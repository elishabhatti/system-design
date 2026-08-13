import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchVideos } from '../services/api';

const categories = ["All", "Development", "System Design", "Backend", "Frontend", "Tech"];

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    fetchVideos()
      .then((data) => setVideos(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center p-20 text-xs text-gray-600 bg-[#0a0a0a]">Loading feed...</div>;

  return (
    <div className="px-6 py-6 bg-[#0a0a0a] min-h-screen text-white">
      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition ${
              activeCategory === cat ? 'bg-white text-black border-white' : 'bg-[#141414] text-gray-400 border-[#262626] hover:border-gray-500'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {videos.map((vid) => (
          <Link to={`/watch/${vid.id}`} key={vid.id} className="group flex flex-col gap-2.5 bg-[#101010] border border-[#222222] p-3 rounded-xl hover:border-gray-500 transition">
            <div className="aspect-video bg-black rounded-lg overflow-hidden relative border border-[#1f1f1f]">
              <video src={vid.filepath} className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-300" muted />
              <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-[10px] px-1.5 py-0.5 rounded text-gray-300 border border-[#333]">10:15</span>
            </div>
            <div className="flex gap-2.5 items-start mt-1">
              <div className="w-7 h-7 rounded-full bg-[#222] border border-[#333] flex items-center justify-center font-medium text-[10px] text-gray-300 shrink-0">
                {vid.title ? vid.title[0].toUpperCase() : 'E'}
              </div>
              <div className="flex flex-col overflow-hidden">
                <h3 className="font-medium text-white text-xs truncate group-hover:underline">{vid.title}</h3>
                <span className="text-[11px] text-gray-500 mt-0.5">Elisha Jameel</span>
                <span className="text-[10px] text-gray-600">1.2K views • Today</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}