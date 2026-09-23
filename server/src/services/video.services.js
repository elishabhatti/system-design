import prisma from "../config/db.js";
import redis from "../config/redis.js";
import fs from "fs";
import { videoQueue } from "../queues/videoQueues.js";
import { buildViewLockKey, CACHE_KEYS } from "../constants/cache.keys.js";
const VIDEO_LIST_CACHE_TTL_SECONDS = 300;
const VIEW_LOCK_TTL_SECONDS = 10;

const videoOwnerSelect = {
  id: true,
  channelName: true,
  avatarUrl: true,
};

const invalidateVideoListCache = () => redis.del(CACHE_KEYS.ALL_VIDEOS);

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

  const video = await prisma.video.create({
    data: {
      title: title || fileMeta.originalname,
      description: description || "",
      filename: fileMeta.filename,
      filepath: fileMeta.path,
      filesize: fileMeta.size,
      mimetype: fileMeta.mimetype,
      category: category || "General",
      tags: tags || "",
      isMadeForKids: isMadeForKids === "true" || isMadeForKids === true,
      ageRestricted: ageRestricted === "true" || ageRestricted === true,
      visibility: visibility || "private",
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      userId,
    },
    include: {
      user: { select: videoOwnerSelect },
      likes: true,
    },
  });

  // New video changes the list result set -> invalidate once, here.
  await invalidateVideoListCache();

  await videoQueue.add("processVideoUpload", {
    videoId: video.id,
    videoTitle: video.title,
    userId,
    filepath: video.filepath, // Passed for FFmpeg
    filename: video.filename, // Passed for FFmpeg
    senderInfo: {
      id: video.user.id,
      channelName: video.user.channelName,
      avatarUrl: video.user.avatarUrl,
    },
  });

  return video;
};

export const listVideos = async () => {
  const cached = await redis.get(CACHE_KEYS.ALL_VIDEOS);
  if (cached) {
    return { videos: JSON.parse(cached), source: "cache" };
  }

  const videos = await prisma.video.findMany({
    include: {
      user: { select: videoOwnerSelect },
      _count: { select: { likes: true } },
    },
    orderBy: { uploadedAt: "desc" },
  });

  await redis.setex(
    CACHE_KEYS.ALL_VIDEOS,
    VIDEO_LIST_CACHE_TTL_SECONDS,
    JSON.stringify(videos),
  );
  return { videos, source: "database" };
};

export const deleteVideoById = async ({ videoId, userId }) => {
  const video = await prisma.video.findUnique({ where: { id: videoId } });

  if (!video) {
    return { status: "not_found" };
  }

  if (video.userId !== userId) {
    return { status: "forbidden" };
  }

  await prisma.video.delete({ where: { id: videoId } });

  // Remove the physical file too — DB delete alone leaks disk space over time.
  fs.unlink(video.filepath, (err) => {
    if (err)
      console.error(`Failed to remove file for video ${videoId}:`, err.message);
  });

  await invalidateVideoListCache();
  return { status: "ok" };
};

export const incrementView = async ({ videoId, userId, io }) => {
  const lockKey = buildViewLockKey(userId, videoId);
  const acquiredLock = await redis.set(
    lockKey,
    "locked",
    "EX",
    VIEW_LOCK_TTL_SECONDS,
    "NX",
  );

  if (!acquiredLock) {
    return { status: "in_progress" };
  }

  try {
    const existingView = await prisma.view.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });

    if (existingView) {
      const video = await prisma.video.findUnique({
        where: { id: videoId },
        select: { views: true },
      });
      return { status: "already_viewed", views: video?.views || 0 };
    }

    await prisma.view.create({ data: { userId, videoId } });

    const updatedVideo = await prisma.video.update({
      where: { id: videoId },
      data: { views: { increment: 1 } },
      select: { views: true },
    });

    if (io) {
      io.to(`video_${videoId}`).emit("view_updated", {
        views: updatedVideo.views,
      });
    }

    // Deliberately NOT invalidating videos:all here. Views change on nearly
    // every request; invalidating on every view would defeat the cache
    // entirely. The list cache tolerates up to TTL staleness on view counts.

    return { status: "ok", views: updatedVideo.views };
  } catch (error) {
    if (error.code === "P2002") {
      const video = await prisma.video.findUnique({
        where: { id: videoId },
        select: { views: true },
      });
      return { status: "already_viewed", views: video?.views || 0 };
    }
    throw error;
  } finally {
    await redis.del(lockKey);
  }
};

export const toggleLike = async ({ videoId, userId, io }) => {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: { id: true, title: true, userId: true },
  });

  if (!video) {
    return { status: "not_found" };
  }

  const existingLike = await prisma.like.findUnique({
    where: { userId_videoId: { userId, videoId } },
  });

  let isLiked;

  if (existingLike) {
    await prisma.like.delete({ where: { id: existingLike.id } });
    isLiked = false;
  } else {
    await prisma.like.create({ data: { userId, videoId } });
    isLiked = true;

    // Agar user khud ki video like nahi kar raha tab notification bhejein
    if (video.userId !== userId) {
      const notification = await prisma.notification.create({
        data: {
          userId: video.userId, // Video ka malik
          senderId: userId, // Jisne like kiya
          type: "LIKE",
          message: `liked your video: "${video.title}"`,
        },
        include: {
          sender: { select: videoOwnerSelect },
        },
      });

      if (io) {
        io.to(video.userId).emit("newNotification", notification);
      }
    }
  }

  const likeCount = await prisma.like.count({ where: { videoId } });

  // Unlike views, likes don't fire on every page load, and likeCount IS
  // part of the cached list payload (_count.likes) — so invalidating here
  // is correct, not accidental.
  await invalidateVideoListCache();

  return { status: "ok", isLiked, likeCount };
};
