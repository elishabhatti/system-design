import { pools, getShardIndex } = "./shard.js";
import crypto from 'crypto';

const VIDEOS = Array.from({ length: 50 }, () => crypto.randomUUID());
const USERS = Array.from({ length: 200 }, () => crypto.randomUUID());
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// 1 Oct 2026 se 31 Dec 2026 ke beech random date
function randomDate() {
  const start = new Date('2026-10-01T00:00:00Z').getTime();
  const end = new Date('2026-12-31T23:59:59Z').getTime();
  return new Date(start + Math.random() * (end - start));
}

async function main() {
  // events ko shard ke hisaab se group karo
  const batches = pools.map(() => []);
  for (let i = 0; i < 10000; i++) {
    const videoId = pick(VIDEOS);
    batches[getShardIndex(videoId)].push([
      videoId,
      pick(USERS),
      Math.floor(Math.random() * 600) + 1,
      randomDate(),
    ]);
  }

  // har shard mein bulk insert
  for (let i = 0; i < pools.length; i++) {
    for (let j = 0; j < batches[i].length; j += 1000) {
      await pools[i].query(
        `INSERT INTO watch_events (video_id, user_id, watched_seconds, created_at) VALUES ?`,
        [batches[i].slice(j, j + 1000)]
      );
    }
  }

  // skew check
  console.log('--- Distribution ---');
  for (let i = 0; i < pools.length; i++) {
    const [[row]] = await pools[i].query('SELECT COUNT(*) AS c FROM watch_events');
    console.log(`shard-${i + 1}: ${row.c} events`);
  }

  // partition pruning check
  console.log('--- EXPLAIN (sirf Nov 2026) ---');
  const [plan] = await pools[0].query(
    `EXPLAIN SELECT * FROM watch_events
     WHERE created_at >= '2026-11-01' AND created_at < '2026-12-01'`
  );
  console.log('partitions touched:', plan[0].partitions);

  const [plan2] = await pools[0].query(
    `EXPLAIN SELECT * FROM watch_events WHERE user_id = 'abc'`
  );
  console.log('bina date ke query:', plan2[0].partitions);

  process.exit(0);
}

main();