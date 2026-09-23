export const CACHE_KEYS = {
  ALL_VIDEOS: "videos:all",
};

export const buildViewLockKey = (userId, videoId) => `view:lock:${userId}:${videoId}`;