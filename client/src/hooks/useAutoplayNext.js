import { useEffect, useRef, useState } from "react";

const AUTOPLAY_COUNTDOWN_SECONDS = 5;

export function useAutoplayNext(sidebarVideos, navigate) {
  const [autoplayCountdown, setAutoplayCountdown] = useState(null);
  const intervalRef = useRef(null);

  const cancelAutoplay = () => {
    clearInterval(intervalRef.current);
    setAutoplayCountdown(null);
  };

  const handleVideoEnded = () => {
    if (sidebarVideos.length === 0) return;
    setAutoplayCountdown(AUTOPLAY_COUNTDOWN_SECONDS);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setAutoplayCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          navigate(`/watch/${sidebarVideos[0].id}`);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  return { autoplayCountdown, handleVideoEnded, cancelAutoplay };
}