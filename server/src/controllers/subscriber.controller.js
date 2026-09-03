import prisma from "../config/db";

export const toggleSubscribe = async (req, res) => {
  try {
    const subscriberId = req.user.id;
    const { channelId } = req.params;

    if (subscriberId === channelId) {
      return res.status(400).json({ error: "Aap apne channel ko subscribe nahi kar sakte!" });
    }

    // Use a transaction to ensure atomicity and prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      const existingSub = await tx.subscription.findUnique({
        where: {
          subscriberId_channelId: { subscriberId, channelId }
        }
      });

      if (existingSub) {
        await tx.subscription.delete({
          where: { id: existingSub.id }
        });
        return { subscribed: false };
      } else {
        await tx.subscription.create({
          data: { subscriberId, channelId }
        });

        // Create Notification in DB for new subscription
        const notif = await tx.notification.create({
          data: {
            userId: channelId, // Channel owner
            senderId: subscriberId,
            type: 'SUBSCRIBE',
            message: 'subscribed to your channel.'
          },
          include: {
            sender: { select: { id: true, channelName: true, avatarUrl: true } }
          }
        });

        // Emit via Socket.io if available
        const io = req.app.get('io');
        if (io) {
          io.to(channelId).emit('newNotification', notif);
        }

        return { subscribed: true };
      }
    });

    // Fetch the updated subscriber count safely outside
    const subscriberCount = await prisma.subscription.count({
      where: { channelId }
    });

    return res.json({ 
      subscribed: result.subscribed, 
      subscriberCount,
      message: result.subscribed ? "Subscribed successfully" : "Unsubscribed successfully" 
    });

  } catch (err) {
    console.error("Subscribe error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
// Get Subscriber Count & Status
export const getSubscriptionsData = async (req, res) => {
  try {
    const { channelId } = req.params;
    const currentUserId = req.user?.id;

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