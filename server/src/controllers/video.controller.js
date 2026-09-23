import * as videoService from '../services/video.services.js';

export const uploadVideo = async (req, res) => {
  try {
    const file = req.file;
    const userId = req.userId;

    if (!file) {
      return res.status(400).json({ error: "Video file is required." });
    }

    const video = await videoService.createVideo({
      fileMeta: file,
      payload: req.body,
      userId,
    });

    return res.status(201).json({
      success: true,
      message: "Video uploaded successfully! Background transcoding and notifications running.",
      video,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const getVideos = async (req, res) => {
  try {
    const currentPort = process.env.PORT || 3000;
    const { videos, source } = await videoService.listVideos();

    return res.status(200).json({
      videos,
      success: true,
      source,
      servedByPort: currentPort,
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    const result = await videoService.deleteVideoById({
      videoId: req.params.id,
      userId: req.userId,
    });

    if (result.status === "not_found") {
      return res.status(404).json({ error: "Video not found." });
    }
    if (result.status === "forbidden") {
      return res.status(403).json({ error: "You are not the owner of this video." });
    }

    return res.status(200).json({ message: "Video deleted successfully." });
  } catch (error) {
    console.error('Error deleting video:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const incrementVideoView = async (req, res) => {
  try {
    const result = await videoService.incrementView({
      videoId: req.params.id,
      userId: req.userId,
      io: req.app.get("io"),
    });

    if (result.status === "in_progress") {
      return res.status(200).json({ success: true, message: "Request already in progress." });
    }

    return res.status(200).json({ success: true, views: result.views });
  } catch (error) {
    console.error("Error incrementing view:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const toggleVideoLike = async (req, res) => {
  try {
    const result = await videoService.toggleLike({
      videoId: req.params.videoId,
      userId: req.userId,
      io: req.app.get("io"),
    });

    if (result.status === "not_found") {
      return res.status(404).json({ error: "Video not found" });
    }

    return res.status(200).json({
      success: true,
      isLiked: result.isLiked,
      likeCount: result.likeCount,
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};