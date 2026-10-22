// Usage: node backfill-tags.js
// Batches me chalta hai, id cursor se resume hota hai, dobara chalao to bhi safe (skipDuplicates)
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const BATCH = 1000;
const PAUSE_MS = 100; // DB ko saans lene do
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// "React, react , " -> ["react"]
function parseTags(raw) {
  const cleaned = raw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .map((t) => t.slice(0, 100));
  return [...new Set(cleaned)];
}

async function main() {
  let cursor = null;
  let done = 0;
  const t0 = Date.now();

  while (true) {
    const videos = await prisma.video.findMany({
      where: { tags: { not: null } },
      orderBy: { id: "asc" },
      take: BATCH,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      select: { id: true, tags: true },
    });
    if (videos.length === 0) break;

    const parsed = videos.map((v) => ({ id: v.id, names: parseTags(v.tags) }));
    const allNames = [...new Set(parsed.flatMap((v) => v.names))];

    if (allNames.length > 0) {
      await prisma.tag.createMany({
        data: allNames.map((name) => ({ name })),
        skipDuplicates: true,
      });
      const tags = await prisma.tag.findMany({ where: { name: { in: allNames } } });
      const idByName = new Map(tags.map((t) => [t.name, t.id]));

      const links = parsed.flatMap((v) =>
        v.names.map((n) => ({ videoId: v.id, tagId: idByName.get(n) }))
      );
      await prisma.videoTag.createMany({ data: links, skipDuplicates: true });
    }

    cursor = videos[videos.length - 1].id;
    done += videos.length;
    console.log(`processed: ${done}  (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    await sleep(PAUSE_MS);
  }

  // Verify: jin videos ke tags me kuch asli tha, un sab ke links bane?
  const withTags = await prisma.video.count({
    where: { tags: { not: null }, NOT: { tags: "" } },
  });
  const linked = await prisma.video.count({ where: { videoTags: { some: {} } } });
  console.log(`videos with tags string: ${withTags}, videos with links: ${linked}`);
  console.log("Farak ho to samjho kyun (khali/sirf-comma tags wali videos expected hain).");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());