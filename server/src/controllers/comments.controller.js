import prisma from "../config/db.js";

// Get all comments
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
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addComment = async (req, res) => {
  try {
    const { videoId } = req.params;
    const commentText = req.body.content || req.body.comment || Object.values(req.body)[0];
    const userId = req.userId || req.user?.id;

    if (!commentText || !String(commentText).trim()) {
      return res.status(400).json({ error: "Comment content cannot be empty" });
    }

    const trimmedContent = String(commentText).trim();

    const { comment, notif } = await prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          content: trimmedContent,
          videoId,
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              channelName: true,
              avatarUrl: true,
            },
          },
        },
      });

      const video = await tx.video.findUnique({
        where: { id: videoId },
        select: { userId: true }
      });

      let createdNotif = null;
      if (video && video.userId !== userId) {
        createdNotif = await tx.notification.create({
          data: {
            userId: video.userId,
            senderId: userId,
            type: 'COMMENT',
            message: `commented on your video: "${trimmedContent.substring(0, 25)}${trimmedContent.length > 25 ? '...' : ''}"`
          },
          include: {
            sender: { select: { id: true, channelName: true, avatarUrl: true } }
          }
        });
      }

      return { comment: newComment, notif: createdNotif };
    });

    if (notif) {
      const io = req.app.get('io');
      if (io) {
        io.to(notif.userId).emit('newNotification', notif);
      }
    }

    res.status(201).json({ message: "Comment added successfully", comment });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.userId || req.user?.id;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

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
          select: { id: true, channelName: true, avatarUrl: true },
        },
      },
    });

    res.status(200).json({
      message: "Comment updated successfully",
      comment: updatedComment,
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.userId || req.user?.id;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (comment.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized to delete this comment" });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    res.status(200).json({ message: "Comment deleted successfully", commentId });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};