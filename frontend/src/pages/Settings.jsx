import React, { useState, useEffect } from "react";
import { useToast } from "../components/Toast";
import "./Settings.css";

function Settings() {
  const { showSuccess, showError } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [userInfo, setUserInfo] = useState({ name: "", email: "" });

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/auth/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUserInfo({ name: data.name, email: data.email });
        }
      } catch (err) {
        console.error("Failed to fetch user info:", err);
      }
    };
    fetchUser();
  }, []);


  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showError("New passwords don't match!");
      return;
    }

    if (newPassword.length < 6) {
      showError("New password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        showSuccess("Password changed successfully! 🔒");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showError(data.msg || "Failed to change password");
      }
    } catch (err) {
      showError("Server error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>⚙️ Settings</h2>
        <p>Manage your account preferences</p>
      </div>

      <div className="settings-section">
        <h3>👤 Account Information</h3>
        <div className="account-info">
          <div className="account-avatar">
            {userInfo.name ? userInfo.name.charAt(0).toUpperCase() : "?"}
          </div>
          <div className="account-details">
            <h4>{userInfo.name || "Loading..."}</h4>
            <p>{userInfo.email || "Loading..."}</p>
          </div>
        </div>
      </div>


      <div className="settings-section">
        <h3>🔒 Change Password</h3>
        <form onSubmit={handleChangePassword} className="settings-form">
          <label>Current Password</label>
          <input
            type="password"
            placeholder="Enter current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <label>New Password</label>
          <input
            type="password"
            placeholder="Enter new password (min 6 chars)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <label>Confirm New Password</label>
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="settings-btn"
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
          >
            {loading ? "Changing..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Settings;
