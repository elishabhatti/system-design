import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, MoreVertical, WifiOff, RefreshCw } from "lucide-react";
import { fetchVideos } from "../services/api";

const CATEGORIES = [
  "All",
  "Music",
  "Gaming",
  "Technology",
  "Education",
  "Programming",
  "Comedy",
  "Live",
  "Anime",
  "Thoughts",
];

const compactNumber = new Intl.NumberFormat("en", { notation: "compact" });

const timeAgo = (dateString) => {
  if (!dateString) return "";
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000,
  );
  const units = [
    [31536000, "year"],
    [2592000, "month"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  for (const [size, name] of units) {
    const n = Math.floor(seconds / size);
    if (n >= 1) return `${n} ${name}${n > 1 ? "s" : ""} ago`;
  }
  return "Just now";
};

// Cloudinary helpers
const thumbUrl = (url) =>
  url
    ?.replace("/upload/", "/upload/so_25p,w_640,ar_16:9,c_fill,q_auto,f_auto/")
    .replace(/\.[^/.]+$/, ".jpg");
const previewUrl = (url) =>
  url?.replace("/upload/", "/upload/so_25p,du_6,w_480,q_auto:low/");

/* One orchestrated moment: the feed settles in once per load / category change.
   Everything else only reacts to the user. */
const styles = `
@keyframes feed-in {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: none; }
}
@keyframes preview-progress {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
@keyframes shimmer {
  from { transform: translateX(-100%); }
  to   { transform: translateX(100%); }
}
.feed-item { animation: feed-in 420ms cubic-bezier(.2,.7,.2,1) both; }
.shimmer::after {
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.045), transparent);
  animation: shimmer 1.6s infinite;
}
@media (prefers-reduced-motion: reduce) {
  .feed-item, .shimmer::after { animation: none; }
}
`;

function VideoCardSkeleton() {
  return (
    <div>
      <div className="shimmer relative aspect-video overflow-hidden rounded-2xl bg-zinc-900" />
      <div className="mt-3 flex gap-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-zinc-900" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3 w-11/12 rounded-full bg-zinc-900" />
          <div className="h-3 w-1/2 rounded-full bg-zinc-900" />
        </div>
      </div>
    </div>
  );
}

function VideoCard({ vid, index }) {
  const [previewing, setPreviewing] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const timer = useRef(null);

  const channelName = vid.user?.channelName || "Unknown channel";
  const avatarUrl = vid.user?.avatarUrl;

  // Hover intent: only start the preview if the cursor actually rests here.
  // Saves bandwidth when you sweep across the grid.
  const start = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setPreviewing(true), 350);
  };
  const stop = () => {
    clearTimeout(timer.current);
    setPreviewing(false);
    setPreviewReady(false);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <Link
      to={`/watch/${vid.id}`}
      className="feed-item group block rounded-2xl outline-none"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      {/* Thumbnail */}
      <div
        className="relative aspect-video overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-inset ring-white/5 transition-[border-radius,box-shadow] duration-300 group-hover:rounded-xl group-focus-visible:ring-2 group-focus-visible:ring-white/70"
        onMouseEnter={start}
        onMouseLeave={stop}
      >
        <img
          src={thumbUrl(vid.filepath)}
          alt=""
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          className={`h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.04] ${
            imgLoaded ? "opacity-100" : "opacity-0"
          }`}
        />

        {previewing && (
          <video
            src={previewUrl(vid.filepath)}
            autoPlay
            muted
            loop
            playsInline
            onLoadedData={() => setPreviewReady(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
              previewReady ? "opacity-100" : "opacity-0"
            }`}
          />
        )}

        {/* Preview progress: loops with the 6s clip */}
        {previewReady && (
          <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/15">
            <div
              className="h-full origin-left bg-white"
              style={{ animation: "preview-progress 6s linear infinite" }}
            />
          </div>
        )}

        {vid.isLive ? (
          <span className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-[11px] font-semibold leading-none text-black">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            Live
          </span>
        ) : (
          vid.duration &&
          !previewReady && (
            <span className="absolute bottom-2.5 right-2.5 rounded-md bg-black/70 px-1.5 py-1 text-[11px] font-medium leading-none tabular-nums text-white backdrop-blur-sm">
              {vid.duration}
            </span>
          )
        )}
      </div>

      {/* Meta */}
      <div className="mt-3 flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            channelName[0].toUpperCase()
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[15px] font-medium leading-[1.35] tracking-[-0.01em] text-zinc-100 transition-colors group-hover:text-white">
            {vid.title}
          </h3>
          <p className="mt-1 truncate text-[13px] text-zinc-400">
            {channelName}
          </p>
          <p className="text-[13px] text-zinc-500">
            {compactNumber.format(vid.views ?? 0)} views
            {vid.uploadedAt && <> &nbsp;·&nbsp; {timeAgo(vid.uploadedAt)}</>}
          </p>
        </div>

        <button
          type="button"
          aria-label="More options"
          onClick={(e) => e.preventDefault()}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 opacity-0 transition hover:bg-zinc-800 hover:text-white focus-visible:opacity-100 group-hover:opacity-100"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </Link>
  );
}

function Message({ icon: Icon, title, body, action }) {
  return (
    <div className="flex flex-col items-center py-32 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 ring-1 ring-inset ring-white/5">
        <Icon className="h-6 w-6 text-zinc-500" />
      </div>
      <p className="mt-5 text-[15px] font-medium text-zinc-100">{title}</p>
      <p className="mt-1 max-w-xs text-[13px] text-zinc-500">{body}</p>
      {action}
    </div>
  );
}

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");

  const load = () => {
    setLoading(true);
    setError(false);
    fetchVideos()
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.videos || res?.data || [];
        setVideos(list);
      })
      .catch((err) => {
        console.error("Failed to load feed", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const visibleVideos = useMemo(() => {
    if (activeCategory === "All") return videos;
    const wanted = activeCategory.toLowerCase();
    return videos.filter(
      (v) =>
        v.category?.toLowerCase() === wanted ||
        v.tags?.toString().toLowerCase().includes(wanted),
    );
  }, [videos, activeCategory]);

  return (
    <div className="mx-auto max-w-[1800px] px-4 pb-20 sm:px-6">
      <style>{styles}</style>

      {/* Category chips */}
      <div className="sticky top-0 z-20 -mx-4 bg-[#09090b]/85 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div
          className="flex gap-2 overflow-x-auto scrollbar-none"
          style={{
            maskImage:
              "linear-gradient(to right, black calc(100% - 32px), transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, black calc(100% - 32px), transparent)",
          }}
        >
          {CATEGORIES.map((name) => {
            const active = activeCategory === name;
            return (
              <button
                key={name}
                onClick={() => setActiveCategory(name)}
                aria-pressed={active}
                className={`shrink-0 cursor-pointer rounded-full px-4 py-1.5 text-[13px] font-medium outline-none transition-all duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-white/70 ${
                  active
                    ? "bg-white text-black"
                    : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed — keyed so it re-settles when the category changes */}
      <div
        key={activeCategory}
        className="mt-5 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
      >
        {loading &&
          Array.from({ length: 10 }).map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}

        {!loading &&
          visibleVideos.map((vid, i) => (
            <VideoCard key={vid.id} vid={vid} index={i} />
          ))}
      </div>

      {!loading && error && (
        <Message
          icon={WifiOff}
          title="Couldn't load the feed"
          body="Check your connection and try again."
          action={
            <button
              onClick={load}
              className="mt-6 flex cursor-pointer items-center gap-2 rounded-full bg-white px-5 py-2 text-[13px] font-semibold text-black transition hover:bg-zinc-200 active:scale-95"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          }
        />
      )}

      {!loading && !error && visibleVideos.length === 0 && (
        <Message
          icon={Eye}
          title="Nothing here yet"
          body={
            activeCategory === "All"
              ? "No videos have been published."
              : `No videos in ${activeCategory}. Try another category.`
          }
        />
      )}
    </div>
  );
}