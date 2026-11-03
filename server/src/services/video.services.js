import { Visibility } from "@prisma/client";
import prisma, { prismaRead, readWithFallback } from "../config/db.js";
import redis from "../config/redis.js";
import { videoQueue } from "../queues/videoQueues.js";
import { buildViewLockKey, CACHE_KEYS } from "../constants/cache.keys.js";
import { parseTags } from "../utils/parseTags.js";

// Feed cache: max staleness ab 60s (pehle 300s tha)
const VIDEO_LIST_CACHE_TTL_SECONDS = 60;
const VIEW_LOCK_TTL_SECONDS = 10;

// Write ke baad itni der tak feed PRIMARY se padhega (replica lag se bara rakho).
// Is se "zombie video" aur "stale cache refill" dono bug band hote hain.
const PRIMARY_WINDOW_SECONDS = 10;
const PRIMARY_WINDOW_KEY = "videos:list:primary-window";

// Retries with backoff so a temporary Redis/Cloudinary/ffmpeg hiccup
// doesn't permanently orphan a video or its storage.
const JOB_OPTS = {
  attempts: 5,
  backoff: { type: "exponential", delay: 5000 },
  removeOnComplete: 100,
  removeOnFail: 500,
};

const videoOwnerSelect = {
  id: true,
  channelName: true,
  avatarUrl: true,
};

// ---------- Helpers ----------
const toVisibility = (value, fallback = Visibility.PRIVATE) => {
  const v = String(value ?? "").toUpperCase();
  return Object.values(Visibility).includes(v) ? v : fallback;
};

const toBool = (v) => v === true || v === "true";

const toDateOrNull = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

// BigInt (filesize) JSON mein nahi jata, is liye replacer
const bigIntReplacer = (_key, value) =>
  typeof value === "bigint" ? Number(value) : value;

// Cache best-effort hai: Redis down ho to API na mare
const cacheGet = async (key) => {
  try {
    return await redis.get(key);
  } catch (err) {
    console.error("Redis get failed:", err.message);
    return null;
  }
};

const cacheSet = async (key, ttl, value) => {
  try {
    await redis.setex(key, ttl, JSON.stringify(value, bigIntReplacer));
  } catch (err) {
    console.error("Redis set failed:", err.message);
  }
};

// Har write ke baad: cache hatao AUR "primary window" kholo
const invalidateVideoListCache = async () => {
  try {
    await redis.del(CACHE_KEYS.ALL_VIDEOS);
    await redis.setex(PRIMARY_WINDOW_KEY, PRIMARY_WINDOW_SECONDS, "1");
  } catch (err) {
    console.error("Redis invalidate failed:", err.message);
  }
};

// ---------- Create ----------
// Level: STRONG (primary pe write). Uploader ko response primary se milta hai.
export const createVideo = async ({ fileMeta, payload, userId }) => {
  const {
    title,
    description,
    category,
    tags,
    isMadeForKids,
    ageRestricted,
    visibility,
    scheduledFor,
  } = payload;

  // NEW: tags ko normalize karo, aur naye Tag table me pehle bana do
  const names = parseTags(tags);
  if (names.length) {
    await prisma.tag.createMany({
      data: names.map((name) => ({ name })),
      skipDuplicates: true,
    });
  }

  const video = await prisma.video.create({
    data: {
      title: title || fileMeta.originalname,
      description: description || "",
      filename: fileMeta.filename, // Cloudinary public_id
      filepath: fileMeta.path,
      filesize: fileMeta.size,
      mimetype: fileMeta.mimetype,
      category: category || "General",
      tags: tags || "", // purani string abhi bhi likho (expand phase)
      // NEW: naye tables me bhi link
      videoTags: {
        create: names.map((name) => ({ tag: { connect: { name } } })),
      },
      isMadeForKids: toBool(isMadeForKids),
      ageRestricted: toBool(ageRestricted),
      visibility: toVisibility(visibility),
      scheduledFor: toDateOrNull(scheduledFor),
      userId,
    },
    include: {
      user: { select: videoOwnerSelect },
    },
  });
  try {
    await invalidateVideoListCache();

    await videoQueue.add(
      "processVideoUpload",
      {
        videoId: video.id,
        videoTitle: video.title,
        userId,
        filepath: video.filepath,
        filename: video.filename,
        senderInfo: {
          channelName: video.user.channelName,
          id: video.user.id,
          avatarUrl: video.user.avatarUrl,
        },
      },
      { ...JOB_OPTS, jobId: `transcode-${video.id}` },
    );
  } catch (err) {
    await prisma.video.update({
      where: { id: video.id },
      data: { status: "FAILED" },
    });
    await invalidateVideoListCache();
    throw err;
  }
  await invalidateVideoListCache();
  return video;
};

// ---------- Get one (used by the upload page to poll processing status) ----------
// Level: READ-YOUR-WRITES. Primary se padhta hai, kyunke worker status primary pe likhta hai.
export const getVideoStatus = async ({ videoId, userId }) => {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: {
      id: true,
      title: true,
      status: true,
      isProcessed: true,
      hlsPath: true,
      userId: true,
    },
  });
  if (!video) return { status: "not_found" };
  if (video.userId !== userId) return { status: "forbidden" };
  return { status: "ok", video };
};

