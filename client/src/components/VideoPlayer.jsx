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
} from "lucide-react";

import { useHlsSource } from"../hooks/useHlsSource";
import { useResumePlayback } from "../hooks/useResumePlayback";
import { usePlayerKeyboardShortcuts } from "../hooks/usePlayerKeyboardShortcuts";

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

function formatTime(sec) {
  if (!isFinite(sec)) return "0:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function VideoPlayer({
  src,
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

  const hideTimer = useRef(null);
  const slowNetworkTimer = useRef(null);

  const { levels, currentLevel, changeQuality: changeQualityHls, fatalError, setFatalError } =
    useHlsSource(videoRef, src, retryToken, {
      onSetupStart: () => setActiveMenu(null),
    });

  const { resumePrompt, applyResume, dismissResume, saveProgress, clearProgress } =
    useResumePlayback(videoRef, videoId, src);

  // Apply volume/mute/speed imperatively — these are JS properties on the
  // media element, not real HTML attributes, so JSX props alone never work.
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
  }, [src, retryToken]);

  const changeQuality = (index) => {
    changeQualityHls(index);
    setActiveMenu(null);
  };

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  }, []);

  const seekTo = useCallback(
    (time) => {
      const v = videoRef.current;
      if (!v) return;
      v.currentTime = Math.min(Math.max(time, 0), duration || 0);
    },
    [duration]
  );

  const skip = useCallback((delta) => {
    const v = videoRef.current;
    if (!v) return;
    seekTo(v.currentTime + delta);
  }, [seekTo]);

  const getTimeFromClientX = (clientX) => {
    const bar = progressBarRef.current;
    if (!bar) return 0;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    return ratio * duration;
  };

  const handleBarMouseMove = (e) => {
    const t = getTimeFromClientX(e.clientX);
    setHoverTime(t);
    setHoverX(e.clientX - progressBarRef.current.getBoundingClientRect().left);
    if (dragging) seekTo(t);
  };

  const handleBarMouseDown = (e) => {
    setDragging(true);
    seekTo(getTimeFromClientX(e.clientX));
  };

  useEffect(() => {
    const stopDrag = () => setDragging(false);
    window.addEventListener("mouseup", stopDrag);
    return () => window.removeEventListener("mouseup", stopDrag);
  }, []);

  const handleDoubleClickZone = (dir) => {
    skip(dir === "left" ? -10 : 10);
    setSeekFlash(dir);
    setTimeout(() => setSeekFlash(null), 500);
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
    clearTimeout(hideTimer.current?._volFlash);
    hideTimer.current = hideTimer.current || {};
    hideTimer.current._volFlash = setTimeout(() => setVolumeFlash(null), 700);
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
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.warn("PiP not supported", err);
    }
  };

  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (playing) {
        setControlsVisible(false);
        setActiveMenu(null);
      }
    }, 2500);
  }, [playing]);

  const handleRetry = () => {
    setFatalError(false);
    setLoading(true);
    setRetryToken((n) => n + 1);
  };

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

  // Video element event listeners
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onTimeUpdate = () => {
      setCurrentTime(v.currentTime);
      handleTimeUpdate?.({ target: v });
      saveProgress(v.currentTime, v.duration);
    };
    const onLoadedMeta = () => {
      setDuration(v.duration);
      setLoading(false);
    };
    const onProgress = () => {
      if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1));
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onWaiting = () => {
      setLoading(true);
      clearTimeout(slowNetworkTimer.current);
      slowNetworkTimer.current = setTimeout(() => setSlowNetwork(true), 3500);
    };
    const onCanPlay = () => {
      setLoading(false);
      setSlowNetwork(false);
      clearTimeout(slowNetworkTimer.current);
    };
    const onError = () => {
      console.error("Video failed to load:", v.error);
      setLoading(false);
      setFatalError(true);
    };
    const onEndedEvent = () => {
      clearProgress();
      onEnded?.();
    };

    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("loadedmetadata", onLoadedMeta);
    v.addEventListener("progress", onProgress);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("error", onError);
    v.addEventListener("ended", onEndedEvent);

    return () => {
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("loadedmetadata", onLoadedMeta);
      v.removeEventListener("progress", onProgress);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("error", onError);
      v.removeEventListener("ended", onEndedEvent);
      clearTimeout(slowNetworkTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, retryToken, handleTimeUpdate, onEnded]);

  const progressPct = duration ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-video bg-black overflow-hidden group/player select-none transition-shadow duration-500 ${
        playing ? "shadow-[0_0_60px_-15px_rgba(139,92,246,0.35)]" : ""
      }`}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => {
        if (playing) {
          setControlsVisible(false);
          setActiveMenu(null);
        }
      }}
    >
      <video ref={videoRef} poster={poster} autoPlay playsInline className="w-full h-full object-contain" onClick={togglePlay} />

      <div className="absolute inset-0 flex pointer-events-none">
        <div className="w-1/2 h-full pointer-events-auto" onDoubleClick={() => handleDoubleClickZone("left")} />
        <div className="w-1/2 h-full pointer-events-auto" onDoubleClick={() => handleDoubleClickZone("right")} />
      </div>

      {seekFlash && (
        <div className={`absolute top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 text-white pointer-events-none animate-pulse ${seekFlash === "left" ? "left-10" : "right-10"}`}>
          {seekFlash === "left" ? <RotateCcw className="w-8 h-8" /> : <RotateCw className="w-8 h-8" />}
          <span className="text-xs font-bold">10s</span>
        </div>
      )}

      {volumeFlash !== null && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm border border-white/10 text-white px-3 py-1.5 rounded-full text-xs font-mono flex items-center gap-2 pointer-events-none z-20">
          {volumeFlash === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          {Math.round(volumeFlash * 100)}%
        </div>
      )}

      {loading && !fatalError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
          <div className="w-10 h-10 border-[3px] border-white/30 border-t-violet-400 rounded-full animate-spin" />
          {slowNetwork && (
            <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-full">
              <WifiOff className="w-3 h-3" /> Buffering — slow connection
            </span>
          )}
        </div>
      )}

      {fatalError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90 text-center px-6">
          <AlertTriangle className="w-8 h-8 text-red-400" />
          <p className="text-xs text-zinc-300 font-semibold">This video couldn't be played.</p>
          <button onClick={handleRetry} className="flex items-center gap-1.5 bg-white text-black text-xs font-bold px-4 py-2 rounded-xl hover:bg-zinc-200 transition cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {!playing && !loading && !fatalError && (
        <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center cursor-pointer">
          <span className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-violet-600/80 transition">
            <Play className="w-7 h-7 text-white fill-white ml-1" />
          </span>
        </button>
      )}

      {isLive && (
        <span className="absolute top-3 left-3 flex items-center gap-1 bg-red-600 text-[10px] font-bold px-2 py-1 rounded text-white tracking-wide z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          LIVE
        </span>
      )}

      {resumePrompt !== null && !fatalError && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-[#121216]/95 backdrop-blur-md border border-white/15 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-2xl z-20 text-xs">
          <span className="text-zinc-300">
            Resume from <span className="font-mono text-violet-400 font-bold">{formatTime(resumePrompt)}</span>?
          </span>
          <button onClick={() => applyResume(resumePrompt)} className="bg-white text-black font-bold px-3 py-1 rounded-lg cursor-pointer hover:bg-zinc-200 transition">
            Resume
          </button>
          <button onClick={dismissResume} className="text-zinc-500 hover:text-zinc-300 cursor-pointer transition">
            Dismiss
          </button>
        </div>
      )}

      {showShortcuts && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-30 p-6">
          <div className="bg-[#121216] border border-white/15 rounded-2xl p-5 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-2 mb-3 text-white">
              <Keyboard className="w-4 h-4 text-violet-400" />
              <h4 className="font-bold text-sm">Keyboard shortcuts</h4>
            </div>
            <div className="grid grid-cols-2 gap-y-2 text-[11px] text-zinc-300 font-mono">
              <span>Space / K</span><span className="text-zinc-500">Play / Pause</span>
              <span>J / L or ←/→</span><span className="text-zinc-500">Seek 10s</span>
              <span>↑ / ↓</span><span className="text-zinc-500">Volume</span>
              <span>M</span><span className="text-zinc-500">Mute</span>
              <span>F</span><span className="text-zinc-500">Fullscreen</span>
              <span>T</span><span className="text-zinc-500">Theater mode</span>
              <span>0–9</span><span className="text-zinc-500">Jump to 0–90%</span>
              <span>?</span><span className="text-zinc-500">Toggle this menu</span>
            </div>
            <button onClick={() => setShowShortcuts(false)} className="mt-4 w-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-2 rounded-lg transition cursor-pointer">
              Close
            </button>
          </div>
        </div>
      )}

      <div className={`absolute bottom-0 left-0 right-0 px-4 pb-3 pt-8 bg-linear-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div
          ref={progressBarRef}
          className="relative w-full h-1.5 group/bar cursor-pointer mb-3"
          onMouseMove={handleBarMouseMove}
          onMouseLeave={() => setHoverTime(null)}
          onMouseDown={handleBarMouseDown}
        >
          <div className="absolute inset-0 bg-white/20 rounded-full" />
          <div className="absolute inset-y-0 left-0 bg-white/35 rounded-full" style={{ width: `${bufferedPct}%` }} />
          <div className="absolute inset-y-0 left-0 bg-violet-500 rounded-full" style={{ width: `${progressPct}%` }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-violet-400 shadow opacity-0 group-hover/bar:opacity-100 transition-opacity" style={{ left: `calc(${progressPct}% - 7px)` }} />
          {hoverTime !== null && !isLive && (
            <div className="absolute -top-8 -translate-x-1/2 bg-black/90 text-white text-[10px] font-mono px-1.5 py-1 rounded pointer-events-none" style={{ left: hoverX }}>
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="hover:text-gray-400 transition cursor-pointer">
              {playing ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            <div className="flex items-center gap-1.5 group/vol">
              <button onClick={toggleMute} className="transition cursor-pointer">
                {muted || volume === 0 ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
              </button>
              <div className="w-0 group-hover/vol:w-16 overflow-hidden transition-all duration-200">
                <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume} onChange={handleVolumeChange} className="w-16 accent-violet-500 cursor-pointer h-1" />
              </div>
            </div>

            {!isLive && (
              <span className="text-[11px] font-mono text-zinc-300 tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            )}
            {isLive && <span className="text-[11px] font-mono text-red-400 font-semibold">LIVE</span>}
          </div>

          <div className="flex items-center gap-3 relative">
            <button onClick={() => setShowShortcuts(true)} className="hidden sm:flex hover:text-violet-400 transition cursor-pointer" title="Keyboard shortcuts (?)">
              <Keyboard className="w-4.5 h-4.5" />
            </button>

            {typeof onToggleTheater === "function" && (
              <button onClick={onToggleTheater} className={`hidden sm:flex transition cursor-pointer ${theaterMode ? "text-violet-400" : "hover:text-violet-400"}`} title="Theater mode (T)">
                <RectangleHorizontal className="w-4.5 h-4.5" />
              </button>
            )}

            <div className="relative">
              <button onClick={() => setActiveMenu(activeMenu === "main" ? null : "main")} className="flex items-center hover:text-violet-400 transition cursor-pointer p-1" title="Settings">
                <Settings className="w-4.5 h-4.5" />
              </button>

              {activeMenu === "main" && (
                <div className="absolute bottom-8 right-0 bg-[#121216]/95 backdrop-blur-md border border-white/15 rounded-xl py-2 w-44 shadow-2xl z-20 text-xs">
                  <button onClick={() => setActiveMenu("speed")} className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/10 transition cursor-pointer text-zinc-200">
                    <span>Playback Speed</span>
                    <span className="font-mono text-white/50">{speed}x</span>
                  </button>

                  {levels.length > 0 && (
                    <button onClick={() => setActiveMenu("quality")} className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/10 transition cursor-pointer text-zinc-200">
                      <span>Quality</span>
                      <span className="font-mono text-white/50">{currentLevel === -1 ? "Auto" : `${levels[currentLevel]?.height}p`}</span>
                    </button>
                  )}
                </div>
              )}

              {activeMenu === "speed" && (
                <div className="absolute bottom-8 right-0 bg-[#121216]/95 backdrop-blur-md border border-white/15 rounded-xl py-2 w-36 shadow-2xl z-20 text-xs">
                  <button onClick={() => setActiveMenu("main")} className="w-full text-left px-4 py-1.5 text-white/40 hover:text-white border-b border-white/10 mb-1 transition cursor-pointer font-semibold text-[10px]">
                    ← BACK
                  </button>
                  {SPEEDS.map((s) => (
                    <button key={s} onClick={() => changeSpeed(s)} className={`w-full flex items-center justify-between px-4 py-1.5 hover:bg-white/10 transition cursor-pointer font-mono ${s === speed ? "text-violet-400 font-bold" : "text-zinc-300"}`}>
                      <span>{s}x</span>
                      {s === speed && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}

              {activeMenu === "quality" && (
                <div className="absolute bottom-8 right-0 bg-[#121216]/95 backdrop-blur-md border border-white/15 rounded-xl py-2 w-36 shadow-2xl z-20 text-xs">
                  <button onClick={() => setActiveMenu("main")} className="w-full text-left px-4 py-1.5 text-white/40 hover:text-white border-b border-white/10 mb-1 transition cursor-pointer font-semibold text-[10px]">
                    ← BACK
                  </button>
                  <button onClick={() => changeQuality(-1)} className={`w-full flex items-center justify-between px-4 py-1.5 hover:bg-white/10 transition cursor-pointer font-mono ${currentLevel === -1 ? "text-violet-400 font-bold" : "text-zinc-300"}`}>
                    <span>Auto</span>
                    {currentLevel === -1 && <Check className="w-3.5 h-3.5" />}
                  </button>
                  {levels.map((lvl, index) => (
                    <button key={index} onClick={() => changeQuality(index)} className={`w-full flex items-center justify-between px-4 py-1.5 hover:bg-white/10 transition cursor-pointer font-mono ${currentLevel === index ? "text-violet-400 font-bold" : "text-zinc-300"}`}>
                      <span>{lvl.height}p</span>
                      {currentLevel === index && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={togglePiP} className="hover:text-violet-400 transition cursor-pointer" title="Picture in Picture">
              <PictureInPicture2 className="w-4.5 h-4.5" />
            </button>

            <button onClick={toggleFullscreen} className="hover:text-violet-400 transition cursor-pointer">
              {fullscreen ? <Minimize className="w-4.5 h-4.5" /> : <Maximize className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}