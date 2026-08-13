import React from 'react';
import { Link } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';

export default function Navbar() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 h-16 bg-[#0a0a0a] border-b border-[#222222] text-white">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar} 
          className="p-2 hover:bg-[#1a1a1a] rounded-lg text-gray-300 transition cursor-pointer"
          title="Toggle sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Link to="/" className="flex items-center gap-2 font-semibold text-sm tracking-widest uppercase">
          <span className="w-2 h-2 bg-white rounded-full"></span> 
          Streamify
        </Link>
      </div>

      <div className="hidden md:flex items-center w-1/3 bg-[#141414] border border-[#262626] rounded-lg overflow-hidden px-3 py-1.5 focus-within:border-white transition">
        <input 
          type="text" 
          placeholder="Search..." 
          className="w-full bg-transparent text-xs text-white outline-none placeholder-gray-600"
        />
      </div>

      <div className="flex items-center gap-3">
        <Link to="/create" className="px-3.5 py-1.5 bg-transparent border border-[#333333] hover:bg-white hover:text-black text-white rounded-lg text-xs font-medium transition">
          + Create
        </Link>
        <Link to="/profile" className="w-7 h-7 rounded-full border border-[#444] bg-[#1a1a1a] flex items-center justify-center font-medium text-[11px] text-white">
          EJ
        </Link>
      </div>
    </header>
  );
}