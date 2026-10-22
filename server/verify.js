// check-tags.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
prisma.tag
  .findMany({ orderBy: { name: "asc" } })
  .then((t) => console.log(t.map((x) => JSON.stringify(x.name))))
  .finally(() => prisma.$disconnect());