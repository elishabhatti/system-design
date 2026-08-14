import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import VideoStudio from './VideoStudio';
import { Settings, Video, Users, Sparkles, CheckCircle2 } from 'lucide-react';

export default function UserVideosPage() {
  const { user } = useAuth();
  const channelName = user?.channelName || "Elisha Jameel";
  const email = user?.email || "elisha@example.com";
  const initial = channelName[0].toUpperCase();

  return (
    <div className="bg-[#09090b] min-h-screen text-zinc-100 pb-16 selection:bg-indigo-500 selection:text-white">
      <div className="h-44 w-full bg-gradient-to-r from-indigo-950 via-zinc-900 to-violet-950 border-b border-zinc-800/80 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 -mt-12 relative z-10 pb-8 border-b border-zinc-800/80">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 border-4 border-[#09090b] flex items-center justify-center text-2xl font-bold shadow-2xl shadow-indigo-500/20 text-white shrink-0">
            {initial}
          </div>

          <div className="text-center md:text-left pt-2 flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <h1 className="text-xl font-bold tracking-wide text-zinc-100 flex items-center justify-center md:justify-start gap-1.5">
                {channelName}
                <CheckCircle2 className="w-4 h-4 text-indigo-400 fill-indigo-400/20" />
              </h1>
              <span className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-semibold px-2.5 py-0.5 rounded-full w-fit mx-auto md:mx-0">
                Pro Creator
              </span>
            </div>
            
            <p className="text-xs text-zinc-400 mt-1 flex items-center justify-center md:justify-start gap-2">
              <span>@{email.split('@')[0]}</span>
              <span>•</span>
              <span className="text-zinc-300 font-medium flex items-center gap-1"><Users className="w-3 h-3 text-indigo-400" /> 1.4K subscribers</span>
            </p>

            <p className="text-xs text-zinc-400 mt-2 max-w-xl leading-relaxed">
              Full-stack developer engineering scalable systems, video streaming platforms, and modern web applications.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4 md:pt-2">
            <button className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/20 transition duration-300 cursor-pointer">
              <Sparkles className="w-3.5 h-3.5" /> Customize Channel
            </button>
            <button className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition cursor-pointer">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6 pt-4 border-b border-zinc-800/60 mb-6 text-xs font-semibold">
          <button className="pb-3 border-b-2 border-indigo-500 text-indigo-400 flex items-center gap-2 cursor-pointer">
            <Video className="w-4 h-4" /> Videos & Uploads
          </button>
          <button className="pb-3 border-b-2 border-transparent text-zinc-400 hover:text-zinc-200 transition cursor-pointer">
            Analytics
          </button>
          <button className="pb-3 border-b-2 border-transparent text-zinc-400 hover:text-zinc-200 transition cursor-pointer">
            Playlists
          </button>
        </div>

        <div className="mt-2">
          <VideoStudio />
        </div>
      </div>
    </div>
  );
}