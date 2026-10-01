import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchVideos, getCurrentUser } from "../services/api";
import {
  ThumbsUp,
  Share2,
  Check,
  MessageSquare,
  Send,
  X,
  Copy,
  Mail,
  ArrowDownUp,
  SkipForward,
} from "lucide-react";
import Navbar from "../components/Navbar";
import VideoPlayer from "../components/VideoPlayer";

import { useVideoLikes } from "../hooks/useVideoLikes";
import { useChannelSubscription } from "../hooks/useChannelSubscription";
import { useVideoComments } from "../hooks/useVideoComment";
import { useLiveViewCount } from "../hooks/useLiveViewCount";
import { useViewIncrementOnWatch } from "../hooks/useViewIncrementOnWatch";
import { useAutoplayNext } from "../hooks/useAutoplayNext";
import { useShareModal, formatShareTime } from "../hooks/useShareModal";
import { useToast } from "../hooks/useToast";
import { useQualityOptions } from "../hooks/useQualityOptions";

// Backend origin: HLS playlists/segments are served by the backend (via Nginx).
// Normalised so it never ends with "/" or "/api" -- either would break the HLS URL.
const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost")
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

// Joins base + path with exactly ONE slash between them.
const joinUrl = (base, path) =>
  `${base.replace(/\/+$/, "")}/${String(path).replace(/^\/+/, "")}`;

// HLS ready => master.m3u8 (adaptive), otherwise original MP4 (fallback).
const getPlaybackSrc = (video) =>
  video?.hlsPath ? joinUrl(API_ORIGIN, video.hlsPath) : video?.filepath;

