import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo">✨ Pixie Pages</div>
          <p>A modern platform for writers, creators, and thinkers to share beautiful stories with the world.</p>
          <div className="footer-social">
            <a href="https://github.com" target="_blank" rel="noreferrer" title="GitHub">🐙</a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" title="Twitter">🐦</a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" title="LinkedIn">💼</a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Navigate</h4>
          <Link to="/">Home</Link>
          <Link to="/explore">Explore</Link>
          <Link to="/create">Write</Link>
          <Link to="/dashboard">Dashboard</Link>
        </div>

        <div className="footer-col">
          <h4>Account</h4>
          <Link to="/settings">Settings</Link>
          <Link to="/notifications">Notifications</Link>
          <Link to="/dashboard">My Profile</Link>
        </div>

        <div className="footer-col">
          <h4>Categories</h4>
          <Link to="/explore">Technology</Link>
          <Link to="/explore">Lifestyle</Link>
          <Link to="/explore">Art & Design</Link>
          <Link to="/explore">Travel</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Pixie Pages. All rights reserved.</span>
        <span>Made with ❤️ for storytellers</span>
      </div>
    </footer>
  );
}

export default Footer;
