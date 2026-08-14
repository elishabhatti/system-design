import React, { useEffect, useState } from "react";
import { fetchVideos } from "../services/api";

export default function VideoStudio() {
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const data = await fetchVideos();
      setVideos(data);
    } catch (err) {
      console.error("Failed to load videos", err);
    } finally {
      setLoadingVideos(false);
    }
  };

  return (
    <div className="space-y-6 text-zinc-100">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-200">Library Feed & Uploads</h2>
      </div>

      {loadingVideos ? (
        <p className="text-xs text-zinc-500">Loading library...</p>
      ) : videos.length === 0 ? (
        <p className="text-xs text-zinc-500 p-6 bg-[#121217] border border-zinc-800 rounded-2xl">No uploads found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {videos.map((vid) => (
            <div key={vid.id} className="bg-[#121217]/80 border border-zinc-800 rounded-2xl p-3.5 flex flex-col gap-3 backdrop-blur-md hover:border-indigo-500/40 transition">
              <div className="aspect-video bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-inner">
                <video controls className="w-full h-full object-cover" src={vid.filepath} />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-zinc-100 truncate">{vid.title}</h4>
                <span className="text-[10px] text-zinc-500 font-mono block mt-1">
                  {vid.filesize ? (vid.filesize / (1024 * 1024)).toFixed(2) + " MB" : "HD Video"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}