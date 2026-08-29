import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchVideos, incrementVideoView, toggleSubscribeChannel, getCurrentUser } from "../services/api";
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
} from "lucide-react";
import Navbar from "../components/Navbar";
import VideoPlayer from "../components/VideoPlayer";

const SOCKET_URL = "http://localhost:3000"; 
const socket = io(SOCKET_URL);

export default function VideoDetail() {
  const { id } = useParams(); // URL se video id uthayein
  const navigate = useNavigate(); // Navigation ke liye

  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [liked, setLiked] = useState(false);

  // User & Subscription states
  const [currentUser, setCurrentUser] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [subscribingLoading, setSubscribingLoading] = useState(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState(null);

  const countedSessionRef = useRef(new Set());

  useEffect(() => {
    loadInitialData();
    loadUserData();
  }, []);

  // Jab URL ki ID change ho ya videos list load ho jaye, toh current video ko match karke set karein
  useEffect(() => {
    if (videos.length > 0) {
      if (id) {
        const found = videos.find((v) => String(v.id) === String(id));
        if (found) {
          setCurrentVideo(found);
        }
      } else {
        // Agar URL mein ID nahi hai toh pehli video par redirect kar dein
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
          return {
            ...prev,
            views: data.views,
          };
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
      setToastMessage("You can't subscribe your own channel Thanks!");
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
      const errorMsg = err.response?.data?.error || "Subscription cant be updated.";
      setToastMessage(errorMsg);
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setSubscribingLoading(false);
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
            setCurrentVideo((prev) => ({
              ...prev,
              views: data.views,
            }));
          }
        })
        .catch((err) => {
          console.error("View count error", err);
          countedSessionRef.current.delete(currentVideo.id);
        });
    }
  };

  if (loadingVideos) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh]">
        <div className="w-6 h-6 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-zinc-400 mt-3 font-mono">
          Loading player...
        </p>
      </div>
    );
  }

  if (!currentVideo) {
    return (
      <div className="text-center py-20 text-zinc-400 text-xs">
        No videos available in your library.
      </div>
    );
  }

  const sidebarVideos = videos.filter((v) => String(v.id) !== String(currentVideo.id));

  return (
    <>
      <Navbar />
      <div className="max-w-full mx-auto px-4 lg:px-8 py-6 text-zinc-100 grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        {/* Left: Player Card */}
        <div className="lg:col-span-8 xl:col-span-9">
          <div className="border border-white/10 rounded-2xl shadow-2xl overflow-hidden bg-[#121212]">
            <div className="relative">
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
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm ring-2 ring-white/10 overflow-hidden bg-zinc-900">
                    {currentVideo.user?.avatarUrl ? (
                      <img
                        src={currentVideo.user.avatarUrl}
                        alt={currentVideo.user.channelName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (currentVideo.user?.channelName || "E")[0].toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-zinc-200">
                      {currentVideo.user?.channelName || "Elisha Jameel"}
                    </h3>
                    <span className="text-[11px] text-zinc-400">
                      {subscriberCount} subscribers
                    </span>
                  </div>
                  
                  {/* Interactive Subscribe Button */}
                  <button
                    onClick={handleSubscribeToggle}
                    disabled={subscribingLoading}
                    className={`ml-3 flex items-center gap-1.5 font-medium text-xs px-4 py-2 rounded-full transition cursor-pointer shadow active:scale-95 disabled:opacity-50 ${
                      isSubscribed
                        ? "bg-zinc-800 border border-white/10 text-zinc-200 hover:bg-zinc-700"
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
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer ${
                      liked
                        ? "bg-zinc-100 border-zinc-100 text-zinc-950 font-bold"
                        : "bg-zinc-900 border-white/10 hover:bg-zinc-800 text-zinc-200"
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{liked ? "28.1K" : "28K"}</span>
                  </button>

                  <button className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 px-3.5 py-1.5 rounded-full text-xs font-medium border border-white/10 transition cursor-pointer text-zinc-200">
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>

                  <button className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 px-3.5 py-1.5 rounded-full text-xs font-medium border border-white/10 transition cursor-pointer text-zinc-200">
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                </div>
              </div>

              {/* Stats + Description */}
              <div className="border border-white/10 rounded-xl p-4 text-xs text-zinc-300 leading-relaxed bg-zinc-900/40">
                <div className="flex flex-wrap items-center gap-4 font-semibold text-zinc-300 mb-3 pb-3 border-b border-white/10">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-zinc-400" />
                    {currentVideo.views ?? 0} views
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ThumbsUp className="w-3.5 h-3.5 text-zinc-400" />
                    28K likes
                  </span>
                  {currentVideo.isLive && (
                    <span className="flex items-center gap-1.5 text-red-400">
                      <Radio className="w-3.5 h-3.5" />
                      1.9M streaming
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    {currentVideo.uploadedAt
                      ? new Date(currentVideo.uploadedAt).toLocaleDateString()
                      : "Aug 15, 2026"}
                  </span>
                </div>
                <p className="text-zinc-400">
                  {currentVideo.description ||
                    "Enjoy this immersive media stream configured directly from your library feed."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Up Next Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-3">
          <div className="border border-white/10 rounded-xl p-3.5 flex items-center justify-between shadow-md bg-zinc-900/60">
            <div>
              <h3 className="font-bold text-xs text-zinc-100">
                Mix - Library Stream
              </h3>
              <span className="text-[10px] text-zinc-500">
                {videos.length} videos
              </span>
            </div>
            <Sparkles className="w-4 h-4 text-zinc-300" />
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto max-h-[70vh] pr-1">
            {sidebarVideos.map((vid, idx) => {
              const isSelected = String(currentVideo.id) === String(vid.id);
              return (
                <div
                  key={vid.id}
                  onClick={() => navigate(`/watch/${vid.id}`)} // URL change karega taake routing properly trigger ho
                  className={`group flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? "border-zinc-500 bg-zinc-900"
                      : "border-white/5 bg-zinc-900/40 hover:border-white/20 hover:bg-zinc-900"
                  }`}
                >
                  <div className="w-28 aspect-video bg-black rounded-lg overflow-hidden relative shrink-0 border border-white/10">
                    <video
                      src={vid.filepath}
                      className="w-full h-full object-cover"
                      muted
                    />
                    <span className="absolute bottom-1 right-1 bg-black/85 text-[9px] px-1 rounded text-zinc-200 font-mono">
                      {vid.duration || "5:31"}
                    </span>
                    {vid.isLive && (
                      <span className="absolute top-1 left-1 bg-red-600 text-[8px] font-bold px-1 rounded text-white">
                        LIVE
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col overflow-hidden w-full">
                    <span className="text-[10px] font-mono text-zinc-500 mb-0.5">
                      #{idx + 1} in queue
                    </span>
                    <h4
                      className={`font-semibold text-xs truncate ${isSelected ? "text-white" : "text-zinc-200 group-hover:text-white"}`}
                    >
                      {vid.title}
                    </h4>
                    <span className="text-[11px] text-zinc-400 truncate mt-0.5">
                      {vid.user?.channelName || "Elisha Jameel"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-white/20 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 transition-all">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <p className="text-xs font-medium">{toastMessage}</p>
        </div>
      )}
    </>
  );
}