import { useEffect, useState } from "react";
import { toggleVideoLikeApi } from "../services/api";

// Owns like/unlike state, the optimistic update, and the "+1" burst
// animation for a single video. Pass the current video + current user;
// the hook resyncs whenever either changes (e.g. navigating to a new video).
export function useVideoLikes(currentVideo, currentUser) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [likeBursts, setLikeBursts] = useState([]);

  useEffect(() => {
    if (!currentVideo) return;

    const count =
      currentVideo._count?.likes ??
      currentVideo.likesCount ??
      (Array.isArray(currentVideo.likes) ? currentVideo.likes.length : 0);
    setLikeCount(count);

    if (currentUser && Array.isArray(currentVideo.likes)) {
      const currentUserId = currentUser.id || currentUser._id;
      const hasLiked = currentVideo.likes.some(
        (l) => String(l.userId || l.id) === String(currentUserId)
      );
      setLiked(hasLiked);
    }
  }, [currentVideo, currentUser]);

  const handleLikeToggle = async (e) => {
    if (!currentVideo?.id || likeLoading) return;

    setLikeLoading(true);
    const previousLiked = liked;
    const previousCount = likeCount;

    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikeCount((prev) => (newLikedState ? prev + 1 : Math.max(0, prev - 1)));

    if (newLikedState && e?.currentTarget) {
      const burstId = Date.now();
      setLikeBursts((prev) => [...prev, { id: burstId }]);
      setTimeout(() => {
        setLikeBursts((prev) => prev.filter((b) => b.id !== burstId));
      }, 700);
    }

    try {
      const res = await toggleVideoLikeApi(currentVideo.id);
      if (res?.success) {
        setLiked(res.isLiked);
        setLikeCount(res.likeCount);
      }
    } catch (err) {
      console.error("Failed to toggle like", err);
      setLiked(previousLiked);
      setLikeCount(previousCount);
      return { error: "Could not update like status." };
    } finally {
      setLikeLoading(false);
    }
    return { error: null };
  };

  return { liked, likeCount, likeLoading, likeBursts, handleLikeToggle };
}