import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const AuthSplash = () => (
  <div className="min-h-screen grain-bg flex items-center justify-center text-sm text-slate-500" data-testid="auth-loading">
    Loading your classroom…
  </div>
);

export const RequireAuth = ({ children }) => {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <AuthSplash />;
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (!user.profileComplete && location.pathname !== "/setup-profile") {
    return <Navigate to="/setup-profile" replace />;
  }
  return children;
};

export const HomeGate = ({ landing, app }) => {
  const { user, ready } = useAuth();
  if (!ready) return <AuthSplash />;
  if (!user) return landing;
  if (!user.profileComplete) return <Navigate to="/setup-profile" replace />;
  return app;
};

export const RedirectIfAuthed = ({ children }) => {
  const { user, ready } = useAuth();
  if (!ready) return <AuthSplash />;
  if (user && user.profileComplete) {
    return <Navigate to="/" replace />;
  }
  if (user && !user.profileComplete) {
    return <Navigate to="/setup-profile" replace />;
  }
  return children;
};
