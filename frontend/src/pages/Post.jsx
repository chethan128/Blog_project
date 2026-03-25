import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Post.css";

function Post() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [commentText, setCommentText] = useState("");
  const navigate = useNavigate();

  const [hasLiked, setHasLiked] = useState(false);

  const fetchPostAndProfile = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${id}`);
      if (res.ok) {
        const postData = await res.json();
        setPost(postData);

        const myEmail = localStorage.getItem("user_email");
        const token = localStorage.getItem("token");

        // Register view if the user is logged in, not the author, and token exists
        if (token && myEmail && postData.author && postData.author !== myEmail) {
          try {
            await fetch(`http://localhost:5000/api/posts/${id}/view`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
          } catch (viewErr) {
            console.error("Failed to register view", viewErr);
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
      } else {
        setPost(null);
      }
    } catch (err) {
      console.error("Failed to fetch post:", err);
      setPost(null);
    }
  };

  useEffect(() => {
    fetchPostAndProfile();
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
      alert("Please login to like posts.");
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
          fetchPostAndProfile(); // Refresh data to get updated likes correctly
        } else {
          const errData = await res.json();
          console.error("Failed to like post:", errData);
          alert("Failed to like post: " + (errData.msg || errData.message));
        }
      } catch (err) {
        console.error("Error liking post:", err);
      }
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to comment.");
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
          body: JSON.stringify({
            text: commentText
          })
        });
        if (res.ok) {
          setCommentText("");
          fetchPostAndProfile(); // Refresh data
        }
      } catch (err) {
        console.error("Error adding comment:", err);
      }
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Post link copied to clipboard!");
  };

  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        const res = await fetch(`http://localhost:5000/api/posts/${post._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          navigate("/explore");
        } else {
          const errData = await res.json();
          alert("Failed to delete post: " + (errData.msg || errData.message));
        }
      } catch (err) {
        console.error("Error deleting post:", err);
      }
    }
  };

  const isAuthor = post && post.author === localStorage.getItem("user_email");

  const handleEdit = () => {
    navigate("/create", { state: { post } });
  };

  if (!post) {
    return (
      <div className="post-container">
        <h2>Post not found</h2>
        <button className="back-btn" onClick={() => navigate("/explore")}>Back to explore</button>
      </div>
    );
  }

  const handleFollow = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to follow authors.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/auth/follow/${post.author}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.following);
      } else {
        const errData = await res.json();
        alert(errData.msg || "Failed to follow user");
      }
    } catch (err) {
      console.error("Error following user:", err);
    }
  };

  return (
    <div className="post-container">
      <div className="post-header">
        <h2>{post.title}</h2>
        <div className="author-meta" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span
            className="author-name"
            style={{ fontWeight: "600", color: "var(--primary-color, #6C63FF)", cursor: "pointer" }}
            onClick={() => navigate(`/user/${post.author}`)}
          >
            {post.author?.split('@')[0] || "Pixie User"}
          </span>
          <span className="post-date">{post.date || new Date().toLocaleDateString()}</span>
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

      <div className="combined-actions-bar">
        <div className="social-actions-group">
          <button className={`action-btn like-btn ${hasLiked ? 'liked' : ''}`} onClick={handleLike}>
            <span className="icon">❤️</span> {post.likes}
          </button>
          <button className="action-btn share-btn" onClick={handleShare}>
            <span className="icon">🔗</span> Share
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
                <div className="comment-header">
                  <span className="comment-author">{comment.author?.split('@')[0] || "Guest"}</span>
                  <span className="comment-date">
                    {new Date(comment.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="comment-text">{comment.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Post;
