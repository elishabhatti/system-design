import prisma from '../config/db.js';
import redis from '../config/redis.js';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';

export const uploadVideo = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      category, 
      tags, 
      isMadeForKids, 
      ageRestricted, 
      visibility, 
      scheduledFor 
    } = req.body;
    
    const file = req.file;
    const userId = req.userId;  

    if (!file) {
      return res.status(400).json({ error: "Video file is required." });
    }

    const newVideo = await prisma.video.create({
      data: {
        title: title || file.originalname,
        description: description || "",
        filename: file.filename,
        filepath: file.path, 
        filesize: file.size,
        mimetype: file.mimetype,
        category: category || "General",
        tags: tags || "",
        isMadeForKids: isMadeForKids === 'true' || isMadeForKids === true,
        ageRestricted: ageRestricted === 'true' || ageRestricted === true,
        visibility: visibility || "private",
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        userId: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            channelName: true,
            avatarUrl: true,
          }
        },
        likes: true
      }
    });
    
    await redis.del("videos:all");

    // --- UPLOAD NOTIFICATION LOGIC ---
    // 1. Creator ke sabhi subscribers ko fetch karein
    const subscriptions = await prisma.subscription.findMany({
      where: { channelId: userId },
    });

    const io = req.app.get("io");

    // 2. Har subscriber ke liye notification create karein aur emit karein
    for (const sub of subscriptions) {
      const notification = await prisma.notification.create({
        data: {
          userId: sub.subscriberId, // Subscriber jisko notification jayegi
          senderId: userId,         // Creator jisne video upload ki
          type: 'UPLOAD',
          message: `uploaded a new video: "${newVideo.title}"`,
        },
        include: {
          sender: { select: { id: true, channelName: true, avatarUrl: true } }
        }
      });

      if (io) {
        io.to(sub.subscriberId).emit('newNotification', notification);
      }
    }

    return res.status(201).json(newVideo);
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const getVideos = async (req, res) => {
  try {
    const currentPort = process.env.PORT || 3000;
    const cacheKey = "videos:all";
    const cachedVideos = await redis.get(cacheKey);

    if (cachedVideos) {
      return res.status(200).json({ 
        videos: JSON.parse(cachedVideos),
        success: true,
        source: "cache",
        servedByPort: currentPort,
      });
    }

    const videos = await prisma.video.findMany({
      include: { 
        user: {
          include: {
            subscribers: true,  
          }
        },
        likes: true 
      },
      orderBy: { uploadedAt: 'desc' }
    });

    await redis.setex(cacheKey, 300, JSON.stringify(videos));
    return res.status(200).json({ 
      videos,
      success: true,
      source: "database",
      servedByPort: currentPort,
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    const videoId = req.params.id;
    const userId = req.userId;
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      return res.status(404).json({ error: "Video not found." });
    }

    if (video.userId !== userId) {
      return res.status(403).json({ error: "You are not the owner of this video." });
    }

    await prisma.video.delete({
      where: { id: videoId },
    })
    await redis.del("videos:all");

    return res.status(200).json({ message: "Video deleted successfully." });
  } catch (error) {
    console.error('Error deleting video:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const incrementVideoView = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId; 

    const redisKey = `view:lock:${userId}:${id}`;
    const acquiredLock = await redis.set(redisKey, "locked", "EX", 10, "NX");
    
    if (!acquiredLock) {
      return res.status(200).json({ success: true, message: "Request already in progress." });
    }

    try {
      const existingView = await prisma.view.findUnique({
        where: { userId_videoId: { userId, videoId: id } }
      });

      if (existingView) {
        const video = await prisma.video.findUnique({ where: { id }, select: { views: true } });
        return res.status(200).json({ success: true, views: video?.views || 0 });
      }

      await prisma.view.create({
        data: { userId, videoId: id }
      });

      const updatedVideo = await prisma.video.update({
        where: { id },
        data: { views: { increment: 1 } },
        select: { views: true }
      });

      const io = req.app.get("io");
      if (io) {
        io.to(`video_${id}`).emit("view_updated", { views: updatedVideo.views });
      }

      await redis.del("videos:all");

      return res.status(200).json({ success: true, views: updatedVideo.views });

    } finally {
      await redis.del(redisKey);
    }

  } catch (error) {
    if (error.code === 'P2002') {
      const video = await prisma.video.findUnique({ where: { id: req.params.id }, select: { views: true } });
      return res.status(200).json({ success: true, views: video?.views || 0 });
    }
    return res.status(500).json({ error: error.message });
  }
};

export const toggleVideoLike = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.userId;

    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true, title: true, userId: true }
    });

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_videoId: { userId, videoId }
      }
    });

    let isLiked = false;

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id }
      });
      isLiked = false;
    } else {
      await prisma.like.create({
        data: { userId, videoId }
      });
      isLiked = true;

      // --- LIKE NOTIFICATION LOGIC ---
      // Agar user khud ki video like nahi kar raha tab notification bhejein
      if (video.userId !== userId) {
        const notification = await prisma.notification.create({
          data: {
            userId: video.userId, // Video ka malik
            senderId: userId,     // Jisne like kiya
            type: 'LIKE',
            message: `liked your video: "${video.title}"`,
          },
          include: {
            sender: { select: { id: true, channelName: true, avatarUrl: true } }
          }
        });

        const io = req.app.get("io");
        if (io) {
          io.to(video.userId).emit('newNotification', notification);
        }
      }
    }

    const likeCount = await prisma.like.count({
      where: { videoId }
    });
    await redis.del("videos:all");

    res.status(200).json({ 
      success: true, 
      isLiked, 
      likeCount 
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};