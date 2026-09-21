import { Queue } from "bullmq";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT),
};

// Video processing queue
export const videoQueue = new Queue("videoQueue", { connection });