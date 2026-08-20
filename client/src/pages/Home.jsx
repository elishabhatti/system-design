import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Flame, Music, Gamepad2, Laptop, GraduationCap, Smile, Radio, Film, Tv, Headphones, Zap, Code2, BrainCircuit, MoreVertical, Eye } from 'lucide-react';

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

  return 'Just now';
};

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    import('../services/api').then(({ fetchVideos }) => {
      fetchVideos()
        .then((data) => {
          if (data && data.length > 0) {
            setVideos(data);
          } else {
            setVideos(dummyVideos);
          }
        })
        .catch((err) => {
          console.warn("API error, loading dummy YouTube feed.", err);
          setVideos(dummyVideos);
        })
        .finally(() => setLoading(false));
    });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-indigo-200/60 mt-3 font-medium">Loading...</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 text-zinc-100 max-w-[1800px] mx-auto">

      {/* Filter Chips Bar */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-4 pt-1 mb-6 scrollbar-none sticky top-0  z-20">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? ' text-white font-semibold shadow-lg '
                  : 'text-zinc-300 border border-white/5'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Main Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {videos.map((vid) => {
          const channelName = vid.user?.channelName || "Elisha Jameel";
          const initialLetter = channelName[0].toUpperCase();

          return (
            <Link
              to={`/watch/${vid.id}`}
              key={vid.id}
              className="group flex flex-col gap-3 cursor-pointer p-2 rounded-2xl border border-transparent hover:border-white/10 hover:bg-[#27272A] transition-all duration-200"
            >
              {/* Thumbnail Container */}
              <div className="aspect-video rounded-xl overflow-hidden relative shadow-md border border-white/5">
                <video
                  src={vid.filepath}
                  className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-300"
                  muted
                  loop
                  onMouseEnter={(e) => e.target.play().catch(() => {})}
                  onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                {vid.isLive ? (
                  <span className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded text-white tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    LIVE
                  </span>
                ) : (
                  <span className="absolute bottom-1.5 right-1.5 bg-black/85 text-[11px] font-medium px-1.5 py-0.5 rounded text-white">
                    12:32
                  </span>
                )}
              </div>

              {/* Video Meta Info */}
              <div className="flex gap-3 items-start px-0.5">
                <div className="w-9 h-9 rounded-full bg-black/20 flex items-center justify-center font-bold text-xs text-white shrink-0 mt-0.5 shadow ring-2 ring-white/5">
                  {initialLetter}
                </div>

                <div className="flex flex-col overflow-hidden w-full">
                  <h3 className="font-semibold text-zinc-100 text-sm tracking-tight line-clamp-2 leading-snug group-hover:text-white">
                    {vid.title}
                  </h3>
                  <span className="text-xs text-indigo-200/40 mt-1 transition font-normal">
                    {channelName}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-indigo-200/40 mt-0.5">
                    <Eye className="w-3 h-3" />
                    <span>{vid.views || '12K views'}</span>
                    <span>•</span>
                    <span>{timeAgo(vid.uploadedAt || new Date())}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => { e.preventDefault(); }}
                  className="text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition p-1"
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