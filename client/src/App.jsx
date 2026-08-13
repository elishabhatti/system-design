import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import CreateVideo from "./pages/Create_Video";
import DetailedVideo from "./pages/DetailedVideo";
import UserVideosPage from "./pages/User_Videos_Page";
import Login from "./pages/Login";
import Register from "./pages/Register";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white font-sans text-gray-900">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateVideo />} />
          <Route path="/watch/:id" element={<DetailedVideo />} />
          <Route path="/profile" element={<UserVideosPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </Router>
  );
}
