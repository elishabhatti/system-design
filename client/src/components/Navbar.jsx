import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Video, PlusSquare, User, LogOut, Compass, Flame, Radio, Search, Bell, Sparkles } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 px-4 py-3 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group cursor-pointer">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-zinc-800 via-zinc-900 to-zinc-700 border border-white/15 flex items-center justify-center shadow-xl group-hover:scale-105 transition duration-300">
            <Video className="w-4 h-4 text-zinc-100 group-hover:rotate-12 transition duration-300" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-sm tracking-tight text-white flex items-center gap-1">
              Orbit <span className="text-[10px] bg-zinc-800 border border-zinc-700 px-1.5 py-0.2 rounded-full text-zinc-300 font-mono">v2</span>
            </span>
            <span className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase">Stream Hub</span>
          </div>
        </Link>

        {/* Center Search Bar */}
        <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md relative group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search creator videos, streams, tags..."
            className="w-full bg-zinc-900/90 border border-white/10 focus:border-zinc-400 rounded-2xl px-4 py-2 pl-10 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition-all shadow-inner group-hover:border-white/20"
          />
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 transition group-focus-within:text-zinc-200" />
          <div className="absolute right-2.5 px-1.5 py-0.5 rounded-lg bg-zinc-800 border border-zinc-700 text-[9px] font-mono text-zinc-400">
            ⌘K
          </div>
        </form>

        {/* Quick Nav Links */}
        <div className="hidden lg:flex items-center gap-1 bg-zinc-900/60 border border-white/5 p-1 rounded-2xl">
          {[
            { name: 'Feed', path: '/', icon: Flame },
            { name: 'Explore', path: '/explore', icon: Compass },
            { name: 'Live', path: '/live', icon: Radio },
          ].map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  active 
                    ? 'bg-zinc-100 text-zinc-950 shadow-md font-bold' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-zinc-950' : 'text-zinc-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Right Action Hub */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Upload Video Button */}
              <Link
                to="/create"
                className="hidden sm:flex items-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg transition active:scale-95 cursor-pointer"
              >
                <PlusSquare className="w-4 h-4" />
                <span>Upload</span>
              </Link>

              {/* Notification Bell */}
              <button className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition relative cursor-pointer">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-zinc-200 animate-pulse"></span>
              </button>

              {/* User Avatar Menu Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-9 h-9 rounded-xl bg-zinc-800 border border-white/10 overflow-hidden flex items-center justify-center font-bold text-xs text-white hover:border-white/30 transition cursor-pointer shadow-md"
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{user.channelName ? user.channelName[0].toUpperCase() : 'U'}</span>
                  )}
                </button>

                {showDropdown && (
                  <div className="absolute right-0 top-11 w-52 bg-zinc-900 border border-white/10 rounded-2xl py-2 shadow-2xl z-50 backdrop-blur-2xl">
                    <div className="px-4 py-2 border-b border-white/10 mb-1">
                      <p className="text-xs font-bold text-white truncate">{user.channelName}</p>
                      <p className="text-[10px] text-zinc-400 font-mono truncate">{user.email}</p>
                    </div>
                    
                    <Link
                      to="/profile"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                    >
                      <User className="w-3.5 h-3.5 text-zinc-400" /> Channel Studio
                    </Link>

                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Logout Session
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs font-semibold text-zinc-300 hover:text-white px-3.5 py-2 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-zinc-100 hover:bg-white text-zinc-950 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition active:scale-95 cursor-pointer"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}