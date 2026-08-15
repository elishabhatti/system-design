import React, { useState } from "react";
import { uploadVideo } from "../services/api";
import { Sparkles } from 'lucide-react';

export default function VideoUpload() {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadedData, setUploadedData] = useState(null);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
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
      setTitle("");
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to upload video.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-full mx-auto my-12 p-8 border border-zinc-800 rounded-2xl font-sans text-zinc-100 shadow-2xl backdrop-blur-md">
      <h2 className="mb-2 text-xl font-bold text-white flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-indigo-400" /> Upload Masterclass
      </h2>
      <p className="text-xs text-zinc-400 mb-6">Publish technical videos to your creator feed.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1.5 text-xs font-medium text-zinc-400">
            Video Title (Optional)
          </label>
          <input
            type="text"
            placeholder="Enter custom title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 bg-[#09090b] border border-zinc-800 rounded-xl text-xs text-zinc-100 outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div>
          <label className="block mb-1.5 text-xs font-medium text-zinc-400">
            Select Video File
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="w-full p-2.5 bg-[#09090b] border border-zinc-800 rounded-xl text-xs text-zinc-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer transition"
          />
        </div>

        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold disabled:bg-zinc-800 cursor-pointer transition-colors shadow-lg shadow-indigo-500/20"
        >
          {loading ? `Uploading... ${progress}%` : "Upload Video"}
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
          <h3 className="text-xs font-bold text-emerald-400 mb-2">
            Upload Successful!
          </h3>
          <pre className="text-[10px] text-emerald-300 overflow-x-auto bg-black/40 p-2 rounded-lg font-mono">
            {JSON.stringify(uploadedData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}