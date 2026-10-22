// Usage: node seed-videos.js
// 100k fake videos, jaanboojh ke ganda tags data (case, spaces, khali, duplicates)
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const TOTAL = 100_000;
const CHUNK = 5_000;
const POOL = [
  "React", "react", " Node.js ", "mongodb", "System Design", "Redis",
  "docker", "MySQL", "prisma", " React ", "", "redis", "HLS",
];

const rand = (n) => Math.floor(Math.random() * n);

function randomTags() {
  if (rand(10) === 0) return null; // 10% videos me tags hi nahi
  const count = 1 + rand(5);
  return Array.from({ length: count }, () => POOL[rand(POOL.length)]).join(",");
}

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "seed@orbit.local" },
    update: {},
    create: { email: "seed@orbit.local", channelName: "seed-channel", password: "not-a-real-hash" },
  });

  for (let i = 0; i < TOTAL; i += CHUNK) {
    const data = Array.from({ length: CHUNK }, (_, j) => ({
      title: `Seed video ${i + j}`,
      filename: `seed-${i + j}.mp4`,
      filepath: `/uploads/seed-${i + j}.mp4`,
      filesize: BigInt(1_000_000 + rand(50_000_000)),
      mimetype: "video/mp4",
      tags: randomTags(),
      userId: user.id,
    }));
    await prisma.video.createMany({ data });
    console.log(`seeded: ${i + CHUNK}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());