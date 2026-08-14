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
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-zinc-500 mt-3 font-medium tracking-wider uppercase">Loading Masterclass Feed...</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 bg-[#09090b] min-h-screen text-zinc-100 selection:bg-indigo-500 selection:text-white">
      {/* Category Pills with Glow & Icon */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-4 scrollbar-none mb-8">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 border ${
                isActive 
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/25 scale-[1.02]' 
                  : 'bg-[#121217] text-zinc-400 border-zinc-800/80 hover:border-zinc-700 hover:text-zinc-200 hover:bg-[#181820]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videos.map((vid) => (
          <Link 
            to={`/watch/${vid.id}`} 
            key={vid.id} 
            className="group flex flex-col gap-3 bg-[#121217]/80 backdrop-blur-sm border border-zinc-800/80 p-3.5 rounded-2xl hover:border-indigo-500/50 hover:bg-[#15151c] transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1"
          >
            {/* Thumbnail Box */}
            <div className="aspect-video bg-black rounded-xl overflow-hidden relative border border-zinc-800/60 shadow-inner">
              <video 
                src={vid.filepath} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
                muted 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md text-[10px] font-semibold px-2 py-0.5 rounded-md text-zinc-300 border border-zinc-700/50">
                12:45
              </span>
              <div className="absolute top-2 left-2 bg-indigo-500/20 backdrop-blur-md border border-indigo-500/30 text-[10px] font-medium text-indigo-300 px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1">
                <Flame className="w-3 h-3 text-indigo-400" /> Trending
              </div>
            </div>

            {/* Video Meta Info */}
            <div className="flex gap-3 items-start mt-0.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 border border-indigo-400/30 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-md">
                {vid.title ? vid.title[0].toUpperCase() : 'E'}
              </div>
              <div className="flex flex-col overflow-hidden w-full">
                <h3 className="font-semibold text-zinc-100 text-xs tracking-wide line-clamp-2 group-hover:text-indigo-400 transition-colors">
                  {vid.title}
                </h3>
                <span className="text-[11px] text-zinc-400 mt-1 font-medium hover:text-zinc-200 transition">Elisha Jameel</span>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-0.5">
                  <span>1.4K views</span>
                  <span>•</span>
                  <span>2 hours ago</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}