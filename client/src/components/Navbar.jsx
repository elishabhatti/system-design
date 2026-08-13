import React from 'react';
import { Link } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';

export default function Navbar() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 h-16 bg-[#0f0f0f] border-b border-[#272727] text-white">
      {/* Left: Hamburger & Logo */}
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar} 
          className="p-2 hover:bg-[#272727] rounded-full text-white transition cursor-pointer"
          title="Toggle sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Link to="/" className="flex items-center gap-1.5 font-bold text-lg tracking-tight">
          <span className="bg-red-600 text-white px-2 py-0.5 rounded-lg text-xs font-black">▶</span> 
          YouTube
        </Link>
      </div>

      {/* Center: Search Bar */}
      <div className="hidden md:flex items-center w-1/3 bg-[#121212] border border-[#303030] rounded-full overflow-hidden px-4 py-1.5 focus-within:border-blue-500">
        <input 
          type="text" 
          placeholder="Search" 
          className="w-full bg-transparent text-sm text-white outline-none placeholder-gray-500"
        />
        <button className="text-gray-400 hover:text-white">🔍</button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <Link to="/create" className="px-4 py-2 bg-[#272727] hover:bg-[#3f3f3f] text-white rounded-full text-xs font-semibold transition flex items-center gap-2">
          <span>＋</span> Create
        </Link>
        <Link to="/profile" className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-xs">
          EJ
        </Link>
      </div>
    </header>
  );
}