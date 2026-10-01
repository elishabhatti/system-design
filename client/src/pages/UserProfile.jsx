import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Clock,
  AlertCircle,
} from "lucide-react";

const compactNumber = new Intl.NumberFormat("en", { notation: "compact" });

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : "";

export default function UserProfile() {
  const { user, setUser } = useAuth();

  const channelName = user?.channelName || "Your channel";
  const channelBio = user?.bio || "";
  const email = user?.email || "";
  const initial = channelName[0].toUpperCase();

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showCustomize, setShowCustomize] = useState(false);

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

  // Close the card menu on outside click
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

  const totalViews = useMemo(
    () => videos.reduce((sum, v) => sum + (Number(v.views) || 0), 0),
    [videos]
  );

  return (
    <div className="pb-20 text-zinc-100">
      {/* Banner */}
      <div className="relative h-36 overflow-hidden bg-zinc-900 md:h-52">
        {bannerUrl ? (
          <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-800/60 to-[#09090b]" />
        )}
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="-mt-12 flex flex-col items-center gap-5 md:-mt-14 md:flex-row md:items-end">
          <button
            onClick={() => setShowCustomize(true)}
            aria-label="Change avatar"
            className="group relative h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-full border-4 border-[#09090b] bg-zinc-800 md:h-28 md:w-28"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-3xl font-semibold text-zinc-300">
                {initial}
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition group-hover:opacity-100">
              <Camera className="h-5 w-5 text-white" />
            </span>
          </button>

          <div className="min-w-0 flex-1 text-center md:pb-2 md:text-left">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-white">
              {channelName}
            </h1>
            <p className="mt-1 text-[13px] text-zinc-500">
              {email && <span>@{email.split("@")[0]}</span>}
              {user?.subscriberCount !== undefined && (
                <>
                  <span className="mx-1.5">·</span>
                  {compactNumber.format(user.subscriberCount)} subscribers
                </>
              )}
              <span className="mx-1.5">·</span>
              {videos.length} {videos.length === 1 ? "video" : "videos"}
            </p>
            {channelBio && (
              <p className="mx-auto mt-2 max-w-2xl text-[13px] leading-relaxed text-zinc-400 md:mx-0">
                {channelBio}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 md:pb-2">
            <Link
              to="/create"
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-black transition hover:bg-zinc-200 active:scale-95"
            >
              <Plus className="h-4 w-4" /> Upload
            </Link>
            <button
              onClick={() => setShowCustomize(true)}
              className="flex cursor-pointer items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-[13px] font-medium text-zinc-200 transition hover:bg-zinc-800"
            >
              <Pencil className="h-3.5 w-3.5" /> Customize
            </button>
          </div>
        </div>

        {/* Stats */}
        {!loading && videos.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:max-w-sm">
            <div className="rounded-xl bg-zinc-900/70 px-4 py-3">
              <p className="text-xl font-semibold tabular-nums text-white">{videos.length}</p>
              <p className="text-xs text-zinc-500">Videos</p>
            </div>
            <div className="rounded-xl bg-zinc-900/70 px-4 py-3">
              <p className="text-xl font-semibold tabular-nums text-white">
                {compactNumber.format(totalViews)}
              </p>
              <p className="text-xs text-zinc-500">Total views</p>
            </div>
          </div>
        )}

        {/* Videos */}
        <div className="mt-10 border-t border-zinc-900 pt-6">
          <h2 className="mb-5 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            Your videos
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-video rounded-xl bg-zinc-900" />
                  <div className="mt-3 h-3 w-5/6 rounded bg-zinc-900" />
                  <div className="mt-2 h-3 w-1/3 rounded bg-zinc-900" />
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center py-24 text-center">
              <AlertCircle className="h-8 w-8 text-zinc-600" />
              <p className="mt-4 text-sm font-medium text-zinc-200">Couldn't load your videos</p>
              <button
                onClick={loadMyVideos}
                className="mt-5 cursor-pointer rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200"
              >
                Try again
              </button>
            </div>
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center py-24 text-center">
              <Video className="h-9 w-9 text-zinc-700" />
              <p className="mt-4 text-sm font-medium text-zinc-200">No videos yet</p>
              <p className="mt-1 max-w-xs text-xs text-zinc-500">
                Upload your first video and it will show up here.
              </p>
              <Link
                to="/create"
                className="mt-5 rounded-full bg-white px-5 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200"
              >
                Upload video
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {videos.map((vid) => (
                <VideoCard
                  key={vid.id}
                  vid={vid}
                  deleting={deletingId === vid.id}
                  menuOpen={openMenuId === vid.id}
                  onToggleMenu={() => setOpenMenuId(openMenuId === vid.id ? null : vid.id)}
                  onCloseMenu={() => setOpenMenuId(null)}
                  onDelete={() => handleDelete(vid)}
                />
              ))}
            </div>
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

function VideoCard({ vid, deleting, menuOpen, onToggleMenu, onCloseMenu, onDelete }) {
  const notPublic = vid.visibility && vid.visibility !== "public";
  const processing = vid.isProcessed === false;

  return (
    <div className="group">
      <Link to={`/watch/${vid.id}`} className="relative block aspect-video overflow-hidden rounded-xl bg-zinc-900">
        <video
          src={vid.filepath ? `${vid.filepath}#t=0.5` : undefined}
          preload="metadata"
          muted
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />

        {vid.isLive ? (
          <span className="absolute left-2 top-2 flex items-center gap-1.5 rounded bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-black" />
            Live
          </span>
        ) : (
          vid.duration && (
            <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">
              {vid.duration}
            </span>
          )
        )}

        {(notPublic || processing) && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium capitalize text-zinc-200">
            {processing ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" /> Processing
              </>
            ) : vid.visibility === "schedule" ? (
              <>
                <Clock className="h-3 w-3" /> Scheduled
              </>
            ) : (
              <>
                <Lock className="h-3 w-3" /> {vid.visibility}
              </>
            )}
          </span>
        )}

        {deleting && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
          </div>
        )}
      </Link>

      <div className="mt-3 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[14px] font-medium leading-snug text-white">{vid.title}</h3>
          <p className="mt-1 text-[13px] text-zinc-500">
            {compactNumber.format(vid.views ?? 0)} views
            {vid.uploadedAt && <span> · {formatDate(vid.uploadedAt)}</span>}
          </p>
        </div>

        <div className="relative shrink-0" data-card-menu>
          <button
            aria-label="Video options"
            onClick={onToggleMenu}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-9 z-20 w-40 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 py-1 shadow-2xl">
              <Link
                to={`/edit/${vid.id}`}
                onClick={onCloseMenu}
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
      </div>
    </div>
  );
}

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