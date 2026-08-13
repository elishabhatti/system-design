import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-64 bg-[#0f0f0f] text-white flex flex-col p-3 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto border-r border-[#272727] hidden md:flex flex-shrink-0">
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
        <p className="py-1 hover:text-white cursor-pointer truncate">Streamify Creator</p>
        <p className="py-1 hover:text-white cursor-pointer truncate">Tech Vlogs</p>
      </div>
    </aside>
  );
}