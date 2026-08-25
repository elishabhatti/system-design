import prisma from '../config/db.js';
import redis from '../config/redis.js';

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
            channelName: true,
            avatarUrl: true,
          }
        }
      }
    });

    return res.status(201).json(newVideo);
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const getVideos = async (req, res) => {
  try {
    const currentPort = process.env.PORT || 3000;
    const videos = await prisma.video.findMany({
      include: { user: true },
      orderBy: { uploadedAt: 'desc' }
    });

    return res.status(200).json({ 
      videos,
      success: true,
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
    });

    return res.status(200).json({ message: "Video deleted successfully." });
  } catch (error) {
    console.error('Error deleting video:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const incrementVideoView = async (req, res) => {
  console.log(req.userId, req.params.id, "Incrementing view count for video");
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