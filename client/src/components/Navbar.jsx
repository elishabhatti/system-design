import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import {
  Video,
  Plus,
  User,
  LogOut,
  Search,
  Bell,
  Menu,
  X,
  Orbit as OrbitIcon,
  Heart,
  UserPlus,
} from "lucide-react";
import { io } from "socket.io-client";
import { fetchNotificationsApi, markNotificationsReadApi } from "../services/api";

const shortTimeAgo = (dateString) => {
  if (!dateString) return "";
  const s = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

const getNotificationIcon = (type) => {
  switch (type) {
    case "LIKE":
      return <Heart className="h-2.5 w-2.5 fill-red-500 text-red-500" />;
    case "SUBSCRIBE":
      return <UserPlus className="h-2.5 w-2.5 text-blue-400" />;
    case "UPLOAD":
      return <Video className="h-2.5 w-2.5 text-emerald-400" />;
    default:
      return <Bell className="h-2.5 w-2.5 text-zinc-400" />;
  }
};

// Menus open in response to a click, so a small pop is feedback, not decoration.
const styles = `
@keyframes pop-in {
  from { opacity: 0; transform: translateY(-4px) scale(.97); }
  to   { opacity: 1; transform: none; }
}
.pop-in { animation: pop-in 160ms cubic-bezier(.2,.7,.2,1) both; transform-origin: top right; }
@media (prefers-reduced-motion: reduce) { .pop-in { animation: none; } }
`;

const iconBtn =
  "flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-zinc-400 outline-none transition hover:bg-zinc-900 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 active:scale-95";

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearch, setMobileSearch] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notificationRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const wasOpen = useRef(false);

  const userId = user?.id || user?._id;

  // Outside click + Escape close menus
  useEffect(() => {
    const onDown = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    const onEsc = (e) => {
      if (e.key === "Escape") {
        setShowNotifications(false);
        setShowDropdown(false);
        setMobileSearch(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  // Ctrl/Cmd+K or "/" focuses search
  useEffect(() => {
    const onKey = (e) => {
      const el = document.activeElement;
      const typing =
        ["INPUT", "TEXTAREA", "SELECT"].includes(el?.tagName) || el?.isContentEditable;
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        if (window.innerWidth < 768) setMobileSearch(true);
        else searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Initial notifications + realtime socket (keyed on id, not the user object,
  // so a profile refresh doesn't tear down and reopen the socket)
  useEffect(() => {
    if (!userId) return;

    fetchNotificationsApi()
      .then((data) => {
        if (Array.isArray(data)) {
          setNotifications(data);
          setUnreadCount(data.filter((n) => !n.read).length);
        }
      })
      .catch((err) => console.error("Failed to load notifications", err));

    const socket = io({ transports: ["websocket", "polling"], withCredentials: true });
    socket.emit("joinRoom", userId);
    socket.on("newNotification", (notif) => {
      setNotifications((prev) =>
        prev.some((n) => n.id === notif.id) ? prev : [notif, ...prev],
      );
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.off("newNotification");
      socket.disconnect();
    };
  }, [userId]);

  const markAsRead = async () => {
    try {
      await markNotificationsReadApi();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark notifications as read", err);
    }
  };

  // Mark as read when the panel CLOSES, so you can still see what was new
  // while it's open (marking on open wipes the unread dots before you read them).
  useEffect(() => {
    if (showNotifications) {
      wasOpen.current = true;
    } else if (wasOpen.current) {
      wasOpen.current = false;
      if (unreadCount > 0) markAsRead();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNotifications]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setMobileSearch(false);
    document.activeElement?.blur();
  };

  const searchField = (inputRef, autoFocus = false) => (
    <form onSubmit={handleSearch} className="relative flex w-full items-center">
      <Search className="pointer-events-none absolute left-4 h-4 w-4 text-zinc-500" />
      <input
        ref={inputRef}
        autoFocus={autoFocus}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search"
        className="w-full rounded-full bg-zinc-900 py-2 pl-11 pr-11 text-[14px] text-zinc-100 outline-none ring-1 ring-inset ring-transparent transition placeholder:text-zinc-500 hover:bg-zinc-900/80 focus:bg-zinc-950 focus:ring-white/25"
      />
      {searchQuery ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setSearchQuery("")}
          className="absolute right-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : (
        <kbd className="pointer-events-none absolute right-3.5 hidden rounded-md bg-zinc-800 px-1.5 py-0.5 font-sans text-[11px] text-zinc-500 md:block">
          /
        </kbd>
      )}
    </form>
  );

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-white/5 bg-[#09090b]/85 backdrop-blur-xl">
      <style>{styles}</style>

      {/* Mobile search takes over the bar */}
      {mobileSearch && (
        <div className="absolute inset-0 z-10 flex items-center gap-2 bg-[#09090b] px-3 md:hidden">
          {searchField(null, true)}
          <button
            type="button"
            aria-label="Close search"
            onClick={() => setMobileSearch(false)}
            className={iconBtn}
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>
      )}

      <div className="mx-auto grid h-full max-w-[1800px] grid-cols-[1fr_auto] items-center gap-4 px-3 md:grid-cols-[1fr_minmax(0,36rem)_1fr] md:px-4">
        {/* Left: menu + brand */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Toggle sidebar"
            onClick={toggleSidebar}
            className={`${iconBtn} hidden md:flex`}
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2.5 rounded-lg px-1.5 py-1 outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white text-black">
              <OrbitIcon className="h-[18px] w-[18px]" />
            </span>
            <span className="text-[16px] font-semibold tracking-[-0.02em] text-white">
              Orbit
            </span>
          </Link>
        </div>

        {/* Center: search (truly centered) */}
        <div className="hidden md:block">{searchField(searchInputRef)}</div>

        {/* Right */}
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            aria-label="Search"
            onClick={() => setMobileSearch(true)}
            className={`${iconBtn} md:hidden`}
          >
            <Search className="h-[18px] w-[18px]" />
          </button>

          {user ? (
            <>
              <Link
                to="/create"
                className="mr-1 hidden h-9 items-center gap-1.5 rounded-full bg-white pl-3 pr-4 text-[13px] font-semibold text-black outline-none transition hover:bg-zinc-200 focus-visible:ring-2 focus-visible:ring-white/70 active:scale-95 sm:flex"
              >
                <Plus className="h-4 w-4" strokeWidth={2.4} />
                Upload
              </Link>

              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <button
                  aria-label="Notifications"
                  aria-expanded={showNotifications}
                  onClick={() => {
                    setShowNotifications((v) => !v);
                    setShowDropdown(false);
                  }}
                  className={`${iconBtn} relative ${showNotifications ? "bg-zinc-900 text-white" : ""}`}
                >
                  <Bell className="h-[18px] w-[18px]" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[9px] font-bold leading-none text-black ring-2 ring-[#09090b]">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="pop-in absolute right-0 top-12 z-50 w-[calc(100vw-1.5rem)] max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/60">
                    <div className="flex items-center justify-between px-4 py-3">
                      <p className="text-[14px] font-semibold text-white">Notifications</p>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAsRead}
                          className="cursor-pointer text-[12px] text-zinc-500 transition hover:text-white"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-[22rem] overflow-y-auto pb-1.5 scrollbar-none">
                      {notifications.length === 0 ? (
                        <p className="px-4 py-12 text-center text-[13px] text-zinc-500">
                          You're all caught up.
                        </p>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className="mx-1.5 flex items-start gap-3 rounded-xl px-2.5 py-2.5 transition hover:bg-zinc-900"
                          >
                            <div className="relative shrink-0">
                              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300">
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
                              <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-950 ring-2 ring-zinc-950">
                                {getNotificationIcon(notif.type)}
                              </span>
                            </div>

                            <div className="min-w-0 flex-1 text-[13px]">
                              <p className="leading-snug text-zinc-400">
                                <span className="font-medium text-zinc-100">
                                  {notif.sender?.channelName || "Someone"}
                                </span>{" "}
                                {notif.message}
                              </p>
                              <span className="mt-0.5 block text-[12px] text-zinc-600">
                                {shortTimeAgo(notif.createdAt)}
                              </span>
                            </div>

                            {!notif.read && (
                              <span
                                aria-label="Unread"
                                className="mt-2 h-2 w-2 shrink-0 rounded-full bg-white"
                              />
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
                  aria-expanded={showDropdown}
                  onClick={() => {
                    setShowDropdown((v) => !v);
                    setShowNotifications(false);
                  }}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-xs font-semibold text-white outline-none ring-offset-2 ring-offset-[#09090b] transition hover:ring-2 hover:ring-zinc-600 focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span>{user.channelName ? user.channelName[0].toUpperCase() : "U"}</span>
                  )}
                </button>

                {showDropdown && (
                  <div className="pop-in absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 p-1.5 shadow-2xl shadow-black/60">
                    <div className="px-3 pb-3 pt-2">
                      <p className="truncate text-[14px] font-semibold text-white">
                        {user.channelName}
                      </p>
                      <p className="truncate text-[12px] text-zinc-500">{user.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                    >
                      <User className="h-4 w-4 text-zinc-500" /> Channel Studio
                    </Link>

                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        logoutUser();
                      }}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                    >
                      <LogOut className="h-4 w-4 text-zinc-500" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1">
              <Link
                to="/login"
                className="rounded-full px-3.5 py-1.5 text-[13px] font-medium text-zinc-300 transition hover:text-white"
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