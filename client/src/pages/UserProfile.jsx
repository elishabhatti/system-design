import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchVideos, deleteVideo, updateUserProfile } from '../services/api';
import { Settings, Video, Users, Sparkles, CheckCircle2, Eye, MoreVertical, Trash2, Pencil, X, Loader2, Camera } from 'lucide-react';

export default function UserProfile() {
  const { user, setUser } = useAuth(); 
  
  const channelName = user?.channelName || "Example Channel";
  const channelBio = user?.bio || "This is a sample bio. Update your profile to add a personal touch!";
  const email = user?.email || "example@gmail.com";
  const initial = channelName ? channelName[0].toUpperCase() : "S";

  const [activeTab, setActiveTab] = useState("videos");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showCustomize, setShowCustomize] = useState(false);
  
  // Real database/user states initialization
  const [bannerUrl, setBannerUrl] = useState(user?.bannerUrl || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [subscriberCount, setSubscriberCount] = useState(1400);

  // Sync when user object updates from AuthContext
  useEffect(() => {
    if (user) {
      if (user.bannerUrl !== undefined) setBannerUrl(user.bannerUrl || "");
      if (user.avatarUrl !== undefined) setAvatarUrl(user.avatarUrl || "");
    }
  }, [user]);

  useEffect(() => {
    loadMyVideos();
  }, [user]);

  const loadMyVideos = async () => {
    setLoading(true);
    try {
      const data = await fetchVideos();
      const videoArray = Array.isArray(data) ? data : (data.videos || data.data || []);
      
      if (user?.id) {
        const mine = videoArray.filter((v) => v.userId === user.id || v.user?.id === user.id);
        setVideos(mine.length > 0 ? mine : videoArray);
      } else {
        setVideos(videoArray);
      }
    } catch (err) {
      console.error("Failed to load videos", err);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setOpenMenuId(null);
    setDeletingId(id);
    try {
      await deleteVideo(id);
      setVideos((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      console.error("Failed to delete video", err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-[95vh] text-zinc-100 selection:bg-zinc-700 selection:text-white pb-20">
      {/* Channel Banner */}
      <div className="h-48 md:h-60 border-b border-white/10 relative overflow-hidden bg-[#121212]">
        {bannerUrl ? (
          <img src={bannerUrl} alt="Channel Banner" className="w-full h-full object-cover opacity-85" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-[#121212] to-[#0a0a0a]"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-60"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {/* Channel Header Profile Section */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 -mt-16 md:-mt-20 relative z-10 pb-8 border-b border-white/10">
          <div className="relative group">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-zinc-900 border-4 border-[#0a0a0a] flex items-center justify-center text-3xl font-extrabold shadow-2xl text-white shrink-0 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-zinc-300">{initial}</span>
              )}
            </div>
            <button 
              onClick={() => setShowCustomize(true)}
              className="absolute inset-0 bg-black/60 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-white"
            >
              <Camera className="w-6 h-6" />
            </button>
          </div>

          <div className="text-center md:text-left pt-2 flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-zinc-100 flex items-center justify-center md:justify-start gap-2">
                {channelName}
                <CheckCircle2 className="w-5 h-5 text-zinc-300 fill-zinc-300/20" />
              </h1>
              <span className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-bold px-3 py-1 rounded-full w-fit mx-auto md:mx-0 shadow-inner">
                PRO CREATOR
              </span>
            </div>

            <p className="text-xs text-zinc-400 mt-1.5 flex items-center justify-center md:justify-start gap-2">
              <span className="font-mono text-zinc-300">@{email.split('@')[0]}</span>
              <span>•</span>
              <span className="text-zinc-300 font-medium flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-zinc-400" /> {subscriberCount} subscribers</span>
              <span>•</span>
              <span className="text-zinc-400">{videos.length} videos</span>
            </p>

            <p className="text-xs text-zinc-400 mt-3 max-w-2xl leading-relaxed">
              {user?.bio || "Full-stack developer engineering scalable systems, high-performance video streaming pipelines, and modern web applications."}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4 md:pt-4">
            <button
              onClick={() => setShowCustomize(true)}
              className="flex items-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 px-5 py-2.5 rounded-2xl text-xs font-semibold shadow-lg transition duration-300 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4" /> Customize Channel
            </button>
            <button 
              onClick={() => setShowCustomize(true)}
              className="p-2.5 rounded-2xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-8 pt-6 border-b border-white/10 mb-8 text-xs font-semibold">
          {["videos", "analytics", "playlists"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 border-b-2 capitalize transition cursor-pointer flex items-center gap-2 ${
                activeTab === tab ? "border-zinc-100 text-white font-bold" : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab === "videos" && <Video className="w-4 h-4 text-zinc-400" />}
              {tab}
            </button>
          ))}
        </div>

        {/* Videos Tab Content */}
        {activeTab === "videos" && (
          <>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-28">
                <Loader2 className="w-7 h-7 text-zinc-400 animate-spin" />
                <p className="text-xs text-zinc-400 mt-3 font-medium">Loading your masterpieces...</p>
              </div>
            ) : videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-28 text-center bg-zinc-900/50 rounded-3xl border border-white/5 p-8">
                <Video className="w-10 h-10 text-zinc-500 mb-3" />
                <p className="text-sm text-zinc-200 font-semibold">No videos uploaded yet</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm">Share your video streaming projects or tutorials with the world.</p>
                <Link
                  to="/create"
                  className="mt-5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold px-5 py-2.5 rounded-2xl transition shadow-lg cursor-pointer"
                >
                  Upload your first video
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-10">
                {videos.map((vid) => (
                  <div key={vid.id} className="group flex flex-col gap-2.5 rounded-2xl p-2.5 bg-zinc-900/60 border border-white/5 hover:border-zinc-700 hover:bg-zinc-900 transition-all shadow-xl">
                    <Link to={`/watch/${vid.id}`} className="aspect-video bg-black rounded-xl overflow-hidden relative shadow-inner block">
                      <video src={vid.filepath} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" muted />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                      {vid.isLive ? (
                        <span className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-red-600 text-[10px] font-bold px-2 py-0.5 rounded-md text-white shadow">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                        </span>
                      ) : (
                        <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md text-[11px] font-mono font-medium px-2 py-0.5 rounded text-white">
                          {vid.duration || '5:31'}
                        </span>
                      )}
                      {deletingId === vid.id && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-10">
                          <Loader2 className="w-6 h-6 text-zinc-300 animate-spin" />
                        </div>
                      )}
                    </Link>

                    <div className="flex items-start justify-between gap-2 px-1">
                      <div className="overflow-hidden">
                        <h3 className="font-semibold text-zinc-100 text-xs tracking-tight line-clamp-2 leading-relaxed group-hover:text-zinc-300 transition">
                          {vid.title}
                        </h3>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-1.5">
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3 text-zinc-400" /> {vid.views || 0} views</span>
                          <span>•</span>
                          <span>Recently</span>
                        </div>
                      </div>

                      <div className="relative shrink-0">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === vid.id ? null : vid.id)}
                          className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {openMenuId === vid.id && (
                          <div className="absolute right-0 top-8 bg-zinc-900 border border-white/10 rounded-xl py-1.5 w-36 shadow-2xl z-20">
                            <Link
                              to={`/edit/${vid.id}`}
                              onClick={() => setOpenMenuId(null)}
                              className="flex items-center gap-2 px-3.5 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                            >
                              <Pencil className="w-3.5 h-3.5 text-zinc-400" /> Edit Details
                            </Link>
                            <button
                              onClick={() => handleDelete(vid.id)}
                              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete Video
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "analytics" && (
          <div className="py-20 text-center text-zinc-500 text-xs bg-zinc-900/40 rounded-3xl border border-white/5">
            📊 Creator Analytics & Real-time Graph Visualizer coming soon.
          </div>
        )}

        {activeTab === "playlists" && (
          <div className="py-20 text-center text-zinc-500 text-xs bg-zinc-900/40 rounded-3xl border border-white/5">
            📁 No custom playlists organized yet.
          </div>
        )}
      </div>

      {/* Customize Channel Modal */}
      {showCustomize && (
        <CustomizeChannelModal
          user={user}
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

function CustomizeChannelModal({ user, setUser, channelName, channelBio, bannerUrl, setBannerUrl, avatarUrl, setAvatarUrl, onClose }) {
  const [name, setName] = useState(channelName);
  const [bio, setBio] = useState(channelBio);
  
  const [tempBanner, setTempBanner] = useState(bannerUrl || "");
  const [tempAvatar, setTempAvatar] = useState(avatarUrl || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTempBanner(bannerUrl || "");
    setTempAvatar(avatarUrl || "");
  }, [bannerUrl, avatarUrl]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await updateUserProfile({ 
        channelName: name, 
        bio, 
        avatarUrl: tempAvatar, 
        bannerUrl: tempBanner 
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
      alert(err.response?.data?.error || err.message || "Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div
        className="bg-[#121212] border border-white/10 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-zinc-300" /> Customize Channel Studio
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label className="text-[11px] font-semibold text-zinc-400 mb-1.5 block">Channel Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 focus:border-zinc-400 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 outline-none transition"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-400 mb-1.5 block">Banner Image URL</label>
            <input
              type="text"
              value={tempBanner}
              onChange={(e) => setTempBanner(e.target.value)}
              placeholder="https://example.com/banner.jpg"
              className="w-full bg-zinc-900 border border-white/10 focus:border-zinc-400 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 outline-none transition"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-400 mb-1.5 block">Avatar / Profile Image URL</label>
            <input
              type="text"
              value={tempAvatar}
              onChange={(e) => setTempAvatar(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full bg-zinc-900 border border-white/10 focus:border-zinc-400 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 outline-none transition"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-400 mb-1.5 block">Channel Bio / About</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full bg-zinc-900 border border-white/10 focus:border-zinc-400 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 outline-none transition resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-zinc-100 hover:bg-white disabled:opacity-60 text-zinc-950 px-5 py-2.5 rounded-xl text-xs font-semibold transition shadow-lg cursor-pointer"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}