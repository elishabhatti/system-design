import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";

const isHlsUrl = (src) => /\.m3u8(\?|$)/i.test(src || "");

/**
 * Attaches `src` to the <video>.
 *  - .m3u8 + hls.js support  -> adaptive streaming, starts on the LOWEST level
 *  - .m3u8 + native (Safari) -> native HLS
 *  - anything else (mp4)     -> plain src
 *
 * levels[i] = { height, bitrate }, index i matches hls.js level index
 * (hls.js sorts levels by bitrate ascending).
 */
export function useHlsSource(videoRef, src, retryToken = 0, { onSetupStart } = {}) {
  const hlsRef = useRef(null);
  const onSetupStartRef = useRef(onSetupStart);
  onSetupStartRef.current = onSetupStart;

  const [levels, setLevels] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(-1); // -1 = Auto (user's choice)
  const [activeLevel, setActiveLevel] = useState(-1); // level actually playing now
  const [fatalError, setFatalError] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !src) return;

    onSetupStartRef.current?.();
    setLevels([]);
    setCurrentLevel(-1);
    setActiveLevel(-1);
    setFatalError(false);

    const tryPlay = () => v.play().catch(() => {}); // autoplay can be blocked; not an error
    let hls = null;

    if (isHlsUrl(src) && Hls.isSupported()) {
      hls = new Hls({
        startLevel: 0, // lowest rendition first => fast start, ABR ramps up
        capLevelToPlayerSize: true, // don't fetch 1080p for a 480px player
        maxBufferLength: 30,
        startFragPrefetch: true,
        enableWorker: true,
      });
      hlsRef.current = hls;

      let networkRetries = 0;

      hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
        setLevels(data.levels.map((l) => ({ height: l.height, bitrate: l.bitrate })));
        tryPlay();
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => setActiveLevel(data.level));

      hls.on(Hls.Events.FRAG_LOADED, () => {
        networkRetries = 0;
      });

      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR && networkRetries < 3) {
          networkRetries += 1;
          setTimeout(() => hls.startLoad(), 1000 * networkRetries);
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        } else {
          console.error("HLS fatal error:", data.type, data.details);
          hls.destroy();
          setFatalError(true);
        }
      });

      hls.loadSource(src);
      hls.attachMedia(v);
    } else {
      // Native HLS (Safari) or a plain MP4
      v.src = src;
      tryPlay();
    }

    return () => {
      if (hls) {
        hls.destroy();
        hlsRef.current = null;
      } else {
        v.removeAttribute("src");
        v.load();
      }
    };
  }, [videoRef, src, retryToken]);

  // index = level index, -1 = Auto
  const changeQuality = useCallback((index) => {
    const hls = hlsRef.current;
    if (!hls) return;
    hls.currentLevel = index;
    setCurrentLevel(index);
  }, []);

  return { levels, currentLevel, activeLevel, changeQuality, fatalError, setFatalError };
}

export default useHlsSource;