import { server, io, pubClient, subClient } from "./app.js";
import prisma from "./lib/prisma.js";

// ... bootstrap ke andar, shutdown function:
const shutdown = (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`🛑 ${signal} received...`);

  const forceTimer = setTimeout(() => process.exit(1), 10000);
  forceTimer.unref();

  // io.close() sockets + HTTP server dono band karta hai
  io.close(async () => {
    try {
      await Promise.allSettled([pubClient.quit(), subClient.quit()]);
      await prisma.$disconnect();
      console.log("✨ Shutdown complete");
      process.exit(0);
    } catch (err) {
      console.error("❌ Shutdown error:", err);
      process.exit(1);
    }
  });
};