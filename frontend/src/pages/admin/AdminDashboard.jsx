import React, { useState, useEffect, useRef } from "react";
import { useToast } from "../../components/Toast";
import { FiPieChart, FiUsers, FiFileText, FiChevronDown, FiMessageSquare } from "react-icons/fi";
import "./AdminDashboard.css";

function CustomDropdown({ options, value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="custom-admin-dropdown" ref={dropdownRef}>
      <button 
        type="button" 
        className={`admin-dropdown-trigger ${disabled ? 'disabled' : ''} ${open ? 'open' : ''}`} 
        onClick={() => !disabled && setOpen(!open)}
      >
        <span>{value}</span>
        <FiChevronDown className={`admin-chevron ${open ? 'rotated' : ''}`} />
      </button>
      {open && (
        <div className="admin-dropdown-menu">
          {options.map(opt => (
            <div 
              key={opt}
              className={`admin-dropdown-option ${value === opt ? 'active' : ''}`}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              {opt} {value === opt && <span style={{marginLeft: 'auto'}}>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError } = useToast();

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const fetchAnalytics = async (token) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setAnalytics(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchUsers = async (token) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setUsers(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchPosts = async (token) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/posts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setPosts(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchComments = async (token) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setComments(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    if (activeTab === "overview") fetchAnalytics(token);
    else if (activeTab === "users") fetchUsers(token);
    else if (activeTab === "posts") fetchPosts(token);
    else if (activeTab === "comments") fetchComments(token);
    
    // Give a slight delay to allow smooth transitioning 
    setTimeout(() => setLoading(false), 300);
  }, [activeTab, API_URL]);

  const handleRoleChange = async (userId, newRole) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        showSuccess("User role updated successfully");
        setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      } else {
        showError("Failed to update role");
      }
    } catch (err) { showError("Error updating role"); }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showSuccess("User deleted");
        setUsers(users.filter(u => u._id !== userId));
      } else {
        showError("Failed to delete user");
      }
    } catch (err) { showError("Error deleting user"); }
  };

  const handePostStatusChange = async (postId, newStatus) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/admin/posts/${postId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showSuccess("Post status updated");
        setPosts(posts.map(p => p._id === postId ? { ...p, status: newStatus } : p));
      } else {
        showError("Failed to update post");
      }
    } catch (err) { showError("Error updating post"); }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showSuccess("Post deleted");
        setPosts(posts.filter(p => p._id !== postId));
      } else {
        showError("Failed to delete post");
      }
    } catch (err) { showError("Error deleting post"); }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/admin/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showSuccess("Comment deleted");
        setComments(comments.filter(c => c._id !== commentId));
      } else {
        showError("Failed to delete comment");
      }
    } catch (err) { showError("Error deleting comment"); }
  };

  return (
    <div className="admin-container">
      <div className="admin-sidebar">
        <h2 style={{ padding: '0 10px', marginBottom: '20px', fontSize: '1.2rem', color: 'var(--text-color)', fontWeight: 800 }}>Admin Portal</h2>
        <button className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <FiPieChart /> Overview
        </button>
        <button className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <FiUsers /> Manage Users
        </button>
        <button className={`admin-tab ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
          <FiFileText /> Manage Posts
        </button>
        <button className={`admin-tab ${activeTab === 'comments' ? 'active' : ''}`} onClick={() => setActiveTab('comments')}>
          <FiMessageSquare /> Manage Comments
        </button>
      </div>

      <div className="admin-content">
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-secondary)' }}>Loading data...</div>
        ) : (
          <>
            {activeTab === 'overview' && analytics && (
              <div className="fade-in">
                <h1 style={{ marginBottom: '20px', fontWeight: 700 }}>Platform Overview</h1>
                <div className="admin-stats-grid">
                  <div className="admin-stat-box">
                    <h3>{analytics.stats.totalUsers || 0}</h3>
                    <p>Total Users</p>
                  </div>
                  <div className="admin-stat-box">
                    <h3>{analytics.stats.totalPosts || 0}</h3>
                    <p>Total Posts</p>
                  </div>
                  <div className="admin-stat-box">
                    <h3>{analytics.stats.publishedPosts || 0}</h3>
                    <p>Published Posts</p>
                  </div>
                  <div className="admin-stat-box">
                    <h3>{analytics.stats.totalComments || 0}</h3>
                    <p>Total Comments</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="admin-glass-card fade-in">
                <h2 style={{ marginBottom: '20px', fontWeight: 700 }}>Manage Users</h2>
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u._id}>
                          <td style={{ fontWeight: 500 }}>{u.name}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                          <td>
                            <CustomDropdown
                              options={['Admin', 'Author', 'Reader']}
                              value={u.role || 'Reader'}
                              onChange={(val) => handleRoleChange(u._id, val)}
                              disabled={u.email === localStorage.getItem('user_email')}
                            />
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{new Date(u.date).toLocaleDateString()}</td>
                          <td>
                            <button className="admin-action-btn btn-danger" onClick={() => handleDeleteUser(u._id)} disabled={u.email === localStorage.getItem('user_email')}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'posts' && (
              <div className="admin-glass-card fade-in">
                <h2 style={{ marginBottom: '20px', fontWeight: 700 }}>Manage Posts</h2>
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Status</th>
                        <th>Published Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {posts.map(p => (
                        <tr key={p._id}>
                          <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                            <a href={`/post/${p._id}`} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                                {p.title}
                            </a>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{p.author}</td>
                          <td>
                            <CustomDropdown
                              options={['Published', 'Draft']}
                              value={p.status || 'Published'}
                              onChange={(val) => handePostStatusChange(p._id, val)}
                            />
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{new Date(p.createdAt || p.date).toLocaleDateString()}</td>
                          <td>
                            <button className="admin-action-btn btn-danger" onClick={() => handleDeletePost(p._id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="admin-glass-card fade-in">
                <h2 style={{ marginBottom: '20px', fontWeight: 700 }}>Manage Comments</h2>
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Comment</th>
                        <th>Author</th>
                        <th>Post Title</th>
                        <th>Date posted</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comments.map(c => (
                        <tr key={c._id}>
                          <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                            {c.text}
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{c.author}</td>
                          <td style={{ color: 'var(--text-secondary)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.post?.title || "Deleted Post"}
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{new Date(c.createdAt || c.date).toLocaleDateString()}</td>
                          <td>
                            <button className="admin-action-btn btn-danger" onClick={() => handleDeleteComment(c._id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
