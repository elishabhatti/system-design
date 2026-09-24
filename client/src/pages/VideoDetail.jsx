import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchVideos, getCurrentUser } from "../services/api";
import {
  ThumbsUp,
  Share2,
  Bookmark,
  Sparkles,
  Eye,
  Clock,
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
      <div className="flex flex-col items-center justify-center min-h-[75vh] bg-black">
        <div className="w-6 h-6 border-2 border-zinc-600 border-t-white rounded-full animate-spin"></div>
        <p className="text-xs text-zinc-500 mt-3 font-mono">Loading player stream...</p>
      </div>
    );
  }

  if (!currentVideo) {
    return (
      <div className="text-center py-20 text-zinc-500 text-xs bg-black">
        No videos available in your library.
      </div>
    );
  }

  const nextVideo = sidebarVideos[0];

  return (
    <div className="min-h-screen bg-black text-zinc-100 relative">
      <Navbar />
      <div
        className={`max-w-7xl mx-auto px-4 lg:px-8 py-6 grid grid-cols-1 gap-6 relative transition-all duration-300 ${
          theaterMode ? "lg:grid-cols-1 max-w-full" : "lg:grid-cols-12"
        }`}
      >
        {/* Left: Player Card, Info & Comments */}
        <div className={`flex flex-col gap-4 ${theaterMode ? "" : "lg:col-span-8 xl:col-span-9"}`}>
          <div className="border border-zinc-900 rounded-2xl shadow-2xl overflow-hidden bg-zinc-950 relative">
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <VideoPlayer
                key={currentVideo.id}
                src={currentVideo.filepath}
                qualities={qualityOptions}
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

            <div className="p-5 flex flex-col gap-4">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
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

              <VideoStatsAndDescription currentVideo={currentVideo} displayedViews={displayedViews} likeCount={likeCount} />

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
          </div>
        </div>

        {/* Right: Up Next Queue Sidebar */}
        {!theaterMode && (
          <UpNextSidebar
            videos={videos}
            sidebarVideos={sidebarVideos}
            currentVideo={currentVideo}
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
// Presentational sub-components (no logic — just rendering, kept in this
// file since they're only used here; split out to their own files if they
// grow or get reused).
// ---------------------------------------------------------------------------

function AutoplayOverlay({ autoplayCountdown, nextVideo, onPlayNow, onCancel }) {
  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-30 p-6">
      <div className="bg-[#121216] border border-white/15 rounded-2xl p-5 w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-2 text-zinc-400 text-[11px] font-mono mb-3">
          <SkipForward className="w-3.5 h-3.5" />
          Up next in {autoplayCountdown}s
        </div>
        <div className="flex gap-3 items-center mb-4">
          <div className="w-24 aspect-video bg-black rounded-lg overflow-hidden shrink-0 border border-zinc-800">
            <video src={nextVideo.filepath} className="w-full h-full object-cover" muted />
          </div>
          <h4 className="text-xs font-bold text-white leading-snug">{nextVideo.title}</h4>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onPlayNow}
            className="flex-1 bg-white text-black font-bold text-xs py-2 rounded-lg cursor-pointer hover:bg-zinc-200 transition"
          >
            Play now
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-white/10 text-zinc-300 font-semibold text-xs py-2 rounded-lg cursor-pointer hover:bg-white/20 transition"
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
    <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-900">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-md border border-zinc-800 overflow-hidden bg-zinc-900">
          {currentVideo.user?.avatarUrl ? (
            <img src={currentVideo.user.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            (currentVideo.user?.channelName || "E")[0].toUpperCase()
          )}
        </div>
        <div>
          <h3 className="font-bold text-xs text-zinc-200">{currentVideo.user?.channelName || "Channel"}</h3>
          <span className="text-[10px] text-zinc-500 font-mono">{subscriberCount} subscribers</span>
        </div>

        <button
          onClick={onSubscribeToggle}
          disabled={subscribingLoading}
          className={`ml-3 flex items-center gap-1.5 font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer shadow-lg active:scale-95 disabled:opacity-50 ${
            isSubscribed
              ? "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
              : "bg-white text-black hover:bg-zinc-200"
          }`}
        >
          {isSubscribed && <Check className="w-3.5 h-3.5" />}
          <span>{isSubscribed ? "Subscribed" : "Subscribe"}</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onLikeToggle}
          disabled={likeLoading}
          className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
            liked
              ? "bg-white border-white text-black font-bold shadow-lg"
              : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300"
          }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          <span>{likeCount}</span>
          {likeBursts.map((b) => (
            <span
              key={b.id}
              className="absolute -top-3 right-1 text-violet-400 text-[10px] font-bold pointer-events-none animate-[likeBurst_0.7s_ease-out_forwards]"
            >
              +1
            </span>
          ))}
        </button>

        <button
          onClick={onShareClick}
          className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 px-3.5 py-2 rounded-xl text-xs font-semibold border border-zinc-800 transition cursor-pointer text-zinc-300"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>

        <button className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 px-3.5 py-2 rounded-xl text-xs font-semibold border border-zinc-800 transition cursor-pointer text-zinc-300">
          <Bookmark className="w-3.5 h-3.5" />
          <span>Save</span>
        </button>
      </div>
    </div>
  );
}

