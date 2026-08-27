import prisma from "../config/db";

exports.toggleSubscribe = async (req, res) => {
  try {
    const subscriberId = req.user.id;
    const { channelId } = req.params;

    if (subscriberId === channelId) {
      return res.status(400).json({ error: "Aap apne channel ko subscribe nahi kar sakte!" });
    }

    const existingSub = await prisma.subscription.findUnique({
      where: {
        subscriberId_channelId: { subscriberId, channelId }
      }
    });

    if (existingSub) {
      await prisma.subscription.delete({
        where: { id: existingSub.id }
      });
      return res.json({ subscribed: false, message: "Unsubscribed successfully" });
    } else {
      await prisma.subscription.create({
        data: { subscriberId, channelId }
      });
      return res.json({ subscribed: true, message: "Subscribed successfully" });
    }
  } catch (err) {
    console.error("Subscribe error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get Subscriber Count & Status
exports.getSubscriptionsData = async (req, res) => {
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