import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import "./Notifications.css";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showSuccess } = useToast();

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/notifications/read", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        showSuccess("All notifications marked as read");
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleClick = (notif) => {
    if (notif.post && notif.post._id) {
      navigate(`/post/${notif.post._id}`);
    } else if (notif.sender && notif.sender.email) {
      navigate(`/user/${notif.sender.email}`);
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

  const typeIcons = {
    like: "❤️",
    comment: "💬",
    follow: "👤",
  };

  if (loading) {
    return (
      <div className="notifications-container">
        <div className="notifications-header">
          <h2>🔔 Notifications</h2>
        </div>
        <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h2>🔔 Notifications</h2>
        {notifications.some((n) => !n.read) && (
          <button className="mark-read-btn" onClick={handleMarkAllRead}>
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="notif-empty">
          <div className="notif-empty-icon">🔕</div>
          <h3>No notifications yet</h3>
          <p>When someone likes, comments, or follows you, it will show up here.</p>
        </div>
      ) : (
        notifications.map((notif) => (
          <div
            key={notif._id}
            className={`notification-item ${!notif.read ? "unread" : ""}`}
            onClick={() => handleClick(notif)}
          >
            <div className={`notif-icon ${notif.type}`}>
              {typeIcons[notif.type] || "🔔"}
            </div>
            <div className="notif-content">
              <div className="notif-message">{notif.message}</div>
              <div className="notif-time">{timeAgo(notif.createdAt)}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Notifications;
