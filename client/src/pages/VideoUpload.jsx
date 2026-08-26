import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadVideo } from "../services/api";
import { CheckCircle2, Globe, Lock, Clock, UploadCloud, Radio, X, ArrowRight, Play } from 'lucide-react';

const MONO = { fontFamily: "'JetBrains Mono', monospace" };

function StageNode({ number, last, done }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-8 h-8 rounded-full border text-[11px] font-bold flex items-center justify-center shrink-0 transition-colors ${
          done ? 'bg-white text-black border-white' : 'border-white/25 text-white/40'
        }`}
        style={MONO}
      >
        {number}
      </div>
      {!last && (
        <div
          className={`flex-1 w-px mt-1.5 ${done ? 'bg-linear-to-b from-white/50 to-white/10' : 'bg-white/10'}`}
        />
      )}
    </div>
  );
}

function ToggleSwitch({ checked, onChange, id, children }) {
  return (
    <label htmlFor={id} className="flex items-center gap-3 cursor-pointer group">
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full border transition-colors shrink-0 cursor-pointer ${
          checked ? 'bg-white/15 border-white/50' : 'bg-white/5 border-white/15'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full transition-transform ${
            checked ? 'translate-x-4 bg-white' : 'translate-x-0 bg-white/30'
          }`}
        />
      </button>
      <span className="text-xs text-white/60 group-hover:text-white transition">{children}</span>
    </label>
  );
}

