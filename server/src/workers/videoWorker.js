import { Worker } from "bullmq";
import prisma from '../config/db.js';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import util from 'util';

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT),
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

const videoWorker = new Worker(
  "videoQueue",
  async (job) => {
    const { videoId, videoTitle, userId, senderInfo, filepath, filename } = job.data;
    console.log(`[Worker] Starting transcoding for Job ID: ${job.id}, Video ID: ${videoId}`);

    try {
      // 1. Find out what resolutions actually make sense for this source.
      const sourceHeight = await getSourceHeight(filepath);
      const targets = RESOLUTIONS.filter((r) => r.height <= sourceHeight);

      // Guard: if source is smaller than our smallest target (e.g. a 240p
      // upload), still produce at least one rendition at the source height.
      if (targets.length === 0) {
        targets.push({ label: `${sourceHeight}p`, height: sourceHeight });
      }

      const outputDir = path.join(process.cwd(), "uploads", "processed", videoId);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // 2. Transcode sequentially — parallel ffmpeg processes on one job
      // just fight each other for CPU, they don't finish faster.
      const successfulRenditions = [];
      for (const target of targets) {
        const outputFilename = `${target.label}-${filename}`;
        const outputPath = path.join(outputDir, outputFilename);

        try {
          await transcodeToResolution(filepath, outputPath, target.height);
          const { size } = fs.statSync(outputPath);
          successfulRenditions.push({
            resolution: target.label,
            filepath: outputPath,
            filesize: size,
          });
          await job.updateProgress(
            Math.round((successfulRenditions.length / targets.length) * 100)
          );
          console.log(`[FFmpeg] ${target.label} done for video ${videoId}`);
        } catch (err) {
          // One resolution failing shouldn't kill the others.
          console.error(`[FFmpeg Error] ${target.label} failed for video ${videoId}:`, err.message);
        }
      }

      if (successfulRenditions.length === 0) {
        throw new Error("All resolution transcodes failed.");
      }

      // 3. Persist renditions. Requires a VideoQuality model — see schema
      // note below. This replaces relying on a single `filepath` column.
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

      // 4. Notify subscribers (unchanged from your version).
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

        await prisma.notification.createMany({
          data: notificationData,
          skipDuplicates: true,
        });

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