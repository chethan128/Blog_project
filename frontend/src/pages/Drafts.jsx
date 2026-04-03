import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import "./Drafts.css";

function Drafts() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const fetchDrafts = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/api/posts/drafts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDrafts(data);
      }
    } catch (err) {
      console.error("Failed to fetch drafts:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (window.confirm("Delete this draft permanently?")) {
      try {
        const res = await fetch(`http://localhost:5000/api/posts/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setDrafts(drafts.filter((d) => d._id !== id));
          showSuccess("Draft deleted");
        } else {
          showError("Failed to delete draft");
        }
      } catch (err) {
        showError("Error deleting draft");
      }
    }
  };

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

  if (loading) {
    return (
      <div className="drafts-container">
        <div className="drafts-header">
          <h2>📝 My Drafts</h2>
        </div>
        <p style={{ textAlign: "center", color: "var(--subtext-color)" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="drafts-container">
      <div className="drafts-header">
        <h2>📝 My Drafts</h2>
        <p>Continue working on your unpublished stories</p>
      </div>

      {drafts.length === 0 ? (
        <div className="drafts-empty">
          <div className="drafts-empty-icon">✍️</div>
          <h3>No drafts yet</h3>
          <p>When you save a post as draft, it will appear here.</p>
          <button className="drafts-create-btn" onClick={() => navigate("/create")}>
            Start Writing
          </button>
        </div>
      ) : (
        <div className="drafts-list">
          {drafts.map((draft) => (
            <div key={draft._id} className="draft-card glass-effect">
              <div className="draft-card-content">
                <div className="draft-card-meta">
                  <span className="draft-badge">Draft</span>
                  <span className="draft-time">Last edited {timeAgo(draft.updatedAt || draft.createdAt)}</span>
                </div>
                <h3 className="draft-title">{draft.title || "Untitled Draft"}</h3>
                <p className="draft-excerpt">
                  {draft.content
                    ? draft.content.replace(/<[^>]*>/g, "").slice(0, 120) + (draft.content.length > 120 ? "..." : "")
                    : "No content yet..."}
                </p>
                {draft.tags && draft.tags.length > 0 && (
                  <div className="draft-tags">
                    {draft.tags.map((tag, i) => (
                      <span key={i} className="draft-tag">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="draft-card-actions">
                <button className="draft-edit-btn" onClick={() => navigate("/create", { state: { post: draft } })}>
                  Continue Editing
                </button>
                <button className="draft-delete-btn" onClick={() => handleDelete(draft._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Drafts;