function VideoStatsAndDescription({ currentVideo, displayedViews, likeCount }) {
  return (
    <div className="border border-zinc-900 rounded-xl p-4 text-xs text-zinc-300 leading-relaxed bg-zinc-950">
      <div className="flex flex-wrap items-center gap-4 font-semibold text-zinc-400 mb-3 pb-3 border-b border-zinc-900">
        <span className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-zinc-500" />
          <span className="tabular-nums">{displayedViews.toLocaleString()}</span> views
        </span>
        <span className="flex items-center gap-1.5">
          <ThumbsUp className="w-3.5 h-3.5 text-zinc-500" />
          {likeCount} likes
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[11px]">
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
          {currentVideo.uploadedAt ? new Date(currentVideo.uploadedAt).toLocaleDateString() : "—"}
        </span>
      </div>
      <p className="text-zinc-400 font-normal">
        {currentVideo.description || "Enjoy this immersive media stream configured directly from your library feed."}
      </p>
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
    <div className="mt-4 flex flex-col gap-4 border border-zinc-900 rounded-xl p-4 bg-zinc-950">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-zinc-400" />
          <h3 className="font-bold text-xs text-white">
            Comments <span className="text-zinc-500 font-mono font-normal">({comments.length})</span>
          </h3>
        </div>
        <button
          onClick={() => setCommentSort((s) => (s === "newest" ? "top" : "newest"))}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
        >
          <ArrowDownUp className="w-3 h-3" />
          {commentSort === "newest" ? "Newest" : "Top"}
        </button>
      </div>

      <form onSubmit={onPostComment} className="flex gap-2 items-center">
        <input
          type="text"
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder="Add a public comment..."
          className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition"
        />
        <button
          type="submit"
          className="bg-white text-black hover:bg-zinc-200 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md active:scale-95"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Post</span>
        </button>
      </form>

      <div className="flex flex-col gap-3 mt-2">
        {sortedComments.length === 0 ? (
          <p className="text-xs text-zinc-600 text-center py-4 font-mono">No comments yet. Be the first to comment!</p>
        ) : (
          sortedComments.map((comm) => {
            const commentUserId = comm.user?.id || comm.userId;
            const isOwner = currentUserId && String(commentUserId) === String(currentUserId);
            const isEditing = editingCommentId === comm.id;

            return (
              <div key={comm.id} className="flex gap-3 items-start p-3 rounded-xl bg-black border border-zinc-900/60 relative group">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden text-zinc-300">
                  {comm.user?.avatarUrl ? (
                    <img src={comm.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (comm.user?.channelName || "U")[0].toUpperCase()
                  )}
                </div>

                <div className="flex flex-col w-full">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-zinc-300">{comm.user?.channelName || "User"}</span>

                    <div className="flex items-center gap-2.5">
                      {isOwner && !isEditing && (
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => onStartEdit(comm)}
                            className="text-[10px] text-zinc-400 hover:text-white px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 cursor-pointer transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDelete(comm.id)}
                            className="text-[10px] text-red-400 hover:text-red-300 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 cursor-pointer transition"
                          >
                            Delete
                          </button>
                        </div>
                      )}

                      <span className="text-[10px] text-zinc-600 font-mono">
                        {comm.createdAt ? new Date(comm.createdAt).toLocaleDateString() : "Just now"}
                      </span>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={editCommentText}
                        onChange={(e) => setEditCommentText(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <button
                        onClick={onSaveEdit}
                        className="bg-white text-black px-3 py-1 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        onClick={onCancelEdit}
                        className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-1 rounded-lg text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{comm.content}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function UpNextSidebar({ videos, sidebarVideos, currentVideo, onSelect }) {
  return (
    <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-3">
      <div className="border border-zinc-900 rounded-2xl p-3.5 flex items-center justify-between shadow-lg bg-zinc-950">
        <div>
          <h3 className="font-bold text-xs text-white">Queue Stream Mix</h3>
          <span className="text-[10px] text-zinc-500 font-mono">{videos.length} videos available</span>
        </div>
        <Sparkles className="w-4 h-4 text-zinc-400" />
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto max-h-[70vh] pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
        {sidebarVideos.map((vid, idx) => {
          const isSelected = String(currentVideo.id) === String(vid.id);
          return (
            <div
              key={vid.id}
              onClick={() => onSelect(vid.id)}
              className={`group flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all border ${
                isSelected
                  ? "border-zinc-700 bg-zinc-900 shadow-md"
                  : "border-zinc-900 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900"
              }`}
            >
              <div className="w-28 aspect-video bg-black rounded-lg overflow-hidden relative shrink-0 border border-zinc-800">
                <video src={vid.filepath} className="w-full h-full object-cover" muted />
                <span className="absolute bottom-1 right-1 bg-black/90 text-[9px] px-1 rounded text-zinc-300 font-mono">
                  {vid.duration || "—"}
                </span>
              </div>
              <div className="flex flex-col overflow-hidden w-full">
                <span className="text-[10px] font-mono text-zinc-500 mb-0.5">#{idx + 1} in queue</span>
                <h4 className={`font-semibold text-xs truncate ${isSelected ? "text-white font-bold" : "text-zinc-300 group-hover:text-white"}`}>
                  {vid.title}
                </h4>
                <span className="text-[10px] text-zinc-500 truncate mt-0.5">{vid.user?.channelName || "Channel"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ShareModal({ onClose, shareLinks, shareAtTimestamp, setShareAtTimestamp, currentTimeRef, currentVideoUrl, copied, onCopy }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-900">
          <h3 className="font-bold text-sm text-white">Share video</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-4 text-center">
            <ShareIconLink href={shareLinks.whatsapp} label="WhatsApp" colorClass="text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black">
              <MessageSquare className="w-5 h-5" />
            </ShareIconLink>
            <ShareIconLink href={shareLinks.facebook} label="Facebook" colorClass="text-blue-400 group-hover:bg-blue-600 group-hover:text-white">
              <Share2 className="w-5 h-5" />
            </ShareIconLink>
            <ShareIconLink href={shareLinks.twitter} label="X" colorClass="text-zinc-200 group-hover:bg-zinc-100 group-hover:text-black font-bold">
              𝕏
            </ShareIconLink>
            <ShareIconLink href={shareLinks.linkedin} label="LinkedIn" colorClass="text-sky-400 group-hover:bg-sky-600 group-hover:text-white font-bold">
              in
            </ShareIconLink>
            <ShareIconLink href={shareLinks.reddit} label="Reddit" colorClass="text-orange-400 group-hover:bg-orange-600 group-hover:text-white font-bold">
              R
            </ShareIconLink>
            <ShareIconLink href={shareLinks.email} label="Email" colorClass="text-zinc-300 group-hover:bg-zinc-200 group-hover:text-black" external={false}>
              <Mail className="w-5 h-5" />
            </ShareIconLink>
          </div>

          <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={shareAtTimestamp}
              onChange={(e) => setShareAtTimestamp(e.target.checked)}
              className="accent-violet-500 w-3.5 h-3.5 cursor-pointer"
            />
            Share starting at {formatShareTime(currentTimeRef.current)}
          </label>

          <div className="flex items-center gap-2 bg-black border border-zinc-800 rounded-xl p-1.5">
            <input
              type="text"
              readOnly
              value={currentVideoUrl}
              className="w-full bg-transparent px-3 text-xs text-zinc-300 focus:outline-none font-mono"
            />
            <button
              onClick={onCopy}
              className="bg-white hover:bg-zinc-200 text-black px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShareIconLink({ href, label, colorClass, children, external = true }) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="flex flex-col items-center gap-1.5 group cursor-pointer"
    >
      <div className={`w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center transition shadow-md ${colorClass}`}>
        {children}
      </div>
      <span className="text-[11px] text-zinc-400 group-hover:text-white">{label}</span>
    </a>
  );
}

function Toast({ message }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-zinc-800 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 transition-all">
      <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
      <p className="text-xs font-semibold">{message}</p>
    </div>
  );
}