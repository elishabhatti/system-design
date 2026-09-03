import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { uploadVideo } from "../services/api";
import { CheckCircle2, Globe, Lock, Clock, UploadCloud, Radio, X, ArrowRight, RefreshCw, AlertCircle, Film } from 'lucide-react';

const MONO = { fontFamily: "'JetBrains Mono', monospace" };

function StageNode({ number, last, done }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-8 h-8 rounded-xl border text-[11px] font-bold flex items-center justify-center shrink-0 transition-all duration-300 ${
          done 
            ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
            : 'bg-black/40 border-white/15 text-white/40'
        }`}
        style={MONO}
      >
        {number}
      </div>
      {!last && (
        <div
          className={`flex-1 w-px my-1 transition-colors duration-300 ${done ? 'bg-gradient-to-b from-white/60 to-white/15' : 'bg-white/10'}`}
        />
      )}
    </div>
  );
}

function ToggleSwitch({ checked, onChange, id, children }) {
  return (
    <label htmlFor={id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition cursor-pointer group">
      <span className="text-xs text-white/70 group-hover:text-white transition">{children}</span>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full border transition-all duration-200 shrink-0 cursor-pointer ${
          checked ? 'bg-white border-white' : 'bg-black/60 border-white/20'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-200 shadow-md ${
            checked ? 'translate-x-4 bg-black' : 'translate-x-0 bg-white/40'
          }`}
        />
      </button>
    </label>
  );
}

