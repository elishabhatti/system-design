import { Worker } from "bullmq";
import prisma from "../config/db.js";
import redis from "../config/redis.js";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import util from "util";
import { downloadToFile } from "../lib/downloadToFile.js";
import { CACHE_KEYS } from "../constants/cache.keys.js";

// Runs cloudinary.config({...}) as a side effect. The worker is a separate
// process from the server (spawned independently via `concurrently`), so
// it never inherits the config that runs when the server imports the
// multer upload middleware — it needs this import for itself.
import "../config/cloudinary.js";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
};

// HLS output lives here: public/hls/<videoId>/master.m3u8
// The Express server must serve this SAME folder (see app.use("/hls", ...)).
// Both processes must start from the backend root so process.cwd() matches.
const HLS_ROOT = path.join(process.cwd(), "public", "hls");

// Adaptive bitrate ladder, tallest first. Only renditions <= source height
// are generated, so a 480p upload never gets a fake upscaled "720p".
// bitrate is in kbps (video only; audio adds ~128k).
const LADDER = [
  { label: "1080p", height: 1080, bitrate: 5000 },
  { label: "720p", height: 720, bitrate: 2800 },
  { label: "480p", height: 480, bitrate: 1400 },
  { label: "360p", height: 360, bitrate: 800 },
  { label: "240p", height: 240, bitrate: 400 },
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

// Transcodes the source into ONE HLS rendition:
//   <outDir>/index.m3u8 + <outDir>/seg_000.ts, seg_001.ts, ...
function transcodeToHls(inputPath, outDir, { height, bitrate }) {
  fs.mkdirSync(outDir, { recursive: true });

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec("libx264")
      .audioCodec("aac")
      .videoFilters(`scale=-2:${height}`) // -2 keeps aspect ratio with an even width
      .outputOptions([
        "-preset veryfast",
        "-profile:v main",
        "-crf 23",
        `-maxrate ${bitrate}k`,
        `-bufsize ${bitrate * 2}k`,
        // Keyframes at the same timestamps in every rendition, otherwise
        // the player can't switch cleanly between qualities at a segment edge.
        `-force_key_frames expr:gte(t,n_forced*${SEGMENT_SECONDS})`,
        "-sc_threshold 0",
        `-hls_time ${SEGMENT_SECONDS}`,
        "-hls_playlist_type vod",
        `-hls_segment_filename ${path.join(outDir, "seg_%03d.ts")}`,
      ])
      .output(path.join(outDir, "index.m3u8"))
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
}

// master.m3u8 = the menu of qualities. hls.js reads this, then picks a
// rendition per segment based on measured download speed.
function writeMasterPlaylist(videoDir, renditions, aspect) {
  const lines = ["#EXTM3U", "#EXT-X-VERSION:3"];

  for (const r of renditions) {
    const width = Math.round((r.height * aspect) / 2) * 2;
    const bandwidth = (r.bitrate + AUDIO_BITRATE_KBPS) * 1000;
    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${width}x${r.height}`,
      `${r.label}/index.m3u8`
    );
  }

  fs.writeFileSync(path.join(videoDir, "master.m3u8"), lines.join("\n") + "\n");
}

function safeRmDir(dirPath) {
  fs.rm(dirPath, { recursive: true, force: true }, (err) => {
    if (err) console.error(`[Worker] Failed to clean up ${dirPath}:`, err.message);
  });
}

const videoWorker = new Worker(
  "videoQueue",
  async (job) => {
    const { videoId, videoTitle, userId, senderInfo, filepath } = job.data;
    console.log(`[Worker] Starting transcoding for Job ID: ${job.id}, Video ID: ${videoId}`);

    // Scratch space for the downloaded source (deleted in `finally`).
    const workDir = path.join(process.cwd(), "tmp", "transcode", videoId);
    fs.mkdirSync(workDir, { recursive: true });

    // Build local temp filenames from videoId only — NOT from `filename`.
    // multer-storage-cloudinary sets file.filename to the Cloudinary
    // public_id, which contains "/" and no extension. videoId is a flat
    // uuid, so it's safe as a local filename.
    const localSourcePath = path.join(workDir, `source-${videoId}.mp4`);

    // Final HLS output (NOT deleted — this is what gets streamed).
    const videoDir = path.join(HLS_ROOT, videoId);

    try {
      // 1. Pull the Cloudinary source down to local disk for ffmpeg.
      await downloadToFile(filepath, localSourcePath);

      // 2. Decide which renditions make sense for this source.
      const { width: srcW, height: srcH } = await getSourceInfo(localSourcePath);
      if (!srcH) throw new Error("Could not read source video height.");

      const targets = LADDER.filter((r) => r.height <= srcH);
      if (targets.length === 0) {
        // Source is smaller than our smallest rung: keep it as-is.
        targets.push({ label: `${srcH}p`, height: srcH, bitrate: 400 });
      }

      // 3. Transcode each rendition to HLS, sequentially.
      // One rendition failing shouldn't kill the others.
      const successful = [];
      for (const target of targets) {
        try {
          await transcodeToHls(localSourcePath, path.join(videoDir, target.label), target);
          successful.push(target);

          await job.updateProgress(Math.round((successful.length / targets.length) * 100));
          console.log(`[Worker] ${target.label} HLS ready for video ${videoId}`);
        } catch (err) {
          console.error(`[Worker Error] ${target.label} failed for video ${videoId}:`, err.message);
        }
      }

      if (successful.length === 0) {
        throw new Error("All resolution transcodes failed.");
      }

      // 4. Write the master playlist and mark the video as processed.
      writeMasterPlaylist(videoDir, successful, srcW / srcH);

      await prisma.video.update({
        where: { id: videoId },
        data: {
          isProcessed: true,
          hlsPath: `/hls/${videoId}/master.m3u8`,
        },
      });

      // The worker is a separate process, so the API's cached video list
      // has no idea this video just got renditions. Invalidate it here.
      try {
        await redis.del(CACHE_KEYS.ALL_VIDEOS);
      } catch (err) {
        console.error("[Worker] Redis invalidate failed:", err.message);
      }

      // 5. Notify subscribers.
      const subscriptions = await prisma.subscription.findMany({
        where: { channelId: userId },
        select: { subscriberId: true },
      });

      if (subscriptions.length > 0) {
        const notificationData = subscriptions.map((sub) => ({
          userId: sub.subscriberId,
          senderId: userId,
          type: "UPLOAD",
          message: `uploaded a new video: "${videoTitle}"`,
        }));

        await prisma.notification.createMany({ data: notificationData, skipDuplicates: true });

        if (global.io) {
          subscriptions.forEach((sub) => {
            global.io.to(sub.subscriberId).emit("newNotification", {
              type: "UPLOAD",
              message: `uploaded a new video: "${videoTitle}"`,
              sender: senderInfo,
              createdAt: new Date(),
            });
          });
        }
      }

      console.log(
        `[Worker] Job ${job.id} finished. Renditions: ${successful.map((r) => r.label).join(", ")}`
      );
      return { status: "success", renditions: successful.map((r) => r.label) };
    } catch (error) {
      console.error(`[Worker Error] Job ${job.id} failed:`, error.message);
      throw error;
    } finally {
      // Only the scratch dir is cleaned up. The HLS output stays.
      safeRmDir(workDir);
    }
  },
  { connection, concurrency: 1 }
);

videoWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully!`);
});

videoWorker.on("failed", (job, err) => {
  console.log(`Job ${job.id} failed with error: ${err.message}`);
});

export default videoWorker;