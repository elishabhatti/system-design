import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Eye, Clock } from "lucide-react";

export default function VideoCard({ video }) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div
      onClick={() => navigate(`/watch/${video.id}`)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group cursor-pointer flex flex-col gap-2.5 bg-[#0A0A0B] border border-white/10 hover:border-white/30 rounded-2xl p-3 transition-all duration-300 shadow-xl"
    >
      {/* Media Preview Box */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/5">
        
        {/* Static Thumbnail / Placeholder */}
        <img
          src={video.thumbnailUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop"}
          alt={video.title}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isHovered ? "opacity-0" : "opacity-100"
          }`}
        />

        {/* Dynamic Hover Video Preview */}
        <video
          ref={videoRef}
          src={`http://localhost:5000/api/videos/${video.id}/stream`}
          muted
          loop
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Play Icon Badge on Hover */}
        <div className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`}>
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-lg">
            <Play className="w-4 h-4 fill-white ml-0.5" />
          </div>
        </div>

        {/* Duration / Live Badge */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono text-white/80 border border-white/10">
          {video.duration || "HD"}
        </div>
      </div>

      {/* Video Details */}
      <div className="flex flex-col gap-1 px-1">
        <h3 className="text-xs font-semibold text-white line-clamp-1 group-hover:text-white/90 transition">
          {video.title}
        </h3>
        <p className="text-[11px] text-white/40 line-clamp-1">
          {video.description || "No description provided."}
        </p>

        <div className="flex items-center justify-between text-[10px] text-white/40 pt-1 font-mono">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" /> {video.views || 0} views
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {new Date(video.createdAt || Date.now()).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}