function SuccessModal({ data, onClose, onUploadAnother, onViewVideo }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div
        className="bg-[#0A0A0B] border border-white/15 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white transition cursor-pointer">
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        </div>

        <h2 className="text-sm font-bold text-white tracking-wide">Stream published successfully</h2>
        <p className="text-xs text-white/50 mt-1">
          <span className="text-white font-medium">{data?.title || "Your asset"}</span> is now indexed.
        </p>

        {/* Video Preview Box inside Modal */}
        {data?.id && (
          <div className="my-4 relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 group">
            <video
              src={`http://localhost:5000/api/videos/${data.id}/stream`}
              controls
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex flex-col gap-2 mt-2">
          {data?.id && (
            <button
              onClick={() => onViewVideo(data.id)}
              className="w-full py-2.5 bg-white hover:bg-white/85 text-black rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-white/5"
            >
              Open in Watch View <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onUploadAnother}
            className="w-full py-2.5 border border-white/15 hover:border-white/30 text-white/70 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Upload another asset
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VideoUpload() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Technology");
  const [tags, setTags] = useState("");
  const [isMadeForKids, setIsMadeForKids] = useState(false);
  const [ageRestricted, setAgeRestricted] = useState(false);
  const [visibility, setVisibility] = useState("private");
  const [scheduledFor, setScheduledFor] = useState("");

  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadedData, setUploadedData] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    if (!title) setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
    setError("");
  };

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setDescription("");
    setCategory("Technology");
    setTags("");
    setIsMadeForKids(false);
    setAgeRestricted(false);
    setVisibility("private");
    setScheduledFor("");
    setProgress(0);
    setUploadedData(null);
    setShowSuccess(false);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Select a video file to continue.");
      return;
    }

    if (visibility === 'schedule') {
      if (!scheduledFor) {
        setError("Please pick a valid date and time for scheduling.");
        return;
      }
      const selectedTime = new Date(scheduledFor).getTime();
      const now = new Date().getTime();
      if (selectedTime <= now) {
        setError("Scheduled time must be set in the future.");
        return;
      }
    }

    const formData = new FormData();
    formData.append("video", file);
    formData.append("title", title || file.name);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("tags", tags);
    formData.append("isMadeForKids", isMadeForKids);
    formData.append("ageRestricted", ageRestricted);
    formData.append("visibility", visibility);
    
    if (visibility === 'schedule' && scheduledFor) {
      formData.append("scheduledFor", scheduledFor);
    }

    try {
      setLoading(true);
      setProgress(0);
      setError("");
      setUploadedData(null);

      const data = await uploadVideo(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(percentCompleted);
      });

      setProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 400));

      setUploadedData(data);
      setShowSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const segments = 28;
  const filledSegments = Math.round((progress / 100) * segments);

  return (
    <div className="max-w-3xl mx-auto my-8 px-4">

      {/* Header */}
      <div className="mb-6">
        <span className="text-[10px] tracking-[0.3em] text-white/40 font-bold" style={MONO}>
          STUDIO PIPELINE
        </span>
        <h1 className="text-2xl font-bold text-white mt-1">Upload Console</h1>
        <p className="text-xs text-white/40 mt-0.5">Push a new video asset through the stream pipeline.</p>
      </div>

      <form onSubmit={handleSubmit} className="border border-white/10 rounded-2xl p-6 sm:p-7 bg-[#0A0A0B]/60 backdrop-blur-xl shadow-2xl">

        {/* Stage 01 — Source */}
        <div className="flex gap-4">
          <StageNode number="01" done={!!file} />
          <div className="flex-1 pb-7">
            <span className="text-[10px] tracking-[0.2em] text-white/40 font-bold" style={MONO}>SOURCE ASSET</span>

            <label
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files[0]); }}
              className={`mt-2.5 flex flex-col items-center justify-center gap-1.5 border border-dashed rounded-xl py-8 cursor-pointer transition ${
                dragActive ? 'border-white/60 bg-white/5' : 'border-white/15 hover:border-white/30 bg-white/[0.01]'
              }`}
            >
              <input
                type="file"
                accept="video/*"
                onChange={(e) => handleFile(e.target.files[0])}
                className="hidden"
              />
              {file ? (
                <>
                  <span className="flex items-center gap-2 text-emerald-400 text-[11px] font-semibold" style={MONO}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ASSET LOADED
                  </span>
                  <span className="text-xs text-white mt-0.5 font-medium">{file.name}</span>
                  <span className="text-[10px] text-white/30">Drop another file to replace</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-5 h-5 text-white/30" />
                  <span className="text-xs text-white/60 mt-0.5">Drag & drop your video file here, or browse</span>
                  <span className="text-[10px] text-white/30">MP4, MOV, WEBM</span>
                </>
              )}
            </label>
          </div>
        </div>

        {/* Stage 02 — Details */}
        <div className="flex gap-4">
          <StageNode number="02" done={title.trim().length > 0} />
          <div className="flex-1 pb-7 space-y-3.5">
            <span className="text-[10px] tracking-[0.2em] text-white/40 font-bold" style={MONO}>METADATA DETAILS</span>

            <div>
              <label className="block mb-1 text-xs font-medium text-white/40">Title</label>
              <input
                type="text"
                required
                placeholder="Name this stream"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-white/40 transition"
              />
            </div>

            <div>
              <label className="block mb-1 text-xs font-medium text-white/40">Description</label>
              <textarea
                rows={2}
                placeholder="What's this stream about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-white/40 transition resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block mb-1 text-xs font-medium text-white/40">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-white/40 transition cursor-pointer"
                >
                  <option value="Technology" className="bg-[#0A0A0B]">Technology & Code</option>
                  <option value="System Architecture" className="bg-[#0A0A0B]">System Architecture</option>
                  <option value="Music" className="bg-[#0A0A0B]">Music & Beats</option>
                  <option value="Gaming" className="bg-[#0A0A0B]">Gaming</option>
                  <option value="Education" className="bg-[#0A0A0B]">Education</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium text-white/40">Tags</label>
                <input
                  type="text"
                  placeholder="react, node, hls"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full p-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-white/40 transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stage 03 — Audience */}
        <div className="flex gap-4">
          <StageNode number="03" done={isMadeForKids || ageRestricted} />
          <div className="flex-1 pb-7 space-y-3">
            <span className="text-[10px] tracking-[0.2em] text-white/40 font-bold" style={MONO}>AUDIENCE CONFIG</span>
            <div className="pt-0.5 space-y-3">
              <ToggleSwitch id="kids" checked={isMadeForKids} onChange={setIsMadeForKids}>
                Made for kids
              </ToggleSwitch>
              <ToggleSwitch id="age" checked={ageRestricted} onChange={setAgeRestricted}>
                Restrict to viewers 18+
              </ToggleSwitch>
            </div>
          </div>
        </div>

        {/* Stage 04 — Release */}
        <div className="flex gap-4">
          <StageNode number="04" last done={visibility !== "private"} />
          <div className="flex-1 space-y-3.5">
            <span className="text-[10px] tracking-[0.2em] text-white/40 font-bold" style={MONO}>RELEASE SETTINGS</span>

            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "private", label: "Private", icon: Lock },
                { key: "public", label: "Public", icon: Globe },
                { key: "schedule", label: "Schedule", icon: Clock },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setVisibility(key)}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer ${
                    visibility === key
                      ? 'bg-white/10 border-white/40 text-white shadow-sm'
                      : 'bg-white/[0.03] border-white/10 text-white/40 hover:border-white/20'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${visibility === key ? 'bg-white' : 'bg-white/25'}`} />
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>

            {visibility === 'schedule' && (
              <div className="space-y-1">
                <label className="block text-[11px] text-white/40">Select release date and time</label>
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="w-full p-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-white/40"
                />
              </div>
            )}

            {error && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-5 bg-white hover:bg-white/85 disabled:opacity-30 text-black rounded-xl text-xs font-bold tracking-wide cursor-pointer transition flex items-center justify-center gap-2 shadow-lg shadow-white/10"
            >
              {loading ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
                  {progress < 100 ? `UPLOADING · ${progress}%` : "FINALIZING PIPELINE..."}
                </>
              ) : (
                <>
                  <Radio className="w-3.5 h-3.5" /> PUBLISH STREAM
                </>
              )}
            </button>

            {loading && (
              <div className="flex gap-[3px] pt-1">
                {Array.from({ length: segments }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-sm transition-colors duration-150 ${
                      i < filledSegments ? 'bg-white' : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

      </form>

      {showSuccess && (
        <SuccessModal
          data={uploadedData}
          onClose={() => setShowSuccess(false)}
          onUploadAnother={resetForm}
          onViewVideo={(id) => navigate(`/watch/${id}`)}
        />
      )}
    </div>
  );
}