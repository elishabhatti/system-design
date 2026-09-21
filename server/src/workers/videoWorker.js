import { Worker } from "bullmq";
import prisma from '../config/db.js';  

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT),
};

const videoWorker = new Worker(
  "videoQueue",
  async (job) => {
    const { videoId, videoTitle, userId, senderInfo } = job.data;
    console.log(`[Worker] Processing job ID: ${job.id}, Video ID: ${videoId}`);
    
    // 1. Simulating heavy task (e.g., FFmpeg processing / Thumbnail generation)
    await new Promise((resolve) => setTimeout(resolve, 5000));
    
    // 2. Fetch all subscribers of the creator
    const subscriptions = await prisma.subscription.findMany({
      where: { channelId: userId },
      select: { subscriberId: true }
    });

    if (subscriptions.length > 0) {
      // 3. Prepare bulk data array for notifications
      const notificationData = subscriptions.map(sub => ({
        userId: sub.subscriberId,
        senderId: userId,
        type: 'UPLOAD',
        message: `uploaded a new video: "${videoTitle}"`,
      }));

      // 4. Bulk insert notifications using Prisma createMany (Fast ⚡)
      await prisma.notification.createMany({
        data: notificationData,
        skipDuplicates: true,
      });

      // 5. Emit real-time socket events to subscribers
      // (Note: Make sure global.io is set in your main server file like `global.io = io`)
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
    
    console.log(`[Worker] Job finished for video ID: ${videoId}`);
    return { status: "success" };
  },
  { connection }
);

videoWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully!`);
});

videoWorker.on("failed", (job, err) => {
  console.log(`Job ${job.id} failed with error: ${err.message}`);
});