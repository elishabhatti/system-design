import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchVideos, deleteVideo, updateUserProfile } from "../services/api";
import {
  Video,
  MoreVertical,
  Trash2,
  Pencil,
  X,
  Loader2,
  Camera,
  Plus,
  Lock,
  Globe,
  Clock,
  AlertCircle,
  Search,
  LayoutGrid,
  List,
  Eye,
  TrendingUp,
  BarChart3,
  Film,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Helpers + motion                                                           */
/* -------------------------------------------------------------------------- */

const compactNumber = new Intl.NumberFormat("en", { notation: "compact" });

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

const thumbUrl = (url) =>
  url
    ?.replace("/upload/", "/upload/so_25p,w_480,ar_16:9,c_fill,q_auto,f_auto/")
    .replace(/\.[^/.]+$/, ".jpg");

// Every animation here answers a user action (switch, open, close, delete)
// except the one-time settle of the content when a tab or filter changes.
const styles = `
@keyframes feed-in   { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes tab-in    { from { opacity: 0; transform: translateY(6px); }  to { opacity: 1; transform: none; } }
@keyframes pop-in    { from { opacity: 0; transform: translateY(-4px) scale(.97); } to { opacity: 1; transform: none; } }
@keyframes modal-in  { from { opacity: 0; transform: translateY(8px) scale(.97); } to { opacity: 1; transform: none; } }
@keyframes modal-out { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateY(8px) scale(.97); } }
@keyframes fade-in   { from { opacity: 0; } to { opacity: 1; } }
@keyframes fade-out  { from { opacity: 1; } to { opacity: 0; } }
@keyframes toast-in  { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
@keyframes shimmer   { from { transform: translateX(-100%); } to { transform: translateX(100%); } }

.feed-item  { animation: feed-in 420ms cubic-bezier(.2,.7,.2,1) backwards; }
.tab-in     { animation: tab-in 260ms cubic-bezier(.2,.7,.2,1) backwards; }
.pop-in     { animation: pop-in 160ms cubic-bezier(.2,.7,.2,1) backwards; transform-origin: top right; }
.modal-in   { animation: modal-in 220ms cubic-bezier(.2,.7,.2,1) backwards; }
.modal-out  { animation: modal-out 160ms ease-in forwards; }
.fade-in    { animation: fade-in 200ms ease-out backwards; }
.fade-out   { animation: fade-out 160ms ease-in forwards; }
.toast-in   { animation: toast-in 240ms cubic-bezier(.2,.7,.2,1) backwards; }
.shimmer::after {
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.045), transparent);
  animation: shimmer 1.6s infinite;
}
@media (prefers-reduced-motion: reduce) {
  .feed-item, .tab-in, .pop-in, .modal-in, .fade-in, .toast-in, .shimmer::after { animation: none; }
  .modal-out, .fade-out { animation-duration: 1ms; }
}
`;

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Numbers ease up to their value instead of just appearing.
function CountUp({ value, format = (n) => n, duration = 800 }) {
  const [shown, setShown] = useState(reducedMotion() ? value : 0);
  useEffect(() => {
    if (reducedMotion()) return setShown(value);
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{format(shown)}</>;
}

// true one frame after mount, so bars can grow from 0
function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setM(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return m;
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const TABS = [
  { key: "content", label: "Content", icon: Video },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "about", label: "About", icon: Film },
];

const FILTERS = [
  { key: "all", label: "All" },
  { key: "public", label: "Public" },
  { key: "private", label: "Private" },
  { key: "schedule", label: "Scheduled" },
  { key: "processing", label: "Processing" },
];

const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "views", label: "Most viewed" },
];

const statusOf = (v) =>
  v.isProcessed === false ? "processing" : v.visibility || "public";

const STATUS_META = {
  public: { label: "Public", icon: Globe },
  private: { label: "Private", icon: Lock },
  schedule: { label: "Scheduled", icon: Clock },
  processing: { label: "Processing", icon: Loader2 },
};

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-white/70";

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function UserProfile() {
  const { user, setUser } = useAuth();

  const channelName = user?.channelName || "Your channel";
  const channelBio = user?.bio || "";
  const email = user?.email || "";
  const initial = channelName[0].toUpperCase();

  const [activeTab, setActiveTab] = useState("content");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [removing, setRemoving] = useState(() => new Set());
  const [confirmVid, setConfirmVid] = useState(null);
  const [toast, setToast] = useState("");
  const [showCustomize, setShowCustomize] = useState(false);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [layout, setLayout] = useState("grid");

  const [bannerUrl, setBannerUrl] = useState(user?.bannerUrl || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");

  useEffect(() => {
    if (user) {
      if (user.bannerUrl !== undefined) setBannerUrl(user.bannerUrl || "");
      if (user.avatarUrl !== undefined) setAvatarUrl(user.avatarUrl || "");
    }
  }, [user]);

  // Keyed on the id: saving your profile calls setUser, and that used to
  // trigger a full refetch of every video on the platform.
  useEffect(() => {
    loadMyVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Close card menus on outside click / Escape
  useEffect(() => {
    if (openMenuId === null) return;
    const close = (e) => {
      if (!e.target.closest("[data-card-menu]")) setOpenMenuId(null);
    };
    const esc = (e) => e.key === "Escape" && setOpenMenuId(null);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [openMenuId]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(id);
  }, [toast]);

  // Sliding tab indicator
  const tabRefs = useRef({});
  const firstMeasure = useRef(true);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, animate: false });
  useLayoutEffect(() => {
    const el = tabRefs.current[activeTab];
    if (!el) return;
    setIndicator({
      left: el.offsetLeft,
      width: el.offsetWidth,
      animate: !firstMeasure.current,
    });
    firstMeasure.current = false;
  }, [activeTab]);

  const loadMyVideos = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await fetchVideos();
      const arr = Array.isArray(data) ? data : data.videos || data.data || [];
      if (user?.id) {
        setVideos(arr.filter((v) => v.userId === user.id || v.user?.id === user.id));
      } else {
        setVideos([]);
      }
    } catch (err) {
      console.error("Failed to load videos", err);
      setVideos([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vid) => {
    setDeletingId(vid.id);
    try {
      await deleteVideo(vid.id);
      // let the card shrink away, then drop it from the list
      setRemoving((prev) => new Set(prev).add(vid.id));
      setTimeout(() => {
        setVideos((prev) => prev.filter((v) => v.id !== vid.id));
        setRemoving((prev) => {
          const next = new Set(prev);
          next.delete(vid.id);
          return next;
        });
      }, 300);
    } catch (err) {
      console.error("Failed to delete video", err);
      setToast("Couldn't delete the video. Try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const counts = useMemo(() => {
    const c = { all: videos.length, public: 0, private: 0, schedule: 0, processing: 0 };
    videos.forEach((v) => {
      const s = statusOf(v);
      if (c[s] !== undefined) c[s] += 1;
    });
    return c;
  }, [videos]);

  const visibleVideos = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = videos.filter(
      (v) =>
        (filter === "all" || statusOf(v) === filter) &&
        (!q || v.title?.toLowerCase().includes(q)),
    );
    return [...list].sort((a, b) => {
      if (sort === "views") return (Number(b.views) || 0) - (Number(a.views) || 0);
      const da = new Date(a.uploadedAt || 0).getTime();
      const db = new Date(b.uploadedAt || 0).getTime();
      return sort === "oldest" ? da - db : db - da;
    });
  }, [videos, query, filter, sort]);

  const totalViews = useMemo(
    () => videos.reduce((sum, v) => sum + (Number(v.views) || 0), 0),
    [videos],
  );

  return (
    <div className="pb-24 text-zinc-100">
      <style>{styles}</style>

      {/* Banner */}
      <div className="relative h-40 overflow-hidden bg-zinc-900 md:h-56">
        {bannerUrl ? (
          <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 20% 0%, rgba(255,255,255,0.10), transparent 55%), radial-gradient(ellipse at 90% 100%, rgba(255,255,255,0.06), transparent 50%)",
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/20 to-transparent" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="relative -mt-14 flex flex-col items-center gap-5 md:-mt-16 md:flex-row md:items-end">
          <button
            onClick={() => setShowCustomize(true)}
            aria-label="Change avatar"
            className={`group relative h-28 w-28 shrink-0 cursor-pointer overflow-hidden rounded-full bg-zinc-800 ring-4 ring-[#09090b] md:h-32 md:w-32 ${focusRing}`}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-4xl font-semibold text-zinc-300">
                {initial}
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 backdrop-blur-[2px] transition duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
              <Camera className="h-6 w-6 scale-90 text-white transition duration-200 group-hover:scale-100" />
            </span>
          </button>

          <div className="min-w-0 flex-1 text-center md:pb-3 md:text-left">
            <h1 className="truncate text-3xl font-semibold tracking-[-0.02em] text-white">
              {channelName}
            </h1>
            <p className="mt-1.5 text-[13px] text-zinc-500">
              {email && <span className="text-zinc-400">@{email.split("@")[0]}</span>}
              {user?.subscriberCount !== undefined && (
                <>
                  <span className="mx-2">·</span>
                  {compactNumber.format(user.subscriberCount)} subscribers
                </>
              )}
              <span className="mx-2">·</span>
              {videos.length} {videos.length === 1 ? "video" : "videos"}
              <span className="mx-2">·</span>
              {compactNumber.format(totalViews)} views
            </p>
            {channelBio && (
              <p className="mx-auto mt-2 line-clamp-2 max-w-2xl text-[13px] leading-relaxed text-zinc-400 md:mx-0">
                {channelBio}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 md:pb-3">
            <Link
              to="/create"
              className={`flex items-center gap-1.5 rounded-full bg-white py-2.5 pl-4 pr-5 text-[13px] font-semibold text-black transition hover:bg-zinc-200 active:scale-95 ${focusRing}`}
            >
              <Plus className="h-4 w-4" strokeWidth={2.4} /> Upload
            </Link>
            <button
              onClick={() => setShowCustomize(true)}
              className={`flex cursor-pointer items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-[13px] font-medium text-zinc-200 transition hover:bg-zinc-800 active:scale-95 ${focusRing}`}
            >
              <Pencil className="h-3.5 w-3.5" /> Customize
            </button>
          </div>
        </div>

        {/* Tabs with a sliding indicator */}
        <div className="relative mt-10 flex gap-1 border-b border-white/5" role="tablist">
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                ref={(el) => (tabRefs.current[key] = el)}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(key)}
                className={`flex cursor-pointer items-center gap-2 rounded-t-lg px-4 py-3 text-[13px] font-medium transition-colors duration-200 ${focusRing} ${
                  active ? "text-white" : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
          <span
            aria-hidden
            className="absolute -bottom-px left-0 h-0.5 rounded-full bg-white"
            style={{
              width: indicator.width,
              transform: `translateX(${indicator.left}px)`,
              transition: indicator.animate
                ? "transform 320ms cubic-bezier(.2,.7,.2,1), width 320ms cubic-bezier(.2,.7,.2,1)"
                : "none",
            }}
          />
        </div>

        <div className="pt-6">
          {loading ? (
            <LoadingSkeleton />
          ) : loadError ? (
            <EmptyState
              icon={AlertCircle}
              title="Couldn't load your videos"
              text="Check your connection and try again."
              action={
                <button
                  onClick={loadMyVideos}
                  className={`mt-6 cursor-pointer rounded-full bg-white px-5 py-2 text-[13px] font-semibold text-black transition hover:bg-zinc-200 active:scale-95 ${focusRing}`}
                >
                  Try again
                </button>
              }
            />
          ) : (
            <div key={activeTab} className="tab-in">
              {activeTab === "content" && (
                <ContentTab
                  videos={videos}
                  visibleVideos={visibleVideos}
                  counts={counts}
                  query={query}
                  setQuery={setQuery}
                  filter={filter}
                  setFilter={setFilter}
                  sort={sort}
                  setSort={setSort}
                  layout={layout}
                  setLayout={setLayout}
                  openMenuId={openMenuId}
                  setOpenMenuId={setOpenMenuId}
                  deletingId={deletingId}
                  removing={removing}
                  onAskDelete={(vid) => {
                    setOpenMenuId(null);
                    setConfirmVid(vid);
                  }}
                />
              )}
              {activeTab === "analytics" && (
                <AnalyticsTab videos={videos} totalViews={totalViews} counts={counts} />
              )}
              {activeTab === "about" && (
                <AboutTab
                  channelBio={channelBio}
                  email={email}
                  user={user}
                  videosCount={videos.length}
                  onEdit={() => setShowCustomize(true)}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {confirmVid && (
        <ConfirmDelete
          vid={confirmVid}
          onCancel={() => setConfirmVid(null)}
          onConfirm={() => {
            const v = confirmVid;
            setConfirmVid(null);
            handleDelete(v);
          }}
        />
      )}

      {showCustomize && (
        <CustomizeChannelModal
          setUser={setUser}
          channelName={channelName}
          channelBio={channelBio}
          bannerUrl={bannerUrl}
          setBannerUrl={setBannerUrl}
          avatarUrl={avatarUrl}
          setAvatarUrl={setAvatarUrl}
          onClose={() => setShowCustomize(false)}
        />
      )}

      {toast && (
        <div
          role="status"
          className="toast-in fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-zinc-100 px-5 py-2.5 text-[13px] font-medium text-black shadow-2xl"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared bits                                                                */
/* -------------------------------------------------------------------------- */

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <div className="shimmer relative aspect-video overflow-hidden rounded-2xl bg-zinc-900" />
          <div className="mt-3 h-3 w-5/6 rounded-full bg-zinc-900" />
          <div className="mt-2 h-3 w-1/3 rounded-full bg-zinc-900" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 ring-1 ring-inset ring-white/5">
        <Icon className="h-6 w-6 text-zinc-500" />
      </div>
      <p className="mt-5 text-[15px] font-medium text-zinc-100">{title}</p>
      {text && <p className="mt-1 max-w-xs text-[13px] text-zinc-500">{text}</p>}
      {action}
    </div>
  );
}

function StatusBadge({ vid, className = "" }) {
  const s = statusOf(vid);
  if (s === "public") return null;
  const { label, icon: Icon } = STATUS_META[s] || STATUS_META.private;
  return (
    <span
      className={`flex items-center gap-1 rounded-md bg-black/65 px-1.5 py-1 text-[11px] font-medium leading-none text-zinc-100 backdrop-blur-sm ${className}`}
    >
      <Icon className={`h-3 w-3 ${s === "processing" ? "animate-spin" : ""}`} />
      {label}
    </span>
  );
}

function Panel({ title, children }) {
  return (
    <section className="rounded-2xl bg-zinc-950 p-5 ring-1 ring-inset ring-white/5">
      <h3 className="mb-5 text-[13px] font-medium text-zinc-400">{title}</h3>
      {children}
    </section>
  );
}

// Modal shell: fades in, and animates OUT before unmounting.
function Modal({ onClose, locked = false, closeRef, maxW = "max-w-lg", children }) {
  const [closing, setClosing] = useState(false);

  const close = useCallback(() => {
    if (locked || closing) return;
    setClosing(true);
    setTimeout(onClose, 160);
  }, [locked, closing, onClose]);

  useEffect(() => {
    if (closeRef) closeRef.current = close;
  }, [close, closeRef]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm ${
        closing ? "fade-out" : "fade-in"
      }`}
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${maxW} overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/60 ${
          closing ? "modal-out" : "modal-in"
        }`}
      >
        {typeof children === "function" ? children(close) : children}
      </div>
    </div>
  );
}

function ConfirmDelete({ vid, onCancel, onConfirm }) {
  const closeRef = useRef(null);
  return (
    <Modal onClose={onCancel} closeRef={closeRef} maxW="max-w-sm">
      {(close) => (
        <div className="p-6">
          <h2 className="text-[16px] font-semibold text-white">Delete this video?</h2>
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-zinc-400">
            “{vid.title}” will be removed for good. This can't be undone.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={close}
              className={`cursor-pointer rounded-full px-4 py-2 text-[13px] font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-white ${focusRing}`}
            >
              Cancel
            </button>
            <button
              autoFocus
              onClick={() => {
                // fade the dialog out, then start the delete
                const run = onConfirm;
                setTimeout(run, 0);
              }}
              className={`cursor-pointer rounded-full bg-red-500 px-5 py-2 text-[13px] font-semibold text-white transition hover:bg-red-400 active:scale-95 ${focusRing}`}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function RowMenu({ vid, open, onToggle, onClose, onAskDelete }) {
  return (
    <div className="relative shrink-0" data-card-menu>
      <button
        aria-label="Video options"
        aria-expanded={open}
        onClick={onToggle}
        className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-900 hover:text-white active:scale-95 ${focusRing} ${
          open ? "bg-zinc-900 text-white" : ""
        }`}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div className="pop-in absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 p-1.5 shadow-2xl shadow-black/60">
          <Link
            to={`/edit/${vid.id}`}
            onClick={onClose}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
          >
            <Pencil className="h-3.5 w-3.5 text-zinc-500" /> Edit details
          </Link>
          <button
            onClick={onAskDelete}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] text-red-400 transition hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

function Thumb({ vid, deleting, children }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <>
      {!loaded && !failed && <div className="shimmer absolute inset-0" />}
      {failed ? (
        <div className="flex h-full w-full items-center justify-center">
          <Film className="h-6 w-6 text-zinc-700" />
        </div>
      ) : (
        <img
          src={thumbUrl(vid.filepath)}
          alt=""
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.04] ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
      {children}
      {deleting && (
        <div className="fade-in absolute inset-0 z-10 flex items-center justify-center bg-black/75 backdrop-blur-[2px]">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-200" />
        </div>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Content tab                                                                */
/* -------------------------------------------------------------------------- */

function ContentTab({
  videos,
  visibleVideos,
  counts,
  query,
  setQuery,
  filter,
  setFilter,
  sort,
  setSort,
  layout,
  setLayout,
  openMenuId,
  setOpenMenuId,
  deletingId,
  removing,
  onAskDelete,
}) {
  if (videos.length === 0) {
    return (
      <EmptyState
        icon={Video}
        title="No videos yet"
        text="Upload your first video and it will show up here."
        action={
          <Link
            to="/create"
            className={`mt-6 rounded-full bg-white px-5 py-2 text-[13px] font-semibold text-black transition hover:bg-zinc-200 active:scale-95 ${focusRing}`}
          >
            Upload video
          </Link>
        }
      />
    );
  }

  const rowProps = (vid) => ({
    vid,
    deleting: deletingId === vid.id,
    removing: removing.has(vid.id),
    menuOpen: openMenuId === vid.id,
    onToggleMenu: () => setOpenMenuId(openMenuId === vid.id ? null : vid.id),
    onCloseMenu: () => setOpenMenuId(null),
    onAskDelete: () => onAskDelete(vid),
  });

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {FILTERS.map(({ key, label }) => {
            const active = filter === key;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                aria-pressed={active}
                className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-200 active:scale-95 ${focusRing} ${
                  active
                    ? "bg-white text-black"
                    : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                }`}
              >
                {label}
                <span
                  className={`text-[12px] tabular-nums transition-colors ${
                    active ? "text-zinc-500" : "text-zinc-600"
                  }`}
                >
                  {counts[key]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 lg:w-56 lg:flex-none">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your videos"
              className="w-full rounded-full bg-zinc-900 py-2 pl-10 pr-3 text-[13px] text-white outline-none ring-1 ring-inset ring-transparent transition placeholder:text-zinc-500 focus:bg-zinc-950 focus:ring-white/25"
            />
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort videos"
            className="cursor-pointer rounded-full bg-zinc-900 px-3.5 py-2 text-[13px] text-zinc-300 outline-none ring-1 ring-inset ring-transparent transition hover:bg-zinc-800 focus:ring-white/25"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Segmented control with a sliding thumb */}
          <div className="relative flex rounded-full bg-zinc-900 p-0.5">
            <span
              aria-hidden
              className="absolute left-0.5 top-0.5 h-8 w-8 rounded-full bg-white transition-transform duration-300 ease-[cubic-bezier(.2,.7,.2,1)]"
              style={{ transform: `translateX(${layout === "grid" ? 0 : 32}px)` }}
            />
            {[
              ["grid", LayoutGrid],
              ["list", List],
            ].map(([key, Icon]) => (
              <button
                key={key}
                onClick={() => setLayout(key)}
                aria-label={`${key} view`}
                aria-pressed={layout === key}
                className={`relative z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ${focusRing} ${
                  layout === key ? "text-black" : "text-zinc-500 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results (re-settles when filter, sort or layout changes) */}
      {visibleVideos.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching videos"
          text="Try a different search or filter."
        />
      ) : layout === "grid" ? (
        <div
          key={`grid-${filter}-${sort}`}
          className="mt-6 grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {visibleVideos.map((vid, i) => (
            <GridCard key={vid.id} index={i} {...rowProps(vid)} />
          ))}
        </div>
      ) : (
        <div
          key={`list-${filter}-${sort}`}
          className="mt-6 overflow-hidden rounded-2xl ring-1 ring-inset ring-white/5"
        >
          <div className="hidden grid-cols-[minmax(0,1fr)_110px_110px_90px_40px] gap-4 bg-zinc-950 px-4 py-3 text-[12px] font-medium text-zinc-500 md:grid">
            <span>Video</span>
            <span>Status</span>
            <span>Date</span>
            <span className="text-right">Views</span>
            <span />
          </div>
          {visibleVideos.map((vid, i) => (
            <ListRow key={vid.id} index={i} {...rowProps(vid)} />
          ))}
        </div>
      )}
    </div>
  );
}

function GridCard({
  vid,
  index,
  deleting,
  removing,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onAskDelete,
}) {
  return (
    <div
      className={`feed-item group transition-all duration-300 ease-out ${
        removing ? "scale-95 opacity-0" : ""
      }`}
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <Link
        to={`/watch/${vid.id}`}
        className={`relative block aspect-video overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-inset ring-white/5 transition-[border-radius] duration-300 hover:rounded-xl ${focusRing}`}
      >
        <Thumb vid={vid} deleting={deleting}>
          {vid.isLive ? (
            <span className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-[11px] font-semibold leading-none text-black">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              Live
            </span>
          ) : (
            <StatusBadge vid={vid} className="absolute left-2.5 top-2.5" />
          )}
          {vid.duration && !vid.isLive && (
            <span className="absolute bottom-2.5 right-2.5 rounded-md bg-black/70 px-1.5 py-1 text-[11px] font-medium leading-none tabular-nums text-white backdrop-blur-sm">
              {vid.duration}
            </span>
          )}
        </Thumb>
      </Link>

      <div className="mt-3 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[15px] font-medium leading-[1.35] tracking-[-0.01em] text-zinc-100 transition-colors group-hover:text-white">
            {vid.title}
          </h3>
          <p className="mt-1 text-[13px] text-zinc-500">
            {compactNumber.format(vid.views ?? 0)} views
            {vid.uploadedAt && <> &nbsp;·&nbsp; {formatDate(vid.uploadedAt)}</>}
          </p>
        </div>
        <RowMenu
          vid={vid}
          open={menuOpen}
          onToggle={onToggleMenu}
          onClose={onCloseMenu}
          onAskDelete={onAskDelete}
        />
      </div>
    </div>
  );
}

function ListRow({
  vid,
  index,
  deleting,
  removing,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onAskDelete,
}) {
  const s = statusOf(vid);
  const { label, icon: Icon } = STATUS_META[s] || STATUS_META.private;

  return (
    <div
      className={`feed-item group grid grid-cols-[minmax(0,1fr)_40px] items-center gap-4 border-t border-white/5 px-4 py-3 transition-all duration-300 hover:bg-zinc-900/50 md:grid-cols-[minmax(0,1fr)_110px_110px_90px_40px] ${
        removing ? "scale-[.98] opacity-0" : ""
      }`}
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
    >
      <Link to={`/watch/${vid.id}`} className="flex min-w-0 items-center gap-3">
        <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-xl bg-zinc-900 sm:w-36">
          <Thumb vid={vid} deleting={deleting}>
            {vid.duration && !vid.isLive && (
              <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.5 text-[10px] font-medium leading-none tabular-nums text-white">
                {vid.duration}
              </span>
            )}
          </Thumb>
        </div>
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-[14px] font-medium leading-snug text-zinc-100">
            {vid.title}
          </h3>
          <p className="mt-1 text-[12px] text-zinc-500 md:hidden">
            {compactNumber.format(vid.views ?? 0)} views · {label}
          </p>
        </div>
      </Link>

      <span className="hidden items-center gap-1.5 text-[13px] text-zinc-400 md:flex">
        <Icon className={`h-3.5 w-3.5 ${s === "processing" ? "animate-spin" : ""}`} />
        {label}
      </span>
      <span className="hidden text-[13px] text-zinc-500 md:block">
        {formatDate(vid.uploadedAt)}
      </span>
      <span className="hidden text-right text-[13px] tabular-nums text-zinc-300 md:block">
        {compactNumber.format(vid.views ?? 0)}
      </span>

      <RowMenu
        vid={vid}
        open={menuOpen}
        onToggle={onToggleMenu}
        onClose={onCloseMenu}
        onAskDelete={onAskDelete}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Analytics tab                                                              */
/* -------------------------------------------------------------------------- */

function StatCard({ icon: Icon, label, value, format, hint }) {
  return (
    <div className="rounded-2xl bg-zinc-950 p-4 ring-1 ring-inset ring-white/5">
      <div className="flex items-center gap-2 text-[12px] text-zinc-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-[-0.02em] text-white">
        <CountUp value={value} format={format} />
      </p>
      {hint && <p className="mt-1 truncate text-[12px] text-zinc-600">{hint}</p>}
    </div>
  );
}

function AnalyticsTab({ videos, totalViews, counts }) {
  const mounted = useMounted();

  const top = useMemo(
    () =>
      [...videos]
        .sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0))
        .slice(0, 5),
    [videos],
  );
  const topMax = Number(top[0]?.views) || 1;
  const avg = videos.length ? Math.round(totalViews / videos.length) : 0;

  // uploads per month, last 6 months
  const months = useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString(undefined, { month: "short" }),
        uploads: 0,
      };
    });
    videos.forEach((v) => {
      if (!v.uploadedAt) return;
      const d = new Date(v.uploadedAt);
      const b = buckets.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
      if (b) b.uploads += 1;
    });
    return buckets;
  }, [videos]);
  const monthMax = Math.max(1, ...months.map((m) => m.uploads));

  if (videos.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Nothing to analyse yet"
        text="Stats appear here once you upload videos."
      />
    );
  }

  const breakdown = [
    { key: "public", label: "Public" },
    { key: "private", label: "Private" },
    { key: "schedule", label: "Scheduled" },
    { key: "processing", label: "Processing" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Video} label="Videos" value={videos.length} />
        <StatCard
          icon={Eye}
          label="Total views"
          value={totalViews}
          format={(n) => compactNumber.format(n)}
        />
        <StatCard
          icon={TrendingUp}
          label="Avg views per video"
          value={avg}
          format={(n) => compactNumber.format(n)}
        />
        <StatCard
          icon={BarChart3}
          label="Top video"
          value={Number(top[0]?.views) || 0}
          format={(n) => compactNumber.format(n)}
          hint={top[0]?.title}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Panel title="Top videos by views">
            <ul className="space-y-4">
              {top.map((v, i) => {
                const views = Number(v.views) || 0;
                return (
                  <li key={v.id}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-4 text-[13px]">
                      <Link
                        to={`/watch/${v.id}`}
                        className="truncate text-zinc-300 transition hover:text-white"
                      >
                        <span className="mr-2 tabular-nums text-zinc-600">{i + 1}</span>
                        {v.title}
                      </Link>
                      <span className="shrink-0 tabular-nums text-zinc-400">
                        {compactNumber.format(views)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-900">
                      <div
                        className="h-full rounded-full bg-white transition-[width] duration-700 ease-[cubic-bezier(.2,.7,.2,1)]"
                        style={{
                          width: mounted ? `${Math.max(2, (views / topMax) * 100)}%` : "0%",
                          transitionDelay: `${i * 70}ms`,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Panel title="Uploads, last 6 months">
            <div className="flex h-28 items-end gap-2">
              {months.map((m, i) => (
                <div key={m.key} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-20 w-full items-end">
                    <div
                      className="w-full rounded-t-md bg-white/90 transition-[height] duration-700 ease-[cubic-bezier(.2,.7,.2,1)]"
                      style={{
                        height: mounted
                          ? m.uploads
                            ? `${(m.uploads / monthMax) * 100}%`
                            : "3px"
                          : "0px",
                        opacity: m.uploads ? 1 : 0.15,
                        transitionDelay: `${i * 60}ms`,
                      }}
                      title={`${m.uploads} upload${m.uploads === 1 ? "" : "s"}`}
                    />
                  </div>
                  <span className="text-[11px] text-zinc-600">{m.label}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Visibility">
            <ul className="space-y-2.5">
              {breakdown.map(({ key, label }) => (
                <li key={key} className="flex items-center justify-between text-[13px]">
                  <span className="text-zinc-400">{label}</span>
                  <span className="tabular-nums text-zinc-200">{counts[key]}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <p className="px-1 text-[12px] text-zinc-600">
        Totals from your current videos. Views over time need the backend to log view events.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* About tab                                                                  */
/* -------------------------------------------------------------------------- */

function AboutTab({ channelBio, email, user, videosCount, onEdit }) {
  const rows = [
    ["Email", email],
    ["Joined", user?.createdAt ? formatDate(user.createdAt) : null],
    ["Videos", videosCount],
  ].filter(([, v]) => v !== null && v !== "" && v !== undefined);

  return (
    <div className="grid max-w-3xl gap-4">
      <Panel title="About">
        {channelBio ? (
          <p className="whitespace-pre-line text-[14px] leading-relaxed text-zinc-300">
            {channelBio}
          </p>
        ) : (
          <div className="text-[13px] text-zinc-500">
            You haven't written anything yet.{" "}
            <button
              onClick={onEdit}
              className="cursor-pointer font-medium text-white hover:underline"
            >
              Add a bio
            </button>
          </div>
        )}
      </Panel>

      <Panel title="Details">
        <dl className="divide-y divide-white/5">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-2.5 text-[13px]">
              <dt className="text-zinc-500">{k}</dt>
              <dd className="text-zinc-200">{v}</dd>
            </div>
          ))}
        </dl>
      </Panel>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Customize modal (save logic unchanged)                                     */
/* -------------------------------------------------------------------------- */

const modalInput =
  "w-full rounded-xl bg-zinc-900 px-3.5 py-2.5 text-[13px] text-white outline-none ring-1 ring-inset ring-white/5 transition placeholder:text-zinc-600 focus:bg-zinc-950 focus:ring-white/30";

function CustomizeChannelModal({
  setUser,
  channelName,
  channelBio,
  bannerUrl,
  setBannerUrl,
  avatarUrl,
  setAvatarUrl,
  onClose,
}) {
  const [name, setName] = useState(channelName);
  const [bio, setBio] = useState(channelBio);
  const [tempBanner, setTempBanner] = useState(bannerUrl || "");
  const [tempAvatar, setTempAvatar] = useState(avatarUrl || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const closeRef = useRef(null);

  useEffect(() => {
    setTempBanner(bannerUrl || "");
    setTempAvatar(avatarUrl || "");
  }, [bannerUrl, avatarUrl]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const data = await updateUserProfile({
        channelName: name,
        bio,
        avatarUrl: tempAvatar,
        bannerUrl: tempBanner,
      });

      const updatedUser = data.user || data;
      setBannerUrl(updatedUser.bannerUrl || "");
      setAvatarUrl(updatedUser.avatarUrl || "");
      if (setUser && updatedUser) setUser(updatedUser);

      setSaving(false);
      // let the modal animate out instead of vanishing
      setTimeout(() => closeRef.current?.(), 0);
    } catch (err) {
      console.error("Failed to update profile", err);
      setError(err.response?.data?.error || err.message || "Error updating profile");
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} locked={saving} closeRef={closeRef}>
      {(close) => (
        <>
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-[15px] font-semibold text-white">Customize channel</h2>
            <button
              onClick={close}
              aria-label="Close"
              className={`cursor-pointer rounded-full p-1.5 text-zinc-400 transition hover:bg-zinc-900 hover:text-white ${focusRing}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 pb-2 scrollbar-none">
            {/* live preview */}
            <div className="overflow-hidden rounded-2xl ring-1 ring-inset ring-white/5">
              <div className="h-20 bg-zinc-900">
                {tempBanner && (
                  <img
                    src={tempBanner}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                    onLoad={(e) => (e.currentTarget.style.display = "block")}
                  />
                )}
              </div>
              <div className="-mt-6 px-4 pb-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-sm font-semibold text-zinc-200 ring-2 ring-zinc-950">
                  {tempAvatar ? (
                    <img
                      src={tempAvatar}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                      onLoad={(e) => (e.currentTarget.style.display = "block")}
                    />
                  ) : (
                    (name || "?")[0].toUpperCase()
                  )}
                </div>
              </div>
            </div>

            <Field id="ch-name" label="Channel name">
              <input
                id="ch-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={modalInput}
              />
            </Field>

            <Field id="ch-banner" label="Banner image URL">
              <input
                id="ch-banner"
                type="text"
                value={tempBanner}
                onChange={(e) => setTempBanner(e.target.value)}
                placeholder="https://example.com/banner.jpg"
                className={modalInput}
              />
            </Field>

            <Field id="ch-avatar" label="Profile image URL">
              <input
                id="ch-avatar"
                type="text"
                value={tempAvatar}
                onChange={(e) => setTempAvatar(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className={modalInput}
              />
            </Field>

            <Field id="ch-bio" label="About">
              <textarea
                id="ch-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Tell viewers what your channel is about"
                className={`${modalInput} resize-none`}
              />
            </Field>

            {error && (
              <div
                role="alert"
                className="pop-in flex items-start gap-2 rounded-xl bg-red-500/10 p-3 text-[13px] text-red-300 ring-1 ring-inset ring-red-500/20"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 px-6 py-4">
            <button
              onClick={close}
              disabled={saving}
              className={`cursor-pointer rounded-full px-4 py-2 text-[13px] font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-white disabled:opacity-40 ${focusRing}`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex min-w-[84px] cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-5 py-2 text-[13px] font-semibold text-black transition hover:bg-zinc-200 active:scale-95 disabled:opacity-70 ${focusRing}`}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

function Field({ id, label, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[12px] font-medium text-zinc-400">
        {label}
      </label>
      {children}
    </div>
  );
}