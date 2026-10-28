const mysql = require('mysql2/promise');
const crypto = require('crypto');

const SHARDS = [
  { host: '127.0.0.1', port: 3309 }, // shard-1
  { host: '127.0.0.1', port: 3310 }, // shard-2
];

const pools = SHARDS.map((s) =>
  mysql.createPool({
    ...s,
    user: 'root',
    password: 'rootpass',
    database: 'orbit_shard',
    connectionLimit: 10,
  })
);

// md5 ka pehla 4 byte -> number. Same videoId = hamesha same number
function hashKey(key) {
  return crypto.createHash('md5').update(String(key)).digest().readUInt32BE(0);
}

function getShardIndex(videoId) {
  return hashKey(videoId) % pools.length;
}

function getShard(videoId) {
  return pools[getShardIndex(videoId)];
}

async function insertEvent({ videoId, userId, watchedSeconds, createdAt = new Date() }) {
  await getShard(videoId).execute(
    `INSERT INTO watch_events (video_id, user_id, watched_seconds, created_at)
     VALUES (?, ?, ?, ?)`,
    [videoId, userId, watchedSeconds, createdAt]
  );
}

// Shard key (videoId) di hai, isliye sirf 1 shard hit hoga
async function getVideoEvents(videoId, from, to) {
  const [rows] = await getShard(videoId).execute(
    `SELECT * FROM watch_events
     WHERE video_id = ? AND created_at >= ? AND created_at < ?`,
    [videoId, from, to]
  );
  return rows;
}

module.exports = { pools, getShard, getShardIndex, insertEvent, getVideoEvents };