export default function VideoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [theaterMode, setTheaterMode] = useState(false);

  const currentTimeRef = useRef(0); // last known playback position, for "share at timestamp"

  const { toastMessage, showToast } = useToast();

  const { liked, likeCount, likeLoading, likeBursts, handleLikeToggle } = useVideoLikes(
    currentVideo,
    currentUser
  );

  const { isSubscribed, subscriberCount, subscribingLoading, handleSubscribeToggle } =
    useChannelSubscription(currentVideo, currentUser);

  const {
    sortedComments,
    comments,
    commentSort,
    setCommentSort,
    newCommentText,
    setNewCommentText,
    handleAddComment,
    editingCommentId,
    editCommentText,
    setEditCommentText,
    startEditingComment,
    cancelEditingComment,
    saveEditedComment,
    deleteComment,
  } = useVideoComments(currentVideo?.id, currentUser);

  const displayedViews = useLiveViewCount(currentVideo, setCurrentVideo);
  const qualityOptions = useQualityOptions(currentVideo);
  const handleTimeUpdateRaw = useViewIncrementOnWatch(currentVideo?.id, setCurrentVideo);
  const handleTimeUpdate = (e) => handleTimeUpdateRaw(e, currentTimeRef);

  const sidebarVideos = useMemo(
    () => videos.filter((v) => currentVideo && String(v.id) !== String(currentVideo.id)),
    [videos, currentVideo]
  );

  const { autoplayCountdown, handleVideoEnded, cancelAutoplay } = useAutoplayNext(
    sidebarVideos,
    navigate
  );

  const {
    isShareModalOpen,
    setIsShareModalOpen,
    copied,
    shareAtTimestamp,
    setShareAtTimestamp,
    currentVideoUrl,
    shareLinks,
    copyToClipboard,
  } = useShareModal(currentVideo, currentTimeRef);

  // Initial data load
  useEffect(() => {
    fetchVideos()
      .then((data) => {
        const videoArray = Array.isArray(data) ? data : data.videos || data.data || [];
        setVideos(videoArray);
      })
      .catch((err) => console.error("Failed to load videos", err))
      .finally(() => setLoadingVideos(false));

    getCurrentUser()
      .then((data) => setCurrentUser(data?.user || data?.currentUser || data))
      .catch((err) => console.error("Failed to fetch current user profile", err));
  }, []);

  // Resolve :id -> currentVideo, or redirect to the first video
  useEffect(() => {
    if (videos.length === 0) return;

    if (!id) {
      navigate(`/watch/${videos[0].id}`, { replace: true });
      return;
    }

    const found = videos.find((v) => String(v.id) === String(id));
    if (found) setCurrentVideo(found);
  }, [id, videos, navigate]);

  const handleLike = async (e) => {
    const { error } = await handleLikeToggle(e);
    if (error) showToast(error);
  };

  const handleSubscribe = async () => {
    const { toast } = await handleSubscribeToggle();
    if (toast) showToast(toast);
  };

  const handlePostComment = async (e) => {
    const { error } = await handleAddComment(e);
    if (error) showToast(error);
  };

  if (loadingVideos) {
    return (
      <div className="min-h-screen bg-[#09090b]">
        <Navbar />
        <div className="flex min-h-[70vh] flex-col items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
          <p className="mt-3 text-xs text-zinc-500">Loading video</p>
        </div>
      </div>
    );
  }

  if (!currentVideo) {
    return (
      <div className="min-h-screen bg-[#09090b]">
        <Navbar />
        <p className="py-32 text-center text-sm text-zinc-500">
          This video isn't available.
        </p>
      </div>
    );
  }

  const nextVideo = sidebarVideos[0];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <Navbar />
      <div
        className={`mx-auto grid grid-cols-1 gap-6 px-4 py-6 transition-all duration-300 lg:px-8 ${
          theaterMode ? "max-w-full lg:grid-cols-1" : "max-w-[1800px] lg:grid-cols-12"
        }`}
      >
        {/* Left: player, info, comments */}
        <div className={`flex min-w-0 flex-col gap-4 ${theaterMode ? "" : "lg:col-span-8 xl:col-span-9"}`}>
          <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
            <VideoPlayer
              key={currentVideo.id}
              src={getPlaybackSrc(currentVideo)}
              qualities={currentVideo.hlsPath ? [] : qualityOptions}
              videoId={currentVideo.id}
              isLive={currentVideo.isLive}
              handleTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnded}
              theaterMode={theaterMode}
              onToggleTheater={() => setTheaterMode((t) => !t)}
            />

            {autoplayCountdown !== null && nextVideo && (
              <AutoplayOverlay
                autoplayCountdown={autoplayCountdown}
                nextVideo={nextVideo}
                onPlayNow={() => navigate(`/watch/${nextVideo.id}`)}
                onCancel={cancelAutoplay}
              />
            )}
          </div>

          <h1 className="text-lg font-semibold leading-snug tracking-tight text-white sm:text-xl">
            {currentVideo.title}
          </h1>

          <ChannelAndActionsRow
            currentVideo={currentVideo}
            subscriberCount={subscriberCount}
            isSubscribed={isSubscribed}
            subscribingLoading={subscribingLoading}
            onSubscribeToggle={handleSubscribe}
            liked={liked}
            likeCount={likeCount}
            likeLoading={likeLoading}
            likeBursts={likeBursts}
            onLikeToggle={handleLike}
            onShareClick={() => setIsShareModalOpen(true)}
          />

          <VideoStatsAndDescription
            currentVideo={currentVideo}
            displayedViews={displayedViews}
            likeCount={likeCount}
          />

          <CommentsSection
            comments={comments}
            sortedComments={sortedComments}
            commentSort={commentSort}
            setCommentSort={setCommentSort}
            newCommentText={newCommentText}
            setNewCommentText={setNewCommentText}
            onPostComment={handlePostComment}
            currentUser={currentUser}
            editingCommentId={editingCommentId}
            editCommentText={editCommentText}
            setEditCommentText={setEditCommentText}
            onStartEdit={startEditingComment}
            onCancelEdit={cancelEditingComment}
            onSaveEdit={saveEditedComment}
            onDelete={deleteComment}
          />
        </div>

        {/* Right: Up next */}
        {!theaterMode && (
          <UpNextSidebar
            sidebarVideos={sidebarVideos}
            onSelect={(vidId) => navigate(`/watch/${vidId}`)}
          />
        )}
      </div>

      {isShareModalOpen && (
        <ShareModal
          onClose={() => setIsShareModalOpen(false)}
          shareLinks={shareLinks}
          shareAtTimestamp={shareAtTimestamp}
          setShareAtTimestamp={setShareAtTimestamp}
          currentTimeRef={currentTimeRef}
          currentVideoUrl={currentVideoUrl}
          copied={copied}
          onCopy={copyToClipboard}
        />
      )}

      {toastMessage && <Toast message={toastMessage} />}

      <style>{`
        @keyframes likeBurst {
          0% { opacity: 0; transform: translateY(0) scale(0.8); }
          20% { opacity: 1; transform: translateY(-4px) scale(1.1); }
          100% { opacity: 0; transform: translateY(-22px) scale(1); }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Presentational sub-components
// ---------------------------------------------------------------------------

function Avatar({ url, name, className = "h-10 w-10 text-sm" }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 font-semibold text-zinc-200 ${className}`}
    >
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        (name || "U")[0].toUpperCase()
      )}
    </div>
  );
}

