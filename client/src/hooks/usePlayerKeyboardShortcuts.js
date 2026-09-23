import { useEffect } from "react";

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
}

// Space/K play-pause, J/L or arrows to seek, up/down for volume, M mute,
// F fullscreen, T theater mode, 0-9 to jump to a % of the video, ? for the
// cheat sheet.
export function usePlayerKeyboardShortcuts({
  videoRef,
  isLive,
  duration,
  muted,
  volume,
  onToggleTheater,
  togglePlay,
  skip,
  seekTo,
  toggleMute,
  toggleFullscreen,
  setVolumeSafely,
  setSeekFlash,
  setShowShortcuts,
  resetHideTimer,
}) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (isTypingTarget(document.activeElement)) return;
      if (!videoRef.current) return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "j":
        case "arrowleft":
          e.preventDefault();
          skip(-10);
          setSeekFlash("left");
          setTimeout(() => setSeekFlash(null), 400);
          break;
        case "l":
        case "arrowright":
          e.preventDefault();
          skip(10);
          setSeekFlash("right");
          setTimeout(() => setSeekFlash(null), 400);
          break;
        case "arrowup":
          e.preventDefault();
          setVolumeSafely((muted ? 0 : volume) + 0.1);
          break;
        case "arrowdown":
          e.preventDefault();
          setVolumeSafely((muted ? 0 : volume) - 0.1);
          break;
        case "m":
          toggleMute();
          break;
        case "f":
          toggleFullscreen();
          break;
        case "t":
          onToggleTheater?.();
          break;
        case "?":
          setShowShortcuts((s) => !s);
          break;
        case "escape":
          setShowShortcuts(false);
          break;
        default: {
          if (!isLive && /^[0-9]$/.test(e.key) && duration) {
            const pct = parseInt(e.key, 10) / 10;
            seekTo(duration * pct);
          }
        }
      }
      resetHideTimer();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [togglePlay, skip, seekTo, duration, muted, volume, isLive, onToggleTheater, resetHideTimer]);
}