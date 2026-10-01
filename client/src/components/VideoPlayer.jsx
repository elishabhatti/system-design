import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  PictureInPicture2,
  RotateCcw,
  RotateCw,
  Check,
  RectangleHorizontal,
  Keyboard,
  AlertTriangle,
  RefreshCw,
  WifiOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { useHlsSource } from "../hooks/useHlsSource";
import { useResumePlayback } from "../hooks/useResumePlayback";
import { usePlayerKeyboardShortcuts } from "../hooks/usePlayerKeyboardShortcuts";

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const CLICK_DELAY_MS = 220; // wait to tell single click from double click
const SEEK_CHAIN_MS = 500; // after a double-tap, extra taps keep seeking

function formatTime(sec) {
  if (!isFinite(sec)) return "0:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function MenuShell({ children, className = "w-52" }) {
  return (
    <div
      className={`absolute bottom-11 right-0 ${className} z-20 rounded-xl border border-white/10 bg-zinc-950/95 py-1.5 text-sm shadow-2xl backdrop-blur-md`}
    >
      {children}
    </div>
  );
}

function MenuBack({ onClick, title }) {
  return (
    <button
      onClick={onClick}
      className="mb-1 flex w-full cursor-pointer items-center gap-1.5 border-b border-white/10 px-3 py-2 text-left text-zinc-300 transition hover:text-white"
    >
      <ChevronLeft className="h-4 w-4" />
      <span className="font-medium">{title}</span>
    </button>
  );
}

