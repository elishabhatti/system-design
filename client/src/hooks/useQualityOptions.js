import { useMemo } from "react";

// Builds the manual quality option list for a video: each ffmpeg-worker
// rendition (from `videoQualities`, if transcoding is done) plus the
// original file as a guaranteed fallback (covers isProcessed === false,
// or every transcode having failed for this video).
//
// This is deliberately NOT HLS/adaptive — a discrete list of progressive
// MP4 files, like YouTube's old 360p/480p/720p dropdown. VideoPlayer swaps
// <video>.src directly between these; there's no hls.js level involved.
export function useQualityOptions(currentVideo) {
  return useMemo(() => {
    const renditions = currentVideo?.videoQualities || [];
    const base = renditions.map((r) => ({ label: r.resolution, src: r.filepath }));
    return [...base, { label: "Original", src: currentVideo?.filepath }].filter((o) => o.src);
  }, [currentVideo]);
}