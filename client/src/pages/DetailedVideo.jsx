import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchVideos } from '../../services/api';

export default function DetailedVideo() {
  const { id } = useParams();
  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);

  useEffect(() => {
    fetchVideos().then((data) => {
      setVideos(data);
      const found = data.find((v) => String(v.id) === id);
      setCurrentVideo(found || data[0]);
    });
  }, [id]);

  if (!currentVideo) return <div className="text-center p-10">Loading video...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Player Section */}
      <div className="lg:col-span-2 space-y-3">
        <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-md">
          <video src={currentVideo.filepath} controls autoPlay className="w-full h-full object-contain" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">{currentVideo.title}</h1>
        <div className="p-4 bg-gray-100 rounded-xl text-sm text-gray-700">
          <p className="font-semibold">Description:</p>
          <p className="text-gray-600 mt-1">Enjoy watching this video stream uploaded via your custom dashboard workspace.</p>
        </div>
      </div>

      {/* Up Next Sidebar */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Up next</h3>
        <div className="space-y-3">
          {videos
            .filter((v) => String(v.id) !== String(currentVideo.id))
            .map((vid) => (
              <Link to={`/watch/${vid.id}`} key={vid.id} className="flex gap-3 group">
                <div className="w-40 aspect-video bg-black rounded-lg overflow-hidden shrink-0">
                  <video src={vid.filepath} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 line-clamp-2">{vid.title}</h4>
                  <span className="text-xs text-gray-500">Local Stream</span>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}