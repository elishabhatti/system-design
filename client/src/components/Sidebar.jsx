import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import {
  Home,
  Clapperboard,
  Tv,
  User,
  History,
  Clock,
  ThumbsUp,
  Video,
  ChevronDown,
} from "lucide-react";

const MAIN_LINKS = [
  { path: "/", label: "Home", icon: Home },
  { path: "/shorts", label: "Shorts", icon: Clapperboard },
  { path: "/subscriptions", label: "Subscriptions", icon: Tv },
];

const YOU_LINKS = [
  { path: "/profile", label: "Your channel", icon: User },
  { path: "/my-videos", label: "Your videos", icon: Video },
  { path: "/history", label: "History", icon: History },
  { path: "/watch-later", label: "Watch later", icon: Clock },
  { path: "/liked-videos", label: "Liked videos", icon: ThumbsUp },
];

const SUB_LIMIT = 6;

// Icon sits at the same x-position open or closed, so only the label animates.
const itemBase =
  "group relative flex h-10 items-center gap-4 rounded-xl px-[13px] text-[14px] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-white/70";
const itemState = (active) =>
  active
    ? "bg-zinc-900 text-white"
    : "text-zinc-500 hover:bg-zinc-900/70 hover:text-zinc-100";

function Label({ open, children }) {
  return (
    <span
      className={`truncate whitespace-nowrap transition-opacity duration-200 ${
        open ? "opacity-100 delay-100" : "pointer-events-none opacity-0"
      }`}
    >
      {children}
    </span>
  );
}

function NavItem({ to, label, icon: Icon, active, open }) {
  return (
    <Link
      to={to}
      title={open ? undefined : label}
      aria-current={active ? "page" : undefined}
      className={`${itemBase} ${itemState(active)}`}
    >
      <Icon
        className="h-[18px] w-[18px] shrink-0"
        strokeWidth={active ? 2.1 : 1.6}
      />
      <Label open={open}>{label}</Label>
    </Link>
  );
}

function SectionLabel({ open, children }) {
  return (
    <p
      className={`px-[13px] pb-1 text-[12px] font-medium text-zinc-600 transition-opacity duration-200 ${
        open ? "opacity-100 delay-100" : "opacity-0"
      }`}
    >
      {children}
    </p>
  );
}

export default function Sidebar() {
  const { isSidebarOpen: open } = useSidebar();
  const { pathname } = useLocation();
  const isActive = (path) => pathname === path;

  const [subscriptions, setSubscriptions] = useState([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    import("../services/api")
      .then(({ fetchSubscriptions }) => {
        if (!fetchSubscriptions) return;
        fetchSubscriptions()
          .then((res) => {
            if (Array.isArray(res)) setSubscriptions(res);
            else if (res?.subscriptions) setSubscriptions(res.subscriptions);
          })
          .catch(() => {});
      })
      .catch(() => {});
  }, []);

  const shownSubs = showAll ? subscriptions : subscriptions.slice(0, SUB_LIMIT);

  return (
    <aside
      className={`sticky top-14 z-10 hidden h-[calc(100vh-3.5rem)] shrink-0 flex-col gap-7 overflow-y-auto overflow-x-hidden bg-[#09090b] px-3 py-3 transition-[width] duration-300 ease-[cubic-bezier(.2,.7,.2,1)] scrollbar-none md:flex ${
        open ? "w-60" : "w-[68px]"
      }`}
    >
      <nav className="space-y-0.5">
        {MAIN_LINKS.map((l) => (
          <NavItem key={l.path} {...l} to={l.path} active={isActive(l.path)} open={open} />
        ))}
      </nav>

      <nav className="space-y-0.5">
        <SectionLabel open={open}>You</SectionLabel>
        {YOU_LINKS.map((l) => (
          <NavItem key={l.path} {...l} to={l.path} active={isActive(l.path)} open={open} />
        ))}
      </nav>

      {/* Subscriptions only when there is something to show, and only when open */}
      {open && subscriptions.length > 0 && (
        <div className="space-y-0.5">
          <SectionLabel open={open}>Subscriptions</SectionLabel>
          {shownSubs.map((sub, idx) => {
            const name = sub.channelName || sub.name;
            const to = `/channel/${sub.id || sub.channelName}`;
            const active = isActive(to);
            return (
              <Link
                key={sub.id || idx}
                to={to}
                className={`${itemBase} h-9 gap-3 ${itemState(active)}`}
              >
                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-[10px] font-semibold text-zinc-300">
                  {sub.avatarUrl ? (
                    <img
                      src={sub.avatarUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    name?.[0]?.toUpperCase() || "C"
                  )}
                </span>
                <span className="truncate">{name}</span>
              </Link>
            );
          })}

          {subscriptions.length > SUB_LIMIT && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className={`${itemBase} h-9 w-full cursor-pointer gap-3 text-zinc-600 hover:bg-zinc-900/70 hover:text-zinc-300`}
            >
              <ChevronDown
                className={`h-4 w-4 shrink-0 transition-transform duration-300 ${
                  showAll ? "rotate-180" : ""
                }`}
              />
              <span>{showAll ? "Show less" : "Show more"}</span>
            </button>
          )}
        </div>
      )}

      {open && (
        <p className="mt-auto px-[13px] pb-1 text-[12px] text-zinc-700">
          © 2026 Orbit
        </p>
      )}
    </aside>
  );
}