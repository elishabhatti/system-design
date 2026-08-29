import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { 
  Home, 
  Clapperboard, 
  Tv, 
  User, 
  History, 
  PlaySquare, 
  Clock, 
  ThumbsUp, 
  Video, 
  Download, 
  Flame, 
  Music, 
  Gamepad2, 
  ChevronRight,
  Trophy,
  Lightbulb
} from 'lucide-react';

export default function Sidebar() {
  const { isSidebarOpen } = useSidebar();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const [subscriptions, setSubscriptions] = useState([]);

  // Fetch real subscriptions from API if available
  useEffect(() => {
    import("../services/api").then(({ fetchSubscriptions }) => {
      if (fetchSubscriptions) {
        fetchSubscriptions()
          .then((res) => {
            if (Array.isArray(res)) setSubscriptions(res);
            else if (res?.subscriptions) setSubscriptions(res.subscriptions);
          })
          .catch(() => {});
      }
    }).catch(() => {});
  }, []);

  const iconClass = "w-5 h-5 stroke-[1.5px]"; 

  const mainLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/shorts', label: 'Shorts', icon: Clapperboard },
    { path: '/subscriptions', label: 'Subscriptions', icon: Tv },
  ];

  const youLinks = [
    { path: '/profile', label: 'Your channel', icon: User },
    { path: '/history', label: 'History', icon: History },
    { path: '/playlists', label: 'Playlists', icon: PlaySquare },
    { path: '/my-videos', label: 'Your videos', icon: Video },
    { path: '/watch-later', label: 'Watch later', icon: Clock },
    { path: '/liked-videos', label: 'Liked videos', icon: ThumbsUp },
    { path: '/downloads', label: 'Downloads', icon: Download },
  ];

  const exploreLinks = [
    { label: 'Trending', icon: Flame },
    { label: 'Music', icon: Music },
    { label: 'Gaming', icon: Gamepad2 },
    { label: 'Sports', icon: Trophy },
    { label: 'Learning', icon: Lightbulb },
  ];

  // Collapsed Sidebar View (Mini Sidebar)
  if (!isSidebarOpen) {
    return (
      <aside className="w-18 bg-black text-zinc-100 flex-col items-center py-2 sticky top-14 h-[calc(100vh-3.5rem)] hidden md:flex shrink-0 z-10 border-r border-zinc-900">
        <div className="flex flex-col w-full gap-1">
          {mainLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link 
                to={link.path} 
                key={link.path}
                title={link.label}
                className={`flex flex-col items-center justify-center py-4 px-1 mx-2 rounded-xl transition-colors ${
                  active 
                    ? 'bg-zinc-900 text-white font-medium border border-zinc-800' 
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <Icon className={`${iconClass} mb-1.5 ${active ? 'fill-white stroke-white stroke-[1px]' : ''}`} />
                <span className="text-[10px] truncate w-full text-center tracking-tight leading-none">{link.label}</span>
              </Link>
            );
          })}
          
          <Link 
            to="/profile"
            title="You"
            className={`flex flex-col items-center justify-center py-4 px-1 mx-2 rounded-xl transition-colors ${
              isActive('/profile') 
                ? 'bg-zinc-900 text-white font-medium border border-zinc-800' 
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
            }`}
          >
            <User className={`${iconClass} mb-1.5 ${isActive('/profile') ? 'fill-white stroke-white stroke-[1px]' : ''}`} />
            <span className="text-[10px] truncate w-full text-center tracking-tight leading-none">You</span>
          </Link>
        </div>
      </aside>
    );
  }

  // Expanded Sidebar View (Full Orbit Style)
  return (
    <aside className="w-[240px] bg-black text-zinc-100 flex-col p-3 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto overflow-x-hidden hidden md:flex shrink-0 z-10 border-r border-zinc-900 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent pr-2 transition-all">
      
      {/* Main Section */}
      <div className="pb-3 border-b border-zinc-900">
        {mainLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.path);
          return (
            <Link 
              to={link.path} 
              key={link.path}
              className={`flex items-center gap-4 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                active 
                  ? 'bg-zinc-900 text-white border border-zinc-800' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <Icon className={`${iconClass} ${active ? 'fill-white stroke-white stroke-[1px]' : ''}`} />
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })}
      </div>

      {/* You Section */}
      <div className="py-3 border-b border-zinc-900">
        <Link 
          to="/profile" 
          className="flex items-center gap-2 px-3 py-2 mb-1 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:bg-zinc-900 rounded-xl transition-colors group"
        >
          You <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" />
        </Link>
        
        {youLinks.map((item, idx) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link 
              to={item.path} 
              key={idx}
              className={`flex items-center gap-4 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                active 
                  ? 'bg-zinc-900 text-white border border-zinc-800' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <Icon className={`${iconClass} ${active ? 'fill-white stroke-white stroke-[1px]' : ''}`} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Subscriptions Section */}
      <div className="py-3 border-b border-zinc-900">
        <p className="px-3 py-1 mb-1 text-xs font-bold uppercase tracking-wider text-zinc-300">Subscriptions</p>
        
        {subscriptions.length > 0 ? (
          subscriptions.map((sub, idx) => (
            <Link 
              to={`/channel/${sub.id || sub.channelName}`} 
              key={idx}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[11px] font-bold text-white shrink-0 overflow-hidden">
                {sub.avatarUrl ? (
                  <img src={sub.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  (sub.channelName || sub.name)?.[0]?.toUpperCase() || 'C'
                )}
              </div>
              <span className="truncate text-left w-full">{sub.channelName || sub.name}</span>
            </Link>
          ))
        ) : (
          <div className="px-3 py-2 text-xs text-zinc-600 font-medium italic">
            No subscriptions yet
          </div>
        )}
      </div>

      {/* Explore Section */}
      <div className="py-3 border-b border-zinc-900">
        <p className="px-3 py-1 mb-1 text-xs font-bold uppercase tracking-wider text-zinc-300">Explore</p>
        {exploreLinks.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button 
              key={idx}
              className="w-full flex items-center gap-4 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
            >
              <Icon className={iconClass} />
              <span className="truncate text-left">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer Links */}
      <div className="px-3 py-4 text-[11px] text-zinc-600 font-medium flex flex-col gap-2">
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <a href="#" className="hover:text-zinc-400">About</a>
          <a href="#" className="hover:text-zinc-400">Press</a>
          <a href="#" className="hover:text-zinc-400">Copyright</a>
          <a href="#" className="hover:text-zinc-400">Contact us</a>
          <a href="#" className="hover:text-zinc-400">Creators</a>
          <a href="#" className="hover:text-zinc-400">Developers</a>
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <a href="#" className="hover:text-zinc-400">Terms</a>
          <a href="#" className="hover:text-zinc-400">Privacy</a>
          <a href="#" className="hover:text-zinc-400">Policy & Safety</a>
        </div>
        <p className="text-[10px] text-zinc-700 font-mono mt-1">© 2026 Orbit Studio</p>
      </div>

    </aside>
  );
}