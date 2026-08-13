import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Agar user logged in NAHI hai toh Login pe bhej do
export const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-center p-20 text-white bg-[#0f0f0f]">Loading...</div>;

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

// Agar user pehle se logged in HAI toh Login/Register access na karne do, Home pe bhej do
export const GuestRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-center p-20 text-white bg-[#0f0f0f]">Loading...</div>;

  return !user ? <Outlet /> : <Navigate to="/" replace />;
};