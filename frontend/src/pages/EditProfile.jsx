import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import "./Settings.css";

function EditProfile() {
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

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
          setName(data.name || "");
          setBio(data.bio || "");
          setLocation(data.location || "");
          setWebsite(data.website || "");
          setProfileImage(data.profileImage || "");
        }
      } catch (err) {
        console.error("Failed to fetch user info:", err);
      }
    };
    fetchUser();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, bio, location, website, profileImage }),
      });
      if (res.ok) {
        showSuccess("Profile updated successfully!");
        setTimeout(() => {
            navigate(`/user/${localStorage.getItem('user_email')}`);
        }, 1000);
      } else {
        showError("Failed to update profile");
      }
    } catch (err) {
      showError("Server error. Please try again.");
    }
    setProfileLoading(false);
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>✏️ Edit Profile</h2>
        <p>Update your public profile details</p>
      </div>

      <div className="settings-section">
        <h3>Public Information</h3>
        <form onSubmit={handleUpdateProfile} className="settings-form">
          <label>Display Name</label>
          <input
            type="text"
            placeholder="Your displayed name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label>Profile Image URL</label>
          <input
            type="url"
            placeholder="https://example.com/my-image.jpg"
            value={profileImage}
            onChange={(e) => setProfileImage(e.target.value)}
          />

          <label>Bio</label>
          <textarea
            rows="3"
            placeholder="Tell us about yourself..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-color)', marginBottom: '15px' }}
          />

          <label>Location</label>
          <input
            type="text"
            placeholder="e.g. New York, USA"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <label>Website</label>
          <input
            type="text"
            placeholder="e.g. yoursite.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />

          <button
            type="submit"
            className="settings-btn"
            disabled={profileLoading}
          >
            {profileLoading ? "Updating..." : "Save Profile Details"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditProfile;
