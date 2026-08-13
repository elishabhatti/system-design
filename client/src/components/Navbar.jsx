import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 h-16 bg-[#0f0f0f] border-b border-[#272727] text-white">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <span className="bg-purple-600 text-white p-1.5 rounded-xl text-xs shadow-lg shadow-purple-600/30">▶</span> 
          Streamify
        </Link>
      </div>

      {/* Search Bar mockup like YouTube */}
      <div className="hidden md:flex items-center w-1/3 bg-[#121212] border border-[#303030] rounded-full overflow-hidden px-4 py-1.5 focus-within:border-purple-500">
        <input 
          type="text" 
          placeholder="Search videos..." 
          className="w-full bg-transparent text-sm text-white outline-none placeholder-gray-500"
        />
      </div>

      <div className="flex items-center gap-3">
        <Link to="/create" className="px-4 py-2 bg-[#272727] hover:bg-[#3f3f3f] text-white rounded-full text-xs font-semibold tracking-wide transition shadow-sm">
          + Create
        </Link>
        <Link to="/profile" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-xs font-semibold tracking-wide transition shadow-lg shadow-purple-600/20">
          My Channel
        </Link>
        <Link to="/login" className="text-xs font-semibold text-gray-400 hover:text-white transition">
          Sign In
        </Link>
      </div>
    </header>
  );
}