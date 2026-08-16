import React from 'react';
import { Link } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { Search, Bell, Video, Mic, Menu, Plus } from 'lucide-react';

export default function Navbar() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 h-16  backdrop-blur-md border-b border-white/10 text-zinc-100">
      
      {/* Left: Menu Toggle & Brand Logo */}
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar} 
          className="p-2.5 hover:bg-white/10 rounded-full text-zinc-300 hover:text-white transition cursor-pointer"
          title="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="text-xl tracking-tight text-white">Orbit</span>
        </Link>
      </div>

      {/* Center: Search Bar with Capsule Design & Mic */}
      <div className="hidden md:flex items-center justify-center flex-1 max-w-2xl px-6">
        <div className="flex items-center w-full  border border-white/10 hover:border-white/20 rounded-full overflow-hidden transition shadow-inner">
          <input 
            type="text" 
            placeholder="Search" 
            className="w-full bg-transparent px-5 py-2.5 text-xs text-zinc-100 outline-none placeholder-indigo-200/40 font-medium"
          />
          <button className="px-5 py-2.5 border-l border-white/10 text-zinc-400 hover:text-zinc-200 transition flex items-center justify-center cursor-pointer">
            <Search className="w-4 h-4" />
          </button>
        </div>
        <button className="ml-3 p-2.5 border border-white/10 rounded-full text-zinc-300 hover:text-white transition cursor-pointer shadow-sm" title="Search with your voice">
          <Mic className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Create Video Button, Notifications & Profile Avatar */}
      <div className="flex items-center gap-3">
        <Link 
          to="/create" 
          className="hidden sm:flex items-center gap-2 px-3.5 py-2  border border-gray-800 text-white rounded-full text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create</span>
        </Link>

        <button 
          className="p-2.5 hover:bg-white/10 rounded-full text-zinc-300 hover:text-white transition relative cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-white rounded-full shadow-md shadow-violet-500/50"></span>
        </button>

        <Link 
          to="/profile" 
          className="w-8 h-8 rounded-full border border-violet-500/40 bg-black flex items-center justify-center font-bold text-xs text-white shadow-md hover:scale-105 transition-transform"
        >
          EJ
        </Link>
      </div>

    </header>
  );
}