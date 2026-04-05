import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import "./dashboard.css";

function Dashboard({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("user_email") || "Guest";
  const userName = userEmail.split("@")[0];
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("my_posts");
  const { showSuccess, showError } = useToast();

  // Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    bio: "Sharing my thoughts and stories with the world.",
    location: "",
    website: "",
    profileImage: "",
  });

  // Load Profile from Backend
  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/auth/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProfileData({
            bio: data.bio || "Sharing my thoughts and stories with the world.",
            location: data.location || "",
            website: data.website || "",
            profileImage: data.profileImage || "",
          });
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    };
    fetchUserProfile();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData({
          bio: data.bio || "Sharing my thoughts and stories with the world.",
          location: data.location || "",
          website: data.website || "",
          profileImage: data.profileImage || "",
        });
        setIsEditingProfile(false);
        showSuccess("Profile updated! ✨");
      } else {
        showError("Failed to save profile");
      }
    } catch (err) {
      showError("Error saving profile");
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, profileImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };


  const fetchUserPosts = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/posts`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const myPosts = data.filter(p => p.author === userEmail);
          const sorted = myPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setPosts(sorted);
        } else {
          setPosts([]);
        }
      } else {
        setPosts([]);
      }
    } catch (err) {
      setPosts([]);
    }
  };

  // Fetch real bookmarked posts
  const fetchBookmarks = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSavedPosts(data);
      }
    } catch (err) {
      console.error("Failed to fetch bookmarks:", err);
    }
  };

  useEffect(() => {
    fetchUserPosts();
    fetchBookmarks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_role");
    localStorage.removeItem("posts");
    setIsAuthenticated(false);
    navigate("/login", { replace: true });
  };

  const displayPosts = activeTab === "my_posts" ? posts : savedPosts;

  return (
    <div className="dashboard-container">
      {/* Profile Header Block */}
      <div className="profile-header glass-effect">
        <div className="profile-avatar-container">
          <div className="profile-avatar">
            {profileData.profileImage ? (
              <img src={profileData.profileImage} alt="Profile" className="profile-avatar-img" />
            ) : (
              userName.charAt(0).toUpperCase()
            )}
          </div>
        </div>

        <div className="profile-meta">
          <div className="profile-meta-top">
            <h2 className="profile-name">{userName}</h2>
            <div className="profile-actions">
              <button className="dashboard-action-btn edit-profile-btn" onClick={() => setIsEditingProfile(true)}>
                Edit Profile
              </button>
              <button className="dashboard-action-btn write-btn" onClick={() => navigate("/create")}>
                Write Story
              </button>
              <button className="dashboard-action-btn settings-nav-btn" onClick={() => navigate("/settings")}>
                ⚙️ Settings
              </button>
              <button className="dashboard-action-btn logout-outline-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>

          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-count">{posts.length}</span>
              <span className="stat-label">posts</span>
            </div>
            <div className="stat-item">
              <span className="stat-count">{posts.reduce((acc, p) => acc + (p.likes || 0), 0)}</span>
              <span className="stat-label">likes</span>
            </div>
            <div className="stat-item">
              <span className="stat-count">
                {posts.reduce((acc, p) => acc + (p.viewsCount || 0), 0)}
              </span>
              <span className="stat-label">views</span>
            </div>
          </div>

          <div className="profile-bio">
            <p className="profile-description">{profileData.bio}</p>

            <div className="profile-details">
              {profileData.location && (
                <span className="detail-item">
                  📍 {profileData.location}
                </span>
              )}
              {profileData.website && (
                <span className="detail-item">
                  🔗 <a href={profileData.website} target="_blank" rel="noreferrer">{profileData.website}</a>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="profile-tabs">
        <div
          className={`tab-item ${activeTab === "my_posts" ? "active" : ""}`}
          onClick={() => setActiveTab("my_posts")}
        >
          📝 My Posts
        </div>
        <div
          className={`tab-item ${activeTab === "saved" ? "active" : ""}`}
          onClick={() => setActiveTab("saved")}
        >
          🔖 Saved ({savedPosts.length})
        </div>
      </div>

      {/* Profile Grid */}
      {displayPosts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">{activeTab === "saved" ? "🔖" : "📝"}</div>
          <h3>No {activeTab === "saved" ? "saved stories" : "stories"} yet</h3>
          <p>{activeTab === "saved" ? "Save posts from the Explore page and they'll show up here." : "Start sharing your thoughts with the world"}</p>
          {activeTab === "my_posts" && (
            <button className="create-btn" onClick={() => navigate("/create")}>
              Create Your First Post
            </button>
          )}
          {activeTab === "saved" && (
            <button className="create-btn" onClick={() => navigate("/explore")}>
              Explore Posts
            </button>
          )}
        </div>
      ) : (
        <div className="profile-grid">
          {displayPosts.map((post) => (
            <div
              key={post._id}
              className="grid-item"
              onClick={() => navigate(`/post/${post._id}`)}
              style={{ backgroundImage: `url(${post.image || 'https://via.placeholder.com/400x400/121212/ffffff?text=' + encodeURIComponent(post.title)})` }}
            >
              <div className="grid-item-overlay">
                <div className="grid-item-stats">
                  <span>❤️ {post.likes || 0}</span>
                  <span>💬 {post.comments?.length || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="modal-overlay">
          <div className="modal-content glass-effect">
            <h3>Edit Profile</h3>
            <form onSubmit={handleSaveProfile} className="edit-profile-form">
              <label>Profile Picture</label>
              <div className="dp-upload-container">
                {profileData.profileImage && (
                  <img src={profileData.profileImage} alt="Preview" className="dp-preview" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="file-input"
                />
              </div>

              <label>Bio / Description</label>
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                maxLength="150"
              />

              <label>Location</label>
              <input
                type="text"
                value={profileData.location}
                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                placeholder="e.g. San Francisco, CA"
              />

              <label>Website Links</label>
              <input
                type="text"
                value={profileData.website}
                onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                placeholder="https://yourwebsite.com"
              />

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setIsEditingProfile(false)}>Cancel</button>
                <button type="submit" className="save-btn">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;