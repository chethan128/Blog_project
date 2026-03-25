import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./explore.css";

function Explore() {
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [followedUsers, setFollowedUsers] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [commentTexts, setCommentTexts] = useState({});
  const [openShare, setOpenShare] = useState({});
  const navigate = useNavigate();

  const CATEGORIES = ["All", "Technology", "Lifestyle", "Art", "Business", "Travel", "General"];

  const fetchPosts = async () => {
    try {
      let url = "http://localhost:5000/api/posts";
      if (selectedCategory && selectedCategory !== "All") {
        url += `?category=${encodeURIComponent(selectedCategory)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setPosts(data);
      } else {
        console.error("Failed to fetch posts:", data);
        setPosts([]);
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err);
      setPosts([]);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  const handleLike = async (id, e) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to like posts.");
      return;
    }

    const postToLike = posts.find(p => String(p._id || p.id) === String(id));
    if (!postToLike) return;

    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postToLike._id}/like`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchPosts();
      } else {
        const errData = await res.json();
        console.error("Failed to like post:", errData);
        alert("Failed to like post: " + (errData.msg || errData.message));
      }
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  const handleFollow = async (authorEmail, e) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to follow authors.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/auth/follow/${authorEmail}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setFollowedUsers(prev => ({
          ...prev,
          [authorEmail]: !prev[authorEmail]
        }));
      } else {
        const errData = await res.json();
        alert(errData.msg || "Failed to follow user");
      }
    } catch (err) {
      console.error("Error following user:", err);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to delete your posts.");
      return;
    }

    if (window.confirm("Delete this post?")) {
      try {
        const postToDelete = posts.find(p => String(p._id || p.id) === String(id));
        if (!postToDelete) return;

        const res = await fetch(`http://localhost:5000/api/posts/${postToDelete._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          setPosts(posts.filter(p => p._id !== postToDelete._id));
        } else {
          const errData = await res.json();
          alert("Failed to delete post: " + (errData.msg || errData.message || "Unauthorized"));
        }
      } catch (err) {
        console.error("Error deleting post:", err);
      }
    }
  };

  const toggleComments = (postId, e) => {
    e.stopPropagation();
    setOpenComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleAddComment = async (postId, e) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to comment.");
      return;
    }

    const text = (commentTexts[postId] || "").trim();
    if (!text) return;

    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });

      if (res.ok) {
        setCommentTexts(prev => ({ ...prev, [postId]: "" }));
        fetchPosts();
      } else {
        const errData = await res.json();
        alert("Failed to add comment: " + (errData.msg || errData.message));
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const currentUserEmail = localStorage.getItem("user_email");

  let filtered = posts.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      (p.title && p.title.toLowerCase().includes(term)) ||
      (p.content && p.content.toLowerCase().includes(term))
    );
  });

  if (sortBy === "newest") {
    filtered.sort((a, b) => new Date(b.date || a.id) - new Date(a.date || b.id));
  } else if (sortBy === "oldest") {
    filtered.sort((a, b) => new Date(a.date || a.id) - new Date(b.date || b.id));
  } else if (sortBy === "trending") {
    filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  }

  return (
    <div className="explore-container">
      <div className="explore-header">
        <h2>Explore Posts</h2>

        <div className="explore-controls">
          <input
            type="text"
            className="explore-search"
            placeholder="Search stories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="explore-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="trending">Trending</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>

      <div className="category-dropdown-container">
        <label htmlFor="category-select" className="category-label">Select Category:</label>
        <select
          id="category-select"
          className="explore-category-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h4>No posts found.</h4>
          <p>There are no stories to display right now.</p>
          <button className="create-btn" onClick={() => navigate("/create")}>
            Write a Story
          </button>
        </div>
      ) : (
        <div className="feed-layout">
          {filtered.map((post) => (
            <div
              key={post._id}
              className="feed-card glass-effect"
              onClick={() => navigate(`/post/${post._id}`)}
            >
              <div className="feed-card-header">
                <div className="author-info">
                  <div className="author-avatar" onClick={(e) => { e.stopPropagation(); navigate(`/user/${post.author}`); }} style={{ cursor: 'pointer' }}>P</div>
                  <div>
                    <div className="author-name-row">
                      <h4 className="author-name" onClick={(e) => { e.stopPropagation(); navigate(`/user/${post.author}`); }} style={{ cursor: 'pointer' }}>
                        {post.author?.split('@')[0] || "Pixie User"}
                      </h4>
                      {post.author !== currentUserEmail && post.author && (
                        <>
                          <span className="dot-sep">•</span>
                          <button
                            className={`feed-follow-btn ${followedUsers[post.author] ? "following" : ""}`}
                            onClick={(e) => handleFollow(post.author, e)}
                          >
                            {followedUsers[post.author] ? "Following" : "Follow"}
                          </button>
                        </>
                      )}
                    </div>
                    <span className="post-date">{post.date || new Date().toLocaleDateString()}</span>
                  </div>
                </div>
                {post.author === currentUserEmail && (
                  <button
                    className="card-delete-icon"
                    onClick={(e) => handleDelete(post._id, e)}
                    title="Delete"
                  >
                    <span className="material-icon">🗑</span>
                  </button>
                )}
              </div>

              {post.image && (
                <div className="feed-card-image">
                  <img src={post.image} alt={post.title} />
                </div>
              )}

              <div className="feed-card-content">
                <div className="feed-action-bar">
                  <div className="feed-action-left">
                    <button className="feed-action-btn ig-like" onClick={(e) => handleLike(post._id, e)} title="Like">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    </button>
                    <button className="feed-action-btn ig-comment" onClick={(e) => toggleComments(post._id, e)} title="Comment">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </button>
                    <div className="share-btn-wrapper">
                      <button className="feed-action-btn ig-share" onClick={(e) => { e.stopPropagation(); setOpenShare(prev => ({ ...prev, [post._id]: !prev[post._id] })); }} title="Share">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                      </button>
                      {openShare[post._id] && (
                        <div className="share-popup" onClick={(e) => e.stopPropagation()}>
                          <div className="share-popup-header">Share to</div>
                          <div className="share-popup-grid">
                            <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(post.title + ' - ' + window.location.origin + '/post/' + post._id)}`} target="_blank" rel="noopener noreferrer" className="share-option whatsapp">
                              <div className="share-icon-circle whatsapp-bg">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                              </div>
                              <span>WhatsApp</span>
                            </a>
                            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/post/' + post._id)}`} target="_blank" rel="noopener noreferrer" className="share-option facebook">
                              <div className="share-icon-circle facebook-bg">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385h-3.047v-3.47h3.047v-2.642c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.513c-1.49 0-1.956.927-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                              </div>
                              <span>Facebook</span>
                            </a>
                            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.origin + '/post/' + post._id)}`} target="_blank" rel="noopener noreferrer" className="share-option twitter">
                              <div className="share-icon-circle twitter-bg">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="#fff"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                              </div>
                              <span>X</span>
                            </a>
                            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin + '/post/' + post._id)}`} target="_blank" rel="noopener noreferrer" className="share-option linkedin">
                              <div className="share-icon-circle linkedin-bg">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="#fff"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                              </div>
                              <span>LinkedIn</span>
                            </a>
                            <button className="share-option copy-link" onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText(window.location.origin + '/post/' + post._id); setOpenShare(prev => ({ ...prev, [post._id]: false })); alert('Link copied!'); }}>
                              <div className="share-icon-circle copylink-bg">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                              </div>
                              <span>Copy Link</span>
                            </button>
                            <a href={`mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent('Check out this post: ' + window.location.origin + '/post/' + post._id)}`} className="share-option email">
                              <div className="share-icon-circle email-bg">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                              </div>
                              <span>Email</span>
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <button className="feed-action-btn ig-bookmark" onClick={(e) => e.stopPropagation()} title="Save">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                  </button>
                </div>
                <div className="feed-likes-count">{post.likes || 0} likes</div>

                <h3 className="feed-title">{post.title}</h3>
                <p className="feed-excerpt">
                  {post.content.length > 150
                    ? post.content.slice(0, 150) + "..."
                    : post.content}
                </p>

                {/* "View all comments" link toggles inline section */}
                {post.comments && post.comments.length > 0 && !openComments[post._id] && (
                  <div
                    className="feed-comments-preview"
                    onClick={(e) => toggleComments(post._id, e)}
                  >
                    View all {post.comments.length} comments
                  </div>
                )}

                {/* Inline Comment Section */}
                {openComments[post._id] && (
                  <div className="inline-comments-section" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-comments-list">
                      {post.comments && post.comments.length > 0 ? (
                        post.comments.map((c, idx) => (
                          <div key={idx} className="inline-comment">
                            <span className="inline-comment-author">
                              {c.author?.split('@')[0] || "Guest"}
                            </span>
                            <span className="inline-comment-text">{c.text}</span>
                          </div>
                        ))
                      ) : (
                        <p className="inline-no-comments">No comments yet. Be the first!</p>
                      )}
                    </div>
                    <div className="inline-comment-input">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={commentTexts[post._id] || ""}
                        onChange={(e) => setCommentTexts(prev => ({ ...prev, [post._id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddComment(post._id, e);
                        }}
                      />
                      <button
                        className="inline-comment-post-btn"
                        onClick={(e) => handleAddComment(post._id, e)}
                        disabled={!(commentTexts[post._id] || "").trim()}
                      >
                        Post
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Explore;
