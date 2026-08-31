import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  fetchVideos, 
  incrementVideoView, 
  toggleSubscribeChannel, 
  getCurrentUser, 
  fetchComments, 
  addComment 
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
} from "lucide-react";
import Navbar from "../components/Navbar";
import VideoPlayer from "../components/VideoPlayer";

const SOCKET_URL = "http://localhost:3000"; 
const socket = io(SOCKET_URL);

export default function VideoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [liked, setLiked] = useState(false);

  // User & Subscription states
  const [currentUser, setCurrentUser] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [subscribingLoading, setSubscribingLoading] = useState(false);

  // Comments states
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [commentingLoading, setCommentingLoading] = useState(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState(null);

  const countedSessionRef = useRef(new Set());

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
        }
      } else {
        navigate(`/watch/${videos[0].id}`, { replace: true });
      }
    }
  }, [id, videos]);

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
      const res = await fetchComments(videoId);
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

  // 🚀 Optimistic UI Comment Handler
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

    // 1. Instant UI update (Optimistic rendering)
    setComments((prev) => [optimisticComment, ...prev]);
    const textToSend = newCommentText.trim();
    setNewCommentText("");

    try {
      // 2. Background request to backend queue/DB
      const res = await addComment(currentVideo.id, textToSend);
      // Replace temporary comment with real response data if needed
      if (res?.comment) {
        setComments((prev) => prev.map(c => c.id === tempCommentId ? res.comment : c));
      }
    } catch (err) {
      console.error("Failed to post comment", err);
      setToastMessage("Comment saved locally, syncing failed.");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleTimeUpdate = (e) => {
    const video = e.target;
    if (!video.duration || !currentVideo?.id) return;
    if (countedSessionRef.current.has(currentVideo.id)) return;

    const watchedPercentage = (video.currentTime / video.duration) * 100;
    if (watchedPercentage >= 20) {
      countedSessionRef.current.add(currentVideo.id);
      incrementVideoView(currentVideo.id)
        .then((data) => {
          if (data && data.success && typeof data.views === "number") {
            setCurrentVideo((prev) => ({ ...prev, views: data.views }));
          }
        })
        .catch(() => countedSessionRef.current.delete(currentVideo.id));
    }
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

  const sidebarVideos = videos.filter((v) => String(v.id) !== String(currentVideo.id));

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        
        {/* Left: Player Card, Info & Comments */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-4">
          <div className="border border-zinc-900 rounded-2xl shadow-2xl overflow-hidden bg-zinc-950">
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <VideoPlayer
                key={currentVideo.id}
                src={currentVideo.filepath}
                isLive={currentVideo.isLive}
                handleTimeUpdate={handleTimeUpdate}
              />
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
                      {currentVideo.user?.channelName || "Elisha Jameel"}
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
                    onClick={() => setLiked(!liked)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      liked
                        ? "bg-white border-white text-black font-bold shadow-lg"
                        : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{liked ? "28.1K" : "28K"}</span>
                  </button>

                  <button className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 px-3.5 py-2 rounded-xl text-xs font-semibold border border-zinc-800 transition cursor-pointer text-zinc-300">
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
                    {currentVideo.views ?? 0} views
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ThumbsUp className="w-3.5 h-3.5 text-zinc-500" />
                    28K likes
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    {currentVideo.uploadedAt ? new Date(currentVideo.uploadedAt).toLocaleDateString() : "Aug 15, 2026"}
                  </span>
                </div>
                <p className="text-zinc-400 font-normal">
                  {currentVideo.description || "Enjoy this immersive media stream configured directly from your library feed."}
                </p>
              </div>

              {/* 💬 Comments Section UI */}
              <div className="mt-4 flex flex-col gap-4 border border-zinc-900 rounded-xl p-4 bg-zinc-950">
                <div className="flex items-center gap-2 pb-3 border-b border-zinc-900">
                  <MessageSquare className="w-4 h-4 text-zinc-400" />
                  <h3 className="font-bold text-xs text-white">
                    Comments <span className="text-zinc-500 font-mono font-normal">({comments.length})</span>
                  </h3>
                </div>

                {/* Comment Input Box */}
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

                {/* Comments List */}
                <div className="flex flex-col gap-3 mt-2">
                  {comments.length === 0 ? (
                    <p className="text-xs text-zinc-600 text-center py-4 font-mono">No comments yet. Be the first to comment!</p>
                  ) : (
                    comments.map((comm) => (
                      <div key={comm.id} className="flex gap-3 items-start p-3 rounded-xl bg-black border border-zinc-900/60">
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
                            <span className="text-[10px] text-zinc-600 font-mono">
                              {comm.createdAt ? new Date(comm.createdAt).toLocaleDateString() : "Just now"}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{comm.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right: Up Next Queue Sidebar */}
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
                      {vid.duration || "5:31"}
                    </span>
                  </div>
                  <div className="flex flex-col overflow-hidden w-full">
                    <span className="text-[10px] font-mono text-zinc-500 mb-0.5">#{idx + 1} in queue</span>
                    <h4 className={`font-semibold text-xs truncate ${isSelected ? "text-white font-bold" : "text-zinc-300 group-hover:text-white"}`}>
                      {vid.title}
                    </h4>
                    <span className="text-[10px] text-zinc-500 truncate mt-0.5">
                      {vid.user?.channelName || "Elisha Jameel"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-zinc-800 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 transition-all">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          <p className="text-xs font-semibold">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}