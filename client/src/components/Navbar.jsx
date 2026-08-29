import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Video, PlusSquare, User, LogOut, Compass, Flame, Radio, Search, Bell, Sparkles, Orbit as OrbitIcon } from 'lucide-react';

export default function Navbar() {
  const { user, logoutUser } = useAuth();
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
    <header className="sticky top-0 z-50 px-4 py-3 bg-black/90 backdrop-blur-xl border-b border-zinc-900 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center relative overflow-hidden group-hover:border-zinc-600 transition duration-300 shadow-xl">
            {/* Inner glowing ring effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50"></div>
            <OrbitIcon className="w-5 h-5 text-white group-hover:rotate-180 transition duration-700 ease-in-out" />
            <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-sm shadow-white"></div>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
              ORBIT <span className="text-[9px] bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded-md text-zinc-400 font-mono">v2.4</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Stream Studio</span>
          </div>
        </Link>

        {/* Center Search Bar */}
        <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md relative group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search creator videos, streams, tags..."
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-white rounded-2xl px-4 py-2.5 pl-10 text-xs text-zinc-100 placeholder-zinc-600 outline-none transition-all shadow-inner group-hover:border-zinc-700 font-medium"
          />
          <Search className="w-4 h-4 text-zinc-600 absolute left-3.5 transition group-focus-within:text-white" />
          <div className="absolute right-2.5 px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
            ⌘K
          </div>
        </form>

        {/* Quick Nav Links */}
        <div className="hidden lg:flex items-center gap-1 bg-zinc-950 border border-zinc-900 p-1 rounded-2xl">
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
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  active 
                    ? 'bg-white text-black shadow-lg font-bold' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-black' : 'text-zinc-400'}`} />
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
                className="hidden sm:flex items-center gap-2 bg-white hover:bg-zinc-200 text-black px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg transition active:scale-95 cursor-pointer"
              >
                <PlusSquare className="w-4 h-4" />
                <span>Upload</span>
              </Link>

              {/* Notification Bell */}
              <button className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition relative cursor-pointer">
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white animate-pulse"></span>
              </button>

              {/* User Avatar Menu Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center font-bold text-xs text-white hover:border-zinc-600 transition cursor-pointer shadow-md"
                >
                  {user.avatarUrl ? (
                    <img src={user?.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{user.channelName ? user.channelName[0].toUpperCase() : 'U'}</span>
                  )}
                </button>

                {showDropdown && (
                  <div className="absolute right-0 top-12 w-52 bg-zinc-950 border border-zinc-800 rounded-2xl py-2 shadow-2xl z-50 backdrop-blur-2xl">
                    <div className="px-4 py-2.5 border-b border-zinc-900 mb-1">
                      <p className="text-xs font-bold text-white truncate">{user.channelName}</p>
                      <p className="text-[10px] text-zinc-500 font-mono truncate">{user.email}</p>
                    </div>
                    
                    <Link
                      to="/profile"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white transition font-medium"
                    >
                      <User className="w-3.5 h-3.5 text-zinc-400" /> Channel Studio
                    </Link>

                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        logoutUser();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 transition cursor-pointer font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Logout Session
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/login"
                className="text-xs font-semibold text-zinc-300 hover:text-white px-3.5 py-2 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-white hover:bg-zinc-200 text-black px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg transition active:scale-95 cursor-pointer"
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