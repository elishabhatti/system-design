import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 h-14 bg-white border-b border-gray-200">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-1 font-bold text-lg text-gray-900 tracking-tighter">
          <span className="bg-red-600 text-white px-2 py-0.5 rounded-md text-sm">▶</span> YouTubeClone
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Link to="/create" className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full text-sm font-medium transition">
          + Create
        </Link>
        <Link to="/profile" className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-full text-sm font-medium transition">
          My Channel
        </Link>
        <Link to="/login" className="text-sm font-medium text-blue-600 hover:underline">
          Sign In
        </Link>
      </div>
    </header>
  );
}