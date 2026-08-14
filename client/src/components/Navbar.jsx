import React from 'react';
import { Link } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { Sparkles, Search } from 'lucide-react';

export default function Navbar() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 h-16 bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-800/80 text-zinc-100">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar} 
          className="p-2 hover:bg-zinc-900 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
          title="Toggle sidebar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Link to="/" className="flex items-center gap-2 font-bold text-xs tracking-widest uppercase">
          <span className="w-2 h-2 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/50"></span> 
          Streamify
        </Link>
      </div>

      <div className="hidden md:flex items-center w-1/3 bg-[#121217] border border-zinc-800 rounded-xl overflow-hidden px-3.5 py-2 focus-within:border-indigo-500/50 transition">
        <Search className="w-3.5 h-3.5 text-zinc-500 mr-2.5" />
        <input 
          type="text" 
          placeholder="Search masterclasses, tech logs..." 
          className="w-full bg-transparent text-xs text-zinc-100 outline-none placeholder-zinc-500 font-medium"
        />
      </div>

      <div className="flex items-center gap-3">
        <Link to="/create" className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/20 transition duration-300">
          + Create
        </Link>
        <Link to="/profile" className="w-8 h-8 rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center font-bold text-xs text-white shadow-md">
          EJ
        </Link>
      </div>
    </header>
  );
}