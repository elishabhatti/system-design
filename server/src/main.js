// dotenv SABSE PEHLE: app.js import hote hi process.env padhta hai (ESM imports hoist hote hain)
import "dotenv/config";

import { server, io, pubClient, subClient } from "./app.js";
import prisma from "./config/db.js";

const PORT = Number(process.env.PORT) || 3001;
const SHUTDOWN_TIMEOUT_MS = 10_000;

let shuttingDown = false;

async function shutdown(signal, exitCode = 0) {
  if (shuttingDown) return; // signal dobara aaye to ignore
  shuttingDown = true;
  console.log(`🛑 ${signal} received. Starting graceful shutdown...`);

  // Safety net: 10s mein band na ho to force exit
  const forceTimer = setTimeout(() => {
    console.error("⚠️ Could not shut down in time, forcing exit.");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceTimer.unref();

  try {
    // 1. Sockets + HTTP server band (io.close dono karta hai)
    const closed = new Promise((resolve) => io.close(() => resolve()));
    server.closeIdleConnections?.(); // idle keep-alive connections foran band
    await closed;
    console.log("🔒 HTTP & Socket.io closed.");

    // 2. Redis
    await Promise.allSettled([pubClient.quit(), subClient.quit()]);
    console.log("🧠 Redis closed.");

    // 3. DB (sabse aakhir mein, chalti requests ko DB chahiye thi)
    await prisma.$disconnect();
    console.log("📦 Database disconnected.");

    console.log("✨ Graceful shutdown complete.");
    process.exit(exitCode);
  } catch (err) {
    console.error("❌ Error during shutdown:", err);
    process.exit(1);
  }
}

async function bootstrap() {
  // Fail-fast: DB down ya URL galat ho to boot par hi crash
  await prisma.$connect();
  console.log("📦 Database connected");

  server.listen(PORT, () => {
    console.log(`🚀 Server & Socket.io running at: http://localhost:${PORT}`);
  });

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  // Unexpected crashes: log karo, saaf tareeqe se band karo, exit code 1
  process.on("unhandledRejection", (reason) => {
    console.error("💥 Unhandled Rejection:", reason);
    shutdown("unhandledRejection", 1);
  });
  process.on("uncaughtException", (err) => {
    console.error("💥 Uncaught Exception:", err);
    shutdown("uncaughtException", 1);
  });
}

bootstrap().catch((err) => {
  console.error("💥 Failed to start:", err);
  process.exit(1);
});