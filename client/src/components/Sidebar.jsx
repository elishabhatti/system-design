import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';

export default function Sidebar() {
  const { isSidebarOpen } = useSidebar();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  if (!isSidebarOpen) {
    return (
      <aside className="w-16 bg-[#0a0a0a] text-white flex-col items-center py-3 sticky top-16 h-[calc(100vh-4rem)] border-r border-[#222222] hidden md:flex shrink-0">
        <div className="space-y-3 flex flex-col items-center">
          <Link to="/" className={`p-2.5 rounded-lg border border-transparent ${isActive('/') ? 'border-white bg-[#141414]' : 'hover:border-[#333]'}`}>
            <span className="text-xs">🏠</span>
          </Link>
          <Link to="/profile" className={`p-2.5 rounded-lg border border-transparent ${isActive('/profile') ? 'border-white bg-[#141414]' : 'hover:border-[#333]'}`}>
            <span className="text-xs">👤</span>
          </Link>
          <Link to="/create" className={`p-2.5 rounded-lg border border-transparent ${isActive('/create') ? 'border-white bg-[#141414]' : 'hover:border-[#333]'}`}>
            <span className="text-xs">➕</span>
          </Link>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-60 bg-[#0a0a0a] text-white flex-col p-3 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-r border-[#222222] hidden md:flex shrink-0">
      <div className="space-y-1">
        <Link to="/" className={`flex items-center gap-4 px-3 py-2 rounded-lg text-xs font-medium border transition ${isActive('/') ? 'border-white bg-[#141414] text-white' : 'border-transparent text-gray-400 hover:text-white hover:border-[#333]'}`}>
          <span>🏠</span> Home
        </Link>
        <Link to="/profile" className={`flex items-center gap-4 px-3 py-2 rounded-lg text-xs font-medium border transition ${isActive('/profile') ? 'border-white bg-[#141414] text-white' : 'border-transparent text-gray-400 hover:text-white hover:border-[#333]'}`}>
          <span>👤</span> Channel Profile
        </Link>
        <Link to="/create" className={`flex items-center gap-4 px-3 py-2 rounded-lg text-xs font-medium border transition ${isActive('/create') ? 'border-white bg-[#141414] text-white' : 'border-transparent text-gray-400 hover:text-white hover:border-[#333]'}`}>
          <span>➕</span> Upload Studio
        </Link>
      </div>
      <div className="mt-6 pt-4 border-t border-[#222] px-3 text-[10px] text-gray-600 uppercase tracking-widest">
        Library
      </div>
    </aside>
  );
}