import React from 'react';
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
  Radio, 
  Gamepad2, 
  ChevronRight,
  Trophy,
  Lightbulb
} from 'lucide-react';

export default function Sidebar() {
  const { isSidebarOpen } = useSidebar();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  // Icons configured to match YouTube's sizing and stroke weight
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

  const subscriptionsList = [
    { name: 'MANGA MIND', initial: 'M', color: 'from-amber-600 to-orange-700' },
    { name: 'ARY Digital HD', initial: 'A', color: 'from-blue-600 to-indigo-700' },
    { name: 'Taarak Mehta Ka...', initial: 'T', color: 'from-emerald-600 to-teal-700' },
    { name: 'Bullet Journal', initial: 'B', color: 'from-purple-600 to-violet-700' },
    { name: 'Piyush Garg', initial: 'P', color: 'from-indigo-600 to-blue-700' },
    { name: 'Sharum Ki Sketches', initial: 'S', color: 'from-rose-600 to-pink-700' },
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
      <aside className="w-[72px] bg-[#0f0f0f] text-zinc-100 flex-col items-center py-2 sticky top-14 h-[calc(100vh-3.5rem)] hidden md:flex shrink-0 z-10">
        <div className="flex flex-col w-full gap-1">
          {mainLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link 
                to={link.path} 
                key={link.path}
                title={link.label}
                className={`flex flex-col items-center justify-center py-4 px-1 mx-1 rounded-xl transition-colors ${
                  active 
                    ? 'bg-[#27272a]/60 text-white font-medium' 
                    : 'text-zinc-200 hover:bg-[#27272a] hover:text-white'
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
            className={`flex flex-col items-center justify-center py-4 px-1 mx-1 rounded-xl transition-colors ${
              isActive('/profile') 
                ? 'bg-[#27272a]/60 text-white font-medium' 
                : 'text-zinc-200 hover:bg-[#27272a] hover:text-white'
            }`}
          >
            <User className={`${iconClass} mb-1.5 ${isActive('/profile') ? 'fill-white stroke-white stroke-[1px]' : ''}`} />
            <span className="text-[10px] truncate w-full text-center tracking-tight leading-none">You</span>
          </Link>
        </div>
      </aside>
    );
  }

  // Expanded Sidebar View (Full YouTube Style)
  return (
    <aside className="w-[240px] bg-[#0f0f0f] text-zinc-100 flex-col p-3 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto overflow-x-hidden hidden md:flex shrink-0 z-10 hover:scrollbar-thumb-[#717171] scrollbar-thin scrollbar-thumb-transparent scrollbar-track-transparent pr-2 transition-all">
      
      {/* Main Section */}
      <div className="pb-3 border-b border-zinc-800/80">
        {mainLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.path);
          return (
            <Link 
              to={link.path} 
              key={link.path}
              className={`flex items-center gap-5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active 
                  ? 'bg-[#27272a] text-white' 
                  : 'text-zinc-100 hover:bg-[#27272a]'
              }`}
            >
              <Icon className={`${iconClass} ${active ? 'fill-white stroke-white stroke-[1px]' : ''}`} />
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })}
      </div>

      {/* You Section */}
      <div className="py-3 border-b border-zinc-800/80">
        <Link 
          to="/profile" 
          className="flex items-center gap-2 px-3 py-2 mb-1 text-base font-bold text-white hover:bg-[#27272a] rounded-lg transition-colors group"
        >
          You <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
        </Link>
        
        {youLinks.map((item, idx) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link 
              to={item.path} 
              key={idx}
              className={`flex items-center gap-5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active 
                  ? 'bg-[#27272a] text-white' 
                  : 'text-zinc-100 hover:bg-[#27272a]'
              }`}
            >
              <Icon className={`${iconClass} ${active ? 'fill-white stroke-white stroke-[1px]' : ''}`} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Subscriptions Section */}
      <div className="py-3 border-b border-zinc-800/80">
        <p className="px-3 py-1 mb-1 text-base font-bold text-white">Subscriptions</p>
        {subscriptionsList.map((sub, idx) => (
          <button 
            key={idx}
            className="w-full flex items-center gap-4 px-3 py-2 rounded-lg text-sm font-medium text-zinc-100 hover:bg-[#27272a] transition-colors cursor-pointer"
          >
            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${sub.color} flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-sm`}>
              {sub.initial}
            </div>
            <span className="truncate text-left w-full">{sub.name}</span>
            
            {/* Fake unread indicator for realism */}
            {idx % 3 === 0 && (
               <span className="w-1 h-1 rounded-full bg-blue-500 shrink-0"></span>
            )}
          </button>
        ))}
        <button className="w-full flex items-center gap-5 px-3 py-2 mt-1 rounded-lg text-sm font-medium text-zinc-100 hover:bg-[#27272a] transition-colors">
          <div className="w-6 flex justify-center">
             <ChevronRight className="w-5 h-5 stroke-[1.5px] rotate-90" />
          </div>
          <span className="truncate">Show more</span>
        </button>
      </div>

      {/* Explore Section */}
      <div className="py-3 border-b border-zinc-800/80">
        <p className="px-3 py-1 mb-1 text-base font-bold text-white">Explore</p>
        {exploreLinks.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button 
              key={idx}
              className="w-full flex items-center gap-5 px-3 py-2 rounded-lg text-sm font-medium text-zinc-100 hover:bg-[#27272a] transition-colors cursor-pointer"
            >
              <Icon className={iconClass} />
              <span className="truncate text-left">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer Links */}
      <div className="px-4 py-4 text-[13px] text-[#AAAAAA] font-semibold flex flex-col gap-3">
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <a href="#" className="hover:text-zinc-300">About</a>
          <a href="#" className="hover:text-zinc-300">Press</a>
          <a href="#" className="hover:text-zinc-300">Copyright</a>
          <a href="#" className="hover:text-zinc-300">Contact us</a>
          <a href="#" className="hover:text-zinc-300">Creators</a>
          <a href="#" className="hover:text-zinc-300">Advertise</a>
          <a href="#" className="hover:text-zinc-300">Developers</a>
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <a href="#" className="hover:text-zinc-300">Terms</a>
          <a href="#" className="hover:text-zinc-300">Privacy</a>
          <a href="#" className="hover:text-zinc-300">Policy & Safety</a>
          <a href="#" className="hover:text-zinc-300">How YouTube works</a>
          <a href="#" className="hover:text-zinc-300">Test new features</a>
        </div>
        <p className="text-xs text-[#717171] font-normal mt-2">© 2026 Google LLC</p>
      </div>

    </aside>
  );
}