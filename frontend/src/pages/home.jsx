import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import "./home.css";

function Home() {
  const [posts, setPosts] = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [stats, setStats] = useState({ totalPosts: 0, totalUsers: 0, totalComments: 0 });
  const [animatedStats, setAnimatedStats] = useState({ totalPosts: 0, totalUsers: 0, totalComments: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/posts`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts || []);
        }
      } catch (err) {
        console.error("Failed to fetch posts:", err);
      }
    };

    const fetchTrending = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/posts/trending`);
        if (res.ok) {
          const data = await res.json();
          setTrendingPosts(data.slice(0, 4));
        }
      } catch (err) {
        console.error("Failed to fetch trending:", err);
      }
    };

    const fetchStats = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/posts/stats/overview`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    };

    fetchPosts();
    fetchTrending();
    fetchStats();
  }, []);

  // Animated counter effect
  useEffect(() => {
    const duration = 1500;
    const steps = 40;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setAnimatedStats({
        totalPosts: Math.round(stats.totalPosts * eased),
        totalUsers: Math.round(stats.totalUsers * eased),
        totalComments: Math.round(stats.totalComments * eased),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [stats]);

  const recentPosts = posts.slice(0, 6);

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
          <button className="hero-btn" onClick={() => navigate("/explore")}>
            Explore All Posts →
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card glass-effect">
            <span className="stat-number">{animatedStats.totalPosts}</span>
            <span className="stat-label-home">Stories Published</span>
          </div>
          <div className="stat-card glass-effect">
            <span className="stat-number">{animatedStats.totalUsers}</span>
            <span className="stat-label-home">Active Writers</span>
          </div>
          <div className="stat-card glass-effect">
            <span className="stat-number">{animatedStats.totalComments}</span>
            <span className="stat-label-home">Comments Shared</span>
          </div>
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

      {/* Trending Posts Section */}
      {trendingPosts.length > 0 && (
        <div className="trending-section">
          <h2>🔥 Trending Right Now</h2>
          <div className="trending-grid">
            {trendingPosts.map((post) => (
              <div
                key={post._id}
                className="trending-card glass-effect"
                onClick={() => navigate(`/post/${post._id}`)}
              >
                {post.image && <img src={post.image} alt={post.title} className="trending-img" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400/E2E8F0/64748B?text=Pixie+Pages'; }} />}
                <div className="trending-info">
                  <div className="trending-top-row">
                    <span className="trending-category">{post.category || "General"}</span>
                    <span className="trending-read-time">📖 {post.readingTime || 1} min</span>
                  </div>
                  <h3>{post.title}</h3>
                  <div className="trending-meta">
                    <span className="trending-author-avatar">{(post.author?.split('@')[0] || 'P').charAt(0).toUpperCase()}</span>
                    <span>{post.author?.split('@')[0] || 'Pixie User'}</span>
                    <span>❤️ {post.likes || 0}</span>
                    <span>👁️ {post.viewsCount || 0}</span>
                  </div>
                  {post.tags && post.tags.length > 0 && (
                    <div className="trending-tags">
                      {post.tags.slice(0, 2).map((tag, i) => (
                        <span key={i} className="trending-tag">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Blogs Section */}
      <div className="featured-section">
        <h2>Featured Blogs</h2>
        {recentPosts.length === 0 ? (
          <div className="empty-state">
            <h4>No posts yet.</h4>
            <p>Be the first to share your story!</p>
            <button className="create-btn" onClick={() => navigate("/create")}>
              Write a Story
            </button>
          </div>
        ) : (
          <>
            <div className="posts-grid">
              {recentPosts.map((post) => {
                const displayTime = new Date(post.createdAt || post.date).toLocaleString('en-US', { month: 'short', day: 'numeric' });
                return (
                <div key={post._id} className="post-card" onClick={() => navigate(`/post/${post._id}`)}>
                  {post.image && <img src={post.image} alt={post.title} onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x600/E2E8F0/64748B?text=Pixie+Pages'; }} />}
                  <div className="post-info">
                    <div className="post-card-meta">
                      <span className="post-card-category">{post.category || "General"}</span>
                      <span className="post-card-read-time">📖 {post.readingTime || 1} min</span>
                    </div>
                    <h3>{post.title}</h3>
                    <p>
                      {post.content.length > 120
                        ? post.content.replace(/<[^>]*>/g, '').slice(0, 120) + "..."
                        : post.content.replace(/<[^>]*>/g, '')}
                    </p>
                    <div className="post-card-footer">
                      <div className="post-card-author">
                        <span className="post-card-avatar">{(post.author?.split('@')[0] || 'P').charAt(0).toUpperCase()}</span>
                        <span className="post-card-author-name">{post.author?.split('@')[0] || 'Pixie User'}</span>
                      </div>
                      <span className="post-card-date">{displayTime}</span>
                    </div>
                    {post.tags && post.tags.length > 0 && (
                      <div className="post-card-tags">
                        {post.tags.slice(0, 2).map((tag, i) => (
                          <span key={i} className="post-card-tag">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                )
              })}
            </div>
            {posts.length > 6 && (
              <div className="view-more">
                <button className="view-more-btn" onClick={() => navigate("/explore")}>
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
            <div key={index} className="category-card" onClick={() => navigate('/explore')}>
              <div className="category-icon">{cat.icon}</div>
              <h3>{cat.name}</h3>
              <p>{cat.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter/CTA Section */}
      <div className="cta-section">
        <div className="cta-content glass-effect">
          <h2>📬 Ready to Start Writing?</h2>
          <p>Join our community of passionate storytellers and share your voice with the world.</p>
          <button className="cta-btn" onClick={() => navigate("/create")}>
            Start Writing Now ✨
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Home;