function AutoplayOverlay({ autoplayCountdown, nextVideo, onPlayNow, onCancel }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl">
        <div className="mb-3 flex items-center gap-2 text-[12px] text-zinc-400">
          <SkipForward className="h-3.5 w-3.5" />
          Up next in {autoplayCountdown}s
        </div>
        <div className="mb-4 flex items-center gap-3">
          <div className="aspect-video w-24 shrink-0 overflow-hidden rounded-lg bg-zinc-900">
            {/* preload="metadata": only the first frame, not the whole file */}
            <video
              src={nextVideo.filepath ? `${nextVideo.filepath}#t=0.5` : undefined}
              preload="metadata"
              className="h-full w-full object-cover"
              muted
            />
          </div>
          <h4 className="line-clamp-2 text-sm font-medium leading-snug text-white">
            {nextVideo.title}
          </h4>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onPlayNow}
            className="flex-1 cursor-pointer rounded-lg bg-white py-2 text-xs font-semibold text-black transition hover:bg-zinc-200"
          >
            Play now
          </button>
          <button
            onClick={onCancel}
            className="flex-1 cursor-pointer rounded-lg bg-zinc-900 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function ChannelAndActionsRow({
  currentVideo,
  subscriberCount,
  isSubscribed,
  subscribingLoading,
  onSubscribeToggle,
  liked,
  likeCount,
  likeLoading,
  likeBursts,
  onLikeToggle,
  onShareClick,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar
          url={currentVideo.user?.avatarUrl}
          name={currentVideo.user?.channelName || "C"}
        />
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-white">
            {currentVideo.user?.channelName || "Channel"}
          </h3>
          <span className="text-xs text-zinc-500">{subscriberCount} subscribers</span>
        </div>

        <button
          onClick={onSubscribeToggle}
          disabled={subscribingLoading}
          className={`ml-2 flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition active:scale-95 disabled:opacity-50 ${
            isSubscribed
              ? "bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
              : "bg-white text-black hover:bg-zinc-200"
          }`}
        >
          {isSubscribed && <Check className="h-3.5 w-3.5" />}
          {isSubscribed ? "Subscribed" : "Subscribe"}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onLikeToggle}
          disabled={likeLoading}
          className={`relative flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition ${
            liked
              ? "bg-white text-black"
              : "bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
          }`}
        >
          <ThumbsUp className={`h-4 w-4 ${liked ? "fill-black" : ""}`} />
          <span className="tabular-nums">{likeCount}</span>
          {likeBursts.map((b) => (
            <span
              key={b.id}
              className="pointer-events-none absolute -top-3 right-2 animate-[likeBurst_0.7s_ease-out_forwards] text-[10px] font-bold text-white"
            >
              +1
            </span>
          ))}
        </button>

        <button
          onClick={onShareClick}
          className="flex cursor-pointer items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-[13px] font-medium text-zinc-200 transition hover:bg-zinc-800"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>
    </div>
  );
}