function MenuOption({ active, onClick, children, hint }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center justify-between px-4 py-2 transition hover:bg-white/10 ${
        active ? "text-white" : "text-zinc-400"
      }`}
    >
      <span className="flex items-center gap-2">
        {children}
        {hint && <span className="text-xs text-zinc-500">{hint}</span>}
      </span>
      {active && <Check className="h-4 w-4 text-white" />}
    </button>
  );
}

export default function VideoPlayer({
  src,
  qualities = [], // [{ label, src }] — legacy progressive-MP4 renditions (no HLS)
  videoId,
  isLive,
  poster,
  handleTimeUpdate,
  onEnded,
  theaterMode,
  onToggleTheater,
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const progressBarRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverX, setHoverX] = useState(0);
  const [seekFlash, setSeekFlash] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null); // 'main' | 'speed' | 'quality'
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [slowNetwork, setSlowNetwork] = useState(false);
  const [volumeFlash, setVolumeFlash] = useState(null);
  const [retryToken, setRetryToken] = useState(0);
  const [manualQualityLabel, setManualQualityLabel] = useState(null);

  const hideTimer = useRef(null);
  const volFlashTimer = useRef(null);
  const seekFlashTimer = useRef(null);
  const slowNetworkTimer = useRef(null);
  const clickTimer = useRef(null);
  const seekChainUntil = useRef(0);
  const pendingResumeRef = useRef(null);

  // `playing` mirrored in a ref so the hide-controls timer never reads a stale value
  const playingRef = useRef(false);
  playingRef.current = playing;

  // Latest callbacks in refs => video listeners are bound once per source,
  // not re-bound on every parent render.
  const handleTimeUpdateRef = useRef(handleTimeUpdate);
  const onEndedRef = useRef(onEnded);
  handleTimeUpdateRef.current = handleTimeUpdate;
  onEndedRef.current = onEnded;

  const hasManualQualities = qualities.length > 1;

  const resolvedSrc = hasManualQualities
    ? qualities.find((q) => q.label === manualQualityLabel)?.src || qualities[0].src
    : src;

  const { levels, currentLevel, activeLevel, changeQuality, fatalError, setFatalError } =
    useHlsSource(videoRef, resolvedSrc, retryToken, {
      onSetupStart: () => setActiveMenu(null),
    });

  const { resumePrompt, applyResume, dismissResume, saveProgress, clearProgress } =
    useResumePlayback(videoRef, videoId, resolvedSrc);

  const saveProgressRef = useRef(saveProgress);
  const clearProgressRef = useRef(clearProgress);
  saveProgressRef.current = saveProgress;
  clearProgressRef.current = clearProgress;

  // ---- Quality (one list for both HLS levels and legacy MP4 renditions) ----
  const qualityOptions = hasManualQualities
    ? qualities.map((q) => ({
        key: q.label,
        label: q.label,
        active: (manualQualityLabel || qualities[0].label) === q.label,
        onSelect: () => {
          const v = videoRef.current;
          pendingResumeRef.current = { time: v?.currentTime || 0, wasPlaying: v && !v.paused };
          setManualQualityLabel(q.label);
          setActiveMenu(null);
        },
      }))
    : [
        ...(levels.length > 0
          ? [
              {
                key: "auto",
                label: "Auto",
                hint: currentLevel === -1 && activeLevel >= 0 ? `${levels[activeLevel]?.height}p` : "",
                active: currentLevel === -1,
                onSelect: () => {
                  changeQuality(-1);
                  setActiveMenu(null);
                },
              },
            ]
          : []),
        ...levels
          .map((l, index) => ({ ...l, index }))
          .sort((a, b) => b.height - a.height)
          .map((l) => ({
            key: `lvl-${l.index}`,
            label: `${l.height}p`,
            active: currentLevel === l.index,
            onSelect: () => {
              changeQuality(l.index);
              setActiveMenu(null);
            },
          })),
      ];

  const hasQualityMenu = qualityOptions.length > 0;

  const currentQualityLabel = hasManualQualities
    ? manualQualityLabel || qualities[0].label
    : currentLevel === -1
    ? activeLevel >= 0
      ? `${levels[activeLevel]?.height}p`
      : "Auto"
    : `${levels[currentLevel]?.height}p`;

  // volume/mute/speed are JS properties on the media element, not attributes
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const applySettings = () => {
      v.volume = volume;
      v.muted = muted;
      v.playbackRate = speed;
    };
    applySettings();
    v.addEventListener("loadedmetadata", applySettings);
    return () => v.removeEventListener("loadedmetadata", applySettings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedSrc, retryToken]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, []);

  const seekTo = useCallback(
    (time) => {
      const v = videoRef.current;
      if (!v || !isFinite(duration)) return;
      v.currentTime = Math.min(Math.max(time, 0), duration || 0);
    },
    [duration]
  );

  const skip = useCallback(
    (delta) => {
      const v = videoRef.current;
      if (!v) return;
      seekTo(v.currentTime + delta);
    },
    [seekTo]
  );

  // ---- Progress bar (pointer events => mouse + touch + pen) ----
  const getTimeFromClientX = (clientX) => {
    const bar = progressBarRef.current;
    if (!bar) return 0;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    return ratio * duration;
  };

  const handleBarPointerMove = (e) => {
    const rect = progressBarRef.current.getBoundingClientRect();
    setHoverTime(getTimeFromClientX(e.clientX));
    setHoverX(Math.min(Math.max(e.clientX - rect.left, 0), rect.width));
    if (dragging) seekTo(getTimeFromClientX(e.clientX));
  };

  const handleBarPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    seekTo(getTimeFromClientX(e.clientX));
  };

  const handleBarPointerUp = (e) => {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    setDragging(false);
  };

  const flashSeek = (dir) => {
    setSeekFlash(dir);
    clearTimeout(seekFlashTimer.current);
    seekFlashTimer.current = setTimeout(() => setSeekFlash(null), 500);
  };

  const setVolumeSafely = (val) => {
    const v = videoRef.current;
    const clamped = Math.min(Math.max(val, 0), 1);
    setVolume(clamped);
    if (v) {
      v.volume = clamped;
      v.muted = clamped === 0;
    }
    setMuted(clamped === 0);
    setVolumeFlash(clamped);
    clearTimeout(volFlashTimer.current);
    volFlashTimer.current = setTimeout(() => setVolumeFlash(null), 700);
  };

  const handleVolumeChange = (e) => setVolumeSafely(parseFloat(e.target.value));

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const changeSpeed = (s) => {
    const v = videoRef.current;
    if (v) v.playbackRate = s;
    setSpeed(s);
    setActiveMenu(null);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await videoRef.current.requestPictureInPicture();
    } catch (err) {
      console.warn("PiP not supported", err);
    }
  };

  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (playingRef.current) {
        setControlsVisible(false);
        setActiveMenu(null);
      }
    }, 2500);
  }, []);

  // Paused => controls always visible. Started playing => start the hide countdown.
  useEffect(() => {
    if (playing) resetHideTimer();
    else {
      clearTimeout(hideTimer.current);
      setControlsVisible(true);
    }
  }, [playing, resetHideTimer]);

  // ---- YouTube-style click surface ----
  // single click        => play / pause
  // double click L / R  => seek -/+ 10s (extra taps within 500ms keep seeking)
  // double click center => fullscreen
  const handleSurfaceClick = (zone) => () => {
    if (activeMenu) {
      setActiveMenu(null); // first click only dismisses an open menu
      return;
    }

    const now = Date.now();
    const isSide = zone === "left" || zone === "right";

    if (clickTimer.current || (isSide && now < seekChainUntil.current)) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;

      if (zone === "center") {
        toggleFullscreen();
      } else {
        skip(zone === "left" ? -10 : 10);
        flashSeek(zone);
        seekChainUntil.current = now + SEEK_CHAIN_MS;
      }
      return;
    }

    clickTimer.current = setTimeout(() => {
      clickTimer.current = null;
      togglePlay();
    }, CLICK_DELAY_MS);
  };

  const handleRetry = () => {
    setFatalError(false);
    setLoading(true);
    setRetryToken((n) => n + 1);
  };

  useEffect(() => {
    return () => {
      clearTimeout(hideTimer.current);
      clearTimeout(volFlashTimer.current);
      clearTimeout(seekFlashTimer.current);
      clearTimeout(slowNetworkTimer.current);
      clearTimeout(clickTimer.current);
    };
  }, []);

  usePlayerKeyboardShortcuts({
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
  });

  // ---- <video> events ----
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const clearSlowTimer = () => {
      clearTimeout(slowNetworkTimer.current);
      setSlowNetwork(false);
    };

    const updateBuffered = () => {
      const b = v.buffered;
      const t = v.currentTime;
      for (let i = 0; i < b.length; i++) {
        if (b.start(i) <= t + 0.5 && t <= b.end(i)) {
          setBuffered(b.end(i));
          return;
        }
      }
      setBuffered(0);
    };

    const onTimeUpdate = () => {
      setCurrentTime(v.currentTime);
      handleTimeUpdateRef.current?.({ target: v });
      saveProgressRef.current?.(v.currentTime, v.duration);
      updateBuffered();
    };
    const onLoadedMeta = () => {
      setDuration(v.duration);
      if (pendingResumeRef.current) {
        v.currentTime = pendingResumeRef.current.time;
        if (pendingResumeRef.current.wasPlaying) v.play().catch(() => {});
        pendingResumeRef.current = null;
      }
    };
    const onDurationChange = () => setDuration(v.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onWaiting = () => {
      setLoading(true);
      clearTimeout(slowNetworkTimer.current);
      slowNetworkTimer.current = setTimeout(() => setSlowNetwork(true), 3500);
    };
    const onReady = () => {
      setLoading(false);
      clearSlowTimer();
    };
    const onError = () => {
      // With hls.js attached, errors are handled by the hook; only react to
      // native <video> errors here.
      if (v.error) {
        console.error("Video failed to load:", v.error);
        setLoading(false);
        setFatalError(true);
      }
    };
    const onEndedEvent = () => {
      clearProgressRef.current?.();
      onEndedRef.current?.();
    };

    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("loadedmetadata", onLoadedMeta);
    v.addEventListener("durationchange", onDurationChange);
    v.addEventListener("progress", updateBuffered);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("canplay", onReady);
    v.addEventListener("playing", onReady);
    v.addEventListener("error", onError);
    v.addEventListener("ended", onEndedEvent);

    return () => {
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("loadedmetadata", onLoadedMeta);
      v.removeEventListener("durationchange", onDurationChange);
      v.removeEventListener("progress", updateBuffered);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("canplay", onReady);
      v.removeEventListener("playing", onReady);
      v.removeEventListener("error", onError);
      v.removeEventListener("ended", onEndedEvent);
      clearTimeout(slowNetworkTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedSrc, retryToken]);

  // New source => show spinner again
  useEffect(() => {
    setLoading(true);
  }, [resolvedSrc, retryToken]);

  const progressPct = duration ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration ? (buffered / duration) * 100 : 0;

  // keep the hover tooltip inside the bar's edges
  const barWidth = progressBarRef.current?.clientWidth || 0;
  const tooltipX = barWidth ? Math.min(Math.max(hoverX, 24), barWidth - 24) : hoverX;

  const hideCursor = playing && !controlsVisible;

  return (
    <div
      ref={containerRef}
      className={`group/player relative aspect-video w-full select-none overflow-hidden bg-black ${
        hideCursor ? "cursor-none" : ""
      }`}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => {
        if (playingRef.current) {
          setControlsVisible(false);
          setActiveMenu(null);
        }
      }}
    >
      <video
        ref={videoRef}
        poster={poster}
        autoPlay
        playsInline
        className="h-full w-full object-contain"
      />

      {/* click surface: left / center / right thirds (sits above the video, below the controls) */}
      <div className="absolute inset-0 flex">
        <div className="h-full w-[30%] cursor-pointer" onClick={handleSurfaceClick("left")} />
        <div className="h-full w-[40%] cursor-pointer" onClick={handleSurfaceClick("center")} />
        <div className="h-full w-[30%] cursor-pointer" onClick={handleSurfaceClick("right")} />
      </div>

      {seekFlash && (
        <div
          className={`pointer-events-none absolute top-1/2 flex -translate-y-1/2 animate-pulse flex-col items-center gap-1 text-white ${
            seekFlash === "left" ? "left-10" : "right-10"
          }`}
        >
          {seekFlash === "left" ? <RotateCcw className="h-8 w-8" /> : <RotateCw className="h-8 w-8" />}
          <span className="text-xs font-semibold">10 seconds</span>
        </div>
      )}

      {volumeFlash !== null && (
        <div className="pointer-events-none absolute left-1/2 top-6 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/80 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
          {volumeFlash === 0 ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          {Math.round(volumeFlash * 100)}%
        </div>
      )}

      {loading && !fatalError && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-white/25 border-t-white" />
          {slowNetwork && (
            <span className="flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1 text-xs text-zinc-300">
              <WifiOff className="h-3 w-3" /> Slow connection, buffering
            </span>
          )}
        </div>
      )}

      {fatalError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/90 px-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-400" />
          <p className="text-sm font-medium text-zinc-200">This video couldn't be played.</p>
          <button
            onClick={handleRetry}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      )}

      {/* paused indicator: visual only, clicks go to the surface above */}
      {!playing && !loading && !fatalError && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
            <Play className="ml-1 h-7 w-7 fill-white text-white" />
          </span>
        </div>
      )}

      {isLive && (
        <span className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-1 rounded bg-red-600 px-2 py-1 text-[10px] font-bold tracking-wide text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          LIVE
        </span>
      )}

      {resumePrompt !== null && !fatalError && (
        <div className="absolute bottom-20 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-white/15 bg-zinc-950/95 px-4 py-2.5 text-xs shadow-2xl backdrop-blur-md">
          <span className="text-zinc-300">
            Continue from <span className="font-semibold text-white">{formatTime(resumePrompt)}</span>?
          </span>
          <button
            onClick={() => applyResume(resumePrompt)}
            className="cursor-pointer rounded-lg bg-white px-3 py-1 font-semibold text-black transition hover:bg-zinc-200"
          >
            Continue
          </button>
          <button onClick={dismissResume} className="cursor-pointer text-zinc-500 transition hover:text-zinc-300">
            Start over
          </button>
        </div>
      )}

      {showShortcuts && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-zinc-950 p-5 shadow-2xl">
            <div className="mb-3 flex items-center gap-2 text-white">
              <Keyboard className="h-4 w-4 text-zinc-400" />
              <h4 className="text-sm font-semibold">Keyboard shortcuts</h4>
            </div>
            <div className="grid grid-cols-2 gap-y-2 text-xs text-zinc-300">
              <span>Space / K</span><span className="text-zinc-500">Play / pause</span>
              <span>J / L or ← / →</span><span className="text-zinc-500">Seek 10 seconds</span>
              <span>↑ / ↓</span><span className="text-zinc-500">Volume</span>
              <span>M</span><span className="text-zinc-500">Mute</span>
              <span>F</span><span className="text-zinc-500">Fullscreen</span>
              <span>T</span><span className="text-zinc-500">Theater mode</span>
              <span>0–9</span><span className="text-zinc-500">Jump to 0–90%</span>
              <span>?</span><span className="text-zinc-500">Show this list</span>
            </div>
            <button
              onClick={() => setShowShortcuts(false)}
              className="mt-4 w-full cursor-pointer rounded-lg bg-white/10 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* controls */}
      <div
        className={`absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-3 pt-10 transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {/* progress */}
        <div
          ref={progressBarRef}
          className="group/bar relative mb-3 h-4 w-full cursor-pointer touch-none py-1.5"
          onPointerMove={handleBarPointerMove}
          onPointerLeave={() => !dragging && setHoverTime(null)}
          onPointerDown={handleBarPointerDown}
          onPointerUp={handleBarPointerUp}
          onPointerCancel={handleBarPointerUp}
        >
          <div className="relative h-1 w-full rounded-full bg-white/20 transition-all group-hover/bar:h-1.5">
            <div className="absolute inset-y-0 left-0 rounded-full bg-white/35" style={{ width: `${bufferedPct}%` }} />
            <div className="absolute inset-y-0 left-0 rounded-full bg-white" style={{ width: `${progressPct}%` }} />
            <div
              className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white opacity-0 shadow transition-opacity group-hover/bar:opacity-100"
              style={{ left: `calc(${progressPct}% - 7px)` }}
            />
          </div>
          {hoverTime !== null && !isLive && (
            <div
              className="pointer-events-none absolute -top-6 -translate-x-1/2 rounded bg-black/90 px-1.5 py-1 text-[11px] tabular-nums text-white"
              style={{ left: tooltipX }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="cursor-pointer transition hover:text-zinc-300"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
            </button>

            <div className="group/vol flex items-center gap-1.5">
              <button onClick={toggleMute} className="cursor-pointer" aria-label="Mute">
                {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <div className="w-0 overflow-hidden transition-all duration-200 group-hover/vol:w-16">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={muted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="h-1 w-16 cursor-pointer accent-white"
                />
              </div>
            </div>

            {isLive ? (
              <span className="text-xs font-semibold text-red-400">LIVE</span>
            ) : (
              <span className="text-xs tabular-nums text-zinc-300">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            )}
          </div>

          <div className="relative flex items-center gap-3">
            {hasQualityMenu && (
              <button
                onClick={() => setActiveMenu(activeMenu === "quality" ? null : "quality")}
                className="cursor-pointer rounded-md border border-white/20 px-2 py-0.5 text-xs font-medium tabular-nums transition hover:border-white hover:text-white"
                title="Video quality"
              >
                {currentQualityLabel}
              </button>
            )}

            <button
              onClick={() => setShowShortcuts(true)}
              className="hidden cursor-pointer text-zinc-300 transition hover:text-white sm:flex"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard className="h-5 w-5" />
            </button>

            {typeof onToggleTheater === "function" && (
              <button
                onClick={onToggleTheater}
                className={`hidden cursor-pointer transition sm:flex ${
                  theaterMode ? "text-white" : "text-zinc-300 hover:text-white"
                }`}
                title="Theater mode (T)"
              >
                <RectangleHorizontal className="h-5 w-5" />
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === "main" ? null : "main")}
                className="flex cursor-pointer items-center p-1 text-zinc-300 transition hover:text-white"
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </button>

              {activeMenu === "main" && (
                <MenuShell>
                  <button
                    onClick={() => setActiveMenu("speed")}
                    className="flex w-full cursor-pointer items-center justify-between px-4 py-2 text-zinc-200 transition hover:bg-white/10"
                  >
                    <span>Playback speed</span>
                    <span className="flex items-center gap-1 text-zinc-500">
                      {speed === 1 ? "Normal" : `${speed}x`} <ChevronRight className="h-4 w-4" />
                    </span>
                  </button>
                  {hasQualityMenu && (
                    <button
                      onClick={() => setActiveMenu("quality")}
                      className="flex w-full cursor-pointer items-center justify-between px-4 py-2 text-zinc-200 transition hover:bg-white/10"
                    >
                      <span>Quality</span>
                      <span className="flex items-center gap-1 text-zinc-500">
                        {currentQualityLabel} <ChevronRight className="h-4 w-4" />
                      </span>
                    </button>
                  )}
                </MenuShell>
              )}

              {activeMenu === "speed" && (
                <MenuShell className="w-44">
                  <MenuBack onClick={() => setActiveMenu("main")} title="Playback speed" />
                  {SPEEDS.map((s) => (
                    <MenuOption key={s} active={s === speed} onClick={() => changeSpeed(s)}>
                      {s === 1 ? "Normal" : `${s}x`}
                    </MenuOption>
                  ))}
                </MenuShell>
              )}
            </div>

            {activeMenu === "quality" && hasQualityMenu && (
              <MenuShell className="w-48">
                <MenuBack onClick={() => setActiveMenu("main")} title="Quality" />
                {qualityOptions.map((o) => (
                  <MenuOption key={o.key} active={o.active} hint={o.hint} onClick={o.onSelect}>
                    {o.label}
                  </MenuOption>
                ))}
              </MenuShell>
            )}

            <button
              onClick={togglePiP}
              className="cursor-pointer text-zinc-300 transition hover:text-white"
              title="Picture in picture"
            >
              <PictureInPicture2 className="h-5 w-5" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="cursor-pointer text-zinc-300 transition hover:text-white"
              title="Fullscreen (F)"
            >
              {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}