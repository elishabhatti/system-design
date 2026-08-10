import React from 'react';
import VideoUpload from './components/VideoUpload';
import VideoList from './components/VideoList';

export default function App() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <VideoUpload />
      <VideoList />
    </main>
  );
}