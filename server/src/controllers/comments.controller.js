import prisma from '../config/db.js';

// Get all comments for a video
export const getCommentsByVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const comments = await prisma.comment.findMany({
      where: { videoId },
      include: {
        user: {
          select: {
            id: true,
            channelName: true,
            avatarUrl: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addComment = async (req, res) => {
  console.log("addComment called with req.body:", req.body);
  try {
    const { videoId } = req.params;
    
    // Yahan hum check kar rahe hain ke key 'content' ho ya 'comment'
    const commentText = req.body.content || req.body.comment || Object.values(req.body)[0];
    
    console.log("Adding comment for videoId:", videoId, "with content:", commentText);
    const userId = req.userId; 

    if (!commentText || !String(commentText).trim()) {
      return res.status(400).json({ error: "Comment content cannot be empty" });
    }

    const comment = await prisma.comment.create({
      data: {
        content: String(commentText).trim(),
        videoId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            channelName: true,
            avatarUrl: true,
          }
        }
      }
    });

    res.status(201).json({ message: "Comment added successfully", comment });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update Comment
export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Ownership Check
    if (comment.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized to update this comment" });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Comment content cannot be empty" });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content: content.trim() },
      include: {
        user: {
          select: { id: true, channelName: true, avatarUrl: true }
        }
      }
    });

    res.status(200).json({ message: "Comment updated successfully", comment: updatedComment });
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete Comment
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.userId;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Ownership Check
    if (comment.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized to delete this comment" });
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    res.status(200).json({ message: "Comment deleted successfully", commentId });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};