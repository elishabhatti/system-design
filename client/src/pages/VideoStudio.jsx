import React, { useEffect, useState } from "react";
import { fetchVideos, uploadVideo } from "../services/api";

export default function VideoStudio() {
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
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
      loadVideos();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to upload video.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 bg-[#0a0a0a] min-h-screen text-white">
      <h1 className="text-lg font-semibold mb-6 border-b border-[#222] pb-3 tracking-wide">
        Creator Studio & Uploads
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-medium text-gray-200 mb-2">Library Feed</h2>

          {loadingVideos ? (
            <p className="text-xs text-gray-500">Loading library...</p>
          ) : videos.length === 0 ? (
            <p className="text-xs text-gray-500 p-5 bg-[#121212] border border-[#222] rounded-xl">No uploads found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {videos.map((vid) => (
                <div key={vid.id} className="bg-[#121212] border border-[#222222] rounded-xl p-2.5 flex flex-col gap-2">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden border border-[#1f1f1f]">
                    <video controls className="w-full h-full object-cover" src={vid.filepath} />
                  </div>
                  <div>
                    <h4 className="font-medium text-xs text-white truncate">{vid.title}</h4>
                    <span className="text-[10px] text-gray-500 block mt-0.5">
                      {(vid.filesize / (1024 * 1024)).toFixed(2)} MB
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