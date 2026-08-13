import React from 'react';
import VideoUpload from '../components/VideoUpload';

export default function CreateVideo() {
  return (
    <div className="py-8">
      <h1 className="text-center text-xl font-bold mb-4 text-gray-800">Upload Video to Studio</h1>
      <VideoUpload />
    </div>
  );
}