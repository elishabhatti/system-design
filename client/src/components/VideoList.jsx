import React, { useEffect, useState } from 'react';
import { fetchVideos } from '../../services/api';

export default function VideoList() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const data = await fetchVideos();
      setVideos(data);
    } catch (err) {
      console.error('Failed to load videos', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-5 text-sm text-gray-500">Loading videos...</div>;

  return (
    <div className="max-w-2xl mx-auto my-10 p-6 bg-white border border-gray-200 rounded-lg font-sans">
      <h2 className="mb-4 text-xl font-semibold text-gray-900">Uploaded Videos</h2>
      
      {videos.length === 0 ? (
        <p className="text-sm text-gray-500">No videos uploaded yet.</p>
      ) : (
        <div className="space-y-4">
          {videos.map((vid) => (
            <div key={vid.id} className="p-4 border border-gray-100 rounded-md bg-gray-50 flex flex-col gap-2">
              <h4 className="font-medium text-gray-900 text-sm">{vid.title}</h4>
              <video 
                controls 
                className="w-full rounded-md max-h-60 bg-black"
                src={`http://localhost:3000/uploads/${vid.filename}`}
              />
              <span className="text-xs text-gray-400">
                Size: {(vid.filesize / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}