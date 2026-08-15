import React from 'react';
import { Link } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { Search, Bell, Video, Mic, Menu } from 'lucide-react';

export default function Navbar() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 h-16 bg-[#09090b]/95 backdrop-blur-md border-b border-zinc-800/80 text-zinc-100">
      
      {/* Left: Menu Toggle & YouTube Style Brand Logo */}
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar} 
          className="p-2.5 hover:bg-zinc-800/60 rounded-full text-zinc-300 hover:text-white transition cursor-pointer"
          title="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="font-bold text-sm tracking-tight text-white">Orbit</span>
        </Link>
      </div>

      {/* Center: Search Bar with Capsule Design & Mic */}
      <div className="hidden md:flex items-center justify-center flex-1 max-w-2xl px-6">
        <div className="flex items-center w-full bg-[#121217] border border-zinc-800 hover:border-zinc-700 focus-within:border-indigo-500 rounded-full overflow-hidden transition shadow-inner">
          <input 
            type="text" 
            placeholder="Search" 
            className="w-full bg-transparent px-5 py-2.5 text-xs text-zinc-100 outline-none placeholder-zinc-500 font-medium"
          />
          <button className="px-5 py-2.5 bg-zinc-900/80 border-l border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition flex items-center justify-center cursor-pointer">
            <Search className="w-4 h-4" />
          </button>
        </div>
        <button className="ml-3 p-2.5 bg-[#121217] hover:bg-zinc-800 border border-zinc-800 rounded-full text-zinc-300 hover:text-white transition cursor-pointer shadow-sm" title="Search with your voice">
          <Mic className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Create Video Button, Notifications & Profile Avatar */}
      <div className="flex items-center gap-3">
        <Link 
          to="/create" 
          className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-200 rounded-full text-xs font-semibold shadow-sm transition"
        >
          <Video className="w-4 h-4 text-indigo-400" />
          <span>Create</span>
        </Link>

        <button 
          className="p-2.5 hover:bg-zinc-800/60 rounded-full text-zinc-300 hover:text-white transition relative cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full shadow-md shadow-indigo-500/50"></span>
        </button>

        <Link 
          to="/profile" 
          className="w-8 h-8 rounded-full border border-indigo-500/40 bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center font-bold text-xs text-white shadow-md hover:scale-105 transition-transform"
        >
          EJ
        </Link>
      </div>

    </header>
  );
}