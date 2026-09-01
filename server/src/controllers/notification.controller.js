import prisma from '../config/db.js';

// Get all notifications for logged-in user
export const getNotifications = async (req, res) => {
  try {
    const userId = req.userId;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      include: {
        sender: {
          select: {
            id: true,
            channelName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mark all unread notifications as read
export const markAsRead = async (req, res) => {
  try {
    const userId = req.userId;

    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};