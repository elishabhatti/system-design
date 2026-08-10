import React, { useState } from 'react';
import { uploadVideo } from '../../services/api';

export default function VideoUpload() {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadedData, setUploadedData] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a video file.');
      return;
    }

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title || file.name);

    try {
      setLoading(true);
      setProgress(0);
      setError('');
      setUploadedData(null);

      const data = await uploadVideo(formData, (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setProgress(percentCompleted);
      });

      setUploadedData(data);
      setTitle('');
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload video.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-10 p-8 bg-white border border-gray-200 rounded-lg font-sans">
      <h2 className="mb-5 text-xl font-semibold text-gray-900">Upload Video (Day 1 Test)</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1.5 text-sm font-medium text-gray-700">Video Title (Optional)</label>
          <input
            type="text"
            placeholder="Enter custom title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-md text-sm bg-gray-50 outline-none focus:border-blue-600 focus:bg-white"
          />
        </div>

        <div>
          <label className="block mb-1.5 text-sm font-medium text-gray-700">Select Video File</label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="w-full p-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-600 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-gray-800 cursor-pointer"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:bg-gray-400 cursor-pointer transition-colors"
        >
          {loading ? `Uploading... ${progress}%` : 'Upload Video'}
        </button>
      </form>

      {loading && (
        <div className="w-full h-1.5 bg-gray-100 rounded-full mt-4 overflow-hidden">
          <div className="h-full bg-blue-600 transition-all duration-200" style={{ width: `${progress}%` }}></div>
        </div>
      )}

      {uploadedData && (
        <div className="mt-5 p-4 bg-emerald-50 border border-emerald-200 rounded-md">
          <h3 className="text-sm font-semibold text-emerald-800 mb-2">Upload Successful!</h3>
          <pre className="text-xs text-emerald-900 overflow-x-auto">{JSON.stringify(uploadedData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}