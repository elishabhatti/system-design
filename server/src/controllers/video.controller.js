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

    const alreadyViewed = await prisma.view.findUnique({
      where: { userId_videoId: { userId, videoId: id } }
    });

    if (alreadyViewed) {
      return res.status(200).json({ success: true, message: "Already counted." });
    }

    await prisma.view.create({
      data: { userId, videoId: id }
    });

    const redisKey = `video:views:${id}`;
    const viewsCount = await redis.incr(redisKey);
    
    await prisma.video.update({
      where: { id },
      data: { views: viewsCount }
    });

    return res.status(200).json({ success: true, views: viewsCount });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};