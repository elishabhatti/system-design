import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Settings, PictureInPicture2, RotateCcw, RotateCw
} from "lucide-react";

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

function formatTime(sec) {
  if (!isFinite(sec)) return "0:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function VideoPlayer({ src, isLive, poster, handleTimeUpdate }) {
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
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverX, setHoverX] = useState(0);
  const [seekFlash, setSeekFlash] = useState(null); // 'left' | 'right' | null
  const [loading, setLoading] = useState(true);

  const hideTimer = useRef(null);

  // --- Play / Pause ---
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  }, []);

  // --- Seek helpers ---
  const seekTo = useCallback((time) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(time, 0), duration || 0);
  }, [duration]);

  const skip = useCallback((delta) => {
    const v = videoRef.current;
    if (!v) return;
    seekTo(v.currentTime + delta);
  }, [seekTo]);

  // --- Scrub bar interactions ---
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

  // --- Double click zones to seek ---
  const handleDoubleClickZone = (dir) => {
    skip(dir === "left" ? -10 : 10);
    setSeekFlash(dir);
    setTimeout(() => setSeekFlash(null), 500);
  };

  // --- Volume ---
  const handleVolumeChange = (e) => {
    const v = videoRef.current;
    const val = parseFloat(e.target.value);
    setVolume(val);
    v.volume = val;
    v.muted = val === 0;
    setMuted(val === 0);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  // --- Speed ---
  const changeSpeed = (s) => {
    videoRef.current.playbackRate = s;
    setSpeed(s);
    setShowSpeedMenu(false);
  };

  // --- Fullscreen ---
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

  // --- PiP ---
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

  // --- Auto-hide controls ---
  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (playing) setControlsVisible(false);
    }, 2500);
  }, [playing]);

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const handleKey = (e) => {
      if (!containerRef.current?.contains(document.activeElement) &&
          document.activeElement !== document.body) return;
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          skip(5);
          break;
        case "ArrowLeft":
          skip(-5);
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolume((v) => {
            const nv = Math.min(v + 0.1, 1);
            videoRef.current.volume = nv;
            return nv;
          });
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume((v) => {
            const nv = Math.max(v - 0.1, 0);
            videoRef.current.volume = nv;
            return nv;
          });
          break;
        case "f":
          toggleFullscreen();
          break;
        case "m":
          toggleMute();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [togglePlay, skip]);

  // --- Video element event bindings ---
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onTimeUpdate = () => setCurrentTime(v.currentTime);
    const onLoadedMeta = () => { setDuration(v.duration); setLoading(false); };
    const onProgress = () => {
      if (v.buffered.length > 0) {
        setBuffered(v.buffered.end(v.buffered.length - 1));
      }
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onWaiting = () => setLoading(true);
    const onCanPlay = () => setLoading(false);

    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("loadedmetadata", onLoadedMeta);
    v.addEventListener("progress", onProgress);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("canplay", onCanPlay);

    return () => {
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("loadedmetadata", onLoadedMeta);
      v.removeEventListener("progress", onProgress);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("canplay", onCanPlay);
    };
  }, [src]);

  const progressPct = duration ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black overflow-hidden group/player select-none"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => playing && setControlsVisible(false)}
    >
      {/* Video */}
      <video
        onTimeUpdate={handleTimeUpdate}
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay
        className="w-full h-full object-contain"
        onClick={togglePlay}
        controls
      />

      {/* Double-click seek zones */}
      <div className="absolute inset-0 flex pointer-events-none">
        <div
          className="w-1/2 h-full pointer-events-auto"
          onDoubleClick={() => handleDoubleClickZone("left")}
        />
        <div
          className="w-1/2 h-full pointer-events-auto"
          onDoubleClick={() => handleDoubleClickZone("right")}
        />
      </div>

      {/* Seek flash feedback */}
      {seekFlash && (
        <div
          className={`absolute top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 text-white pointer-events-none animate-pulse ${
            seekFlash === "left" ? "left-10" : "right-10"
          }`}
        >
          {seekFlash === "left" ? <RotateCcw className="w-8 h-8" /> : <RotateCw className="w-8 h-8" />}
          <span className="text-xs font-bold">10s</span>
        </div>
      )}

      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Center play button (paused state) */}
      {!playing && !loading && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
        >
          <span className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-violet-600/80 transition">
            <Play className="w-7 h-7 text-white fill-white ml-1" />
          </span>
        </button>
      )}

      {/* Live badge */}
      {isLive && (
        <span className="absolute top-3 left-3 flex items-center gap-1 bg-red-600 text-[10px] font-bold px-2 py-1 rounded text-white tracking-wide z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          LIVE
        </span>
      )}

      {/* Controls bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 px-4 pb-3 pt-8 bg-linear-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Progress bar */}
        <div
          ref={progressBarRef}
          className="relative w-full h-1.5 group/bar cursor-pointer mb-3"
          onMouseMove={handleBarMouseMove}
          onMouseLeave={() => setHoverTime(null)}
          onMouseDown={handleBarMouseDown}
        >
          {/* Track */}
          <div className="absolute inset-0 bg-white/20 rounded-full" />
          {/* Buffered */}
          <div
            className="absolute inset-y-0 left-0 bg-white/35 rounded-full"
            style={{ width: `${bufferedPct}%` }}
          />
          {/* Progress fill */}
          <div
            className="absolute inset-y-0 left-0 bg-white rounded-full"
            style={{ width: `${progressPct}%` }}
          />
          {/* Scrub handle */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full shadow opacity-0 group-hover/bar:opacity-100 transition-opacity"
            style={{ left: `calc(${progressPct}% - 7px)` }}
          />
          {/* Hover time tooltip */}
          {hoverTime !== null && !isLive && (
            <div
              className="absolute -top-8 -translate-x-1/2 bg-black/90 text-white text-[10px] font-mono px-1.5 py-1 rounded pointer-events-none"
              style={{ left: hoverX }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="hover:text-gray-400 transition cursor-pointer">
              {playing ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

          {/* Volume */}
            <div className="flex items-center gap-1.5 group/vol">
              <button onClick={toggleMute} className="transition cursor-pointer">
                {muted || volume === 0 ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
              </button>
              <div className="w-0 group-hover/vol:w-16 overflow-hidden transition-all duration-200">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={muted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 accent-white cursor-pointer h-1"
                />
              </div>
            </div>

            {/* Time */}
            {!isLive && (
              <span className="text-[11px] font-mono text-zinc-300 tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            )}
            {isLive && (
              <span className="text-[11px] font-mono text-red-400 font-semibold">LIVE</span>
            )}
          </div>

          <div className="flex items-center gap-3 relative">
            {/* Speed */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu((s) => !s)}
                className="flex items-center gap-1 hover:text-violet-400 transition text-[11px] font-mono cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                {speed}x
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-8 right-0 bg-[#1c1c22] border border-white/10 rounded-lg py-1.5 w-20 shadow-xl z-20">
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      onClick={() => changeSpeed(s)}
                      className={`w-full text-left px-3 py-1 text-[11px] font-mono hover:bg-violet-600/20 transition cursor-pointer ${
                        s === speed ? "text-violet-400 font-bold" : "text-zinc-300"
                      }`}
                    >
                      {s}x
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