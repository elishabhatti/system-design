import * as videoService from '../services/videoService.js';

const sendError = (res, status, message) => res.status(status).json({ success: false, message });

export const uploadVideo = async (req, res) => {
  try {
    const file = req.file;
    const userId = req.userId;

    if (!file) {
      return sendError(res, 400, "Video file is required.");
    }

    const video = await videoService.createVideo({
      fileMeta: file,
      payload: req.body,
      userId,
    });

    return res.status(201).json({
      success: true,
      message: "Video uploaded successfully! Background transcoding and notifications running.",
      data: video,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return sendError(res, 500, error.message);
  }
};

export const getVideos = async (req, res) => {
  try {
    const { videos, source } = await videoService.listVideos();
    return res.status(200).json({
      success: true,
      message: "Videos fetched successfully.",
      data: videos,
      source,
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return sendError(res, 500, error.message);
  }
};

export const deleteVideo = async (req, res) => {
  try {
    const result = await videoService.deleteVideoById({
      videoId: req.params.id,
      userId: req.userId,
    });

    if (result.status === "not_found") {
      return sendError(res, 404, "Video not found.");
    }
    if (result.status === "forbidden") {
      return sendError(res, 403, "You are not the owner of this video.");
    }

    return res.status(200).json({ success: true, message: "Video deleted successfully." });
  } catch (error) {
    console.error('Error deleting video:', error);
    return sendError(res, 500, error.message);
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

    return res.status(200).json({
      success: true,
      message: "View recorded.",
      data: { views: result.views },
    });
  } catch (error) {
    console.error("Error incrementing view:", error);
    return sendError(res, 500, error.message);
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
      return sendError(res, 404, "Video not found.");
    }

    return res.status(200).json({
      success: true,
      message: result.isLiked ? "Video liked." : "Video unliked.",
      data: { isLiked: result.isLiked, likeCount: result.likeCount },
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    return sendError(res, 500, error.message);
  }
};