import React, { useState } from "react";
import { uploadVideo } from "../services/api";
import { CheckCircle2, Globe, Lock, Clock, UploadCloud, Radio } from 'lucide-react';

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

export default function VideoUpload() {
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
  const [error, setError] = useState("");

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    if (!title) setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Select a video file to continue.");
      return;
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

      setUploadedData(data);
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
          STUDIO
        </span>
        <h1 className="text-2xl font-bold text-white mt-1.5">Upload console</h1>
        <p className="text-xs text-white/40 mt-1">Push a new asset through the pipeline — source to release.</p>
      </div>

      <form onSubmit={handleSubmit} className="border border-white/10 rounded-2xl p-6 sm:p-7">

        {/* Stage 01 — Source */}
        <div className="flex gap-4">
          <StageNode number="01" done={!!file} />
          <div className="flex-1 pb-7">
            <span className="text-[10px] tracking-[0.2em] text-white/40 font-bold" style={MONO}>SOURCE</span>

            <label
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files[0]); }}
              className={`mt-2.5 flex flex-col items-center justify-center gap-1.5 border border-dashed rounded-xl py-8 cursor-pointer transition ${
                dragActive ? 'border-white/60 bg-white/5' : 'border-white/15 hover:border-white/30'
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
                  <span className="flex items-center gap-2 text-[#3DDC84] text-[11px] font-semibold" style={MONO}>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3DDC84] animate-pulse" />
                    ASSET LOADED
                  </span>
                  <span className="text-xs text-white mt-0.5">{file.name}</span>
                  <span className="text-[10px] text-white/30">Drop another file to replace</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-5 h-5 text-white/30" />
                  <span className="text-xs text-white/60 mt-0.5">Drag a video file here, or click to browse</span>
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
            <span className="text-[10px] tracking-[0.2em] text-white/40 font-bold" style={MONO}>DETAILS</span>

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
                  <option value="Technology">Technology & Code</option>
                  <option value="System Architecture">System Architecture</option>
                  <option value="Music">Music & Beats</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Education">Education</option>
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
            <span className="text-[10px] tracking-[0.2em] text-white/40 font-bold" style={MONO}>AUDIENCE</span>
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
            <span className="text-[10px] tracking-[0.2em] text-white/40 font-bold" style={MONO}>RELEASE</span>

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
                      ? 'bg-white/10 border-white/40 text-white'
                      : 'bg-white/[0.03] border-white/10 text-white/40 hover:border-white/20'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${visibility === key ? 'bg-white' : 'bg-white/25'}`} />
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>

            {visibility === 'schedule' && (
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="w-full p-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-white/40"
              />
            )}

            {error && (
              <div className="p-2.5 bg-[#FF3B30]/10 border border-[#FF3B30]/25 rounded-xl text-[#FF6B60] text-xs">
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
                  PUBLISHING · {progress}%
                </>
              ) : (
                <>
                  <Radio className="w-3.5 h-3.5" /> PUBLISH STREAM
                </>
              )}
            </button>

            {loading && (
              <div className="flex gap-[3px]">
                {Array.from({ length: segments }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded-sm transition-colors duration-150 ${
                      i < filledSegments ? 'bg-white' : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            )}

            {uploadedData && (
              <div className="p-3.5 bg-[#3DDC84]/5 border border-[#3DDC84]/25 rounded-xl">
                <h3 className="text-xs font-bold text-[#3DDC84] mb-2 flex items-center gap-1.5" style={MONO}>
                  <CheckCircle2 className="w-4 h-4" /> INDEXED
                </h3>
                <pre className="text-[10px] text-[#3DDC84]/80 overflow-x-auto bg-black/40 p-3 rounded-lg" style={MONO}>
                  {JSON.stringify(uploadedData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

      </form>
    </div>
  );
}