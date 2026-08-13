# video-stream-lab

A hands-on system design learning project — building a small video-streaming backend, implementing one core system design concept at a time (caching, rate limiting, queues, load balancing, containerization, etc).

The goal isn't a polished product — it's learning system design **by breaking and fixing things**, not by passively watching tutorials.

## Tech Stack

- **Backend:** Node.js + Express
- **Database:** MySQL + Prisma ORM
- **File Upload:** Multer
- **Media Storage:** Cloudinary
- **Caching:** Redis *(planned)*
- **Queue:** BullMQ *(planned)*
- **Containerization:** Docker *(planned)*
- **Load Balancing:** Nginx *(planned)*

## Setup

```bash
# Install dependencies
npm install

# Set up .env
DATABASE_URL="mysql://devuser:<password>@localhost:3306/video_stream_lab"
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Run migrations
npx prisma migrate dev

# Start dev server
npm run dev
```

## API Endpoints

| Method | Route                  | Description              | Status |
|--------|-------------------------|---------------------------|--------|
| POST   | `/api/videos/upload`    | Upload a video (Cloudinary) | ✅ Done |
| GET    | `/api/videos`           | List all videos           | ⬜ Planned |
| GET    | `/api/videos/:id`       | Get single video by ID    | ⬜ Planned |

## Roadmap

Progress is tracked phase by phase — each phase implements one system design concept, tested and compared before/after.

### Phase 1 — Baseline ✅
- [x] Express app setup
- [x] DB connect (Prisma + MySQL)
- [x] Upload endpoint (Multer + Cloudinary)
- [ ] List/Get endpoints
- [ ] Basic error handling & validation
- [ ] Load test baseline (autocannon) — record numbers

### Phase 2 — Caching
- [ ] Redis setup
- [ ] Cache a read-heavy endpoint
- [ ] Re-test load, compare before/after
- [ ] Test cache invalidation edge cases

### Phase 3 — Rate Limiting
- [ ] Token bucket rate limiter (Redis-based)
- [ ] Try to bypass it (parallel requests, race conditions)

### Phase 4 — Async / Queue
- [ ] BullMQ setup for async video processing
- [ ] Compare sync vs async response time
- [ ] Fanout pattern — one event, multiple consumers

### Phase 5 — Containerization
- [ ] Dockerize app + Redis
- [ ] `docker-compose` for full stack

### Phase 6 — Load Balancing
- [ ] Nginx + 2 app instances
- [ ] Verify Round Robin distribution via logs
- [ ] Kill one instance — test fault tolerance

### Concepts covered (theory + practice)
Fault tolerance · DNS · Scalability (vertical/horizontal) · Round Robin · Elastic Load Balancer · API Gateway · EC2 · Queues · Rate limiting (strategies) · SQS · SNS · Fanout architecture · CDN · Read replicas · Redis · Caching · Vendor lock-in · Virtualization · VMs · Containerization · Container orchestration · CNCF · FFmpeg · Nginx · Event-driven architecture · Event sourcing · Kafka

## Daily Log

Each working session is logged with:
- What was planned
- What was actually built
- What was learned / what tradeoff was discovered

*(kept separately in daily notes — not in this README to keep it clean)*

## Notes

- This is a **learning sandbox**, not production code — some steps intentionally skip optimization first, so the "before" state can be measured against the "after" state once a concept is applied.
- Local dev DB only — no production data, safe to reset/reinstall as needed.
