import { useEffect, useRef, useState } from "react";
import { socket } from "../lib/socket";

// Joins the video's socket room, listens for live view_updated events,
// and eases the displayed number toward the real value instead of jumping.
export function useLiveViewCount(currentVideo, setCurrentVideo) {
  const [displayedViews, setDisplayedViews] = useState(0);
  const animFrameRef = useRef(null);

  useEffect(() => {
    if (!currentVideo?.id) return;

    socket.emit("join_video_room", currentVideo.id);

    const onViewUpdated = (data) => {
      if (data && typeof data.views === "number") {
        setCurrentVideo((prev) => (prev ? { ...prev, views: data.views } : prev));
      }
    };
    socket.on("view_updated", onViewUpdated);

    return () => {
      socket.emit("leave_video_room", currentVideo.id);
      socket.off("view_updated", onViewUpdated);
    };
  }, [currentVideo?.id, setCurrentVideo]);

  useEffect(() => {
    const target = currentVideo?.views ?? 0;
    const start = displayedViews;
    if (start === target) return;

    const duration = 600;
    const startTime = performance.now();

    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayedViews(Math.round(start + (target - start) * eased));
      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      }
    };

    animFrameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVideo?.views]);

  return displayedViews;
}