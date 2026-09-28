// src/lib/prisma.js
import { PrismaClient } from '@prisma/client';

const isProd = process.env.NODE_ENV === 'production';

const prisma = new PrismaClient({
  log: isProd
    ? ['error']
    : [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
});

// Dev mein sirf slow queries dikhao (200ms se upar)
if (!isProd) {
  prisma.$on('query', (e) => {
    if (e.duration > 200) {
      console.warn(`🐢 Slow query (${e.duration}ms): ${e.query}`);
    }
  });
}

export default prisma;