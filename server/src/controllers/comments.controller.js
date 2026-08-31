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