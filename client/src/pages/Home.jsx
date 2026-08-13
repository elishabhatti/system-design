import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchVideos } from '../services/api';

const categories = ["All", "Gaming", "Music", "Live", "Podcasts", "Tech", "React.js", "Mixes", "Vlogs", "ASP.NET Core"];

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

  if (loading) return <div className="text-center p-20 text-gray-400 bg-[#0f0f0f]">Loading feed...</div>;

  return (
    <div className="px-6 py-4 bg-[#0f0f0f] min-h-screen text-white">
      {/* Category Filter Pills */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-none mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeCategory === cat ? 'bg-white text-black font-semibold' : 'bg-[#272727] text-white hover:bg-[#3f3f3f]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Video Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
        {videos.map((vid) => (
          <Link to={`/watch/${vid.id}`} key={vid.id} className="group flex flex-col gap-3">
            <div className="aspect-video bg-[#1f1f1f] rounded-2xl overflow-hidden relative border border-[#272727] shadow-lg">
              <video src={vid.filepath} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" muted />
              <span className="absolute bottom-2 right-2 bg-black/80 text-[10px] px-1.5 py-0.5 rounded text-gray-200">14:22</span>
            </div>
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                {vid.title ? vid.title[0].toUpperCase() : 'S'}
              </div>
              <div className="flex flex-col">
                <h3 className="font-semibold text-white text-sm line-clamp-2 group-hover:text-blue-400 transition">{vid.title}</h3>
                <span className="text-xs text-gray-400 mt-1">Elisha Jameel</span>
                <span className="text-xs text-gray-500">24K views • 2 days ago</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}