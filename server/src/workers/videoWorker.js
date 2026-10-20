import { Worker } from "bullmq";
import { v2 as cloudinary } from "cloudinary";
import prisma from "../config/db.js";
import redis from "../config/redis.js";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import util from "util";
import { downloadToFile } from "../lib/downloadToFile.js";
import { CACHE_KEYS } from "../constants/cache.keys.js";

// Runs cloudinary.config({...}) as a side effect. The worker is a separate
// process from the server, so it needs this import for itself.
import "../config/cloudinary.js";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
};

// HLS output: public/hls/<videoId>/master.m3u8
// Express must serve this SAME folder (app.use("/hls", ...)).
const HLS_ROOT = path.join(process.cwd(), "public", "hls");
const TMP_ROOT = path.join(process.cwd(), "tmp", "transcode");

// Sweeper: PROCESSING videos older than this are marked FAILED.
// Long videos can take a while, raise this if needed.
const STUCK_AFTER_MS = 60 * 60 * 1000; // 1 hour
const SWEEP_EVERY_MS = 10 * 60 * 1000; // every 10 min

// Ladder is LOWEST FIRST on purpose:
//  1. the smallest rendition finishes in seconds -> video is playable almost
//     immediately (we publish after the first rendition, not after all five)
//  2. master.m3u8 lists the lowest rendition first, so players (hls.js /
//     Safari) start on it and ramp up instead of starting at 1080p and stalling.
const LADDER = [
  { label: "240p", height: 240, bitrate: 400 },
  { label: "360p", height: 360, bitrate: 800 },
  { label: "480p", height: 480, bitrate: 1400 },
  { label: "720p", height: 720, bitrate: 2800 },
  { label: "1080p", height: 1080, bitrate: 5000 },
];

const AUDIO_BITRATE_KBPS = 128;
const SEGMENT_SECONDS = 4;

const ffprobeAsync = util.promisify(ffmpeg.ffprobe);

async function getSourceInfo(filepath) {
  const metadata = await ffprobeAsync(filepath);
  const videoStream = metadata.streams.find((s) => s.codec_type === "video");
  return {
    width: videoStream?.width || 0,
    height: videoStream?.height || 0,
  };
}

function transcodeToHls(inputPath, outDir, { height, bitrate }) {
  fs.mkdirSync(outDir, { recursive: true });

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec("libx264")
      .audioCodec("aac")
      .videoFilters(`scale=-2:${height}`)
      .outputOptions([
        "-preset veryfast",
        "-profile:v main",
        "-pix_fmt yuv420p", // Safari / older devices need this
        "-crf 23",
        `-maxrate ${bitrate}k`,
        `-bufsize ${bitrate * 2}k`,
        `-b:a ${AUDIO_BITRATE_KBPS}k`,
        "-ac 2",
        // Same keyframe timestamps in every rendition -> clean quality switching
        `-force_key_frames expr:gte(t,n_forced*${SEGMENT_SECONDS})`,
        "-sc_threshold 0",
        `-hls_time ${SEGMENT_SECONDS}`,
        "-hls_playlist_type vod",
        "-hls_flags independent_segments",
        `-hls_segment_filename ${path.join(outDir, "seg_%03d.ts")}`,
      ])
      .output(path.join(outDir, "index.m3u8"))
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
}