// ---------- List ----------
// Level: EVENTUAL (replica + cache), lekin kisi write ke baad PRIMARY_WINDOW_SECONDS
// tak primary se padhta hai. Is se:
//   - delete ke baad video feed me wapas nahi aati (zombie video fix)
//   - like/upload ke baad stale replica data cache me nahi bharta (cache poisoning fix)
export const listVideos = async () => {
  const cached = await cacheGet(CACHE_KEYS.ALL_VIDEOS);
  if (cached) {
    return { videos: JSON.parse(cached), source: "cache" };
  }

  const inPrimaryWindow = Boolean(await cacheGet(PRIMARY_WINDOW_KEY));
  const db = inPrimaryWindow ? prisma : prismaRead;

  const videos = await readWithFallback(() =>
    db.video.findMany({
      where: {
        visibility: Visibility.PUBLIC,
        AND: [
          {
            OR: [{ scheduledFor: null }, { scheduledFor: { lte: new Date() } }],
          },
          {
            OR: [
              { status: "READY" },
              { qualities: { some: {} }, status: { not: "DELETING" } },
            ],
          },
        ],
      },
      include: {
        user: { select: videoOwnerSelect },
        _count: { select: { likes: true } },
        qualities: {
          select: { resolution: true, filepath: true },
          orderBy: { resolution: "desc" },
        },
      },
      orderBy: { uploadedAt: "desc" },
    }),
  );

  await cacheSet(CACHE_KEYS.ALL_VIDEOS, VIDEO_LIST_CACHE_TTL_SECONDS, videos);
  return {
    videos,
    source: inPrimaryWindow ? "primary-window" : "replica-db",
  };
};

// ---------- Delete ----------
// Level: STRONG (read + write dono primary pe), aur feed ke liye primary window khulti hai.
export const deleteVideoById = async ({ videoId, userId }) => {
  const video = await prisma.video.findUnique({ where: { id: videoId } });

  if (!video) return { status: "not_found" };
  if (video.userId !== userId) return { status: "forbidden" };

  await prisma.video.update({
    where: { id: videoId },
    data: { status: "DELETING" },
  });
  await invalidateVideoListCache();

  // Fail ho to throw hone de: row DELETING me rahegi, user dobara delete kar sakta hai
  await videoQueue.add(
    "deleteVideoAssets",
    { videoId, publicId: video.filename },
    { ...JOB_OPTS, jobId: `delete-${videoId}` },
  );

  return { status: "ok" };
};

// ---------- Views ----------
// Level: STRONG (primary pe transaction). Feed me view count eventual hai.
export const incrementView = async ({ videoId, userId, io }) => {
  const lockKey = buildViewLockKey(userId, videoId);

  let acquiredLock = true;
  try {
    acquiredLock = await redis.set(
      lockKey,
      "locked",
      "EX",
      VIEW_LOCK_TTL_SECONDS,
      "NX",
    );
  } catch (err) {
    console.error("Redis lock failed:", err.message);
  }

  if (!acquiredLock) return { status: "in_progress" };

  const currentViews = async () => {
    const v = await prisma.video.findUnique({
      where: { id: videoId },
      select: { views: true },
    });
    return v?.views ?? 0;
  };

  try {
    const [, updatedVideo] = await prisma.$transaction([
      prisma.view.create({ data: { userId, videoId } }),
      prisma.video.update({
        where: { id: videoId },
        data: { views: { increment: 1 } },
        select: { views: true },
      }),
    ]);

    if (io) {
      io.to(`video_${videoId}`).emit("view_updated", {
        views: updatedVideo.views,
      });
    }

    return { status: "ok", views: updatedVideo.views };
  } catch (error) {
    if (error.code === "P2002") {
      return { status: "already_viewed", views: await currentViews() };
    }
    if (error.code === "P2003" || error.code === "P2025") {
      return { status: "not_found" };
    }
    throw error;
  } finally {
    redis.del(lockKey).catch(() => {});
  }
};

// ---------- Likes ----------
// Level: READ-YOUR-WRITES. likeCount primary se aata hai (liker ko apna like turant dikhe),
// feed ka count eventual hai, par primary window ki wajah se stale cache nahi bharta.
export const toggleLike = async ({ videoId, userId, io }) => {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: { id: true, title: true, userId: true },
  });

  if (!video) return { status: "not_found" };

  const removed = await prisma.like.deleteMany({ where: { userId, videoId } });

  let isLiked = false;

  if (removed.count === 0) {
    try {
      await prisma.like.create({ data: { userId, videoId } });
      isLiked = true;

      if (video.userId !== userId) {
        const notification = await prisma.notification.create({
          data: {
            userId: video.userId,
            senderId: userId,
            type: "LIKE",
            message: `liked your video: "${video.title}"`,
          },
          include: { sender: { select: videoOwnerSelect } },
        });

        if (io) io.to(video.userId).emit("newNotification", notification);
      }
    } catch (error) {
      if (error.code === "P2002") {
        isLiked = true;
      } else {
        throw error;
      }
    }
  }

  const likeCount = await prisma.like.count({ where: { videoId } });
  return { status: "ok", isLiked, likeCount };
};
