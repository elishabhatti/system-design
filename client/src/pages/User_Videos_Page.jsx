import React from 'react';
import VideoList from '../components/VideoList';

export default function UserVideosPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="bg-gray-900 text-white p-6 rounded-2xl mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Channel Profile</h1>
          <p className="text-xs text-gray-400 mt-1">Manage and track your uploaded files</p>
        </div>
      </div>
      <VideoList />
    </div>
  );
}