// Written atomically (tmp + rename) because we now rewrite it while the video
// may already be getting played.
function writeMasterPlaylist(videoDir, renditions, aspect) {
  const lines = ["#EXTM3U", "#EXT-X-VERSION:3", "#EXT-X-INDEPENDENT-SEGMENTS"];

  for (const r of renditions) {
    const width = Math.round((r.height * aspect) / 2) * 2;
    const bandwidth = (r.bitrate + AUDIO_BITRATE_KBPS) * 1000;
    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${width}x${r.height}`,
      `${r.label}/index.m3u8`
    );
  }

  const finalPath = path.join(videoDir, "master.m3u8");
  const tmpPath = `${finalPath}.tmp`;
  fs.writeFileSync(tmpPath, lines.join("\n") + "\n");
  fs.renameSync(tmpPath, finalPath);
}

function safeRmDir(dirPath) {
  fs.rm(dirPath, { recursive: true, force: true }, (err) => {
    if (err) console.error(`[Worker] Failed to clean up ${dirPath}:`, err.message);
  });
}

async function markPlayable({ videoId, videoTitle, userId, senderInfo }) {
  // Only PROCESSING -> READY. A video that is DELETING / FAILED / gone must
  // never come back to life.
  const { count } = await prisma.video.updateMany({
    where: { id: videoId, status: "PROCESSING" },
    data: {
      status: "READY",
      isProcessed: true,
      hlsPath: `/hls/${videoId}/master.m3u8`,
    },
  });

  if (count === 0) {
    const current = await prisma.video.findUnique({
      where: { id: videoId },
      select: { status: true },
    });

    // Job retry: already published earlier, don't notify subscribers twice.
    if (current?.status === "READY") return;

    // Deleted (row gone) or DELETING: triggers the "deleted mid-transcode" abort.
    const err = new Error("Video is no longer processing");
    err.code = "P2025";
    throw err;
  }

  try {
    await redis.del(CACHE_KEYS.ALL_VIDEOS);
  } catch (err) {
    console.error("[Worker] Redis invalidate failed:", err.message);
  }

  const subscriptions = await prisma.subscription.findMany({
    where: { channelId: userId },
    select: { subscriberId: true },
  });
  if (subscriptions.length === 0) return;

  const message = `uploaded a new video: "${videoTitle}"`;
  await prisma.notification.createMany({
    data: subscriptions.map((sub) => ({
      userId: sub.subscriberId,
      senderId: userId,
      type: "UPLOAD",
      message,
    })),
    skipDuplicates: true,
  });

  if (global.io) {
    subscriptions.forEach((sub) => {
      global.io.to(sub.subscriberId).emit("newNotification", {
        type: "UPLOAD",
        message,
        sender: senderInfo,
        createdAt: new Date(),
      });
    });
  }
}

// ---------------------------------------------------------------------------
// Job: transcode
// ---------------------------------------------------------------------------
async function handleTranscode(job) {
  const { videoId, videoTitle, userId, senderInfo, filepath } = job.data;
  console.log(`[Worker] Transcoding job ${job.id}, video ${videoId}`);

  const workDir = path.join(TMP_ROOT, videoId);
  fs.mkdirSync(workDir, { recursive: true });
  const localSourcePath = path.join(workDir, `source-${videoId}.mp4`);
  const videoDir = path.join(HLS_ROOT, videoId);

  try {
    await downloadToFile(filepath, localSourcePath);

    const { width: srcW, height: srcH } = await getSourceInfo(localSourcePath);
    if (!srcH) throw new Error("Could not read source video height.");
    const aspect = srcW && srcH ? srcW / srcH : 16 / 9;

    const targets = LADDER.filter((r) => r.height <= srcH);
    if (targets.length === 0) {
      targets.push({ label: `${srcH}p`, height: srcH, bitrate: 400 });
    }

    const successful = [];
    let published = false;

    for (const target of targets) {
      try {
        await transcodeToHls(localSourcePath, path.join(videoDir, target.label), target);
        successful.push(target);

        // Master always reflects what's actually on disk.
        writeMasterPlaylist(videoDir, successful, aspect);

        // First rendition ready => video is watchable NOW.
        if (!published) {
          await markPlayable({ videoId, videoTitle, userId, senderInfo });
          published = true;
        }

        await job.updateProgress(Math.round((successful.length / targets.length) * 100));
        console.log(`[Worker] ${target.label} ready for video ${videoId}`);
      } catch (err) {
        // Video deleted (or marked DELETING) while we were transcoding:
        // stop, don't leave junk. The delete job cleans up the rest.
        if (err.code === "P2025") {
          console.warn(`[Worker] Video ${videoId} was deleted mid-transcode. Aborting.`);
          safeRmDir(videoDir);
          return { status: "aborted_video_deleted" };
        }
        console.error(`[Worker Error] ${target.label} failed for ${videoId}:`, err.message);
      }
    }

    if (successful.length === 0) {
      throw new Error("All resolution transcodes failed.");
    }

    return { status: "success", renditions: successful.map((r) => r.label) };
  } catch (error) {
    console.error(`[Worker Error] Job ${job.id} failed:`, error.message);
    throw error;
  } finally {
    safeRmDir(workDir);
  }
}

// ---------------------------------------------------------------------------
// Job: delete assets (Cloudinary original + local HLS output + DB row)
// The API only marks the video DELETING and enqueues this job. The DB row is
// removed LAST, so if anything here fails, BullMQ retries and nothing is
// orphaned (the row still exists as proof that cleanup is pending).
// ---------------------------------------------------------------------------
async function handleDeleteAssets(job) {
  const { videoId, publicId } = job.data;

  if (publicId) {
    const res = await cloudinary.uploader.destroy(publicId, {
      resource_type: "video",
      invalidate: true,
    });
    // destroy() does NOT throw on failure; it returns { result }.
    if (res.result !== "ok" && res.result !== "not found") {
      throw new Error(`Cloudinary destroy returned "${res.result}" for ${publicId}`);
    }
  }

  await fs.promises.rm(path.join(HLS_ROOT, videoId), { recursive: true, force: true });
  await fs.promises.rm(path.join(TMP_ROOT, videoId), { recursive: true, force: true });

  // Last step. deleteMany so a retry with the row already gone doesn't crash.
  await prisma.video.deleteMany({ where: { id: videoId } });

  try {
    await redis.del(CACHE_KEYS.ALL_VIDEOS);
  } catch (err) {
    console.error("[Worker] Redis invalidate failed:", err.message);
  }

  console.log(`[Worker] Assets + row deleted for video ${videoId}`);
  return { status: "deleted" };
}

const videoWorker = new Worker(
  "videoQueue",
  async (job) => {
    switch (job.name) {
      case "deleteVideoAssets":
        return handleDeleteAssets(job);
      case "processVideoUpload":
      default:
        return handleTranscode(job);
    }
  },
  { connection, concurrency: 1 }
);

videoWorker.on("completed", (job) => console.log(`Job ${job.id} (${job.name}) completed`));

videoWorker.on("failed", async (job, err) => {
  console.log(`Job ${job?.id} (${job?.name}) failed: ${err.message}`);
  if (!job || job.name === "deleteVideoAssets") return;

  // BullMQ retry: "failed" fires on every attempt, mark only on the last one.
  const isFinal = job.attemptsMade >= (job.opts.attempts ?? 1);
  if (!isFinal) return;

  try {
    // updateMany: only PROCESSING -> FAILED. READY / DELETING / deleted untouched.
    const { count } = await prisma.video.updateMany({
      where: { id: job.data.videoId, status: "PROCESSING" },
      data: { status: "FAILED" },
    });
    if (count) {
      try {
        await redis.del(CACHE_KEYS.ALL_VIDEOS);
      } catch (_) {}
    }
  } catch (e) {
    console.error("[Worker] Could not mark FAILED:", e.message);
  }
});

// ---------------------------------------------------------------------------
// Sweeper: catches videos stuck in PROCESSING (e.g. worker crashed, job lost).
// ---------------------------------------------------------------------------
const sweeper = setInterval(async () => {
  try {
    const cutoff = new Date(Date.now() - STUCK_AFTER_MS);
    const { count } = await prisma.video.updateMany({
      where: { status: "PROCESSING", uploadedAt: { lt: cutoff } },
      data: { status: "FAILED" },
    });
    if (count) console.log(`[Sweeper] ${count} stuck video(s) marked FAILED`);
  } catch (e) {
    console.error("[Sweeper] failed:", e.message);
  }
}, SWEEP_EVERY_MS);
sweeper.unref(); // don't keep the process alive just for the sweeper

export default videoWorker;