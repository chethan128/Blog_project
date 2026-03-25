import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar({ darkMode, setDarkMode }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("home");
  const navigate = useNavigate();
  const location = useLocation();

  const hideNavContent = ["/login", "/register", "/forgot-password"].some(path => location.pathname.startsWith(path));
  const currentUserEmail = localStorage.getItem("user_email");
  const isAuthenticated = !!currentUserEmail;

  useEffect(() => {
    const path = location.pathname.split("/")[1] || "home";
    setActiveLink(path);
  }, [location]);

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
    window.location.href = "/login";
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
        <form onSubmit={handleSearch}>
          <input
            type="text"
            className="search"
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>

        <div className="nav-links">
          <Link to="/" className={activeLink === "home" ? "active" : ""} onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/explore" className={activeLink === "explore" ? "active" : ""} onClick={() => setMenuOpen(false)}>Explore</Link>
          <Link to="/create" className={activeLink === "create" ? "active" : ""} onClick={() => setMenuOpen(false)}>Write</Link>
        </div>
      </div>

      <div className="nav-right">
        <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "☀️" : "🌙"}
        </button>

        {isAuthenticated && (
          <div className="account-actions">
            <Link to={`/user/${currentUserEmail}`} className="account-btn profile-btn" onClick={() => setMenuOpen(false)} title="My Profile">
              👤
            </Link>
            <button className="account-btn logout-btn" onClick={handleLogout} title="Logout">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
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
