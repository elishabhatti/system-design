import { useEffect, useState } from "react";
import { toggleSubscribeChannel } from "../services/api";

export function useChannelSubscription(currentVideo, currentUser) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [subscribingLoading, setSubscribingLoading] = useState(false);

  useEffect(() => {
    if (!currentVideo?.user || !currentUser) return;

    const subs = currentVideo.user.subscribers || [];
    setSubscriberCount(subs.length);

    const currentUserId = currentUser.id || currentUser._id;
    const alreadySubscribed = subs.some(
      (sub) => String(sub.subscriberId) === String(currentUserId)
    );
    setIsSubscribed(alreadySubscribed);
  }, [currentVideo, currentUser]);

  const handleSubscribeToggle = async () => {
    if (!currentVideo?.userId) return { toast: null };

    const currentUserId = currentUser?.id || currentUser?._id;
    if (currentUserId && String(currentVideo.userId) === String(currentUserId)) {
      return { toast: "You can't subscribe to your own channel!" };
    }

    setSubscribingLoading(true);
    try {
      const res = await toggleSubscribeChannel(currentVideo.userId);
      setIsSubscribed(res.isSubscribed);
      setSubscriberCount(res.subscriberCount);
      return { toast: null };
    } catch (err) {
      console.error("Failed to toggle subscription", err);
      return { toast: "Subscription couldn't be updated." };
    } finally {
      setSubscribingLoading(false);
    }
  };

  return { isSubscribed, subscriberCount, subscribingLoading, handleSubscribeToggle };
}