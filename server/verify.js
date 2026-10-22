// Usage: node check-gap.js
// Sawal: jin videos ke tags string me asli tag hai, kya sab ke VideoTag links bane?
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // A: tags string non-null aur non-empty
  const [a] = await prisma.$queryRaw`
    SELECT COUNT(*) AS c FROM Video WHERE tags IS NOT NULL AND tags <> ''`;

  // B: un me se jinke links bane
  const [b] = await prisma.$queryRaw`
    SELECT COUNT(*) AS c FROM Video
    WHERE tags IS NOT NULL AND tags <> ''
      AND id IN (SELECT videoId FROM VideoTag)`;

  // C: jinke links NAHI bane
  const [c] = await prisma.$queryRaw`
    SELECT COUNT(*) AS c FROM Video
    WHERE tags IS NOT NULL AND tags <> ''
      AND id NOT IN (SELECT videoId FROM VideoTag)`;

  // D: C me se woh jinme sirf commas/spaces hain (parse ke baad kuch bacha hi nahi)
  const [d] = await prisma.$queryRaw`
    SELECT COUNT(*) AS c FROM Video
    WHERE tags IS NOT NULL AND tags <> ''
      AND id NOT IN (SELECT videoId FROM VideoTag)
      AND tags REGEXP '^[ ,]+$'`;

  console.log("A tags string wali videos:   ", Number(a.c));
  console.log("B un me links bane:          ", Number(b.c));
  console.log("C links NAHI bane (A - B):   ", Number(c.c));
  console.log("D C me sirf commas/spaces:   ", Number(d.c));
  console.log("UNEXPLAINED (C - D), expect 0:", Number(c.c) - Number(d.c));
}

main().finally(() => prisma.$disconnect());