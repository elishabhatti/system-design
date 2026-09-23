import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

// Attaches `src` to the given video element, using hls.js for .m3u8 sources
// when native HLS isn't supported. Handles quality levels and auto-recovers
// from transient network/media errors; only a truly unrecoverable error
// surfaces as `fatalError`.
export function useHlsSource(videoRef, src, retryToken, { onSetupStart } = {}) {
  const hlsRef = useRef(null);
  const [levels, setLevels] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(-1); // -1 = Auto
  const [fatalError, setFatalError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setLevels([]);
    setCurrentLevel(-1);
    setFatalError(false);
    onSetupStart?.();

    if (src.includes(".m3u8")) {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        return;
      }
      if (Hls.isSupported()) {
        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
          setLevels(data.levels);
          setCurrentLevel(hls.currentLevel);
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => {
          setCurrentLevel(data.level);
        });

        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (!data.fatal) return;
          console.error("HLS fatal error:", data.type, data.details);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setFatalError(true);
              break;
          }
        });

        return () => {
          hls.destroy();
          hlsRef.current = null;
        };
      }
    } else {
      video.src = src;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, retryToken]);

  const changeQuality = (index) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = index;
      setCurrentLevel(index);
    }
  };

  return { levels, currentLevel, changeQuality, fatalError, setFatalError };
}