# Orbit

A video-streaming platform built to learn and demonstrate **scalable backend design**: adaptive HLS streaming, async transcoding, caching, rate limiting, load balancing, and zero-downtime schema migrations.

Orbit isn't a polished product. It's a system built piece by piece, where each concept is implemented, **broken on purpose, measured, and fixed**.

> **Demo video:** _coming soon_
> **Benchmarks:** see [Performance](#performance) (numbers added as tests are completed)

---

## Architecture

```
                         +------------------+
 Browser (React + hls.js)|  Vite dev proxy  |   (dev)
        |                +--------+---------+
        v                         |
   +---------+   least_conn   +---v-----------+      +---------+
   |  Nginx  |--------------->| Node/Express  |----->|  Redis  |  cache, locks,
   | (LB +   |   failover     | instance :3000|      +---------+  rate limits, queue
   | failover)|-------------->| Node/Express  |
   +---------+                | instance :3001|----->+---------+
                              +---+-----------+      |  MySQL  |  (Prisma ORM)
                                  |                  +---------+
                                  | enqueue job
                                  v
                          +----------------+      +--------------+
                          | BullMQ worker  |----->| HLS segments |  served at /hls
                          | FFmpeg ladder  |      | (local disk) |
                          | 240p -> 1080p  |      +--------------+
                          +-------+--------+
                                  ^
                                  | source video
                            +-----+------+
                            | Cloudinary |
                            +------------+
```

**Upload flow:** client uploads a video, it's stored in Cloudinary, a BullMQ job is queued, the worker transcodes it with FFmpeg into an adaptive HLS ladder (240p to 1080p), and the client polls processing status until it's playable. The upload request never waits for transcoding.

## Tech Stack

| Layer | Tech |
|---|---|
| Client | React, Vite, hls.js, Socket.io client, Tailwind |
| API | Node.js, Express, Socket.io, JWT auth |
| Database | MySQL + Prisma ORM |
| Cache / locks / rate limits | Redis |
| Queue + worker | BullMQ, FFmpeg |
| Media | Cloudinary (source), HLS segments on local disk |
| Load balancing | Nginx (least_conn, failover), multiple Node instances |
| Security / logging | Helmet, Morgan, Redis-backed rate limiters |
| Containers | Docker Compose (DB replication lab) |

## Features

- **Upload and transcode:** `POST /api/videos/upload`, async FFmpeg HLS ladder via BullMQ
- **Adaptive playback:** quality switching with hls.js
- **Cached listing:** public video list cached in Redis (5 min TTL), invalidated on upload, delete, and like
- **Processing status:** polled by the upload page
- **Safe delete:** video is marked `DELETING`, then assets are cleaned up asynchronously by a queue job
- **View counter:** Redis lock plus a unique `View` row, so repeat views don't double count; live updates over Socket.io
- **Likes and real-time notifications** to the video owner
- **Comments and subscriptions**
- **Rate limiting** on the API using Redis

## Design Decisions

| Decision | Why |
|---|---|
| Transcode in a queue, not in the request | Keeps uploads fast and lets the worker scale and retry independently |
| HLS ladder instead of a single MP4 | Viewers on slow networks switch down instead of buffering |
| Redis cache with explicit invalidation | The video list is read-heavy; invalidating on writes avoids stale data |
| Redis lock plus unique DB row for views | The lock absorbs bursts; the unique constraint is the real guarantee |
| Soft delete (`DELETING`) then async cleanup | A slow asset delete never blocks the user, and failures can be retried |
| Expand / contract schema migrations | Lets the schema change without downtime or data loss |

## Setup

**Requirements:** Node.js 20+, MySQL, Redis, FFmpeg, a Cloudinary account.

```bash
# 1. Server
cd server
npm install
cp .env.example .env     # then fill in the values below
npx prisma migrate dev
npm run dev:cluster      # 2 API instances (3000, 3001) + the video worker

# 2. Client (new terminal)
cd client
npm install
npm run dev              # http://localhost:5173
```

`server/.env`:

```env
NODE_ENV=development
PORT=3000
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=<long random string>
DATABASE_URL="mysql://<user>:<password>@localhost:3306/video_stream_lab"
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
REDIS_HOST=localhost
REDIS_PORT=6379
```

Never commit `.env`. The app connects with a dedicated non-root DB user.

In development, Vite proxies `/api`, `/hls`, and `/socket.io` to the Express instance on port 3001.

### Sharing a live demo (free)

Orbit can be exposed from a laptop with a Cloudflare Quick Tunnel, no account needed:

```bash
cloudflared tunnel --url http://localhost:5173
```

This is temporary and for demos only. The URL changes on every run.

## Performance

Load tests are run with k6 against a single instance vs the 2-instance cluster behind Nginx.

| Scenario | RPS | p95 latency | Notes |
|---|---|---|---|
| Single instance, no cache | _TBD_ | _TBD_ | baseline |
| Single instance, Redis cache | _TBD_ | _TBD_ | |
| 2 instances behind Nginx | _TBD_ | _TBD_ | |

_Filled in as each test is completed. Methodology and scripts will live in `/load-tests`._

## Status and Roadmap

**Done:** upload and transcode pipeline, Redis caching, rate limiting, BullMQ workers, Nginx load balancing, DB replication lab, `Video.tags` migration (expand, backfill, dual-write).

**Next:**
- Load tests with k6, record before/after numbers
- Verify Nginx request distribution and test fault tolerance (kill an instance)
- Switch reads to the new `Tag` tables, then drop the old `tags` column
- Dockerize the full stack
- Fanout pattern: one event, multiple consumers
- Read replica routing in the app

## Database Notes

### Replication lab
Separate from the app DB, defined in `docker-compose.yaml`.

- Primary `localhost:3307`, replica `localhost:3308` (MySQL 8.0, GTID replication)
- Replica uses a dedicated `repl` user; `super_read_only=ON` so even `root` can't write to it
- Not applied to Orbit's own DB yet: data is small, and Redis plus indexes cover reads first

```bash
docker compose up -d
# on the replica: CHANGE REPLICATION SOURCE TO ... SOURCE_AUTO_POSITION=1; START REPLICA;
# verify: SHOW REPLICA STATUS\G  (Replica_IO_Running / Replica_SQL_Running = Yes)
```

### Schema migration: `Video.tags` to `Tag` + `VideoTag`

1. **Expand:** add new tables, leave the old column alone
2. **Backfill:** copy data in batches (resumable, idempotent), tested on 100k seeded rows
3. **Dual-write:** app writes to both old and new
4. **Switch reads:** app reads from the new tables
5. **Monitor:** old column usage should hit zero
6. **Contract:** drop the old column (last, never first)

Scripts in `server/`: `seed-videos.js`, `backfill.js`, and a gap-check script that explains every missing link.

## What Broke (and what I learned)

- **Prisma drift:** the DB didn't match migration history, forcing a reset on localhost. In production this would block a deploy.
- **Backfill gap:** a video uploaded after the backfill never reached the new tables because the app still wrote only to the old column. Fixed with dual-write.
- **Count mismatch:** expected 9 tags, got 10, because a real upload was in the DB. Lesson: check the *reason* for a mismatch, not just the count.
- **Writing to a replica:** a direct write caused a duplicate-key collision and stopped the replica's SQL thread. Fix: remove the row, restart replication, enforce `super_read_only`.
- **Replication lag:** with a 10s delay, a write didn't appear on the replica for 12s, a clear read-your-own-writes problem.
- **Demo deploy:** the player broke when exposed through a tunnel because of a hardcoded `localhost` fallback and a missing `/hls` proxy rule.

## Concepts Practiced

Fault tolerance, scalability (vertical and horizontal), load balancing, queues and fanout, rate limiting, caching, CDN, read replicas and replication lag, schema migrations, event-driven architecture, containers, FFmpeg and HLS, Nginx.

## Notes

Orbit is a learning and portfolio project. Some steps intentionally skip optimization first, so the "before" state can be measured against the "after" state. Local dev database only; safe to reset.