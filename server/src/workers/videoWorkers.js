import { Worker } from "bullmq";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT),
};

const videoWorker = new Worker(
  "videoQueue",
  async (job) => {
    console.log(`Processing job ID: ${job.id}, Video ID: ${job.videoId}`);
    
    // heavy task perform (e.g., FFmpeg processing / Thumbnail generation)
    // Simulating heavy task delay:
    await new Promise((resolve) => setTimeout(resolve, 5000));
    
    console.log(`Job finished for video ID: ${job.videoId}`);
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