import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { SidebarProvider } from './context/SidebarContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import CreateVideo from './pages/Create_Video';
import UserVideosPage from './pages/User_Videos_Page';
import Login from './pages/Login';
import Register from './pages/Register';
import VideoStudio from './pages/VideoStudio';

function LayoutWithSidebar() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white font-sans flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[#0f0f0f]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SidebarProvider>
      <Router>
        <Routes>
          <Route element={<LayoutWithSidebar />}>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateVideo />} />
            <Route path="/watch/:id" element={<VideoStudio />} />
            <Route path="/profile" element={<UserVideosPage />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </Router>
    </SidebarProvider>
  );
}