import { Worker } from "bullmq";
import prisma from "../config/db.js";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import util from "util";
import { v2 as cloudinary } from "cloudinary";
import { downloadToFile } from "../lib/downloadToFile.js";

// Assumes cloudinary.config({...}) already ran somewhere at startup
// (the same config your multer-storage-cloudinary upload middleware uses).
// If it doesn't, uncomment and point at your actual config module:
// import "../config/cloudinary.js";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
};

// Target renditions, tallest first. We only generate ones <= source height,
// so a 480p upload never gets a fake upscaled "720p" file.
const RESOLUTIONS = [
  { label: "720p", height: 720 },
  { label: "480p", height: 480 },
  { label: "360p", height: 360 },
];

const ffprobeAsync = util.promisify(ffmpeg.ffprobe);

async function getSourceHeight(filepath) {
  const metadata = await ffprobeAsync(filepath);
  const videoStream = metadata.streams.find((s) => s.codec_type === "video");
  return videoStream?.height || 0;
}

function transcodeToResolution(inputPath, outputPath, height) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .output(outputPath)
      .videoCodec("libx264")
      .audioCodec("aac")
      .size(`?x${height}`)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
}

// Renditions are re-uploaded to Cloudinary — local disk is only ever a
// scratch space for ffmpeg, never the final storage location. Uses
// upload_large (chunked) since transcoded files can still be sizeable.
function uploadToCloudinary(localPath, publicId) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_large(
      localPath,
      {
        resource_type: "video",
        public_id: publicId,
        folder: "videos_streaming_app/renditions",
      },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
}

function safeRmDir(dirPath) {
  fs.rm(dirPath, { recursive: true, force: true }, (err) => {
    if (err) console.error(`[Worker] Failed to clean up ${dirPath}:`, err.message);
  });
}

const videoWorker = new Worker(
  "videoQueue",
  async (job) => {
    const { videoId, videoTitle, userId, senderInfo, filepath, filename } = job.data;
    console.log(`[Worker] Starting transcoding for Job ID: ${job.id}, Video ID: ${videoId}`);

    const workDir = path.join(process.cwd(), "tmp", "transcode", videoId);
    fs.mkdirSync(workDir, { recursive: true });
    const localSourcePath = path.join(workDir, `source-${filename}`);

    try {
      // 1. Pull the Cloudinary source down to local disk for ffmpeg.
      await downloadToFile(filepath, localSourcePath);

      // 2. Figure out which resolutions make sense for this source.
      const sourceHeight = await getSourceHeight(localSourcePath);
      const targets = RESOLUTIONS.filter((r) => r.height <= sourceHeight);
      if (targets.length === 0) {
        targets.push({ label: `${sourceHeight}p`, height: sourceHeight });
      }

      // 3. Transcode sequentially, then re-upload each rendition to
      // Cloudinary and record its URL. One resolution failing shouldn't
      // kill the others.
      const successfulRenditions = [];
      for (const target of targets) {
        const outputFilename = `${target.label}-${filename}`;
        const outputPath = path.join(workDir, outputFilename);

        try {
          await transcodeToResolution(localSourcePath, outputPath, target.height);

          const publicId = `${videoId}/${target.label}`;
          const uploadResult = await uploadToCloudinary(outputPath, publicId);

          successfulRenditions.push({
            resolution: target.label,
            filepath: uploadResult.secure_url,
            filesize: uploadResult.bytes,
          });

          await job.updateProgress(
            Math.round((successfulRenditions.length / targets.length) * 100)
          );
          console.log(`[Worker] ${target.label} transcoded + uploaded for video ${videoId}`);
        } catch (err) {
          console.error(`[Worker Error] ${target.label} failed for video ${videoId}:`, err.message);
        }
      }

      if (successfulRenditions.length === 0) {
        throw new Error("All resolution transcodes failed.");
      }

      // 4. Persist renditions (requires a VideoQuality model in schema.prisma:
      // videoId, resolution, filepath, filesize — filepath here is a
      // Cloudinary secure_url, not a local path).
      await prisma.videoQuality.createMany({
        data: successfulRenditions.map((r) => ({
          videoId,
          resolution: r.resolution,
          filepath: r.filepath,
          filesize: r.filesize,
        })),
        skipDuplicates: true,
      });

      await prisma.video.update({
        where: { id: videoId },
        data: { isProcessed: true },
      });

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
        `[Worker] Job ${job.id} finished. Renditions: ${successfulRenditions.map((r) => r.resolution).join(", ")}`
      );
      return { status: "success", renditions: successfulRenditions.map((r) => r.resolution) };
    } catch (error) {
      console.error(`[Worker Error] Job ${job.id} failed:`, error.message);
      throw error;
    } finally {
      // Local disk was only ever scratch space — always clean it up,
      // success or failure, so it never silently accumulates.
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