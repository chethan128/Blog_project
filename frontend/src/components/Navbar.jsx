import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { FiSun, FiMoon, FiBell, FiUser, FiSettings, FiLogOut } from "react-icons/fi";
function Navbar({ darkMode, setDarkMode, isAuthenticated, setIsAuthenticated }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("home");
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const hideNavContent = ["/login", "/register", "/forgot-password"].some(path => location.pathname.startsWith(path));
  const currentUserEmail = localStorage.getItem("user_email");

  useEffect(() => {
    const path = location.pathname.split("/")[1] || "home";
    setActiveLink(path);
  }, [location]);

  // Fetch unread notification count
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchUnread = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch("http://localhost:5000/api/notifications/unread-count", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count);
        }
      } catch (err) {
        // silently ignore
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_name");
    if (setIsAuthenticated) setIsAuthenticated(false);
    navigate("/login", { replace: true });
  };

  if (hideNavContent) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/" className="logo">✨ Pixie</Link>
      </div>

      <div className={`nav-center ${menuOpen ? "active" : ""}`}>


        <div className="nav-links">
          <Link to="/" className={activeLink === "home" ? "active" : ""} onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/explore" className={activeLink === "explore" ? "active" : ""} onClick={() => setMenuOpen(false)}>Explore</Link>
          <Link to="/create" className={activeLink === "create" ? "active" : ""} onClick={() => setMenuOpen(false)}>Write</Link>
        </div>
      </div>

      <div className="nav-right">
        <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)} title="Toggle Theme">
          {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
        </button>

        {isAuthenticated && (
          <div className="account-actions">
            <Link
              to="/notifications"
              className="account-btn notif-btn"
              onClick={() => setMenuOpen(false)}
              title="Notifications"
            >
              <FiBell size={20} />
              {unreadCount > 0 && (
                <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
              )}
            </Link>
            <Link to={`/user/${currentUserEmail}`} className="account-btn profile-btn" onClick={() => setMenuOpen(false)} title="My Profile">
              <FiUser size={20} />
            </Link>
            <Link to="/settings" className="account-btn settings-btn-nav" onClick={() => setMenuOpen(false)} title="Settings">
              <FiSettings size={20} />
            </Link>
            <button className="account-btn logout-btn" onClick={handleLogout} title="Logout">
              <FiLogOut size={20} />
            </button>
          </div>
        )}

        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
