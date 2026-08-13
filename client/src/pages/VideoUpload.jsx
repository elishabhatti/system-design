import React, { useState } from "react";
import { uploadVideo } from "../services/api";

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
    <div className="max-w-md mx-auto my-10 p-8 bg-[#1f1f1f] border border-[#272727] rounded-2xl font-sans text-white shadow-2xl">
      <h2 className="mb-5 text-xl font-bold text-white flex items-center gap-2">
        <span className="bg-red-600 text-white px-2 py-0.5 rounded text-xs">▶</span> Upload Video Studio
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1.5 text-xs font-medium text-gray-300">
            Video Title (Optional)
          </label>
          <input
            type="text"
            placeholder="Enter custom title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 bg-[#121212] border border-[#303030] rounded-xl text-xs text-white outline-none focus:border-blue-500 transition"
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
            className="w-full p-2.5 bg-[#121212] border border-[#303030] rounded-xl text-xs text-gray-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white file:text-black hover:file:bg-gray-200 cursor-pointer transition"
          />
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold disabled:bg-gray-700 cursor-pointer transition-colors shadow-lg"
        >
          {loading ? `Uploading... ${progress}%` : "Upload Video"}
        </button>
      </form>

      {loading && (
        <div className="w-full h-1.5 bg-[#121212] rounded-full mt-4 overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-200"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {uploadedData && (
        <div className="mt-5 p-4 bg-emerald-950/40 border border-emerald-800 rounded-xl">
          <h3 className="text-xs font-bold text-emerald-400 mb-2">
            Upload Successful!
          </h3>
          <pre className="text-[10px] text-emerald-300 overflow-x-auto bg-black/40 p-2 rounded-lg">
            {JSON.stringify(uploadedData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}