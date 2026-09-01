import prisma from "../config/db.js";

export const toggleSubscribe = async (req, res) => {
  try {
    const subscriberId = req.user.id || req.userId;
    const { channelId } = req.params;

    if (subscriberId === channelId) {
      return res.status(400).json({ error: "Aap apne channel ko subscribe nahi kar sakte!" });
    }

    const existingSub = await prisma.subscription.findUnique({
      where: {
        subscriberId_channelId: { subscriberId, channelId }
      }
    });

    let isSubscribed = false;
    if (existingSub) {
      await prisma.subscription.delete({
        where: { id: existingSub.id }
      });
      isSubscribed = false;
    } else {
      await prisma.subscription.create({
        data: { subscriberId, channelId }
      });
      isSubscribed = true;

      try {
        const notification = await prisma.notification.create({
          data: {
            userId: channelId,     // Channel owner
            senderId: subscriberId, // Subscriber
            type: 'SUBSCRIBE',
            message: 'started subscribing to your channel.'
          },
          include: {
            sender: {
              select: { id: true, channelName: true, avatarUrl: true }
            }
          }
        });

        // Socket.io emit to channel owner room
        const io = req.app.get('io');
        if (io) {
          io.to(channelId).emit('newNotification', notification);
        }
      } catch (notifErr) {
        console.error("Failed to create subscribe notification:", notifErr);
      }
    }

    const subscriberCount = await prisma.subscription.count({
      where: { channelId }
    });

    return res.json({ subscribed: isSubscribed, isSubscribed, subscriberCount, message: isSubscribed ? "Subscribed successfully" : "Unsubscribed successfully" });
  } catch (err) {
    console.error("Subscribe error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get Subscriber Count & Status
export const getSubscriptionsData = async (req, res) => {
  try {
    const { channelId } = req.params;
    const currentUserId = req.user?.id || req.userId;

    const subscriberCount = await prisma.subscription.count({
      where: { channelId }
    });

    let isSubscribed = false;
    if (currentUserId) {
      const check = await prisma.subscription.findUnique({
        where: {
          subscriberId_channelId: { subscriberId: currentUserId, channelId }
        }
      });
      isSubscribed = !!check;
    }

    res.json({ subscriberCount, isSubscribed });
  } catch (err) {
    console.error("Fetch subs error:", err);
    res.status(500).json({ error: "Server error" });
  }
};