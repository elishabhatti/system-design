import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchVideos,
  incrementVideoView,
  toggleSubscribeChannel,
  getCurrentUser,
  fetchCommentsByVideo,
  addCommentToVideo,
  updateCommentApi,
  deleteCommentApi,
  toggleVideoLikeApi
} from "../services/api";
import { io } from "socket.io-client";
import {
  ThumbsUp,
  Share2,
  Bookmark,
  Sparkles,
  Eye,
  Radio,
  Clock,
  Check,
  MessageSquare,
  Send,
  X,
  Copy,
  Code,
  Mail,
  ArrowDownUp,
  SkipForward,
} from "lucide-react";
import Navbar from "../components/Navbar";
import VideoPlayer from "../components/VideoPlayer";

const SOCKET_URL = "http://localhost:3000";
const socket = io(SOCKET_URL);

// Max number of times we'll retry incrementing the view count for a single
// video before giving up. Prevents a "retry storm" where a failing backend
// call gets re-fired on every timeupdate tick (every ~250ms).
const MAX_VIEW_INCREMENT_ATTEMPTS = 3;
const AUTOPLAY_COUNTDOWN_SECONDS = 5;

export default function VideoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [loadingVideos, setLoadingVideos] = useState(true);

  // Likes states
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [likeBursts, setLikeBursts] = useState([]); // ✨ floating "+1" animations

  // Share Modal states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareAtTimestamp, setShareAtTimestamp] = useState(false);

  // User & Subscription states
  const [currentUser, setCurrentUser] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [subscribingLoading, setSubscribingLoading] = useState(false);

  // Comments states
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [commentSort, setCommentSort] = useState("newest"); // ✨ 'newest' | 'top'

  // Comment Editing states
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");

  // Toast notification state
  const [toastMessage, setToastMessage] = useState(null);

  // ✨ Theater mode + autoplay-next state
  const [theaterMode, setTheaterMode] = useState(false);
  const [autoplayCountdown, setAutoplayCountdown] = useState(null);
  const countdownIntervalRef = useRef(null);

  // ✨ Animated view counter
  const [displayedViews, setDisplayedViews] = useState(0);
  const viewAnimFrameRef = useRef(null);
  const currentTimeRef = useRef(0); // last known playback position, for "share at timestamp"

  const countedSessionRef = useRef(new Set());
  const viewAttemptCountRef = useRef({});

  useEffect(() => {
    loadInitialData();
    loadUserData();
  }, []);

  useEffect(() => {
    if (videos.length > 0) {
      if (id) {
        const found = videos.find((v) => String(v.id) === String(id));
        if (found) {
          setCurrentVideo(found);
          loadVideoComments(found.id);
          setAutoplayCountdown(null);
          clearInterval(countdownIntervalRef.current);
        }
      } else {
        navigate(`/watch/${videos[0].id}`, { replace: true });
      }
    }
  }, [id, videos]);

  useEffect(() => {
    if (currentVideo) {
      const count = currentVideo._count?.likes ?? currentVideo.likesCount ?? (Array.isArray(currentVideo.likes) ? currentVideo.likes.length : 0);
      setLikeCount(count);

      if (currentUser && Array.isArray(currentVideo.likes)) {
        const currentUserId = currentUser.id || currentUser._id;
        const hasLiked = currentVideo.likes.some(
          (l) => String(l.userId || l.id) === String(currentUserId)
        );
        setLiked(hasLiked);
      }
    }
  }, [currentVideo, currentUser]);

  const loadUserData = async () => {
    try {
      const data = await getCurrentUser();
      const userObj = data?.user || data?.currentUser || data;
      setCurrentUser(userObj);
    } catch (err) {
      console.error("Failed to fetch current user profile", err);
    }
  };

  const loadVideoComments = async (videoId) => {
    try {
      const res = await fetchCommentsByVideo(videoId);
      setComments(Array.isArray(res) ? res : (res.comments || []));
    } catch (err) {
      console.error("Failed to fetch comments", err);
    }
  };

  useEffect(() => {
    if (currentVideo?.user && currentUser) {
      const subs = currentVideo.user.subscribers || [];
      setSubscriberCount(subs.length);

      const currentUserId = currentUser.id || currentUser._id;
      const isAlreadySubscribed = subs.some(
        sub => String(sub.subscriberId) === String(currentUserId)
      );
      setIsSubscribed(isAlreadySubscribed);
    }
  }, [currentVideo, currentUser]);

  useEffect(() => {
    if (!currentVideo?.id) return;

    socket.emit("join_video_room", currentVideo.id);

    socket.on("view_updated", (data) => {
      if (data && typeof data.views === "number") {
        setCurrentVideo((prev) => {
          if (!prev) return prev;
          return { ...prev, views: data.views };
        });
      }
    });

    return () => {
      socket.emit("leave_video_room", currentVideo.id);
      socket.off("view_updated");
    };
  }, [currentVideo?.id]);

  const loadInitialData = async () => {
    try {
      const data = await fetchVideos();
      const videoArray = Array.isArray(data) ? data : (data.videos || data.data || []);
      setVideos(videoArray);
    } catch (err) {
      console.error("Failed to load videos", err);
    } finally {
      setLoadingVideos(false);
    }
  };

  // ✨ Animated view counter — eases the displayed number toward the real
  // value over ~600ms instead of jumping, whenever `views` changes.
  useEffect(() => {
    const target = currentVideo?.views ?? 0;
    const start = displayedViews;
    if (start === target) return;

    const duration = 600;
    const startTime = performance.now();

    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value = Math.round(start + (target - start) * eased);
      setDisplayedViews(value);
      if (progress < 1) {
        viewAnimFrameRef.current = requestAnimationFrame(step);
      }
    };

    viewAnimFrameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(viewAnimFrameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVideo?.views]);

  const handleSubscribeToggle = async () => {
    if (!currentVideo?.userId) return;

    const currentUserId = currentUser?.id || currentUser?._id;
    if (currentUserId && String(currentVideo.userId) === String(currentUserId)) {
      setToastMessage("You can't subscribe to your own channel!");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setSubscribingLoading(true);
    try {
      const res = await toggleSubscribeChannel(currentVideo.userId);
      setIsSubscribed(res.isSubscribed);
      setSubscriberCount(res.subscriberCount);
    } catch (err) {
      console.error("Failed to toggle subscription", err);
      setToastMessage("Subscription couldn't be updated.");
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setSubscribingLoading(false);
    }
  };

  const handleLikeToggle = async (e) => {
    if (!currentVideo?.id || likeLoading) return;

    setLikeLoading(true);
    const previousLiked = liked;
    const previousCount = likeCount;

    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikeCount(prev => (newLikedState ? prev + 1 : Math.max(0, prev - 1)));

    // ✨ Fire a little floating "+1" burst from the button on like (not unlike)
    if (newLikedState && e?.currentTarget) {
      const burstId = Date.now();
      setLikeBursts((prev) => [...prev, { id: burstId }]);
      setTimeout(() => {
        setLikeBursts((prev) => prev.filter((b) => b.id !== burstId));
      }, 700);
    }

    try {
      const res = await toggleVideoLikeApi(currentVideo.id);
      if (res?.success) {
        setLiked(res.isLiked);
        setLikeCount(res.likeCount);
      }
    } catch (err) {
      console.error("Failed to toggle like", err);
      setLiked(previousLiked);
      setLikeCount(previousCount);
      setToastMessage("Could not update like status.");
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !currentVideo?.id) return;

    const tempCommentId = "temp_" + Date.now();
    const optimisticComment = {
      id: tempCommentId,
      content: newCommentText.trim(),
      createdAt: new Date().toISOString(),
      user: {
        id: currentUser?.id || currentUser?._id || "me",
        channelName: currentUser?.channelName || "You",
        avatarUrl: currentUser?.avatarUrl || null,
      }
    };

    setComments((prev) => [optimisticComment, ...prev]);
    const textToSend = newCommentText.trim();
    setNewCommentText("");

    try {
      const res = await addCommentToVideo(currentVideo.id, textToSend);
      if (res?.comment) {
        setComments((prev) => prev.map(c => c.id === tempCommentId ? res.comment : c));
      }
    } catch (err) {
      console.error("Failed to post comment", err);
      setComments((prev) => prev.filter((c) => c.id !== tempCommentId));
      setToastMessage("Failed to post comment. Please try again.");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // View-increment: attempts at most MAX_VIEW_INCREMENT_ATTEMPTS times per
  // video, then gives up — never re-fires on every timeupdate tick forever.
  const handleTimeUpdate = (e) => {
    const video = e.target;
    currentTimeRef.current = video.currentTime || 0;
    if (!video.duration || !currentVideo?.id) return;

    const videoId = currentVideo.id;
    if (countedSessionRef.current.has(videoId)) return;

    const watchedPercentage = (video.currentTime / video.duration) * 100;
    if (watchedPercentage < 20) return;

    const attempts = viewAttemptCountRef.current[videoId] || 0;
    if (attempts >= MAX_VIEW_INCREMENT_ATTEMPTS) {
      countedSessionRef.current.add(videoId);
      return;
    }

    countedSessionRef.current.add(videoId);
    viewAttemptCountRef.current[videoId] = attempts + 1;

    incrementVideoView(videoId)
      .then((data) => {
        if (data && data.success && typeof data.views === "number") {
          setCurrentVideo((prev) =>
            prev && String(prev.id) === String(videoId) ? { ...prev, views: data.views } : prev
          );
        }
      })
      .catch((err) => {
        console.error(`Failed to increment view (attempt ${attempts + 1}/${MAX_VIEW_INCREMENT_ATTEMPTS})`, err);
        if (attempts + 1 < MAX_VIEW_INCREMENT_ATTEMPTS) {
          countedSessionRef.current.delete(videoId);
        }
      });
  };

  const sidebarVideos = useMemo(
    () => videos.filter((v) => currentVideo && String(v.id) !== String(currentVideo.id)),
    [videos, currentVideo]
  );

  // ✨ Autoplay next — when the video ends, count down before advancing so
  // the user can cancel (mirrors the familiar "up next" pattern).
  const handleVideoEnded = () => {
    if (sidebarVideos.length === 0) return;
    setAutoplayCountdown(AUTOPLAY_COUNTDOWN_SECONDS);
    clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setAutoplayCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          navigate(`/watch/${sidebarVideos[0].id}`);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelAutoplay = () => {
    clearInterval(countdownIntervalRef.current);
    setAutoplayCountdown(null);
  };

  useEffect(() => () => clearInterval(countdownIntervalRef.current), []);

  // ✨ Sorted comments — client-side, no backend change needed. "Top" ranks
  // by like count when the API provides one, falling back to original order.
  const sortedComments = useMemo(() => {
    const arr = [...comments];
    if (commentSort === "top") {
      arr.sort((a, b) => (b.likeCount || b._count?.likes || 0) - (a.likeCount || a._count?.likes || 0));
    } else {
      arr.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return arr;
  }, [comments, commentSort]);

  // Share helpers
  const baseVideoUrl = window.location.href.split("?")[0].split("#")[0];
  const currentVideoUrl = shareAtTimestamp
    ? `${baseVideoUrl}?t=${Math.floor(currentTimeRef.current)}`
    : baseVideoUrl;
  const shareTitle = currentVideo?.title || "Check out this video";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentVideoUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + " " + currentVideoUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentVideoUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentVideoUrl)}&text=${encodeURIComponent(shareTitle)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentVideoUrl)}`,
    reddit: `https://www.reddit.com/submit?url=${encodeURIComponent(currentVideoUrl)}&title=${encodeURIComponent(shareTitle)}`,
    email: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent("Check out this awesome video: " + currentVideoUrl)}`
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
                videoId={currentVideo.id}
                isLive={currentVideo.isLive}
                handleTimeUpdate={handleTimeUpdate}
                onEnded={handleVideoEnded}
                theaterMode={theaterMode}
                onToggleTheater={() => setTheaterMode((t) => !t)}
              />

              {/* ✨ Autoplay "Up Next" countdown overlay */}
              {autoplayCountdown !== null && nextVideo && (
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
                        onClick={() => navigate(`/watch/${nextVideo.id}`)}
                        className="flex-1 bg-white text-black font-bold text-xs py-2 rounded-lg cursor-pointer hover:bg-zinc-200 transition"
                      >
                        Play now
                      </button>
                      <button
                        onClick={cancelAutoplay}
                        className="flex-1 bg-white/10 text-zinc-300 font-semibold text-xs py-2 rounded-lg cursor-pointer hover:bg-white/20 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 flex flex-col gap-4">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                {currentVideo.title}
              </h1>

              {/* Channel + Actions */}
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
                    <h3 className="font-bold text-xs text-zinc-200">
                      {currentVideo.user?.channelName || "Channel"}
                    </h3>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {subscriberCount} subscribers
                    </span>
                  </div>

                  <button
                    onClick={handleSubscribeToggle}
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
                    onClick={handleLikeToggle}
                    disabled={likeLoading}
                    className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      liked
                        ? "bg-white border-white text-black font-bold shadow-lg"
                        : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{likeCount}</span>
                    {/* ✨ Floating "+1" burst */}
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
                    onClick={() => setIsShareModalOpen(true)}
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

              {/* Stats + Description */}
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

              {/* Comments Section UI */}
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

                <form onSubmit={handleAddComment} className="flex gap-2 items-center">
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

                {/* Comments List Layout */}
                <div className="flex flex-col gap-3 mt-2">
                  {sortedComments.length === 0 ? (
                    <p className="text-xs text-zinc-600 text-center py-4 font-mono">No comments yet. Be the first to comment!</p>
                  ) : (
                    sortedComments.map((comm) => {
                      const currentUserId = currentUser?.id || currentUser?._id;
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
                                      onClick={() => {
                                        setEditingCommentId(comm.id);
                                        setEditCommentText(comm.content);
                                      }}
                                      className="text-[10px] text-zinc-400 hover:text-white px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 cursor-pointer transition"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={async () => {
                                        try {
                                          setComments(prev => prev.filter(c => c.id !== comm.id));
                                          await deleteCommentApi(comm.id);
                                        } catch (err) {
                                          console.error("Failed to delete comment", err);
                                          loadVideoComments(currentVideo.id);
                                        }
                                      }}
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
                                  onClick={async () => {
                                    if (!editCommentText.trim()) return;
                                    try {
                                      const res = await updateCommentApi(comm.id, editCommentText);
                                      if (res?.comment) {
                                        setComments(prev => prev.map(c => c.id === comm.id ? res.comment : c));
                                      }
                                      setEditingCommentId(null);
                                    } catch (err) {
                                      console.error("Failed to update comment", err);
                                    }
                                  }}
                                  className="bg-white text-black px-3 py-1 rounded-lg text-xs font-bold cursor-pointer"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingCommentId(null)}
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

            </div>
          </div>
        </div>

        {/* Right: Up Next Queue Sidebar — hidden in theater mode to give the player room */}
        {!theaterMode && (
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
                    onClick={() => navigate(`/watch/${vid.id}`)}
                    className={`group flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all border ${
                      isSelected ? "border-zinc-700 bg-zinc-900 shadow-md" : "border-zinc-900 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900"
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
                      <span className="text-[10px] text-zinc-500 truncate mt-0.5">
                        {vid.user?.channelName || "Channel"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SHARE POPUP MODAL */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">

            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-900">
              <h3 className="font-bold text-sm text-white">Share video</h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-6">

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-4 text-center">

                <a
                  href={shareLinks.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition shadow-md">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] text-zinc-400 group-hover:text-white">WhatsApp</span>
                </a>

                <a
                  href={shareLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition shadow-md">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] text-zinc-400 group-hover:text-white">Facebook</span>
                </a>

                <a
                  href={shareLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200 group-hover:bg-zinc-100 group-hover:text-black transition shadow-md font-bold">
                    𝕏
                  </div>
                  <span className="text-[11px] text-zinc-400 group-hover:text-white">X</span>
                </a>

                <a
                  href={shareLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sky-400 group-hover:bg-sky-600 group-hover:text-white transition shadow-md font-bold">
                    in
                  </div>
                  <span className="text-[11px] text-zinc-400 group-hover:text-white">LinkedIn</span>
                </a>

                <a
                  href={shareLinks.reddit}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-orange-400 group-hover:bg-orange-600 group-hover:text-white transition shadow-md font-bold">
                    R
                  </div>
                  <span className="text-[11px] text-zinc-400 group-hover:text-white">Reddit</span>
                </a>

                <a
                  href={shareLinks.email}
                  className="flex flex-col items-center gap-1.5 group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 group-hover:bg-zinc-200 group-hover:text-black transition shadow-md">
                    <Mail className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] text-zinc-400 group-hover:text-white">Email</span>
                </a>

              </div>

              {/* ✨ Share-at-current-timestamp toggle */}
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
                  onClick={copyToClipboard}
                  className="bg-white hover:bg-zinc-200 text-black px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-zinc-800 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 transition-all">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          <p className="text-xs font-semibold">{toastMessage}</p>
        </div>
      )}

      {/* ✨ Keyframes for the like "+1" burst — Tailwind's arbitrary-value
          animation utility (`animate-[likeBurst_...]`) picks this up
          automatically since it's a global stylesheet rule. */}
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

function formatShareTime(sec) {
  const s = Math.floor(sec || 0);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}