function SuccessModal({ data, onClose, onUploadAnother, onViewVideo }) {
  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 flex items-center justify-center px-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-[#0c0c0e] border border-white/20 rounded-2xl w-full max-w-md p-6 shadow-[0_0_50px_rgba(0,0,0,0.9)] text-center relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500" />
        
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white transition cursor-pointer p-1 rounded-lg hover:bg-white/5">
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        </div>

        <h2 className="text-sm font-bold text-white tracking-wide">Stream Indexed Successfully</h2>
        <p className="text-xs text-white/50 mt-1 max-w-[280px] mx-auto truncate">
          <span className="text-white font-medium">{data?.title || "Your asset"}</span> is now live on pipeline.
        </p>

        {data?.id && (
          <div className="my-5 relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 shadow-inner">
            <video
              src={`http://localhost:5000/api/videos/${data.id}/stream`}
              controls
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex flex-col gap-2.5 mt-4">
          {data?.id && (
            <button
              onClick={() => onViewVideo(data.id)}
              className="w-full py-3 bg-white hover:bg-white/90 text-black rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              Open in Watch View <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onUploadAnother}
            className="w-full py-2.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-white/80 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
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
  const [previewUrl, setPreviewUrl] = useState(null);
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

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    
    // Basic validation for video format
    if (!selectedFile.type.startsWith("video/")) {
      setError("Please select a valid video file (MP4, MOV, WEBM).");
      return;
    }

    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    if (!title) {
      // Clean up filename for default title
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setTitle(cleanName);
    }
    setError("");
  };

  const resetForm = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
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
      setError("Source asset required. Please drop a video file.");
      return;
    }

    if (visibility === 'schedule') {
      if (!scheduledFor) {
        setError("Please pick a valid target deployment date and time.");
        return;
      }
      const selectedTime = new Date(scheduledFor).getTime();
      const now = new Date().getTime();
      if (selectedTime <= now) {
        setError("Scheduled deployment time must be set in the future.");
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
      await new Promise((resolve) => setTimeout(resolve, 300));

      setUploadedData(data);
      setShowSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || "Pipeline upload failed. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  const segments = 32;
  const filledSegments = Math.round((progress / 100) * segments);

  return (
    <div className="max-w-3xl mx-auto my-6 px-4">

      {/* Header */}
      <div className="mb-6 border-b border-white/5 pb-4 flex items-end justify-between">
        <div>
          <span className="text-[10px] tracking-[0.3em] text-white/40 font-bold" style={MONO}>
            STUDIO // PIPELINE_v2.4
          </span>
          <h1 className="text-xl font-bold text-white tracking-tight mt-0.5">Upload Console</h1>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-[10px] text-white/50 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          ENCODER READY
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border border-white/10 rounded-2xl p-6 sm:p-8 bg-[#08080a]/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-2">

        {/* Stage 01 — Source */}
        <div className="flex gap-4">
          <StageNode number="01" done={!!file} />
          <div className="flex-1 pb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] tracking-[0.2em] text-white/40 font-bold" style={MONO}>SOURCE ASSET</span>
              {file && (
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <Film className="w-3 h-3" /> {(file.size / (1024 * 1024)).toFixed(1)} MB
                </span>
              )}
            </div>

            {file && previewUrl ? (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/15 group shadow-2xl">
                <video
                  src={previewUrl}
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 flex items-center gap-2 shadow-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-white font-mono truncate max-w-[220px]">{file.name}</span>
                </div>
                
                <label className="absolute top-3 right-3 bg-black/80 hover:bg-black backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/15 text-[10px] text-white/90 hover:text-white transition cursor-pointer flex items-center gap-1.5 shadow-lg group-hover:border-white/30">
                  <RefreshCw className="w-3 h-3" /> Replace File
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFile(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <label
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files[0]); }}
                className={`flex flex-col items-center justify-center gap-2 border border-dashed rounded-xl py-10 px-4 cursor-pointer transition-all duration-300 ${
                  dragActive 
                    ? 'border-white/60 bg-white/[0.08] scale-[0.99]' 
                    : 'border-white/15 hover:border-white/30 bg-white/[0.01] hover:bg-white/[0.02]'
                }`}
              >
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFile(e.target.files[0])}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 mb-1">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <span className="text-xs text-white/80 font-medium">Drag & drop your source video asset here</span>
                <span className="text-[10px] text-white/40 font-mono">Supports MP4, MOV, WEBM up to 500MB</span>
              </label>
            )}
          </div>
        </div>

        {/* Stage 02 — Details */}
        <div className="flex gap-4">
          <StageNode number="02" done={title.trim().length > 0} />
          <div className="flex-1 pb-6 space-y-4">
            <span className="text-[10px] tracking-[0.2em] text-white/40 font-bold" style={MONO}>METADATA DETAILS</span>

            <div>
              <label className="block mb-1.5 text-[11px] font-medium text-white/50">Stream Title *</label>
              <input
                type="text"
                required
                placeholder="Enter a descriptive title for this asset"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 bg-white/[0.02] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-white/40 focus:bg-white/[0.04] transition"
              />
            </div>

            <div>
              <label className="block mb-1.5 text-[11px] font-medium text-white/50">Description</label>
              <textarea
                rows={2}
                placeholder="Briefly describe what this stream covers..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 bg-white/[0.02] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-white/40 focus:bg-white/[0.04] transition resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block mb-1.5 text-[11px] font-medium text-white/50">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 bg-[#0c0c0e] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-white/40 transition cursor-pointer"
                >
                  <option value="Technology">Technology & Code</option>
                  <option value="System Architecture">System Architecture</option>
                  <option value="Music">Music & Beats</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Education">Education</option>
                </select>
              </div>
              <div>
                <label className="block mb-1.5 text-[11px] font-medium text-white/50">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="react, node, hls, architecture"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full p-3 bg-white/[0.02] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-white/40 focus:bg-white/[0.04] transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stage 03 — Audience */}
        <div className="flex gap-4">
          <StageNode number="03" done={isMadeForKids || ageRestricted} />
          <div className="flex-1 pb-6 space-y-3">
            <span className="text-[10px] tracking-[0.2em] text-white/40 font-bold" style={MONO}>AUDIENCE CONFIG</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <ToggleSwitch id="kids" checked={isMadeForKids} onChange={setIsMadeForKids}>
                Made for kids
              </ToggleSwitch>
              <ToggleSwitch id="age" checked={ageRestricted} onChange={setAgeRestricted}>
                Restrict to 18+ viewers
              </ToggleSwitch>
            </div>
          </div>
        </div>

        {/* Stage 04 — Release */}
        <div className="flex gap-4">
          <StageNode number="04" last done={visibility !== "private"} />
          <div className="flex-1 space-y-4">
            <span className="text-[10px] tracking-[0.2em] text-white/40 font-bold" style={MONO}>RELEASE DEPLOYMENT</span>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                { key: "private", label: "Private", icon: Lock },
                { key: "public", label: "Public", icon: Globe },
                { key: "schedule", label: "Schedule", icon: Clock },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setVisibility(key)}
                  className={`py-3 px-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer ${
                    visibility === key
                      ? 'bg-white/10 border-white/40 text-white shadow-md'
                      : 'bg-white/[0.02] border-white/10 text-white/40 hover:border-white/20 hover:text-white/70'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${visibility === key ? 'text-white' : 'text-white/40'}`} /> 
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {visibility === 'schedule' && (
              <div className="space-y-1.5 pt-1 animate-fade-in">
                <label className="block text-[11px] text-white/50 font-medium">Select release date & time</label>
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="w-full p-3 bg-white/[0.02] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-white/40 font-mono"
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-white hover:bg-white/90 disabled:opacity-40 text-black rounded-xl text-xs font-bold tracking-wider cursor-pointer transition flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(255,255,255,0.15)]"
            >
              {loading ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-black animate-ping" />
                  {progress < 100 ? `UPLOADING ASSET · ${progress}%` : "INDEXING TO PIPELINE..."}
                </>
              ) : (
                <>
                  <Radio className="w-3.5 h-3.5" /> PUBLISH STREAM ASSET
                </>
              )}
            </button>

            {loading && (
              <div className="space-y-1.5 pt-1">
                <div className="flex gap-[3px]">
                  {Array.from({ length: segments }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-sm transition-all duration-200 ${
                        i < filledSegments ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-white/40 font-mono">
                  <span>TRANSFERRING CHUNKS</span>
                  <span>{progress}% COMPLETE</span>
                </div>
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