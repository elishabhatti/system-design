import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
  Link,
  useLocation,
} from "react-router-dom";
import { SidebarProvider } from "./context/SidebarContext";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, GuestRoute } from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VideoDetail from "./pages/VideoDetail";
import VideoUpload from "./pages/VideoUpload";
import UserProfile from "./pages/UserProfile";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Page scrolls on the body, so Navbar (top-0) and Sidebar (top-14) can be sticky.
// Do NOT add overflow-* on these wrappers, it breaks position: sticky.
function LayoutWithSidebar() {
  return (
    <div className="min-h-screen bg-[#09090b] font-sans text-zinc-100">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] px-4 text-center text-zinc-100">
      <p className="text-6xl font-semibold tracking-tight text-white">404</p>
      <p className="mt-3 text-sm text-zinc-500">This page doesn't exist (yet).</p>
      <Link
        to="/"
        className="mt-6 rounded-full bg-white px-5 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200"
      >
        Back to home
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            {/* Logged-in users only */}
            <Route element={<ProtectedRoute />}>
              <Route path="/watch/:id" element={<VideoDetail />} />
              <Route element={<LayoutWithSidebar />}>
                <Route path="/" element={<Home />} />
                <Route path="/create" element={<VideoUpload />} />
                <Route path="/profile" element={<UserProfile />} />
              </Route>
            </Route>

            {/* Logged-out users only */}
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </SidebarProvider>
    </AuthProvider>
  );
}