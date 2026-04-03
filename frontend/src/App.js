import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import { ToastProvider } from "./components/Toast";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/register";
import Home from "./pages/home";
import Dashboard from "./pages/dashboard";
import Explore from "./pages/explore";
import Post from "./pages/Post";
import Create from "./pages/create";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import UserProfile from "./pages/UserProfile";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Drafts from "./pages/Drafts";

import "./index.css";

// Protected Route Component — relies only on React state for instant redirect on logout
const ProtectedRoute = ({ element, isAuthenticated }) => {
  return isAuthenticated ? element : <Navigate to="/login" replace />;
};

const AppContent = ({ darkMode, setDarkMode, isAuthenticated, setIsAuthenticated }) => {
  return (
    <>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Home />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Login setIsAuthenticated={setIsAuthenticated} />
            )
          }
        />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              element={<Dashboard setIsAuthenticated={setIsAuthenticated} />}
              isAuthenticated={isAuthenticated}
            />
          }
        />
        <Route
          path="/explore"
          element={
            <ProtectedRoute
              element={<Explore />}
              isAuthenticated={isAuthenticated}
            />
          }
        />
        <Route
          path="/create"
          element={
            <ProtectedRoute
              element={<Create />}
              isAuthenticated={isAuthenticated}
            />
          }
        />
        <Route
          path="/post/:id"
          element={
            <ProtectedRoute
              element={<Post />}
              isAuthenticated={isAuthenticated}
            />
          }
        />
        <Route
          path="/user/:email"
          element={
            <ProtectedRoute
              element={<UserProfile setIsAuthenticated={setIsAuthenticated} />}
              isAuthenticated={isAuthenticated}
            />
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute
              element={<Settings />}
              isAuthenticated={isAuthenticated}
            />
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute
              element={<Notifications />}
              isAuthenticated={isAuthenticated}
            />
          }
        />
        <Route
          path="/drafts"
          element={
            <ProtectedRoute
              element={<Drafts />}
              isAuthenticated={isAuthenticated}
            />
          }
        />
      </Routes>
    </>
  );
};

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in from localStorage
  useEffect(() => {
    const user = localStorage.getItem("user_email");
    if (user) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  // initialize theme from storage
  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) {
      setDarkMode(saved === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
    if (darkMode) {
      document.body.classList.remove("light");
    } else {
      document.body.classList.add("light");
    }
  }, [darkMode]);

  if (loading) return null; // avoid flashing

  return (
    <ToastProvider>
      <Router>
        <AppContent
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          isAuthenticated={isAuthenticated}
          setIsAuthenticated={setIsAuthenticated}
        />
      </Router>
    </ToastProvider>
  );
}

export default App;