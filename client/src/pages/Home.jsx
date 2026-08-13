import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchVideos } from '../../services/api';

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos()
      .then((data) => setVideos(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center p-20 text-gray-400 bg-[#0f0f0f] min-h-screen">Loading custom feed...</div>;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white px-4 md:px-8 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-tight">Recommended</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
          {videos.map((vid) => (
            <Link to={`/watch/${vid.id}`} key={vid.id} className="group flex flex-col gap-3">
              {/* Thumbnail Container */}
              <div className="aspect-video bg-[#1f1f1f] rounded-2xl overflow-hidden relative shadow-md border border-[#272727]">
                <video 
                  src={vid.filepath} 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                  muted 
                />
                <div className="absolute bottom-2 right-2 bg-black/80 text-[10px] font-medium px-2 py-0.5 rounded backdrop-blur-sm text-gray-300">
                  HD
                </div>
              </div>

              {/* Video Details */}
              <div className="flex gap-3 items-start">
                {/* Channel Avatar Placeholder */}
                <div className="w-9 h-9 rounded-full bg-purple-600/30 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-xs flex-shrink-0">
                  {vid.title ? vid.title[0].toUpperCase() : 'S'}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <h3 className="font-semibold text-white text-sm line-clamp-2 group-hover:text-purple-400 transition">
                    {vid.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">Streamify Creator</p>
                  <p className="text-xs text-gray-500">12K views • 2 days ago</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}