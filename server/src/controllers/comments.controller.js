import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

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

// Add a new comment
export const addComment = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { content } = req.body;
    const userId = req.user.id; // from protect middleware

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Comment content cannot be empty" });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
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