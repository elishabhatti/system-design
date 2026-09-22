import { Worker } from "bullmq";
import prisma from '../config/db.js';  
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT),
};

const videoWorker = new Worker(
  "videoQueue",
  async (job) => {
    const { videoId, videoTitle, userId, senderInfo, filepath, filename } = job.data;
    console.log(`[Worker] Starting transcoding for Job ID: ${job.id}, Video ID: ${videoId}`);
    
    try {
      // 1. Define output path for transcoded video
      const outputDir = path.join(process.cwd(), "uploads", "processed");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const outputFilename = `processed-${Date.now()}-${filename}`;
      const outputPath = path.join(outputDir, outputFilename);

      // 2. Run FFmpeg Transcoding (Convert to 720p web-friendly MP4)
      await new Promise((resolve, reject) => {
        ffmpeg(filepath)
          .output(outputPath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .size('?x720') // Resize height to 720p preserving aspect ratio
          .on('end', () => {
            console.log(`[FFmpeg] Transcoding finished for video ID: ${videoId}`);
            resolve();
          })
          .on('error', (err) => {
            console.error(`[FFmpeg Error]: ${err.message}`);
            reject(err);
          })
          .run();
      });

      // 3. Update Database: Mark video as processed and update file path
      await prisma.video.update({
        where: { id: videoId },
        data: { 
          filepath: outputPath,
          isProcessed: true 
        }
      });

      // 4. Fetch all subscribers of the creator
      const subscriptions = await prisma.subscription.findMany({
        where: { channelId: userId },
        select: { subscriberId: true }
      });

      if (subscriptions.length > 0) {
        // 5. Prepare bulk data array for notifications
        const notificationData = subscriptions.map(sub => ({
          userId: sub.subscriberId,
          senderId: userId,
          type: 'UPLOAD',
          message: `uploaded a new video: "${videoTitle}"`,
        }));

        // 6. Bulk insert notifications using Prisma createMany (Fast ⚡)
        await prisma.notification.createMany({
          data: notificationData,
          skipDuplicates: true,
        });

        // 7. Emit real-time socket events to subscribers
        if (global.io) {
          subscriptions.forEach(sub => {
            global.io.to(sub.subscriberId).emit('newNotification', {
              type: 'UPLOAD',
              message: `uploaded a new video: "${videoTitle}"`,
              sender: senderInfo,
              createdAt: new Date(),
            });
          });
        }
      }
      
      console.log(`[Worker] Job ${job.id} finished successfully for video ID: ${videoId}`);
      return { status: "success" };

    } catch (error) {
      console.error(`[Worker Error] Job ${job.id} failed:`, error.message);
      throw error;
    }
  },
  { connection }
);

videoWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully!`);
});

videoWorker.on("failed", (job, err) => {
  console.log(`Job ${job.id} failed with error: ${err.message}`);
});