import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function FullPageSpinner({ label }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090b]">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
      <p className="mt-3 text-xs text-zinc-500">{label}</p>
    </div>
  );
}

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner label="Signing you in" />;

  return user ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );
};

export const GuestRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner label="Checking session" />;

  const from = location.state?.from;
  const target = from ? `${from.pathname}${from.search || ""}` : "/";

  return !user ? <Outlet /> : <Navigate to={target} replace />;
};