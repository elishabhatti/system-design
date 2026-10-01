import React, { useEffect, useMemo, useState } from "react";
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
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
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

function VideoCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-video rounded-xl bg-zinc-900" />
      <div className="mt-3 flex gap-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-zinc-900" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3 w-11/12 rounded bg-zinc-900" />
          <div className="h-3 w-1/2 rounded bg-zinc-900" />
        </div>
      </div>
    </div>
  );
}

function VideoCard({ vid }) {
  const channelName = vid.user?.channelName || "Unknown channel";
  const avatarUrl = vid.user?.avatarUrl;

  return (
    <Link to={`/watch/${vid.id}`} className="group block">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-xl bg-zinc-900">
        <video
          src={vid.filepath ? `${vid.filepath}#t=0.5` : undefined}
          preload="metadata"
          muted
          loop
          playsInline
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
          onMouseLeave={(e) => {
            e.currentTarget.pause();
            e.currentTarget.currentTime = 0.5;
          }}
        />

        {vid.isLive ? (
          <span className="absolute left-2 top-2 flex items-center gap-1.5 rounded bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-black" />
            Live
          </span>
        ) : (
          vid.duration && (
            <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">
              {vid.duration}
            </span>
          )
        )}
      </div>

      {/* Meta */}
      <div className="mt-3 flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-xs font-semibold text-zinc-200">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            channelName[0].toUpperCase()
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[14px] font-medium leading-snug text-white">
            {vid.title}
          </h3>
          <p className="mt-1 truncate text-[13px] text-zinc-400">{channelName}</p>
          <p className="flex items-center gap-1.5 text-[13px] text-zinc-500">
            <span>{compactNumber.format(vid.views ?? 0)} views</span>
            {vid.uploadedAt && (
              <>
                <span aria-hidden>·</span>
                <span>{timeAgo(vid.uploadedAt)}</span>
              </>
            )}
          </p>
        </div>

        <button
          type="button"
          aria-label="More options"
          onClick={(e) => e.preventDefault()}
          className="h-8 w-8 shrink-0 rounded-full text-zinc-400 opacity-0 transition hover:bg-zinc-800 hover:text-white group-hover:opacity-100 flex items-center justify-center"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </Link>
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
        v.tags?.toString().toLowerCase().includes(wanted)
    );
  }, [videos, activeCategory]);

  return (
    <div className="mx-auto max-w-[1800px] px-4 pb-16 sm:px-6">
      {/* Category chips */}
      <div className="sticky top-0 z-20 -mx-4 bg-[#09090b]/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {CATEGORIES.map((name) => {
            const active = activeCategory === name;
            return (
              <button
                key={name}
                onClick={() => setActiveCategory(name)}
                className={`shrink-0 cursor-pointer rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition ${
                  active
                    ? "bg-white text-black"
                    : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed */}
      <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {loading &&
          Array.from({ length: 10 }).map((_, i) => <VideoCardSkeleton key={i} />)}

        {!loading &&
          visibleVideos.map((vid) => <VideoCard key={vid.id} vid={vid} />)}
      </div>

      {/* Error */}
      {!loading && error && (
        <div className="flex flex-col items-center py-32 text-center">
          <WifiOff className="h-8 w-8 text-zinc-600" />
          <p className="mt-4 text-sm font-medium text-zinc-200">Couldn't load the feed</p>
          <p className="mt-1 text-xs text-zinc-500">Check your connection and try again.</p>
          <button
            onClick={load}
            className="mt-5 flex cursor-pointer items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && visibleVideos.length === 0 && (
        <div className="flex flex-col items-center py-32 text-center">
          <Eye className="h-8 w-8 text-zinc-600" />
          <p className="mt-4 text-sm font-medium text-zinc-200">Nothing here yet</p>
          <p className="mt-1 text-xs text-zinc-500">
            {activeCategory === "All"
              ? "No videos have been published."
              : `No videos in ${activeCategory}.`}
          </p>
        </div>
      )}
    </div>
  );
}