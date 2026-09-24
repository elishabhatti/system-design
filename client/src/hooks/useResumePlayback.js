import { useEffect, useRef, useState } from "react";

const RESUME_MIN_REMAINING_SECONDS = 10;
const RESUME_SAVE_INTERVAL_MS = 4000;

export function useResumePlayback(videoRef, videoId, src) {
  const [resumePrompt, setResumePrompt] = useState(null);
  const resumeAppliedRef = useRef(false);
  const lastSavedAtRef = useRef(0);
  const resumeKey = videoId ? `video-resume:${videoId}` : null;

  // Reset on videoId change ONLY, not on every `src` change — a quality
  // switch changes `src` while staying on the same video, and shouldn't
  // re-trigger the "resume from X?" prompt.
  useEffect(() => {
    resumeAppliedRef.current = false;
  }, [videoId]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !resumeKey) return;

    const onLoadedMeta = () => {
      if (resumeAppliedRef.current) return;
      resumeAppliedRef.current = true;
      try {
        const saved = parseFloat(localStorage.getItem(resumeKey));
        if (
          !isNaN(saved) &&
          saved > 5 &&
          v.duration &&
          v.duration - saved > RESUME_MIN_REMAINING_SECONDS
        ) {
          setResumePrompt(saved);
        }
      } catch {
        // localStorage unavailable (private mode etc.) — silently skip.
      }
    };

    v.addEventListener("loadedmetadata", onLoadedMeta);
    return () => v.removeEventListener("loadedmetadata", onLoadedMeta);
  }, [resumeKey, src, videoRef]);

  const saveProgress = (currentTime, duration) => {
    if (!resumeKey || !duration) return;
    const now = Date.now();
    if (now - lastSavedAtRef.current <= RESUME_SAVE_INTERVAL_MS) return;
    lastSavedAtRef.current = now;
    try {
      if (duration - currentTime <= RESUME_MIN_REMAINING_SECONDS) {
        localStorage.removeItem(resumeKey);
      } else {
        localStorage.setItem(resumeKey, String(currentTime));
      }
    } catch {
      // ignore storage errors
    }
  };

  const clearProgress = () => {
    if (!resumeKey) return;
    try {
      localStorage.removeItem(resumeKey);
    } catch {
      // ignore
    }
  };

  const applyResume = (seconds) => {
    if (videoRef.current) videoRef.current.currentTime = seconds;
    setResumePrompt(null);
  };

  const dismissResume = () => {
    setResumePrompt(null);
    clearProgress();
  };

  return { resumePrompt, applyResume, dismissResume, saveProgress, clearProgress };
}