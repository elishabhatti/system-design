import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Flame,
  Music,
  Gamepad2,
  Laptop,
  GraduationCap,
  Smile,
  Radio,
  Film,
  Tv,
  Headphones,
  Zap,
  Code2,
  BrainCircuit,
  MoreVertical,
  Eye,
  Play,
} from "lucide-react";

const categories = [
  { name: "All", icon: Sparkles },
  { name: "Music", icon: Music },
  { name: "Mixes", icon: Flame },
  { name: "Gaming", icon: Gamepad2 },
  { name: "Tech", icon: Laptop },
  { name: "Education", icon: GraduationCap },
  { name: "Comedy", icon: Smile },
  { name: "Live", icon: Radio },
  { name: "Cartoon", icon: Film },
  { name: "Anime", icon: Tv },
  { name: "Beats", icon: Headphones },
  { name: "Phonk", icon: Zap },
  { name: "Programming", icon: Code2 },
  { name: "Thoughts", icon: BrainCircuit },
];

const timeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) return `${interval} years ago`;
  if (interval === 1) return `1 year ago`;

  interval = Math.floor(seconds / 2592000);
  if (interval > 1) return `${interval} months ago`;
  if (interval === 1) return `1 month ago`;

  interval = Math.floor(seconds / 86400);
  if (interval > 1) return `${interval} days ago`;
  if (interval === 1) return `1 day ago`;

  interval = Math.floor(seconds / 3600);
  if (interval > 1) return `${interval} hours ago`;
  if (interval === 1) return `1 hour ago`;

  interval = Math.floor(seconds / 60);
  if (interval > 1) return `${interval} minutes ago`;
  if (interval === 1) return `1 minute ago`;

  return "Just now";
};

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    import("../services/api").then(({ fetchVideos }) => {
      fetchVideos()
        .then((response) => {
          if (response && response.videos && response.videos.length > 0) {
            setVideos(response.videos);
          } else if (Array.isArray(response)) {
            setVideos(response);
          } 
        })
        .catch((err) => {
          console.warn("API error, loading dummy feed.", err);
        })
        .finally(() => setLoading(false));
    });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-black">
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-zinc-400 mt-3 font-mono tracking-wider uppercase">
          Initializing Stream feed...
        </p>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 text-zinc-100 max-w-[1800px] mx-auto bg-black">
      {/* Filter Chips Bar */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-4 pt-1 mb-8 scrollbar-none sticky top-0 bg-black/90 backdrop-blur-md z-20 border-b border-zinc-900">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                isActive
                  ? "bg-white text-black border-white shadow-lg shadow-white/10"
                  : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${isActive ? "text-black" : "text-zinc-400"}`}
              />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Main Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {videos.map((vid) => {
          const channelName = vid.user?.channelName || "Orbit Creator";
          const avatarUrl = vid.user?.avatarUrl;

          return (
            <Link
              to={`/watch/${vid.id}`}
              key={vid.id}
              className="group flex flex-col gap-3.5 cursor-pointer p-3 rounded-2xl border border-transparent hover:border-zinc-800 hover:bg-[#0a0a0a] transition-all duration-300"
            >
              {/* Thumbnail Container */}
              <div className="aspect-video rounded-xl overflow-hidden relative border border-zinc-800/80 bg-zinc-900">
                <video
                  src={vid.filepath}
                  className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-500 ease-out"
                  muted
                  loop
                  onMouseEnter={(e) => e.target.play().catch(() => {})}
                  onMouseLeave={(e) => {
                    e.target.pause();
                    e.target.currentTime = 0;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                {vid.isLive ? (
                  <span className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-red-600/90 backdrop-blur-sm text-[10px] font-bold px-2 py-0.5 rounded-md text-white tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    LIVE
                  </span>
                ) : (
                  <span className="absolute bottom-2 right-2 bg-black/90 backdrop-blur-md text-[11px] font-mono font-medium px-2 py-0.5 rounded-md text-zinc-200 border border-zinc-800">
                    {vid.duration || "12:32"}
                  </span>
                )}
              </div>

              {/* Video Meta Info */}
              <div className="flex gap-3.5 items-start">
                <div className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xs text-white shrink-0 mt-0.5 overflow-hidden">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={channelName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    channelName[0].toUpperCase()
                  )}
                </div>

                <div className="flex flex-col overflow-hidden w-full">
                  <h3 className="font-bold text-zinc-100 text-sm tracking-tight line-clamp-2 leading-snug group-hover:text-white transition">
                    {vid.title}
                  </h3>
                  <span className="text-xs text-zinc-400 mt-1.5 font-medium hover:text-zinc-200 transition">
                    {channelName}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1 font-mono">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-zinc-500" />
                      {vid.views ?? 0} views
                    </span>
                    <span>•</span>
                    <span>{timeAgo(vid.uploadedAt || new Date())}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                  className="text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 transition p-1.5 rounded-lg hover:bg-zinc-900"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}