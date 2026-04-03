import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import "./Post.css";

function Post() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [hasLiked, setHasLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readProgress, setReadProgress] = useState(0);
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useToast();

  // Reading progress bar
  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight > 0) {
      setReadProgress(Math.min((scrollTop / docHeight) * 100, 100));
    }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Relative time helper
  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const fetchPostAndProfile = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${id}`);
      if (res.ok) {
        const postData = await res.json();
        setPost(postData);

        const myEmail = localStorage.getItem("user_email");
        const token = localStorage.getItem("token");

        // Register view
        if (token && myEmail && postData.author && postData.author !== myEmail) {
          try {
            await fetch(`http://localhost:5000/api/posts/${id}/view`, {
              method: 'PUT',
              headers: { 'Authorization': `Bearer ${token}` }
            });
          } catch (viewErr) {
            // silently ignore
          }
        }

        // Check if I follow the author
        if (myEmail && postData.author && postData.author !== myEmail) {
          const resProfile = await fetch(`http://localhost:5000/api/auth/profile/${postData.author}`);
          if (resProfile.ok) {
            const profileData = await resProfile.json();
            setIsFollowing(profileData.followers?.includes(myEmail));
          }
        }

        // Fetch related posts
        try {
          const relRes = await fetch(`http://localhost:5000/api/posts/${id}/related`);
          if (relRes.ok) {
            const relData = await relRes.json();
            setRelatedPosts(relData);
          }
        } catch (relErr) {
          // ignore
        }

        // Check bookmark status
        if (token) {
          try {
            const bkRes = await fetch(`http://localhost:5000/api/bookmarks/check/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (bkRes.ok) {
              const bkData = await bkRes.json();
              setIsBookmarked(bkData.bookmarked);
            }
          } catch (bkErr) {
            // ignore
          }
        }
      } else {
        setPost(null);
      }
    } catch (err) {
      console.error("Failed to fetch post:", err);
      setPost(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchPostAndProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (post && post.likedBy && userId) {
      setHasLiked(post.likedBy.includes(userId));
    } else {
      setHasLiked(false);
    }
  }, [post]);

  const handleLike = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Please login to like posts.");
      return;
    }

    if (post) {
      try {
        const res = await fetch(`http://localhost:5000/api/posts/${post._id}/like`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          fetchPostAndProfile();
        } else {
          const errData = await res.json();
          showError("Failed to like: " + (errData.msg || errData.message));
        }
      } catch (err) {
        showError("Error liking post");
      }
    }
  };

  const handleBookmark = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Please login to save posts.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/bookmarks/${post._id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsBookmarked(data.bookmarked);
        showSuccess(data.bookmarked ? "Post saved! 🔖" : "Bookmark removed");
      }
    } catch (err) {
      showError("Failed to bookmark");
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Please login to comment.");
      return;
    }

    if (post && commentText.trim() !== "") {
      try {
        const res = await fetch(`http://localhost:5000/api/posts/${post._id}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ text: commentText })
        });
        if (res.ok) {
          setCommentText("");
          showSuccess("Comment posted! 💬");
          fetchPostAndProfile();
        }
      } catch (err) {
        showError("Error adding comment");
      }
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showSuccess("Post link copied! 🔗");
  };

  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        const res = await fetch(`http://localhost:5000/api/posts/${post._id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          showSuccess("Post deleted");
          navigate("/explore");
        } else {
          const errData = await res.json();
          showError("Failed to delete: " + (errData.msg || errData.message));
        }
      } catch (err) {
        showError("Error deleting post");
      }
    }
  };

  const isAuthor = post && post.author === localStorage.getItem("user_email");

  const handleEdit = () => {
    navigate("/create", { state: { post } });
  };

  const handleFollow = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Please login to follow authors.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/auth/follow/${post.author}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.following);
        showInfo(data.following ? "Following! ✨" : "Unfollowed");
      } else {
        const errData = await res.json();
        showError(errData.msg || "Failed to follow user");
      }
    } catch (err) {
      showError("Error following user");
    }
  };

  if (loading) {
    return (
      <div className="post-container">
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-secondary, #888)" }}>
          Loading post...
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-container">
        <h2>Post not found</h2>
        <button className="back-btn" onClick={() => navigate("/explore")}>Back to explore</button>
      </div>
    );
  }

  return (
    <div className="post-container">
      {/* Reading Progress Bar */}
      <div className="reading-progress-bar" style={{ width: `${readProgress}%` }} />
      <div className="post-header">
        <h2>{post.title}</h2>
        <div className="author-meta" style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <span
            className="author-name"
            style={{ fontWeight: "600", color: "var(--primary-color, #6C63FF)", cursor: "pointer" }}
            onClick={() => navigate(`/user/${post.author}`)}
          >
            {post.author?.split('@')[0] || "Pixie User"}
          </span>
          <span className="post-date">{new Date(post.createdAt || post.date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
          {post.category && (
            <span className="post-category-badge">{post.category}</span>
          )}
          {!isAuthor && post.author && (
            <button
              className={`follow-btn ${isFollowing ? "following" : ""}`}
              onClick={handleFollow}
              style={{
                background: isFollowing ? "var(--input-bg)" : "var(--primary-gradient)",
                color: isFollowing ? "var(--text-color)" : "white",
                border: isFollowing ? "1px solid var(--input-border)" : "none",
                padding: "6px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px"
              }}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>
      </div>

      {post.image && (
        <div className="post-cover">
          <img src={post.image} alt={post.title} />
        </div>
      )}

      <div className="post-content" dangerouslySetInnerHTML={{ __html: post.content }} />

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="post-tags">
          {post.tags.map((tag, i) => (
            <span key={i} className="post-tag">#{tag}</span>
          ))}
        </div>
      )}

      <div className="combined-actions-bar">
        <div className="social-actions-group">
          <button className={`action-btn like-btn ${hasLiked ? 'liked' : ''}`} onClick={handleLike}>
            <span className="icon">❤️</span> {post.likes}
          </button>
          <button className="action-btn share-btn" onClick={handleShare}>
            <span className="icon">🔗</span> Share
          </button>
          <button className={`action-btn bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`} onClick={handleBookmark}>
            <span className="icon">{isBookmarked ? '🔖' : '📑'}</span> {isBookmarked ? 'Saved' : 'Save'}
          </button>
        </div>

        <div className="manage-actions-group">
          {isAuthor && (
            <>
              <button className="post-action-btn edit-btn" onClick={handleEdit}>Edit</button>
              <button className="post-action-btn delete-btn" onClick={handleDelete}>Delete</button>
            </>
          )}
          <button className="post-action-btn back-btn" onClick={() => navigate("/explore")}>Back</button>
        </div>
      </div>

      <div className="comments-section">
        <h3>Comments ({(post.comments || []).length})</h3>

        <form className="comment-form" onSubmit={handleCommentSubmit}>
          <textarea
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            required
          />
          <button type="submit" disabled={!commentText.trim()}>Post Comment</button>
        </form>

        <div className="comments-list">
          {(!post.comments || post.comments.length === 0) ? (
            <p className="no-comments">No comments yet. Be the first to share your thoughts!</p>
          ) : (
            post.comments.map((comment) => (
              <div key={comment._id || Math.random()} className="comment-bubble">
                <div className="comment-avatar">
                  {(comment.author?.split('@')[0] || "G").charAt(0).toUpperCase()}
                </div>
                <div className="comment-body">
                  <div className="comment-header">
                    <span className="comment-author">{comment.author?.split('@')[0] || "Guest"}</span>
                    <span className="comment-date">{timeAgo(comment.date)}</span>
                  </div>
                  <p className="comment-text">{comment.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div className="related-section">
          <h3>📚 Related Posts</h3>
          <div className="related-grid">
            {relatedPosts.map((rp) => (
              <div
                key={rp._id}
                className="related-card"
                onClick={() => navigate(`/post/${rp._id}`)}
              >
                {rp.image && <img src={rp.image} alt={rp.title} className="related-img" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x600/E2E8F0/64748B?text=Pixie+Pages'; }}/>}
                <div className="related-info">
                  <span className="related-category">{rp.category || "General"}</span>
                  <h4>{rp.title}</h4>
                  <span className="related-meta">
                    ❤️ {rp.likes || 0} · {new Date(rp.createdAt || rp.date).toLocaleString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Post;
