import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "../components/Toast";
import { SkeletonGrid } from "../components/SkeletonLoader";
import { FiSearch, FiChevronDown, FiClock, FiTrendingUp, FiCalendar, FiFilter } from "react-icons/fi";
import "./explore.css";

const CATEGORIES = ["All", "Technology", "Lifestyle", "Art", "Business", "Travel", "General"];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest", icon: <FiClock size={16} />, description: "Most recent first" },
  { value: "trending", label: "Trending", icon: <FiTrendingUp size={16} />, description: "Most popular" },
  { value: "oldest", label: "Oldest", icon: <FiCalendar size={16} />, description: "Published earliest" },
];

function Explore() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [followedUsers, setFollowedUsers] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [commentTexts, setCommentTexts] = useState({});
  const [openShare, setOpenShare] = useState({});
  const [bookmarkedPosts, setBookmarkedPosts] = useState({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPosts, setTotalPosts] = useState(0);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError, showInfo } = useToast();
  const sortDropdownRef = useRef(null);
  const catDropdownRef = useRef(null);
  const loadMoreRef = useRef(null);
  const LIMIT = 10;

  // Close sort dropdown on outside click
  const handleClickOutside = useCallback((e) => {
    if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
      setSortDropdownOpen(false);
    }
    if (catDropdownRef.current && !catDropdownRef.current.contains(e.target)) {
      setCatDropdownOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  // Check URL for search param from navbar
  useEffect(() => {
    const urlSearch = searchParams.get("search");
    if (urlSearch) setSearchTerm(urlSearch);
  }, [searchParams]);

  const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      let url = `http://localhost:5000/api/posts?page=${pageNum}&limit=${LIMIT}`;
      if (selectedCategory && selectedCategory !== "All") {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      const res = await fetch(url);
      const data = await res.json();

      if (res.ok && data.posts) {
        if (append) {
          setPosts(prev => [...prev, ...data.posts]);
        } else {
          setPosts(data.posts);
        }
        setTotalPosts(data.totalPosts);
        setHasMore(pageNum < data.totalPages);
      } else {
        if (!append) setPosts([]);
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err);
      if (!append) setPosts([]);
    }
    setLoading(false);
    setLoadingMore(false);
  }, [selectedCategory]);

  // Fetch bookmark status for all posts
  const fetchBookmarks = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/api/bookmarks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const map = {};
        data.forEach(p => { map[p._id] = true; });
        setBookmarkedPosts(map);
      }
    } catch (err) { /* ignore */ }
  };

  // Reset and fetch when category changes
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchPosts(1, false);
    fetchBookmarks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || loadingMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchPosts(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    const el = loadMoreRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasMore, loadingMore, loading, page, fetchPosts]);

  const handleLike = async (id, e) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) { showError("Please login to like posts."); return; }
    const postToLike = posts.find(p => String(p._id || p.id) === String(id));
    if (!postToLike) return;
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postToLike._id}/like`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const updated = await res.json();
        setPosts(prev => prev.map(p => p._id === updated._id ? { ...p, likes: updated.likes, likedBy: updated.likedBy } : p));
      } else {
        const errData = await res.json();
        showError("Failed to like: " + (errData.msg || errData.message));
      }
    } catch (err) { showError("Error liking post"); }
  };

  const handleBookmark = async (postId, e) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) { showError("Please login to save posts."); return; }
    try {
      const res = await fetch(`http://localhost:5000/api/bookmarks/${postId}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBookmarkedPosts(prev => ({ ...prev, [postId]: data.bookmarked }));
        showSuccess(data.bookmarked ? "Post saved! 🔖" : "Bookmark removed");
      }
    } catch (err) { showError("Failed to bookmark post"); }
  };

  const handleFollow = async (authorEmail, e) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) { showError("Please login to follow authors."); return; }
    try {
      const res = await fetch(`http://localhost:5000/api/auth/follow/${authorEmail}`, {
        method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFollowedUsers(prev => ({ ...prev, [authorEmail]: data.following }));
        showInfo(data.following ? "Following! ✨" : "Unfollowed");
      } else {
        const errData = await res.json();
        showError(errData.msg || "Failed to follow user");
      }
    } catch (err) { showError("Error following user"); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) { showError("Please login to delete your posts."); return; }
    if (window.confirm("Delete this post?")) {
      try {
        const postToDelete = posts.find(p => String(p._id || p.id) === String(id));
        if (!postToDelete) return;
        const res = await fetch(`http://localhost:5000/api/posts/${postToDelete._id}`, {
          method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setPosts(posts.filter(p => p._id !== postToDelete._id));
          showSuccess("Post deleted successfully");
        } else {
          const errData = await res.json();
          showError("Failed to delete: " + (errData.msg || errData.message || "Unauthorized"));
        }
      } catch (err) { showError("Error deleting post"); }
    }
  };

  const toggleComments = (postId, e) => {
    e.stopPropagation();
    setOpenComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleAddComment = async (postId, e) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) { showError("Please login to comment."); return; }
    const text = (commentTexts[postId] || "").trim();
    if (!text) return;
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        const updated = await res.json();
        setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: updated.comments } : p));
        setCommentTexts(prev => ({ ...prev, [postId]: "" }));
        showSuccess("Comment posted! 💬");
      } else {
        const errData = await res.json();
        showError("Failed to comment: " + (errData.msg || errData.message));
      }
    } catch (err) { showError("Error adding comment"); }
  };

  const currentUserEmail = localStorage.getItem("user_email");
  const currentUserId = localStorage.getItem("user_id");

  // Client-side filtering (search + sort) on already-loaded posts
  let filtered = posts.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (p.title && p.title.toLowerCase().includes(term)) ||
      (p.content && p.content.toLowerCase().includes(term))
    );
  });

  if (sortBy === "newest") {
    filtered.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
  } else if (sortBy === "oldest") {
    filtered.sort((a, b) => new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date));
  } else if (sortBy === "trending") {
    filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  }

  return (
    <div className="explore-container">
      <div className="explore-header sticky-header">
        <div className="explore-header-top">
          <h2>Explore Posts</h2>

          <div className="modern-search-bar glass-effect">
          <FiSearch className="search-icon" size={20} />
          <input
            type="text"
            className="explore-search-modern"
            placeholder="Search stories, topics, or authors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="sort-divider"></div>
          <div className="custom-sort-dropdown" ref={catDropdownRef}>
            <button
              className={`sort-dropdown-trigger ${catDropdownOpen ? 'open' : ''}`}
              onClick={(e) => { e.stopPropagation(); setCatDropdownOpen(!catDropdownOpen); }}
              type="button"
              style={{ padding: '8px 12px' }}
            >
              <FiFilter size={16} className="sort-chevron" />
              <span className="sort-trigger-label" style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedCategory}</span>
              <FiChevronDown className={`sort-chevron ${catDropdownOpen ? 'rotated' : ''}`} size={16} />
            </button>
            {catDropdownOpen && (
              <div className="sort-dropdown-menu" style={{ minWidth: '150px' }}>
                <div className="sort-dropdown-header">Category</div>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    className={`sort-dropdown-option ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCategory(cat);
                      setCatDropdownOpen(false);
                    }}
                    type="button"
                  >
                    <div className="sort-option-text">
                      <span className="sort-option-label">{cat}</span>
                    </div>
                    {selectedCategory === cat && (
                      <span className="sort-option-check">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="sort-divider"></div>
          <div className="custom-sort-dropdown" ref={sortDropdownRef}>
            <button
              className={`sort-dropdown-trigger ${sortDropdownOpen ? 'open' : ''}`}
              onClick={(e) => { e.stopPropagation(); setSortDropdownOpen(!sortDropdownOpen); }}
              type="button"
            >
              {SORT_OPTIONS.find(o => o.value === sortBy)?.icon}
              <span className="sort-trigger-label">{SORT_OPTIONS.find(o => o.value === sortBy)?.label}</span>
              <FiChevronDown className={`sort-chevron ${sortDropdownOpen ? 'rotated' : ''}`} size={16} />
            </button>
            {sortDropdownOpen && (
              <div className="sort-dropdown-menu">
                <div className="sort-dropdown-header">Sort by</div>
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    className={`sort-dropdown-option ${sortBy === option.value ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSortBy(option.value);
                      setSortDropdownOpen(false);
                    }}
                    type="button"
                  >
                    <span className="sort-option-icon">{option.icon}</span>
                    <div className="sort-option-text">
                      <span className="sort-option-label">{option.label}</span>
                      <span className="sort-option-desc">{option.description}</span>
                    </div>
                    {sortBy === option.value && (
                      <span className="sort-option-check">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {loading ? (
        <SkeletonGrid count={4} />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h4>No posts found.</h4>
          <p>There are no stories to display right now.</p>
          <button className="create-btn" onClick={() => navigate("/create")}>
            Write a Story
          </button>
        </div>
      ) : (
        <div className="feed-layout">
          {filtered.map((post, index) => (
            <div
              key={post._id}
              className="feed-card glass-effect card-animate"
              style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
              onClick={() => navigate(`/post/${post._id}`)}
            >
              <div className="feed-card-header">
                <div className="author-info">
                  <div className="author-avatar" onClick={(e) => { e.stopPropagation(); navigate(`/user/${post.author}`); }} style={{ cursor: 'pointer' }}>
                    {(post.author?.split('@')[0] || "P").charAt(0).toUpperCase()}
                  </div>
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
                    <div className="post-meta-row">
                      <span className="post-date">
                        {new Date(post.createdAt || post.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                      <span className="post-read-time">· {post.readingTime || 1} min read</span>
                    </div>
                  </div>
                </div>
                {post.author === currentUserEmail && (
                  <button className="card-delete-icon" onClick={(e) => handleDelete(post._id, e)} title="Delete">
                    <span className="material-icon">🗑</span>
                  </button>
                )}
              </div>

              {post.image && (
                <div className="feed-card-image">
                  <img src={post.image} alt={post.title} onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x600/E2E8F0/64748B?text=Pixie+Pages'; }} />
                </div>
              )}

              <div className="feed-card-content">
                <div className="feed-action-bar">
                  <div className="feed-action-left">
                    <button className={`feed-action-btn ig-like ${post.likedBy?.includes(currentUserId) ? 'liked' : ''}`} onClick={(e) => handleLike(post._id, e)} title="Like">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={post.likedBy?.includes(currentUserId) ? "#ef4444" : "none"} stroke={post.likedBy?.includes(currentUserId) ? "#ef4444" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
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
                              <div className="share-icon-circle whatsapp-bg">💬</div><span>WhatsApp</span>
                            </a>
                            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.origin + '/post/' + post._id)}`} target="_blank" rel="noopener noreferrer" className="share-option twitter">
                              <div className="share-icon-circle twitter-bg">🐦</div><span>X</span>
                            </a>
                            <button className="share-option copy-link" onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText(window.location.origin + '/post/' + post._id); setOpenShare(prev => ({ ...prev, [post._id]: false })); showSuccess('Link copied! 🔗'); }}>
                              <div className="share-icon-circle copylink-bg">🔗</div><span>Copy Link</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    className={`feed-action-btn ig-bookmark ${bookmarkedPosts[post._id] ? 'bookmarked' : ''}`}
                    onClick={(e) => handleBookmark(post._id, e)}
                    title="Save"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={bookmarkedPosts[post._id] ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                  </button>
                </div>
                <div className="feed-likes-count">{post.likes || 0} likes</div>

                <h3 className="feed-title">{post.title}</h3>
                <p className="feed-excerpt">
                  {post.content.replace(/<[^>]*>/g, '').length > 150
                    ? post.content.replace(/<[^>]*>/g, '').slice(0, 150) + "..."
                    : post.content.replace(/<[^>]*>/g, '')}
                </p>

                {/* Tags on cards */}
                {post.tags && post.tags.length > 0 && (
                  <div className="feed-card-tags">
                    {post.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="feed-tag-pill">#{tag}</span>
                    ))}
                    {post.tags.length > 3 && <span className="feed-tag-pill more">+{post.tags.length - 3}</span>}
                  </div>
                )}

                {post.comments && post.comments.length > 0 && !openComments[post._id] && (
                  <div className="feed-comments-preview" onClick={(e) => toggleComments(post._id, e)}>
                    View all {post.comments.length} comments
                  </div>
                )}

                {openComments[post._id] && (
                  <div className="inline-comments-section" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-comments-list">
                      {post.comments && post.comments.length > 0 ? (
                        post.comments.map((c, idx) => (
                          <div key={idx} className="inline-comment">
                            <span className="inline-comment-author">{c.author?.split('@')[0] || "Guest"}</span>
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
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(post._id, e); }}
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

          {/* Infinite scroll sentinel */}
          {hasMore && (
            <div ref={loadMoreRef} className="load-more-sentinel">
              {loadingMore && (
                <div className="loading-more-indicator">
                  <div className="loading-dots">
                    <span></span><span></span><span></span>
                  </div>
                  <p>Loading more stories...</p>
                </div>
              )}
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <div className="end-of-feed">
              <span className="end-divider"></span>
              <span className="end-text">You've seen all {totalPosts} stories ✨</span>
              <span className="end-divider"></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Explore;