function VideoStatsAndDescription({ currentVideo, displayedViews, likeCount }) {
  const [expanded, setExpanded] = useState(false);
  const description = currentVideo.description?.trim();
  const dateText = currentVideo.uploadedAt
    ? new Date(currentVideo.uploadedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="rounded-xl bg-zinc-900/70 p-4 text-[13px]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-medium text-zinc-200">
        <span className="tabular-nums">{displayedViews.toLocaleString()} views</span>
        <span className="text-zinc-600">·</span>
        <span className="tabular-nums">{likeCount} likes</span>
        {dateText && (
          <>
            <span className="text-zinc-600">·</span>
            <span>{dateText}</span>
          </>
        )}
      </div>

      {description && (
        <>
          <p
            className={`mt-3 whitespace-pre-line leading-relaxed text-zinc-400 ${
              expanded ? "" : "line-clamp-3"
            }`}
          >
            {description}
          </p>
          {description.length > 160 && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="mt-2 cursor-pointer text-xs font-medium text-white hover:underline"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function CommentsSection({
  comments,
  sortedComments,
  commentSort,
  setCommentSort,
  newCommentText,
  setNewCommentText,
  onPostComment,
  currentUser,
  editingCommentId,
  editCommentText,
  setEditCommentText,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}) {
  const currentUserId = currentUser?.id || currentUser?._id;

  return (
    <section className="mt-2 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold text-white">
          <MessageSquare className="h-4 w-4 text-zinc-500" />
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </h3>
        <button
          onClick={() => setCommentSort((s) => (s === "newest" ? "top" : "newest"))}
          className="flex cursor-pointer items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
        >
          <ArrowDownUp className="h-3.5 w-3.5" />
          {commentSort === "newest" ? "Newest" : "Top"}
        </button>
      </div>

      <form onSubmit={onPostComment} className="flex items-center gap-3">
        <Avatar
          url={currentUser?.avatarUrl}
          name={currentUser?.channelName || "U"}
          className="h-9 w-9 text-xs"
        />
        <input
          type="text"
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder="Add a comment"
          className="w-full rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-[13px] text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-500"
        />
        <button
          type="submit"
          disabled={!newCommentText.trim()}
          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-[13px] font-semibold text-black transition hover:bg-zinc-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Send className="h-3.5 w-3.5" />
          Post
        </button>
      </form>

      <div className="flex flex-col gap-5">
        {sortedComments.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-600">
            No comments yet. Start the conversation.
          </p>
        ) : (
          sortedComments.map((comm) => {
            const commentUserId = comm.user?.id || comm.userId;
            const isOwner = currentUserId && String(commentUserId) === String(currentUserId);
            const isEditing = editingCommentId === comm.id;

            return (
              <div key={comm.id} className="group flex items-start gap-3">
                <Avatar
                  url={comm.user?.avatarUrl}
                  name={comm.user?.channelName || "U"}
                  className="h-9 w-9 text-xs"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-zinc-200">
                      {comm.user?.channelName || "User"}
                    </span>
                    <span className="text-zinc-600">
                      {comm.createdAt ? new Date(comm.createdAt).toLocaleDateString() : "Just now"}
                    </span>

                    {isOwner && !isEditing && (
                      <div className="ml-auto flex items-center gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                        <button
                          onClick={() => onStartEdit(comm)}
                          className="cursor-pointer rounded-md px-2 py-1 text-[11px] text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(comm.id)}
                          className="cursor-pointer rounded-md px-2 py-1 text-[11px] text-red-400 transition hover:bg-zinc-900 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={editCommentText}
                        onChange={(e) => setEditCommentText(e.target.value)}
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-[13px] text-white outline-none focus:border-zinc-500"
                      />
                      <button
                        onClick={onSaveEdit}
                        className="cursor-pointer rounded-lg bg-white px-3 py-1 text-xs font-semibold text-black transition hover:bg-zinc-200"
                      >
                        Save
                      </button>
                      <button
                        onClick={onCancelEdit}
                        className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1 text-xs text-zinc-400 transition hover:bg-zinc-800"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-zinc-300">
                      {comm.content}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function UpNextSidebar({ sidebarVideos, onSelect }) {
  return (
    <aside className="flex flex-col gap-3 lg:col-span-4 xl:col-span-3">
      <div className="flex items-baseline justify-between px-1">
        <h3 className="text-sm font-semibold text-white">Up next</h3>
        <span className="text-xs text-zinc-600">{sidebarVideos.length} videos</span>
      </div>

      <div className="flex max-h-[calc(100vh-8rem)] flex-col gap-1 overflow-y-auto pr-1">
        {sidebarVideos.map((vid) => (
          <div
            key={vid.id}
            onClick={() => onSelect(vid.id)}
            className="group flex cursor-pointer gap-3 rounded-xl p-1.5 transition hover:bg-zinc-900/70"
          >
            <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-zinc-900">
              {/* preload="metadata": without it every sidebar item can download its whole MP4 */}
              <video
                src={vid.filepath ? `${vid.filepath}#t=0.5` : undefined}
                preload="metadata"
                className="h-full w-full object-cover"
                muted
              />
              {vid.duration && (
                <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-[10px] font-medium tabular-nums text-white">
                  {vid.duration}
                </span>
              )}
            </div>
            <div className="min-w-0 py-0.5">
              <h4 className="line-clamp-2 text-[13px] font-medium leading-snug text-zinc-100 group-hover:text-white">
                {vid.title}
              </h4>
              <p className="mt-1 truncate text-xs text-zinc-500">
                {vid.user?.channelName || "Channel"}
              </p>
              <p className="text-xs text-zinc-600">{(vid.views ?? 0).toLocaleString()} views</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function ShareModal({
  onClose,
  shareLinks,
  shareAtTimestamp,
  setShareAtTimestamp,
  currentTimeRef,
  currentVideoUrl,
  copied,
  onCopy,
}) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <h3 className="text-sm font-semibold text-white">Share</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-full p-1.5 text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-6 px-5 pb-6">
          <div className="grid grid-cols-4 gap-4 text-center sm:grid-cols-6">
            <ShareIconLink href={shareLinks.whatsapp} label="WhatsApp">
              <MessageSquare className="h-5 w-5" />
            </ShareIconLink>
            <ShareIconLink href={shareLinks.facebook} label="Facebook">
              <Share2 className="h-5 w-5" />
            </ShareIconLink>
            <ShareIconLink href={shareLinks.twitter} label="X">
              <span className="text-base font-bold">𝕏</span>
            </ShareIconLink>
            <ShareIconLink href={shareLinks.linkedin} label="LinkedIn">
              <span className="text-sm font-bold">in</span>
            </ShareIconLink>
            <ShareIconLink href={shareLinks.reddit} label="Reddit">
              <span className="text-sm font-bold">R</span>
            </ShareIconLink>
            <ShareIconLink href={shareLinks.email} label="Email" external={false}>
              <Mail className="h-5 w-5" />
            </ShareIconLink>
          </div>

          <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={shareAtTimestamp}
              onChange={(e) => setShareAtTimestamp(e.target.checked)}
              className="h-3.5 w-3.5 cursor-pointer accent-white"
            />
            Start at {formatShareTime(currentTimeRef.current)}
          </label>

          <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-black p-1.5">
            <input
              type="text"
              readOnly
              value={currentVideoUrl}
              className="w-full bg-transparent px-3 font-mono text-xs text-zinc-300 outline-none"
            />
            <button
              onClick={onCopy}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200 active:scale-95"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShareIconLink({ href, label, children, external = true }) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="group flex cursor-pointer flex-col items-center gap-1.5"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-zinc-300 transition group-hover:bg-white group-hover:text-black">
        {children}
      </span>
      <span className="text-[11px] text-zinc-500 group-hover:text-white">{label}</span>
    </a>
  );
}

function Toast({ message }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white shadow-2xl">
      <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
      <p className="text-xs font-medium">{message}</p>
    </div>
  );
}