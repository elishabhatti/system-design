import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { SidebarProvider } from './context/SidebarContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import UserVideosPage from './pages/UserVideosPage';
import Login from './pages/Login';
import Register from './pages/Register';
import VideoStudio from './pages/VideoStudio';
import VideoUpload from './pages/VideoUpload';

function LayoutWithSidebar() {
  return (
    <div className="min-h-screen text-white font-sans flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <Router>
          <Routes>
            {/* Protected Routes (Sirf logged-in users ke liye) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<LayoutWithSidebar />}>
                <Route path="/" element={<Home />} />
                <Route path="/create" element={<VideoUpload />} />
                <Route path="/watch/:id" element={<VideoStudio />} />
                <Route path="/profile" element={<UserVideosPage />} />
              </Route>
            </Route>

            {/* Guest Routes (Sirf logged-OUT users ke liye i.e. Login / Register) */}
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
          </Routes>
        </Router>
      </SidebarProvider>
    </AuthProvider>
  );
}