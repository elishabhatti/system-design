import React, { useEffect, useMemo, useState } from "react";
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

const compactNumber = new Intl.NumberFormat("en", { notation: "compact" });

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : "";

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

const statusOf = (v) => (v.isProcessed === false ? "processing" : v.visibility || "public");

const STATUS_META = {
  public: { label: "Public", icon: Globe },
  private: { label: "Private", icon: Lock },
  schedule: { label: "Scheduled", icon: Clock },
  processing: { label: "Processing", icon: Loader2 },
};

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
  const [showCustomize, setShowCustomize] = useState(false);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [layout, setLayout] = useState("grid");

  const [bannerUrl, setBannerUrl] = useState(user?.bannerUrl || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");

  // Sync when user object updates from AuthContext
  useEffect(() => {
    if (user) {
      if (user.bannerUrl !== undefined) setBannerUrl(user.bannerUrl || "");
      if (user.avatarUrl !== undefined) setAvatarUrl(user.avatarUrl || "");
    }
  }, [user]);

  useEffect(() => {
    loadMyVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Close any row/card menu on outside click
  useEffect(() => {
    if (openMenuId === null) return;
    const close = (e) => {
      if (!e.target.closest("[data-card-menu]")) setOpenMenuId(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [openMenuId]);

  const loadMyVideos = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await fetchVideos();
      const videoArray = Array.isArray(data) ? data : data.videos || data.data || [];

      if (user?.id) {
        setVideos(videoArray.filter((v) => v.userId === user.id || v.user?.id === user.id));
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
    setOpenMenuId(null);
    if (!window.confirm(`Delete "${vid.title}"? This can't be undone.`)) return;
    setDeletingId(vid.id);
    try {
      await deleteVideo(vid.id);
      setVideos((prev) => prev.filter((v) => v.id !== vid.id));
    } catch (err) {
      console.error("Failed to delete video", err);
    } finally {
      setDeletingId(null);
    }
  };

  // ---- derived data ----
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
    let list = videos.filter(
      (v) =>
        (filter === "all" || statusOf(v) === filter) &&
        (!q || v.title?.toLowerCase().includes(q))
    );
    list = [...list].sort((a, b) => {
      if (sort === "views") return (Number(b.views) || 0) - (Number(a.views) || 0);
      const da = new Date(a.uploadedAt || 0).getTime();
      const db = new Date(b.uploadedAt || 0).getTime();
      return sort === "oldest" ? da - db : db - da;
    });
    return list;
  }, [videos, query, filter, sort]);

  const totalViews = useMemo(
    () => videos.reduce((sum, v) => sum + (Number(v.views) || 0), 0),
    [videos]
  );

  return (
    <div className="pb-24 text-zinc-100">
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
            className="group relative h-28 w-28 shrink-0 cursor-pointer overflow-hidden rounded-full border-4 border-[#09090b] bg-zinc-800 shadow-2xl md:h-32 md:w-32"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-4xl font-semibold text-zinc-300">
                {initial}
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition group-hover:opacity-100">
              <Camera className="h-6 w-6 text-white" />
            </span>
          </button>

          <div className="min-w-0 flex-1 text-center md:pb-3 md:text-left">
            <h1 className="truncate text-3xl font-semibold tracking-tight text-white">
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
              className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold text-black transition hover:bg-zinc-200 active:scale-95"
            >
              <Plus className="h-4 w-4" /> Upload
            </Link>
            <button
              onClick={() => setShowCustomize(true)}
              className="flex cursor-pointer items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-[13px] font-medium text-zinc-200 transition hover:bg-zinc-800"
            >
              <Pencil className="h-3.5 w-3.5" /> Customize
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-10 flex gap-1 border-b border-zinc-900">
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`relative flex cursor-pointer items-center gap-2 px-4 py-3 text-[13px] font-medium transition ${
                  active ? "text-white" : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {active && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-white" />}
              </button>
            );
          })}
        </div>

        <div className="pt-6">
          {loading ? (
            <LoadingSkeleton />
          ) : loadError ? (
            <EmptyState
              icon={AlertCircle}
              title="Couldn't load your videos"
              action={
                <button
                  onClick={loadMyVideos}
                  className="mt-5 cursor-pointer rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200"
                >
                  Try again
                </button>
              }
            />
          ) : (
            <>
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
                  onDelete={handleDelete}
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
            </>
          )}
        </div>
      </div>

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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-video rounded-xl bg-zinc-900" />
          <div className="mt-3 h-3 w-5/6 rounded bg-zinc-900" />
          <div className="mt-2 h-3 w-1/3 rounded bg-zinc-900" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <Icon className="h-9 w-9 text-zinc-700" />
      <p className="mt-4 text-sm font-medium text-zinc-200">{title}</p>
      {text && <p className="mt-1 max-w-xs text-xs text-zinc-500">{text}</p>}
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
      className={`flex items-center gap-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-zinc-200 ${className}`}
    >
      <Icon className={`h-3 w-3 ${s === "processing" ? "animate-spin" : ""}`} />
      {label}
    </span>
  );
}

function RowMenu({ vid, open, onToggle, onClose, onDelete }) {
  return (
    <div className="relative shrink-0" data-card-menu>
      <button
        aria-label="Video options"
        onClick={onToggle}
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-20 w-40 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 py-1 shadow-2xl">
          <Link
            to={`/edit/${vid.id}`}
            onClick={onClose}
            className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
          >
            <Pencil className="h-3.5 w-3.5 text-zinc-500" /> Edit details
          </Link>
          <button
            onClick={onDelete}
            className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-red-400 transition hover:bg-zinc-900"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

function Thumb({ vid, deleting, children }) {
  return (
    <>
      <video
        src={vid.filepath ? `${vid.filepath}#t=0.5` : undefined}
        preload="metadata"
        muted
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      {children}
      {deleting && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Content tab
// ---------------------------------------------------------------------------

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
  onDelete,
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
            className="mt-5 rounded-full bg-white px-5 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200"
          >
            Upload video
          </Link>
        }
      />
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-1.5 overflow-x-auto">
          {FILTERS.map(({ key, label }) => {
            const active = filter === key;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
                  active ? "bg-white text-black" : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                {label}
                <span className={`text-[11px] tabular-nums ${active ? "text-zinc-600" : "text-zinc-500"}`}>
                  {counts[key]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 lg:w-56 lg:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your videos"
              className="w-full rounded-full border border-zinc-800 bg-zinc-950 py-2 pl-9 pr-3 text-[13px] text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-500"
            />
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort videos"
            className="cursor-pointer rounded-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-[13px] text-zinc-300 outline-none transition focus:border-zinc-500"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>

          <div className="flex rounded-full border border-zinc-800 bg-zinc-950 p-0.5">
            {[
              ["grid", LayoutGrid],
              ["list", List],
            ].map(([key, Icon]) => (
              <button
                key={key}
                onClick={() => setLayout(key)}
                aria-label={`${key} view`}
                className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition ${
                  layout === key ? "bg-white text-black" : "text-zinc-500 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {visibleVideos.length === 0 ? (
        <EmptyState icon={Search} title="No matching videos" text="Try a different search or filter." />
      ) : layout === "grid" ? (
        <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleVideos.map((vid) => (
            <GridCard
              key={vid.id}
              vid={vid}
              deleting={deletingId === vid.id}
              menuOpen={openMenuId === vid.id}
              onToggleMenu={() => setOpenMenuId(openMenuId === vid.id ? null : vid.id)}
              onCloseMenu={() => setOpenMenuId(null)}
              onDelete={() => onDelete(vid)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-900">
          <div className="hidden grid-cols-[minmax(0,1fr)_110px_110px_90px_40px] gap-4 border-b border-zinc-900 bg-zinc-950 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-zinc-600 md:grid">
            <span>Video</span>
            <span>Status</span>
            <span>Date</span>
            <span className="text-right">Views</span>
            <span />
          </div>
          {visibleVideos.map((vid) => (
            <ListRow
              key={vid.id}
              vid={vid}
              deleting={deletingId === vid.id}
              menuOpen={openMenuId === vid.id}
              onToggleMenu={() => setOpenMenuId(openMenuId === vid.id ? null : vid.id)}
              onCloseMenu={() => setOpenMenuId(null)}
              onDelete={() => onDelete(vid)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GridCard({ vid, deleting, menuOpen, onToggleMenu, onCloseMenu, onDelete }) {
  return (
    <div className="group">
      <Link to={`/watch/${vid.id}`} className="relative block aspect-video overflow-hidden rounded-xl bg-zinc-900">
        <Thumb vid={vid} deleting={deleting}>
          {vid.isLive ? (
            <span className="absolute left-2 top-2 flex items-center gap-1.5 rounded bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-black" />
              Live
            </span>
          ) : (
            <StatusBadge vid={vid} className="absolute left-2 top-2" />
          )}
          {vid.duration && !vid.isLive && (
            <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">
              {vid.duration}
            </span>
          )}
        </Thumb>
      </Link>

      <div className="mt-3 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[14px] font-medium leading-snug text-white">{vid.title}</h3>
          <p className="mt-1 text-[13px] text-zinc-500">
            {compactNumber.format(vid.views ?? 0)} views
            {vid.uploadedAt && <span> · {formatDate(vid.uploadedAt)}</span>}
          </p>
        </div>
        <RowMenu vid={vid} open={menuOpen} onToggle={onToggleMenu} onClose={onCloseMenu} onDelete={onDelete} />
      </div>
    </div>
  );
}

function ListRow({ vid, deleting, menuOpen, onToggleMenu, onCloseMenu, onDelete }) {
  const s = statusOf(vid);
  const { label, icon: Icon } = STATUS_META[s] || STATUS_META.private;

  return (
    <div className="group grid grid-cols-[minmax(0,1fr)_40px] items-center gap-4 border-b border-zinc-900 px-4 py-3 transition last:border-b-0 hover:bg-zinc-900/40 md:grid-cols-[minmax(0,1fr)_110px_110px_90px_40px]">
      <Link to={`/watch/${vid.id}`} className="flex min-w-0 items-center gap-3">
        <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg bg-zinc-900 sm:w-36">
          <Thumb vid={vid} deleting={deleting}>
            {vid.duration && !vid.isLive && (
              <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-[10px] font-medium tabular-nums text-white">
                {vid.duration}
              </span>
            )}
          </Thumb>
        </div>
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-[13px] font-medium leading-snug text-white">{vid.title}</h3>
          <p className="mt-1 text-xs text-zinc-500 md:hidden">
            {compactNumber.format(vid.views ?? 0)} views · {label}
          </p>
        </div>
      </Link>

      <span className="hidden items-center gap-1.5 text-[13px] text-zinc-400 md:flex">
        <Icon className={`h-3.5 w-3.5 ${s === "processing" ? "animate-spin" : ""}`} />
        {label}
      </span>
      <span className="hidden text-[13px] text-zinc-500 md:block">{formatDate(vid.uploadedAt)}</span>
      <span className="hidden text-right text-[13px] tabular-nums text-zinc-300 md:block">
        {compactNumber.format(vid.views ?? 0)}
      </span>

      <RowMenu vid={vid} open={menuOpen} onToggle={onToggleMenu} onClose={onCloseMenu} onDelete={onDelete} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Analytics tab (everything computed from the loaded videos)
// ---------------------------------------------------------------------------

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-4">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{value}</p>
      {hint && <p className="mt-1 truncate text-xs text-zinc-600">{hint}</p>}
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="rounded-xl border border-zinc-900 bg-zinc-950 p-5">
      <h3 className="mb-5 text-[11px] font-medium uppercase tracking-wider text-zinc-500">{title}</h3>
      {children}
    </section>
  );
}

function AnalyticsTab({ videos, totalViews, counts }) {
  const sortedByViews = useMemo(
    () => [...videos].sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0)),
    [videos]
  );
  const top = sortedByViews.slice(0, 5);
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
        <StatCard icon={Eye} label="Total views" value={compactNumber.format(totalViews)} />
        <StatCard icon={TrendingUp} label="Avg views / video" value={compactNumber.format(avg)} />
        <StatCard
          icon={BarChart3}
          label="Top video"
          value={compactNumber.format(Number(top[0]?.views) || 0)}
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
                      <Link to={`/watch/${v.id}`} className="truncate text-zinc-200 hover:text-white">
                        <span className="mr-2 text-zinc-600 tabular-nums">{i + 1}</span>
                        {v.title}
                      </Link>
                      <span className="shrink-0 tabular-nums text-zinc-400">
                        {compactNumber.format(views)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-900">
                      <div
                        className="h-full rounded-full bg-white transition-[width] duration-500"
                        style={{ width: `${Math.max(2, (views / topMax) * 100)}%` }}
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
              {months.map((m) => (
                <div key={m.key} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-20 w-full items-end">
                    <div
                      className="w-full rounded-t bg-white/90 transition-[height] duration-500"
                      style={{ height: m.uploads ? `${(m.uploads / monthMax) * 100}%` : "3px", opacity: m.uploads ? 1 : 0.15 }}
                      title={`${m.uploads} upload${m.uploads === 1 ? "" : "s"}`}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-600">{m.label}</span>
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

      <p className="px-1 text-xs text-zinc-600">
        These are totals from your current videos. Views over time need the backend to log view events.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// About tab
// ---------------------------------------------------------------------------

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
          <p className="whitespace-pre-line text-[14px] leading-relaxed text-zinc-300">{channelBio}</p>
        ) : (
          <div className="text-[13px] text-zinc-500">
            You haven't written anything yet.{" "}
            <button onClick={onEdit} className="cursor-pointer font-medium text-white hover:underline">
              Add a bio
            </button>
          </div>
        )}
      </Panel>

      <Panel title="Details">
        <dl className="divide-y divide-zinc-900">
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

// ---------------------------------------------------------------------------
// Customize modal (logic unchanged)
// ---------------------------------------------------------------------------

const modalInput =
  "w-full rounded-xl border border-zinc-800 bg-black px-3.5 py-2.5 text-[13px] text-white outline-none transition placeholder:text-zinc-700 focus:border-zinc-500";

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

  useEffect(() => {
    setTempBanner(bannerUrl || "");
    setTempAvatar(avatarUrl || "");
  }, [bannerUrl, avatarUrl]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

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
      if (setUser && updatedUser) {
        setUser(updatedUser);
      }

      onClose();
    } catch (err) {
      console.error("Failed to update profile", err);
      setError(err.response?.data?.error || err.message || "Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
      onClick={() => !saving && onClose()}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-sm font-semibold text-white">Customize channel</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-full p-1.5 text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 pb-2">
          {/* live preview */}
          <div className="overflow-hidden rounded-xl border border-zinc-900">
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
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-zinc-950 bg-zinc-800 text-sm font-semibold text-zinc-200">
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

          <div>
            <label htmlFor="ch-name" className="mb-1.5 block text-[12px] font-medium text-zinc-400">
              Channel name
            </label>
            <input id="ch-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={modalInput} />
          </div>

          <div>
            <label htmlFor="ch-banner" className="mb-1.5 block text-[12px] font-medium text-zinc-400">
              Banner image URL
            </label>
            <input
              id="ch-banner"
              type="text"
              value={tempBanner}
              onChange={(e) => setTempBanner(e.target.value)}
              placeholder="https://example.com/banner.jpg"
              className={modalInput}
            />
          </div>

          <div>
            <label htmlFor="ch-avatar" className="mb-1.5 block text-[12px] font-medium text-zinc-400">
              Profile image URL
            </label>
            <input
              id="ch-avatar"
              type="text"
              value={tempAvatar}
              onChange={(e) => setTempAvatar(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className={modalInput}
            />
          </div>

          <div>
            <label htmlFor="ch-bio" className="mb-1.5 block text-[12px] font-medium text-zinc-400">
              About
            </label>
            <textarea
              id="ch-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell viewers what your channel is about"
              className={`${modalInput} resize-none`}
            />
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-[13px] text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4">
          <button
            onClick={onClose}
            disabled={saving}
            className="cursor-pointer rounded-full px-4 py-2 text-[13px] font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-white disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex cursor-pointer items-center gap-2 rounded-full bg-white px-5 py-2 text-[13px] font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}