import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
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
  Trophy,
  Lightbulb,
} from "lucide-react";

const MAIN_LINKS = [
  { path: "/", label: "Home", icon: Home },
  { path: "/shorts", label: "Shorts", icon: Clapperboard },
  { path: "/subscriptions", label: "Subscriptions", icon: Tv },
];

const YOU_LINKS = [
  { path: "/profile", label: "Your channel", icon: User },
  { path: "/history", label: "History", icon: History },
  { path: "/playlists", label: "Playlists", icon: PlaySquare },
  { path: "/my-videos", label: "Your videos", icon: Video },
  { path: "/watch-later", label: "Watch later", icon: Clock },
  { path: "/liked-videos", label: "Liked videos", icon: ThumbsUp },
  { path: "/downloads", label: "Downloads", icon: Download },
];

const EXPLORE_LINKS = [
  { label: "Trending", icon: Flame },
  { label: "Music", icon: Music },
  { label: "Gaming", icon: Gamepad2 },
  { label: "Sports", icon: Trophy },
  { label: "Learning", icon: Lightbulb },
];

function SectionLabel({ children }) {
  return (
    <p className="px-3 pb-1.5 pt-1 text-[11px] font-medium uppercase tracking-wider text-zinc-600">
      {children}
    </p>
  );
}

function NavItem({ to, label, icon: Icon, active }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3.5 rounded-lg px-3 py-2 text-[13px] font-medium transition ${
        active
          ? "bg-zinc-900 text-white"
          : "text-zinc-400 hover:bg-zinc-900/60 hover:text-white"
      }`}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2 : 1.6} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const { isSidebarOpen } = useSidebar();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const [subscriptions, setSubscriptions] = useState([]);

  // Fetch real subscriptions from API if available
  useEffect(() => {
    import("../services/api")
      .then(({ fetchSubscriptions }) => {
        if (fetchSubscriptions) {
          fetchSubscriptions()
            .then((res) => {
              if (Array.isArray(res)) setSubscriptions(res);
              else if (res?.subscriptions) setSubscriptions(res.subscriptions);
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  // ---------- Collapsed (mini) ----------
  if (!isSidebarOpen) {
    const miniLinks = [...MAIN_LINKS, { path: "/profile", label: "You", icon: User }];

    return (
      <aside className="sticky top-14 z-10 hidden h-[calc(100vh-3.5rem)] w-[72px] shrink-0 flex-col items-center gap-1 border-r border-zinc-900 bg-[#09090b] px-1.5 py-2 md:flex">
        {miniLinks.map(({ path, label, icon: Icon }) => {
          const active = isActive(path);
          return (
            <Link
              key={label}
              to={path}
              title={label}
              className={`flex w-full flex-col items-center gap-1.5 rounded-lg py-3 transition ${
                active
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-400 hover:bg-zinc-900/60 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.6} />
              <span className="w-full truncate text-center text-[10px] leading-none">
                {label}
              </span>
            </Link>
          );
        })}
      </aside>
    );
  }

  // ---------- Expanded ----------
  return (
    <aside className="sticky top-14 z-10 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 flex-col overflow-y-auto overflow-x-hidden border-r border-zinc-900 bg-[#09090b] px-2 py-3 md:flex">
      {/* Main */}
      <nav className="space-y-0.5 pb-3">
        {MAIN_LINKS.map((l) => (
          <NavItem key={l.path} to={l.path} label={l.label} icon={l.icon} active={isActive(l.path)} />
        ))}
      </nav>

      {/* You */}
      <nav className="space-y-0.5 border-t border-zinc-900 py-3">
        <SectionLabel>You</SectionLabel>
        {YOU_LINKS.map((l) => (
          <NavItem key={l.path} to={l.path} label={l.label} icon={l.icon} active={isActive(l.path)} />
        ))}
      </nav>

      {/* Subscriptions */}
      <div className="space-y-0.5 border-t border-zinc-900 py-3">
        <SectionLabel>Subscriptions</SectionLabel>

        {subscriptions.length > 0 ? (
          subscriptions.map((sub, idx) => {
            const name = sub.channelName || sub.name;
            const to = `/channel/${sub.id || sub.channelName}`;
            return (
              <Link
                key={sub.id || idx}
                to={to}
                className={`flex items-center gap-3 rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
                  isActive(to)
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-400 hover:bg-zinc-900/60 hover:text-white"
                }`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-[11px] font-semibold text-zinc-200">
                  {sub.avatarUrl ? (
                    <img src={sub.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    name?.[0]?.toUpperCase() || "C"
                  )}
                </span>
                <span className="truncate">{name}</span>
              </Link>
            );
          })
        ) : (
          <p className="px-3 py-1.5 text-xs text-zinc-600">No subscriptions yet</p>
        )}
      </div>

      {/* Explore */}
      <div className="space-y-0.5 border-t border-zinc-900 py-3">
        <SectionLabel>Explore</SectionLabel>
        {EXPLORE_LINKS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            className="flex w-full cursor-pointer items-center gap-3.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-zinc-400 transition hover:bg-zinc-900/60 hover:text-white"
          >
            <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.6} />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto space-y-2 border-t border-zinc-900 px-3 pt-4 text-[11px] text-zinc-600">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <a href="#" className="transition hover:text-zinc-400">About</a>
          <a href="#" className="transition hover:text-zinc-400">Contact</a>
          <a href="#" className="transition hover:text-zinc-400">Terms</a>
          <a href="#" className="transition hover:text-zinc-400">Privacy</a>
          <a href="#" className="transition hover:text-zinc-400">Policy &amp; Safety</a>
        </div>
        <p className="text-zinc-700">© 2026 Orbit</p>
      </div>
    </aside>
  );
}