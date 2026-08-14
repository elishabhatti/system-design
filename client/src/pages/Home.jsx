import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Compass, Code, Server, Layout, Cpu, Sparkles } from 'lucide-react';

const categories = [
  { name: "All", icon: Sparkles },
  { name: "Development", icon: Code },
  { name: "System Design", icon: Server },
  { name: "Backend", icon: Cpu },
  { name: "Frontend", icon: Layout },
  { name: "Tech", icon: Compass },
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
        .then((data) => setVideos(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-[#09090b]">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[11px] text-zinc-500 mt-3 font-mono tracking-widest uppercase">Loading Feed...</p>
      </div>
    );
  }

  return (
    <div className="px-8 py-8 bg-[#09090b] min-h-screen text-zinc-100 selection:bg-indigo-500 selection:text-white">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
          Featured <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Masterclasses</span>
        </h1>
        <p className="text-xs text-zinc-400 max-w-xl font-normal">
          Explore technical walkthroughs, system architecture designs, and full-stack engineering logs.
        </p>
      </div>

      <div className="flex items-center gap-2.5 overflow-x-auto pb-4 scrollbar-none mb-8">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-300 border cursor-pointer ${
                isActive 
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20 scale-[1.02]' 
                  : 'bg-[#121217] text-zinc-400 border-zinc-800/80 hover:border-zinc-700 hover:text-zinc-200 hover:bg-[#181822]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
              {cat.name}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videos.map((vid) => {
          const channelName = vid.user?.channelName || "Elisha Jameel";
          const initialLetter = channelName[0].toUpperCase();

          return (
            <Link 
              to={`/watch/${vid.id}`} 
              key={vid.id} 
              className="group flex flex-col gap-3.5 bg-[#121217]/60 backdrop-blur-md border border-zinc-800/80 p-4 rounded-2xl hover:border-indigo-500/50 hover:bg-[#15151c] transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1"
            >
              <div className="aspect-video bg-black rounded-xl overflow-hidden relative border border-zinc-800/60 shadow-inner">
                <video 
                  src={vid.filepath} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
                  muted 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-md text-[10px] font-mono font-medium px-2 py-0.5 rounded text-zinc-300 border border-zinc-700/50">
                  HD
                </span>
                <div className="absolute top-2.5 left-2.5 bg-indigo-500/20 backdrop-blur-md border border-indigo-500/30 text-[10px] font-medium text-indigo-300 px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-indigo-400" /> New
                </div>
              </div>

              <div className="flex gap-3 items-start mt-0.5">
                <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-200 shrink-0 shadow-inner group-hover:border-indigo-500/40 transition">
                  {initialLetter}
                </div>
                <div className="flex flex-col overflow-hidden w-full">
                  <h3 className="font-medium text-zinc-100 text-xs tracking-wide line-clamp-2 group-hover:text-indigo-400 transition-colors">
                    {vid.title}
                  </h3>
                  <span className="text-[11px] text-zinc-400 mt-1 font-normal hover:text-zinc-200 transition">
                    {channelName}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-1 font-mono">
                    <span>{vid.views || 0} views</span>
                    <span>•</span>
                    <span>{timeAgo(vid.uploadedAt || new Date())}</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}