import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Video,
  PlusSquare,
  User,
  LogOut,
  Compass,
  Flame,
  Radio,
  Search,
  Bell,
  Orbit as OrbitIcon,
  Heart,
  UserPlus,
} from "lucide-react";
import { io } from "socket.io-client";
import { fetchNotificationsApi, markNotificationsReadApi } from "../services/api";

const NAV_LINKS = [
  { name: "Feed", path: "/", icon: Flame },
  { name: "Explore", path: "/explore", icon: Compass },
  { name: "Live", path: "/live", icon: Radio },
];

const shortTimeAgo = (dateString) => {
  if (!dateString) return "";
  const s = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const getNotificationIcon = (type) => {
  switch (type) {
    case "LIKE":
      return <Heart className="h-3 w-3 fill-red-500 text-red-500" />;
    case "SUBSCRIBE":
      return <UserPlus className="h-3 w-3 text-blue-400" />;
    case "UPLOAD":
      return <Video className="h-3 w-3 text-emerald-400" />;
    default:
      return <Bell className="h-3 w-3 text-zinc-400" />;
  }
};

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notificationRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Ctrl/Cmd+K or "/" focuses search
  useEffect(() => {
    const onKey = (e) => {
      const typing = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Initial notifications + realtime socket
  useEffect(() => {
    if (!user) return;

    const currentUserId = user.id || user._id;

    fetchNotificationsApi()
      .then((data) => {
        if (Array.isArray(data)) {
          setNotifications(data);
          setUnreadCount(data.filter((n) => !n.read).length);
        }
      })
      .catch((err) => console.error("Failed to load notifications", err));

    const socket = io({
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.emit("joinRoom", currentUserId);
    socket.on("newNotification", (notif) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === notif.id)) return prev;
        return [notif, ...prev];
      });
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.off("newNotification");
      socket.disconnect();
    };
  }, [user]);

  const markAsRead = async () => {
    try {
      await markNotificationsReadApi();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark notifications as read", err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-zinc-900 bg-[#09090b]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1800px] items-center justify-between gap-4 px-4">
        {/* Brand */}
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black">
            <OrbitIcon className="h-4.5 w-4.5" />
          </span>
          <span className="text-[15px] font-bold tracking-tight text-white">Orbit</span>
        </Link>

        {/* Search */}
        <form
          onSubmit={handleSearch}
          className="relative hidden max-w-xl flex-1 items-center md:flex"
        >
          <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-zinc-500" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search videos, creators, tags"
            className="w-full rounded-full border border-zinc-800 bg-zinc-950 py-2 pl-10 pr-14 text-[13px] text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-zinc-500"
          />
          <kbd className="pointer-events-none absolute right-3 rounded border border-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
            Ctrl K
          </kbd>
        </form>

        {/* Section links */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map(({ name, path, icon: Icon }) => {
            const active = isActive(path);
            return (
              <Link
                key={name}
                to={path}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
                  active ? "bg-zinc-900 text-white" : "text-zinc-400 hover:bg-zinc-900/60 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {name}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex shrink-0 items-center gap-2">
          {user ? (
            <>
              <Link
                to="/create"
                className="hidden items-center gap-2 rounded-full bg-white px-4 py-1.5 text-[13px] font-semibold text-black transition hover:bg-zinc-200 active:scale-95 sm:flex"
              >
                <PlusSquare className="h-4 w-4" />
                Upload
              </Link>

              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <button
                  aria-label="Notifications"
                  onClick={() => {
                    const next = !showNotifications;
                    setShowNotifications(next);
                    setShowDropdown(false);
                    if (next && unreadCount > 0) markAsRead();
                  }}
                  className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                >
                  <Bell className="h-[18px] w-[18px]" />
                  {unreadCount > 0 && (
                    <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[9px] font-bold text-black">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl sm:w-96">
                    <div className="flex items-center justify-between border-b border-zinc-900 px-4 py-3">
                      <p className="text-[13px] font-semibold text-white">Notifications</p>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAsRead}
                          className="cursor-pointer text-[11px] text-zinc-400 transition hover:text-white"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="py-10 text-center text-xs text-zinc-600">
                          No notifications yet
                        </p>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`flex items-start gap-3 px-4 py-3 transition hover:bg-zinc-900/50 ${
                              !notif.read ? "bg-zinc-900/30" : ""
                            }`}
                          >
                            <div className="relative shrink-0">
                              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-xs font-semibold text-zinc-200">
                                {notif.sender?.avatarUrl ? (
                                  <img
                                    src={notif.sender.avatarUrl}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  (notif.sender?.channelName || "U")[0].toUpperCase()
                                )}
                              </div>
                              <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950">
                                {getNotificationIcon(notif.type)}
                              </span>
                            </div>

                            <div className="min-w-0 flex-1 text-[13px]">
                              <p className="leading-snug text-zinc-400">
                                <span className="font-semibold text-white">
                                  {notif.sender?.channelName || "Someone"}
                                </span>{" "}
                                {notif.message}
                              </p>
                              <span className="mt-0.5 block text-[11px] text-zinc-600">
                                {shortTimeAgo(notif.createdAt)}
                              </span>
                            </div>

                            {!notif.read && (
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Avatar menu */}
              <div className="relative" ref={dropdownRef}>
                <button
                  aria-label="Account menu"
                  onClick={() => {
                    setShowDropdown(!showDropdown);
                    setShowNotifications(false);
                  }}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-xs font-semibold text-white ring-offset-2 ring-offset-[#09090b] transition hover:ring-2 hover:ring-zinc-600"
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span>{user.channelName ? user.channelName[0].toUpperCase() : "U"}</span>
                  )}
                </button>

                {showDropdown && (
                  <div className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 py-1.5 shadow-2xl">
                    <div className="border-b border-zinc-900 px-4 pb-3 pt-2">
                      <p className="truncate text-[13px] font-semibold text-white">
                        {user.channelName}
                      </p>
                      <p className="truncate text-[11px] text-zinc-500">{user.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                    >
                      <User className="h-4 w-4 text-zinc-500" /> Channel Studio
                    </Link>

                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        logoutUser();
                      }}
                      className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-[13px] text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                    >
                      <LogOut className="h-4 w-4 text-zinc-500" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-1.5 text-[13px] font-medium text-zinc-300 transition hover:text-white"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-white px-4 py-1.5 text-[13px] font-semibold text-black transition hover:bg-zinc-200 active:scale-95"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}