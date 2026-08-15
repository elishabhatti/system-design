import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { 
  Home, 
  Clapperboard, 
  Tv, 
  User, 
  History, 
  ListVideo, 
  Clock, 
  ThumbsUp, 
  Video, 
  Download, 
  Compass, 
  Flame, 
  Music, 
  Radio, 
  Gamepad2, 
  ChevronRight 
} from 'lucide-react';

export default function Sidebar() {
  const { isSidebarOpen } = useSidebar();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const mainLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/shorts', label: 'Shorts', icon: Clapperboard },
    { path: '/subscriptions', label: 'Subscriptions', icon: Tv },
  ];

  const youLinks = [
    { path: '/profile', label: 'Your channel', icon: User },
    { path: '/history', label: 'History', icon: History },
    { path: '/playlists', label: 'Playlists', icon: ListVideo },
    { path: '/watch-later', label: 'Watch later', icon: Clock },
    { path: '/liked-videos', label: 'Liked videos', icon: ThumbsUp },
    { path: '/my-videos', label: 'Your videos', icon: Video },
    { path: '/downloads', label: 'Downloads', icon: Download },
  ];

  const subscriptionsList = [
    { name: 'MANGA MIND', initial: 'M', color: 'from-amber-600 to-orange-700' },
    { name: 'ARY Digital HD', initial: 'A', color: 'from-blue-600 to-indigo-700' },
    { name: 'Taarak Mehta Ka Ooltah...', initial: 'T', color: 'from-emerald-600 to-teal-700' },
    { name: 'Bullet Journal', initial: 'B', color: 'from-purple-600 to-violet-700' },
    { name: 'Piyush Garg', initial: 'P', color: 'from-indigo-600 to-blue-700' },
    { name: 'Sharum Ki Sketches', initial: 'S', color: 'from-rose-600 to-pink-700' },
  ];

  const exploreLinks = [
    { label: 'Trending', icon: Flame },
    { label: 'Music', icon: Music },
    { label: 'Live', icon: Radio },
    { label: 'Gaming', icon: Gamepad2 },
  ];

  // Collapsed Sidebar View (Icon Only)
  if (!isSidebarOpen) {
    return (
      <aside className="w-20 bg-[#09090b] text-zinc-400 flex flex-col items-center py-6 sticky top-16 h-[calc(100vh-4rem)] border-r border-zinc-800/80 hidden md:flex shrink-0 shadow-2xl">
        <div className="space-y-3 flex flex-col items-center">
          {mainLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link 
                to={link.path} 
                key={link.path}
                title={link.label}
                className={`p-3 rounded-xl border transition-all duration-300 ${
                  active 
                    ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400 shadow-lg shadow-indigo-500/10' 
                    : 'border-transparent text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900/60 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-5 h-5" />
              </Link>
            );
          })}
        </div>
      </aside>
    );
  }

  // Expanded Sidebar View (Full YouTube Style)
  return (
    <aside className="w-64 bg-[#09090b] text-zinc-300 flex flex-col p-3 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-r border-zinc-800/80 hidden md:flex shrink-0 shadow-2xl scrollbar-thin scrollbar-thumb-zinc-800">
      
      {/* Main Section */}
      <div className="space-y-1 pb-4 border-b border-zinc-800/80">
        {mainLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.path);
          return (
            <Link 
              to={link.path} 
              key={link.path}
              className={`flex items-center gap-5 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-300 ${
                active 
                  ? 'border-indigo-500/40 bg-gradient-to-r from-indigo-600/15 to-violet-600/10 text-white shadow-lg shadow-indigo-500/10' 
                  : 'border-transparent text-zinc-300 hover:text-white hover:bg-zinc-900/60 hover:border-zinc-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-indigo-400' : 'text-zinc-400'}`} />
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* You Section */}
      <div className="py-4 border-b border-zinc-800/80 space-y-1">
        <Link to="/profile" className="flex items-center gap-2 px-3 pb-2 text-xs font-bold tracking-wider text-zinc-200 hover:text-indigo-400 transition">
          You <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
        </Link>
        {youLinks.map((item, idx) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link 
              to={item.path} 
              key={idx}
              className={`flex items-center gap-5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                active 
                  ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 hover:border-zinc-800/50'
              }`}
            >
              <Icon className="w-4 h-4 text-zinc-400" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Subscriptions Section */}
      <div className="py-4 border-b border-zinc-800/80 space-y-1">
        <p className="px-3 pb-2 text-xs font-bold tracking-wider text-zinc-200">Subscriptions</p>
        {subscriptionsList.map((sub, idx) => (
          <button 
            key={idx}
            className="w-full flex items-center gap-3.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 transition cursor-pointer"
          >
            <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${sub.color} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
              {sub.initial}
            </div>
            <span className="truncate">{sub.name}</span>
          </button>
        ))}
      </div>

      {/* Explore Section */}
      <div className="py-4 space-y-1">
        <p className="px-3 pb-2 text-xs font-bold tracking-wider text-zinc-200">Explore</p>
        {exploreLinks.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button 
              key={idx}
              className="w-full flex items-center gap-5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 transition cursor-pointer"
            >
              <Icon className="w-4 h-4 text-zinc-400" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

    </aside>
  );
}