import React, { useState } from "react";
import { uploadVideo } from "../services/api";
import { Sparkles, CheckCircle2, Globe, Lock, Clock } from 'lucide-react';

export default function VideoUpload() {
  const [file, setFile] = useState(null);
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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile && !title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
    }
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a video file.");
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
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        );
        setProgress(percentCompleted);
      });

      setUploadedData(data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to upload video.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-8 p-8 bg-[#121216] border border-zinc-800 rounded-2xl font-sans text-zinc-100 shadow-2xl">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" /> Studio Video Upload Pipeline
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">Configure full stream metadata, visibility, and audience settings.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Step 1: File Selection */}
        <div className="p-4 bg-[#18181b] border border-zinc-800 rounded-xl">
          <label className="block mb-2 text-xs font-semibold text-zinc-300">
            Select Video Asset
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer transition"
          />
          {file && <span className="block mt-2 text-[11px] text-emerald-400 font-mono">Selected: {file.name}</span>}
        </div>

        {/* Step 2: Details (Title & Description) */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block mb-1.5 text-xs font-medium text-zinc-400">Title (required)</label>
            <input
              type="text"
              required
              placeholder="Add a title that describes your video"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 bg-[#09090b] border border-zinc-800 rounded-xl text-xs text-zinc-100 outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-medium text-zinc-400">Description</label>
            <textarea
              rows={3}
              placeholder="Tell viewers about your video stream..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-[#09090b] border border-zinc-800 rounded-xl text-xs text-zinc-100 outline-none focus:border-indigo-500 transition resize-none"
            />
          </div>
        </div>

        {/* Step 3: Category & Tags */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1.5 text-xs font-medium text-zinc-400">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 bg-[#09090b] border border-zinc-800 rounded-xl text-xs text-zinc-100 outline-none focus:border-indigo-500 transition cursor-pointer"
            >
              <option value="Technology">Technology & Code</option>
              <option value="System Architecture">System Architecture</option>
              <option value="Music">Music & Beats</option>
              <option value="Gaming">Gaming</option>
              <option value="Education">Education</option>
            </select>
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-medium text-zinc-400">Tags (comma separated)</label>
            <input
              type="text"
              placeholder="react, node, streaming, hls"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full p-3 bg-[#09090b] border border-zinc-800 rounded-xl text-xs text-zinc-100 outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Step 4: Audience & Age Restriction */}
        <div className="p-4 bg-[#18181b] border border-zinc-800 rounded-xl space-y-3">
          <h3 className="text-xs font-semibold text-zinc-300">Audience & Restrictions</h3>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="kids"
              checked={isMadeForKids}
              onChange={(e) => setIsMadeForKids(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="kids" className="text-xs text-zinc-300 cursor-pointer">
              Yes, it's made for kids
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="age"
              checked={ageRestricted}
              onChange={(e) => setAgeRestricted(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="age" className="text-xs text-zinc-300 cursor-pointer">
              Age restriction: Do not restrict my video to viewers over 18 only
            </label>
          </div>
        </div>

        {/* Step 5: Visibility & Schedule */}
        <div className="p-4 bg-[#18181b] border border-zinc-800 rounded-xl space-y-3">
          <h3 className="text-xs font-semibold text-zinc-300">Save or Publish (Visibility)</h3>
          
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setVisibility("private")}
              className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer ${
                visibility === 'private' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-[#09090b] border-zinc-800 text-zinc-400'
              }`}
            >
              <Lock className="w-3.5 h-3.5" /> Private
            </button>

            <button
              type="button"
              onClick={() => setVisibility("public")}
              className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer ${
                visibility === 'public' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-[#09090b] border-zinc-800 text-zinc-400'
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> Public
            </button>

            <button
              type="button"
              onClick={() => setVisibility("schedule")}
              className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer ${
                visibility === 'schedule' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-[#09090b] border-zinc-800 text-zinc-400'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Schedule
            </button>
          </div>

          {visibility === 'schedule' && (
            <div className="mt-3">
              <label className="block mb-1 text-[11px] text-zinc-400">Select Date and Time</label>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="w-full p-2.5 bg-[#09090b] border border-zinc-800 rounded-xl text-xs text-zinc-100 outline-none focus:border-indigo-500"
              />
            </div>
          )}
        </div>

        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold disabled:bg-zinc-800 cursor-pointer transition shadow-lg shadow-indigo-500/20"
        >
          {loading ? `Processing & Uploading... ${progress}%` : "Publish Stream Asset"}
        </button>
      </form>

      {loading && (
        <div className="w-full h-1.5 bg-[#09090b] rounded-full mt-4 overflow-hidden border border-zinc-800">
          <div
            className="h-full bg-indigo-500 transition-all duration-200"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {uploadedData && (
        <div className="mt-6 p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl">
          <h3 className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Video Metadata Indexed Successfully!
          </h3>
          <pre className="text-[10px] text-emerald-300 overflow-x-auto bg-black/40 p-3 rounded-lg font-mono">
            {JSON.stringify(uploadedData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}