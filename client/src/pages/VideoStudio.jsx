import React, { useEffect, useState } from "react";
import { fetchVideos, uploadVideo } from "../services/api";

export default function VideoStudio() {
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);

  // Upload States
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const data = await fetchVideos();
      setVideos(data);
    } catch (err) {
      console.error("Failed to load videos", err);
    } finally {
      setLoadingVideos(false);
    }
  };

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
      setUploading(true);
      setProgress(0);
      setError("");

      await uploadVideo(formData, (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        );
        setProgress(percentCompleted);
      });

      setTitle("");
      setFile(null);
      loadVideos(); // Refresh feed automatically after upload
    } catch (err) {
      setError(err.response?.data?.error || "Failed to upload video.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 bg-[#0f0f0f] min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <span className="bg-red-600 text-white px-2 py-0.5 rounded text-sm">▶</span> Creator Studio
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Upload Form */}
        <div className="bg-[#1f1f1f] border border-[#272727] p-6 rounded-2xl shadow-xl h-fit">
          <h2 className="text-lg font-bold mb-4">Upload New Video</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-xs font-medium text-gray-300">
                Video Title
              </label>
              <input
                type="text"
                placeholder="Enter custom title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 bg-[#121212] border border-[#303030] rounded-xl text-xs text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-medium text-gray-300">
                Select Video File
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="w-full p-2 bg-[#121212] border border-[#303030] rounded-xl text-xs text-gray-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white file:text-black hover:file:bg-gray-200 cursor-pointer"
              />
            </div>

            {error && <p className="text-red-500 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white rounded-xl text-xs font-bold transition shadow-lg cursor-pointer"
            >
              {uploading ? `Uploading... ${progress}%` : "Upload Video"}
            </button>
          </form>

          {uploading && (
            <div className="w-full h-1.5 bg-[#121212] rounded-full mt-4 overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-200"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </div>

        {/* Right Column: Uploaded Videos List Grid */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold mb-4">Your Uploaded Videos</h2>

          {loadingVideos ? (
            <p className="text-xs text-gray-400">Loading your videos...</p>
          ) : videos.length === 0 ? (
            <p className="text-xs text-gray-400 p-6 bg-[#1f1f1f] rounded-xl border border-[#272727]">No videos uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.map((vid) => (
                <div
                  key={vid.id}
                  className="bg-[#1f1f1f] border border-[#272727] rounded-2xl p-3 flex flex-col gap-3 group shadow-lg"
                >
                  <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
                    <video
                      controls
                      className="w-full h-full object-cover"
                      src={vid.filepath}
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-white line-clamp-1 group-hover:text-blue-400 transition">{vid.title}</h4>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      Size: {(vid.filesize / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}