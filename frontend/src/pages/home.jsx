import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./home.css";

function Home() {
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/posts");
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
        } else {
          console.error("Failed to fetch posts");
        }
      } catch (err) {
        console.error("Failed to fetch posts:", err);
      }
    };
    fetchPosts();
  }, []);

  const recentPosts = posts.slice(0, 6); // Show only 6 recent posts

  const categories = [
    { name: "Technology", icon: "💻", description: "The latest in coding and hardware" },
    { name: "Lifestyle", icon: "☕", description: "Daily habits and slow living" },
    { name: "Art & Design", icon: "🎨", description: "Creative processes and inspiration" },
    { name: "Travel", icon: "✈️", description: "Adventures across the globe" }
  ];

  return (
    <div className="home-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>✨ Pixie Pages</h1>
          <p className="hero-subtitle">Discover beautiful stories shared by the community</p>
          <button
            className="hero-btn"
            onClick={() => navigate("/explore")}
          >
            Explore All Posts →
          </button>
        </div>
      </div>

      {/* About Section */}
      <div className="about-section">
        <div className="about-content">
          <h2>Why Pixie Pages?</h2>
          <p className="about-description">
            Pixie Pages is a safe haven for writers, creators, and thinkers. A place where elegant design meets thoughtful communities.
          </p>
          <div className="features-grid">
            <div className="feature-card glass-effect">
              <span className="feature-icon">📝</span>
              <h3>Rich Expression</h3>
              <p>Share your ideas with formatting that highlights your voice.</p>
            </div>
            <div className="feature-card glass-effect">
              <span className="feature-icon">🌍</span>
              <h3>Global Community</h3>
              <p>Connect with readers and writers from all around the world.</p>
            </div>
            <div className="feature-card glass-effect">
              <span className="feature-icon">✨</span>
              <h3>Elegant Design</h3>
              <p>A beautiful reading experience, carefully crafted for you.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Blogs Section */}
      <div className="featured-section">
        <h2>Featured Blogs</h2>

        {recentPosts.length === 0 ? (
          <div className="empty-state">
            <h4>No posts yet.</h4>
            <p>Be the first to share your story!</p>
            <button
              className="create-btn"
              onClick={() => navigate("/create")}
            >
              Write a Story
            </button>
          </div>
        ) : (
          <>
            <div className="posts-grid">
              {recentPosts.map((post) => (
                <div
                  key={post._id}
                  className="post-card"
                  onClick={() => navigate(`/post/${post._id}`)}
                >
                  {post.image && <img src={post.image} alt={post.title} />}
                  <div className="post-info">
                    <h3>{post.title}</h3>
                    <span className="post-date">{post.date}</span>
                    <p>
                      {post.content.length > 120
                        ? post.content.slice(0, 120) + "..."
                        : post.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {posts.length > 6 && (
              <div className="view-more">
                <button
                  className="view-more-btn"
                  onClick={() => navigate("/explore")}
                >
                  View All {posts.length} Posts →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Categories Section */}
      <div className="categories-section">
        <h2>Explore Categories</h2>
        <div className="categories-grid">
          {categories.map((cat, index) => (
            <div
              key={index}
              className="category-card"
              onClick={() => navigate('/explore')}
            >
              <div className="category-icon">{cat.icon}</div>
              <h3>{cat.name}</h3>
              <p>{cat.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Basic Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-logo">✨ Pixie Pages</div>
          <p>© {new Date().getFullYear()} Pixie Pages. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
