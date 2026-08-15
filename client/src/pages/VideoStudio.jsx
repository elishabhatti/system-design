import React, { useEffect, useState } from "react";
import { fetchVideos } from "../services/api";
import { Play, ThumbsUp, Share2, Bookmark, MoreVertical, Sparkles } from "lucide-react";
import Navbar from "../components/Navbar";

export default function VideoStudio() {
  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [loadingVideos, setLoadingVideos] = useState(true);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const data = await fetchVideos();
      if (data && data.length > 0) {
        setVideos(data);
        setCurrentVideo(data[0]); // Default to first video
      }
    } catch (err) {
      console.error("Failed to load videos", err);
    } finally {
      setLoadingVideos(false);
    }
  };

  if (loadingVideos) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh]">
        <div className="w-6 h-6 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-zinc-400 mt-3 font-mono">Loading player...</p>
      </div>
    );
  }

  if (!currentVideo) {
    return (
      <div className="text-center py-20 text-zinc-400 text-xs">
        No videos available in your library.
      </div>
    );
  }

  // Filter out current video for the sidebar playlist
  const sidebarVideos = videos.filter((v) => v.id !== currentVideo.id);

  return (
    <>
      <Navbar />
      <div className="max-w-full mx-auto px-4 lg:px-8 py-6 text-zinc-100 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Main Player & Details */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-4">
          
          {/* Main Video Player Container */}
          <div className="w-full aspect-video bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-xl relative">
            <video 
              key={currentVideo.id}
              src={currentVideo.filepath} 
              controls 
              autoPlay
              className="w-full h-full object-contain" 
            />
          </div>

          {/* Video Title */}
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
            {currentVideo.title}
          </h1>

          {/* Channel Info & Action Buttons Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
            
            {/* Channel Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-sm">
                {(currentVideo.user?.channelName || "E")[0].toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-xs text-zinc-200">
                  {currentVideo.user?.channelName || "Elisha Jameel"}
                </h3>
                <span className="text-[11px] text-zinc-400">1.75K subscribers</span>
              </div>
              <button className="ml-3 bg-white text-zinc-950 font-medium text-xs px-4 py-2 rounded-full hover:bg-zinc-200 transition cursor-pointer">
                Subscribe
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#27272a] rounded-full overflow-hidden border border-zinc-700/50">
                <button className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium hover:bg-[#3f3f46] transition border-r border-zinc-700/50 cursor-pointer">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>28K</span>
                </button>
                <button className="px-3.5 py-1.5 text-xs font-medium hover:bg-[#3f3f46] transition cursor-pointer">
                  <span className="rotate-180 inline-block"><ThumbsUp className="w-3.5 h-3.5" /></span>
                </button>
              </div>

              <button className="flex items-center gap-1.5 bg-[#27272a] hover:bg-[#3f3f46] px-3.5 py-1.5 rounded-full text-xs font-medium border border-zinc-700/50 transition cursor-pointer">
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>

              <button className="flex items-center gap-1.5 bg-[#27272a] hover:bg-[#3f3f46] px-3.5 py-1.5 rounded-full text-xs font-medium border border-zinc-700/50 transition cursor-pointer">
                <Bookmark className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>

          </div>

          {/* Video Description Box */}
          <div className="bg-[#27272a]/60 border border-zinc-800/80 rounded-xl p-4 text-xs text-zinc-300 leading-relaxed">
            <div className="flex items-center gap-3 font-semibold text-zinc-200 mb-2 font-mono">
              <span>{currentVideo.views || '1.2M views'}</span>
              <span>•</span>
              <span>{currentVideo.uploadedAt ? new Date(currentVideo.uploadedAt).toLocaleDateString() : 'Aug 15, 2026'}</span>
            </div>
            <p>{currentVideo.description || "Enjoy this immersive media stream configured directly from your library feed."}</p>
          </div>

        </div>

        {/* Right Column: Up Next / Queue Playlist Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-3">
          
          {/* Playlist Header Box */}
          <div className="bg-[#1f1f23] border border-zinc-800/80 rounded-xl p-3.5 flex items-center justify-between shadow-md">
            <div>
              <h3 className="font-bold text-xs text-zinc-100">Mix - Library Stream</h3>
              <span className="text-[10px] text-zinc-400">Elisha Jameel • {videos.length} videos</span>
            </div>
            <Sparkles className="w-4 h-4 text-zinc-300" />
          </div>

          {/* Sidebar Video List */}
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[70vh] pr-1 scrollbar-thin scrollbar-thumb-zinc-700">
            {sidebarVideos.map((vid, idx) => {
              const isSelected = currentVideo.id === vid.id;
              return (
                <div 
                  key={vid.id}
                  onClick={() => setCurrentVideo(vid)}
                  className={`group flex items-center gap-3 p-2 rounded-xl cursor-pointer transition border ${
                    isSelected 
                      ? 'bg-[#27272a] border-zinc-700' 
                      : 'bg-transparent border-transparent hover:bg-[#27272a]/40'
                  }`}
                >
                  {/* Index / Thumbnail */}
                  <div className="w-28 aspect-video bg-black rounded-lg overflow-hidden relative shrink-0 border border-zinc-800">
                    <video src={vid.filepath} className="w-full h-full object-cover" muted />
                    <span className="absolute bottom-1 right-1 bg-black/80 text-[9px] px-1 rounded text-zinc-200 font-mono">
                      {vid.duration || '5:31'}
                    </span>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-col overflow-hidden w-full">
                    <span className="text-[10px] font-mono text-zinc-500 mb-0.5">#{idx + 1} in queue</span>
                    <h4 className={`font-semibold text-xs truncate ${isSelected ? 'text-white font-bold' : 'text-zinc-200 group-hover:text-white'}`}>
                      {vid.title}
                    </h4>
                    <span className="text-[11px] text-zinc-400 truncate mt-0.5">
                      {vid.user?.channelName || "Elisha Jameel"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </>
  );
}