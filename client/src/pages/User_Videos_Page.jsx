import React from 'react';
import VideoList from '../components/VideoList';

export default function UserVideosPage() {
  return (
    <div className="bg-[#0f0f0f] min-h-screen text-white pb-12">
      {/* Banner */}
      <div className="h-40 md:h-52 w-full bg-gradient-to-r from-red-900 via-gray-900 to-black relative"></div>

      <div className="max-w-6xl mx-auto px-6">
        {/* Profile Info */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 -mt-10 relative z-10 pb-6 border-b border-[#272727]">
          <div className="w-28 h-28 rounded-full bg-purple-600 border-4 border-[#0f0f0f] flex items-center justify-center text-4xl font-bold shadow-2xl">
            EJ
          </div>
          <div className="text-center md:text-left pt-2">
            <h1 className="text-2xl font-bold">Elisha Jameel</h1>
            <p className="text-xs text-gray-400 mt-1">@elishajameel • 45.2K subscribers • 12 videos</p>
            <p className="text-xs text-gray-300 mt-2 max-w-lg">Full-stack software developer building scalable video platforms and web apps.</p>
            <div className="flex gap-3 mt-4 justify-center md:justify-start">
              <button className="px-5 py-2 bg-white text-black font-semibold rounded-full text-xs hover:bg-gray-200 transition">Customize channel</button>
              <button className="px-5 py-2 bg-[#272727] text-white font-semibold rounded-full text-xs hover:bg-[#3f3f3f] transition">Manage videos</button>
            </div>
          </div>
        </div>

        {/* Channel Navigation Tabs */}
        <div className="flex gap-8 border-b border-[#272727] text-sm font-semibold text-gray-400 py-3">
          <span className="text-white border-b-2 border-white pb-3 cursor-pointer">Home</span>
          <span className="hover:text-white cursor-pointer pb-3">Videos</span>
          <span className="hover:text-white cursor-pointer pb-3">Playlists</span>
          <span className="hover:text-white cursor-pointer pb-3">Community</span>
        </div>

        {/* Video List Section */}
        <div className="mt-6">
          <VideoList />
        </div>
      </div>
    </div>
  );
}