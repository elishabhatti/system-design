import React from 'react';
import VideoStudio from './VideoStudio';

export default function UserVideosPage() {
  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white pb-12">
      <div className="h-36 w-full bg-[#141414] border-b border-[#222]"></div>

      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-5 -mt-8 relative z-10 pb-6 border-b border-[#222]">
          <div className="w-20 h-20 rounded-full bg-[#1a1a1a] border-2 border-white flex items-center justify-center text-xl font-bold shadow-lg">
            EJ
          </div>
          <div className="text-center md:text-left pt-1">
            <h1 className="text-lg font-semibold tracking-wide">Elisha Jameel</h1>
            <p className="text-xs text-gray-500 mt-0.5">@elishajameel • 45.2K subscribers</p>
            <p className="text-xs text-gray-400 mt-1 max-w-md">Full-stack developer engineering scalable systems and video platforms.</p>
          </div>
        </div>

        <div className="mt-4">
          <VideoStudio />
        </div>
      </div>
    </div>
  );
}