import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';

export default function Sidebar() {
  const { isSidebarOpen } = useSidebar();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  if (!isSidebarOpen) {
    // Collapsed Mini Sidebar view (Icons only)
    return (
      <aside className="w-18 bg-[#0f0f0f] text-white flex flex-col items-center py-3 sticky top-16 h-[calc(100vh-4rem)] border-r border-[#272727] hidden md:flex flex-shrink-0 transition-all duration-300">
        <div className="space-y-4 flex flex-col items-center">
          <Link to="/" className={`p-3 rounded-xl flex flex-col items-center text-xs ${isActive('/') ? 'bg-[#272727] text-white' : 'hover:bg-[#1f1f1f] text-gray-300'}`}>
            <span className="text-xl">🏠</span>
            <span className="text-[10px] mt-1">Home</span>
          </Link>
          <Link to="/profile" className={`p-3 rounded-xl flex flex-col items-center text-xs ${isActive('/profile') ? 'bg-[#272727] text-white' : 'hover:bg-[#1f1f1f] text-gray-300'}`}>
            <span className="text-xl">👤</span>
            <span className="text-[10px] mt-1">You</span>
          </Link>
          <Link to="/create" className={`p-3 rounded-xl flex flex-col items-center text-xs ${isActive('/create') ? 'bg-[#272727] text-white' : 'hover:bg-[#1f1f1f] text-gray-300'}`}>
            <span className="text-xl">➕</span>
            <span className="text-[10px] mt-1">Create</span>
          </Link>
        </div>
      </aside>
    );
  }

  // Expanded Full Sidebar view
  return (
    <aside className="w-64 bg-[#0f0f0f] text-white flex flex-col p-3 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-r border-[#272727] hidden md:flex flex-shrink-0 transition-all duration-300">
      <div className="space-y-1">
        <Link to="/" className={`flex items-center gap-6 px-4 py-3 rounded-xl text-sm font-medium transition ${isActive('/') ? 'bg-[#272727] text-white' : 'hover:bg-[#1f1f1f] text-gray-300'}`}>
          <span className="text-lg">🏠</span> Home
        </Link>
        <Link to="/profile" className={`flex items-center gap-6 px-4 py-3 rounded-xl text-sm font-medium transition ${isActive('/profile') ? 'bg-[#272727] text-white' : 'hover:bg-[#1f1f1f] text-gray-300'}`}>
          <span className="text-lg">👤</span> You / Channel
        </Link>
        <Link to="/create" className={`flex items-center gap-6 px-4 py-3 rounded-xl text-sm font-medium transition ${isActive('/create') ? 'bg-[#272727] text-white' : 'hover:bg-[#1f1f1f] text-gray-300'}`}>
          <span className="text-lg">➕</span> Upload Studio
        </Link>
      </div>
      <hr className="border-[#272727] my-4" />
      <div className="px-4 text-xs text-gray-500">
        <p className="font-semibold text-gray-400 mb-2">Subscriptions</p>
        <p className="py-1 hover:text-white cursor-pointer">Streamify Creator</p>
      </div>
    </aside>
  );
}