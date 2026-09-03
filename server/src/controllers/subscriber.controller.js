import prisma from "../config/db";

export const toggleSubscribe = async (req, res) => {
  try {
    const subscriberId = req.user?.id || req.userId;
    const { channelId } = req.params;

    if (subscriberId === channelId) {
      return res.status(400).json({ error: "Aap apne channel ko subscribe nahi kar sakte!" });
    }

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
        return { subscribed: false, notif: null };
      } else {
        await tx.subscription.create({
          data: { subscriberId, channelId }
        });

        const notif = await tx.notification.create({
          data: {
            userId: channelId, 
            senderId: subscriberId,
            type: 'SUBSCRIBE',
            message: 'subscribed to your channel.'
          },
          include: {
            sender: { select: { id: true, channelName: true, avatarUrl: true } }
          }
        });

        return { subscribed: true, notif };
      }
    });

    if (result.notif) {
      const io = req.app.get('io');
      if (io) {
        io.to(channelId).emit('newNotification', result.notif);
      }
    }

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