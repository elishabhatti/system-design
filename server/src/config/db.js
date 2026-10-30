import { PrismaClient } from '@prisma/client';

const isProd = process.env.NODE_ENV === 'production';

// Primary: sab writes + jin reads ko latest data chahiye
const prisma = new PrismaClient({
  log: isProd
    ? ['error']
    : [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
});

// Replica: sirf stale-tolerant reads (abhi sirf listVideos)
export const prismaRead = new PrismaClient({
  datasourceUrl: process.env.DATABASE_REPLICA_URL,
  log: isProd ? ['error'] : ['warn', 'error'],
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