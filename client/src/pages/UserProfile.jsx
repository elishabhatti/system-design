import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchVideos, deleteVideo } from '../services/api';
import { Settings, Video, Users, Sparkles, CheckCircle2, Eye, MoreVertical, Trash2, Pencil, X, Loader2 } from 'lucide-react';

export default function UserProfile() {
  const { user } = useAuth();
  const channelName = user?.channelName || "Elisha Jameel";
  const email = user?.email || "elisha@example.com";
  const initial = channelName[0].toUpperCase();

  const [activeTab, setActiveTab] = useState("videos");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showCustomize, setShowCustomize] = useState(false);

  useEffect(() => {
    loadMyVideos();
  }, []);

  const loadMyVideos = async () => {
    setLoading(true);
    try {
      const data = await fetchVideos();
      const mine = user?.id
        ? data.filter((v) => v.user?.id === user.id || v.userId === user.id)
        : data;
      setVideos(mine.length > 0 ? mine : data);
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
    <div className="min-h-screen text-zinc-100  selection:bg-violet-500 selection:text-white">
      <div className="h-44  border-b border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-violet-500/10 via-transparent to-transparent"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 -mt-12 relative z-10 pb-8 border-b border-white/10">
          <div className="w-24 h-24 rounded-2xl bg-[#0F0F0F] flex items-center justify-center text-2xl font-bold shadow-2xl text-white shrink-0">
            {initial}
          </div>

          <div className="text-center md:text-left pt-2 flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <h1 className="text-xl font-bold tracking-wide text-zinc-100 flex items-center justify-center md:justify-start gap-1.5">
                {channelName}
                <CheckCircle2 className="w-4 h-4 text-white fill-violet-400/20" />
              </h1>
              <span className="bg-white border border-white/10 text-black text-[10px] font-semibold px-2.5 py-0.5 rounded-full w-fit mx-auto md:mx-0">
                Pro Creator
              </span>
            </div>

            <p className="text-xs text-zinc-400 mt-1 flex items-center justify-center md:justify-start gap-2">
              <span>@{email.split('@')[0]}</span>
              <span>•</span>
              <span className="text-zinc-300 font-medium flex items-center gap-1"><Users className="w-3 h-3 text-white" /> 1.4K subscribers</span>
            </p>

            <p className="text-xs text-zinc-400 mt-2 max-w-xl leading-relaxed">
              Full-stack developer engineering scalable systems, video streaming platforms, and modern web applications.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4 md:pt-2">
            <button
              onClick={() => setShowCustomize(true)}
              className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-violet-500/20 transition duration-300 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> Customize Channel
            </button>
            <button className="p-2 rounded-xl bg-white border border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20 transition cursor-pointer">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6 pt-4 border-b border-white/10 mb-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("videos")}
            className={`pb-3 border-b-2 flex items-center gap-2 cursor-pointer transition ${
              activeTab === "videos" ? "border-white text-white" : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Video className="w-4 h-4" /> Videos & Uploads
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`pb-3 border-b-2 cursor-pointer transition ${
              activeTab === "analytics" ? "border-white text-white" : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab("playlists")}
            className={`pb-3 border-b-2 cursor-pointer transition ${
              activeTab === "playlists" ? "border-white text-white" : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Playlists
          </button>
        </div>

        {/* Videos & Uploads Tab */}
        {activeTab === "videos" && (
          <>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
                <p className="text-xs text-zinc-400 mt-3">Loading your videos...</p>
              </div>
            ) : videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Video className="w-8 h-8 text-zinc-600 mb-3" />
                <p className="text-sm text-zinc-300 font-medium">No videos uploaded yet</p>
                <p className="text-xs text-zinc-500 mt-1">Your uploads will show up here.</p>
                <Link
                  to="/create"
                  className="mt-4 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-4 py-2 rounded-full transition cursor-pointer"
                >
                  Upload your first video
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
                {videos.map((vid) => (
                  <div key={vid.id} className="group flex flex-col gap-2 rounded-2xl p-2 border border-transparent hover:border-white/10 hover:bg-[#26233A] transition-all">
                    <Link to={`/watch/${vid.id}`} className="aspect-video bg-[#26233A] rounded-xl overflow-hidden relative shadow-md border border-white/5 block">
                      <video src={vid.filepath} className="w-full h-full object-cover" muted />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                      {vid.isLive ? (
                        <span className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded text-white">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                        </span>
                      ) : (
                        <span className="absolute bottom-1.5 right-1.5 bg-black/85 text-[11px] font-medium px-1.5 py-0.5 rounded text-white">
                          {vid.duration || '5:31'}
                        </span>
                      )}
                      {deletingId === vid.id && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        </div>
                      )}
                    </Link>

                    <div className="flex items-start justify-between gap-2 px-0.5">
                      <div className="overflow-hidden">
                        <h3 className="font-semibold text-zinc-100 text-sm tracking-tight line-clamp-2 leading-snug">
                          {vid.title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
                          <Eye className="w-3 h-3" />
                          <span>{vid.views || '12K views'}</span>
                        </div>
                      </div>

                      <div className="relative shrink-0">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === vid.id ? null : vid.id)}
                          className="text-zinc-500 hover:text-white transition p-1 cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {openMenuId === vid.id && (
                          <div className="absolute right-0 top-7 bg-[#1c1c22] border border-white/10 rounded-lg py-1 w-32 shadow-xl z-20">
                            <Link
                              to={`/edit/${vid.id}`}
                              onClick={() => setOpenMenuId(null)}
                              className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-zinc-300 hover:bg-white/5 transition"
                            >
                              <Pencil className="w-3.5 h-3.5" /> Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(vid.id)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-red-400 hover:bg-white/5 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
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

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="py-16 text-center text-zinc-500 text-xs">
            Analytics dashboard coming soon.
          </div>
        )}

        {/* Playlists Tab */}
        {activeTab === "playlists" && (
          <div className="py-16 text-center text-zinc-500 text-xs">
            No playlists created yet.
          </div>
        )}
      </div>

      {/* Customize Channel Modal */}
      {showCustomize && (
        <CustomizeChannelModal
          channelName={channelName}
          onClose={() => setShowCustomize(false)}
        />
      )}
    </div>
  );
}

function CustomizeChannelModal({ channelName, onClose }) {
  const [name, setName] = useState(channelName);
  const [bio, setBio] = useState("Full-stack developer engineering scalable systems, video streaming platforms, and modern web applications.");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: wire to actual update-profile endpoint
      // await updateProfile({ channelName: name, bio });
      onClose();
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div
        className="bg-[#26233A] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-white">Customize Channel</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[11px] font-semibold text-zinc-400 mb-1.5 block">Channel Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#1F1D2C] border border-white/10 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-zinc-100 outline-none transition"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-400 mb-1.5 block">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full bg-[#1F1D2C] border border-white/10 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-zinc-100 outline-none transition resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-semibold text-zinc-300 hover:bg-white/5 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}