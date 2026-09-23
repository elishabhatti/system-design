import { useRef } from "react";
import { incrementVideoView } from "../services/api";

const MAX_VIEW_INCREMENT_ATTEMPTS = 3;
const WATCH_PERCENTAGE_THRESHOLD = 20;

// Fires a view-increment once a video has been watched past a threshold,
// retrying up to a small cap on failure — never re-fires on every
// timeupdate tick (~every 250ms) forever.
export function useViewIncrementOnWatch(currentVideoId, setCurrentVideo) {
  const countedSessionRef = useRef(new Set());
  const attemptCountRef = useRef({});

  const handleTimeUpdate = (e, currentTimeRef) => {
    const video = e.target;
    if (currentTimeRef) currentTimeRef.current = video.currentTime || 0;
    if (!video.duration || !currentVideoId) return;

    if (countedSessionRef.current.has(currentVideoId)) return;

    const watchedPercentage = (video.currentTime / video.duration) * 100;
    if (watchedPercentage < WATCH_PERCENTAGE_THRESHOLD) return;

    const attempts = attemptCountRef.current[currentVideoId] || 0;
    if (attempts >= MAX_VIEW_INCREMENT_ATTEMPTS) {
      countedSessionRef.current.add(currentVideoId);
      return;
    }

    countedSessionRef.current.add(currentVideoId);
    attemptCountRef.current[currentVideoId] = attempts + 1;

    incrementVideoView(currentVideoId)
      .then((data) => {
        if (data?.success && typeof data.views === "number") {
          setCurrentVideo((prev) =>
            prev && String(prev.id) === String(currentVideoId)
              ? { ...prev, views: data.views }
              : prev
          );
        }
      })
      .catch((err) => {
        console.error(
          `Failed to increment view (attempt ${attempts + 1}/${MAX_VIEW_INCREMENT_ATTEMPTS})`,
          err
        );
        if (attempts + 1 < MAX_VIEW_INCREMENT_ATTEMPTS) {
          countedSessionRef.current.delete(currentVideoId);
        }
      });
  };

  return handleTimeUpdate;
}