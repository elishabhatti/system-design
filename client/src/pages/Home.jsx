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

  if (loading) return <div className="text-center p-10 text-gray-500">Loading feed...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {videos.map((vid) => (
          <Link to={`/watch/${vid.id}`} key={vid.id} className="group flex flex-col gap-2">
            <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
              <video src={vid.filepath} className="w-full h-full object-cover group-hover:scale-105 transition duration-200" muted />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{vid.title}</h3>
              <p className="text-xs text-gray-500 mt-1">Uploaded recently</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}