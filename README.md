# video-stream-lab

A hands-on system design learning project: a video-streaming backend (plus a small React client) where I implement one core system design concept at a time (caching, rate limiting, queues, load balancing, replication, schema migrations, etc).

The goal isn't a polished product. It's learning system design **by breaking and fixing things**, not by passively watching tutorials.

## Tech Stack

- **Client:** React, hls.js player, Socket.io client
- **Backend:** Node.js + Express, Socket.io
- **Database:** MySQL + Prisma ORM
- **Cache / locks / rate limits:** Redis
- **Queue + worker:** BullMQ, FFmpeg (HLS ladder 240p to 1080p, asset cleanup job)
- **Media storage:** Cloudinary (source video), HLS segments on local disk served at `/hls`
- **Load balancing / process mgmt:** Nginx (least_conn, failover), multiple Node instances (PM2 cluster)
- **Middleware:** Helmet, Morgan, rate limiters, JWT auth
- **Containers:** Docker Compose (currently used for the DB replication lab, see below)

## Setup

```bash
# Install dependencies
cd server && npm install

# Set up .env (never commit this)
DATABASE_URL="mysql://devuser:<password>@localhost:3306/video_stream_lab"
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
# plus Redis settings (see src/config/redis.js)

# Run migrations
npx prisma migrate dev

# Start two API instances + the video worker
npm run dev:cluster
```

The app connects with a dedicated non-root DB user (`devuser`), not `root`.

## Features

| Feature | Notes | Status |
|---|---|---|
| Upload video | `POST /api/videos/upload`, Cloudinary + BullMQ transcode job | ✅ Done |
| List public videos | Redis cache (5 min TTL), invalidated on upload/delete/like | ✅ Done |
| Processing status | Polled by the upload page | ✅ Done |
| Delete video | Marks `DELETING`, async asset cleanup via queue | ✅ Done |
| View counter | Redis lock + unique `View` row, live update over Socket.io | ✅ Done |
| Likes + notifications | Toggle like, real-time notification to the owner | ✅ Done |
| Comments / subscriptions | Models exist | ⬜ Check status |

Exact routes live in `server/src/routes`.

## Roadmap

Each phase implements one concept, tested and compared before/after.

### Phase 1: Baseline ✅
- [x] Express app setup
- [x] DB connect (Prisma + MySQL)
- [x] Upload endpoint (Multer + Cloudinary)
- [x] List/Get endpoints
- [ ] Basic error handling & validation (partial)
- [ ] Load test baseline (autocannon): record numbers

### Phase 2: Caching
- [x] Redis setup
- [x] Cache a read-heavy endpoint (video list)
- [ ] Re-test load, compare before/after
- [ ] Test cache invalidation edge cases

### Phase 3: Rate Limiting
- [x] Redis-backed rate limiters
- [ ] Try to bypass it (parallel requests, race conditions)

### Phase 4: Async / Queue
- [x] BullMQ setup for async video processing (FFmpeg HLS)
- [ ] Compare sync vs async response time
- [ ] Fanout pattern: one event, multiple consumers

### Phase 5: Containerization
- [x] Docker Compose for the DB replication lab
- [ ] Dockerize app + Redis
- [ ] `docker-compose` for the full stack

### Phase 6: Load Balancing
- [x] Nginx in front of multiple app instances
- [ ] Verify distribution via logs
- [ ] Kill one instance: test fault tolerance

### Phase 7: Database (in progress)
- [x] Primary + read replica (Docker lab): replication, lag, drift
- [x] Schema migration practice: `Video.tags` string to `Tag` + `VideoTag`
- [x] Batched, resumable, idempotent backfill (100k seeded rows)
- [x] Dual-write in `createVideo`
- [ ] Check the tag edit route (if any) also dual-writes
- [ ] Switch reads to the new tables
- [ ] Monitor old `tags` column usage, then drop it (contract step)
- [ ] Compare one-query backfill vs batched backfill
- [ ] Route reads to a replica in the app (Prisma read-replica extension)
- [ ] Redis invalidation edge cases, SQL vs NoSQL tradeoffs
- [ ] Partitioning / sharding (theory)

## DB Replication Lab

Separate from the app DB (port 3306). Defined in `docker-compose.yaml` at the repo root.

- Primary: `localhost:3307`, replica: `localhost:3308` (MySQL 8.0, GTID replication)
- Replica connects to primary with a dedicated `repl` user and replays the primary's binary log
- `super_read_only=ON` on the replica so even `root` can't write to it

```bash
docker compose up -d
# create the replication user on the primary, then on the replica:
#   CHANGE REPLICATION SOURCE TO SOURCE_HOST='mysql-primary', ... SOURCE_AUTO_POSITION=1;
#   START REPLICA;
# check: SHOW REPLICA STATUS\G  (Replica_IO_Running / Replica_SQL_Running = Yes)
```

Lab passwords are throwaway values, never reuse real ones.

**Not applied to Orbit's own DB.** Replication was practiced in this lab only. The app doesn't need a replica yet (small data, reads are easy to handle with Redis and indexes first).

## Schema Migration Notes

Process used for `Video.tags` (comma-separated string) to `Tag` + `VideoTag`:

1. **Expand:** add the new tables, don't touch the old column
2. **Backfill:** copy old data into the new structure (batches, resumable, safe to re-run)
3. **Dual-write:** app writes to both old and new
4. **Switch reads:** app reads from the new tables
5. **Monitor:** old column usage should hit zero
6. **Contract:** drop the old column (last, never first)

Scripts in `server/`: `seed-videos.js` (100k videos with messy tags), `backfill.js`, and a gap-check script that proves every missing link is explained (empty or comma-only tags).

## What broke (so far)

- **Prisma drift:** DB schema didn't match migration history, so `migrate dev` forced a reset (localhost only). In prod this blocks a deploy.
- **Backfill gap:** a video uploaded after the backfill never reached the new tables, because the app still wrote only to the old column. Fixed with dual-write.
- **Expected vs actual counts:** expected 9 tags, got 10, because a real upload (`carton`) was in the DB. Check the *reason* for a mismatch, not just the count.
- **Writing to a replica:** a direct write to the replica made the primary's next insert collide (duplicate key) and the replica's SQL thread stopped. Fix: remove the extra row, restart replication, lock replica with `super_read_only`.
- **Replication lag:** with a 10s delay on the replica, a row written to the primary didn't show on the replica until 12s later (read-your-own-writes problem).

### Concepts covered (theory + practice)
Fault tolerance · DNS · Scalability (vertical/horizontal) · Round Robin · Elastic Load Balancer · API Gateway · EC2 · Queues · Rate limiting (strategies) · SQS · SNS · Fanout architecture · CDN · Read replicas · Replication (binlog, relay log, lag, drift, read-your-own-writes) · Schema migrations (expand/contract) · Backfill · Dual-write · Redis · Caching · Vendor lock-in · Virtualization · VMs · Containerization · Container orchestration · CNCF · FFmpeg · Nginx · Event-driven architecture · Event sourcing · Kafka

## Daily Log

Each working session is logged with:
- What was planned
- What was actually built
- What was learned / what tradeoff was discovered

*(kept separately in daily notes, not in this README to keep it clean)*

## Notes

- This is a **learning sandbox**, not production code. Some steps intentionally skip optimization first, so the "before" state can be measured against the "after" state once a concept is applied.
- Local dev DB only. No production data, safe to reset as needed.