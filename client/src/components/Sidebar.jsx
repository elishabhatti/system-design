import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { Home, User, PlusSquare, Compass, History, Bookmark, Settings, Layers } from 'lucide-react';

export default function Sidebar() {
  const { isSidebarOpen } = useSidebar();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const mainLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/profile', label: 'Channel Studio', icon: User },
    { path: '/create', label: 'Upload Video', icon: PlusSquare },
  ];

  const secondaryLinks = [
    { label: 'Explore', icon: Compass },
    { label: 'History', icon: History },
    { label: 'Saved Library', icon: Bookmark },
  ];

  if (!isSidebarOpen) {
    return (
      <aside className="w-20 bg-[#09090b] text-zinc-400 flex flex-col items-center py-5 sticky top-16 h-[calc(100vh-4rem)] border-r border-zinc-800/80 hidden md:flex shrink-0 shadow-2xl">
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

  return (
    <aside className="w-64 bg-[#09090b] text-zinc-300 flex flex-col p-4 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-r border-zinc-800/80 hidden md:flex shrink-0 shadow-2xl">
      {/* Main Navigation */}
      <div className="space-y-1.5">
        <p className="px-3 pb-2 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Menu</p>
        {mainLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.path);
          return (
            <Link 
              to={link.path} 
              key={link.path}
              className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-300 ${
                active 
                  ? 'border-indigo-500/40 bg-gradient-to-r from-indigo-600/15 to-violet-600/10 text-white shadow-lg shadow-indigo-500/10' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60 hover:border-zinc-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-indigo-400' : 'text-zinc-400'}`} />
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Secondary Library Links */}
      <div className="mt-8 pt-6 border-t border-zinc-800/80 space-y-1.5">
        <p className="px-3 pb-2 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Discover</p>
        {secondaryLinks.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button 
              key={idx}
              className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-medium border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 hover:border-zinc-800/50 transition"
            >
              <Icon className="w-4 h-4 text-zinc-500" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Creator Badge Box at bottom */}
      <div className="mt-auto pt-4 border-t border-zinc-800/60">
        <div className="p-3 rounded-xl bg-gradient-to-br from-zinc-900 to-[#121217] border border-zinc-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs">
            EJ
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-zinc-200 truncate">Elisha Jameel</p>
            <p className="text-[10px] text-zinc-500 truncate">Pro Creator Workspace</p>
          </div>
        </div>
      </div>
    </aside>
  );
}