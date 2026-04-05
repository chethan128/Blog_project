import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./UserProfile.css";

function UserProfile({ setIsAuthenticated }) {
    const { email } = useParams();
    const navigate = useNavigate();
    const currentUserEmail = localStorage.getItem("user_email");

    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [savedPosts, setSavedPosts] = useState([]);
    const [activeTab, setActiveTab] = useState('POSTS');
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfileData = async () => {
            setLoading(true);
            setError(null);
            try {
                const resProfile = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/auth/profile/${email}?t=${Date.now()}`, {
                    cache: 'no-store',
                    headers: {
                        'Pragma': 'no-cache',
                        'Cache-Control': 'no-cache'
                    }
                });
                if (resProfile.ok) {
                    const data = await resProfile.json();
                    setProfile(data);

                    if (currentUserEmail) {
                        setIsFollowing(data.followers?.includes(currentUserEmail));
                    }
                } else {
                    setError("User not found. (If you just generated AI users, please restart your backend server!)");
                    setLoading(false);
                    return;
                }

                const resPosts = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/posts/user/${email}?t=${Date.now()}`);
                if (resPosts.ok) {
                    const postsData = await resPosts.json();
                    setPosts(postsData);
                }

                if (email === currentUserEmail) {
                    const token = localStorage.getItem("token");
                    if (token) {
                        const resSaved = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/bookmarks`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (resSaved.ok) {
                            const savedData = await resSaved.json();
                            setSavedPosts(savedData);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to load user profile:", err);
                setError("Failed to load profile data.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [email, currentUserEmail]);

    const handleFollow = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Please login to follow users.");
            return;
        }

        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/auth/follow/${email}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setIsFollowing(data.following);
                setProfile(prev => ({
                    ...prev,
                    followers: data.following
                        ? [...(prev.followers || []), currentUserEmail]
                        : (prev.followers || []).filter(e => e !== currentUserEmail)
                }));
            }
        } catch (err) {
            console.error("Error following user:", err);
        }
    };

    if (loading) return <div className="ig-loading"><div className="ig-spinner"></div></div>;
    if (error) return <div className="ig-error-state"><h2>Oops!</h2><p>{error}</p><button onClick={() => navigate(-1)}>Go Back</button></div>;
    if (!profile) return null;

    const userName = profile.name || profile.email.split('@')[0];
    const isOwnProfile = email === currentUserEmail;

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user_email");
        localStorage.removeItem("user_name");
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_role");
        localStorage.removeItem("posts");
        if (setIsAuthenticated) setIsAuthenticated(false);
        navigate("/login", { replace: true });
    };

    return (
        <div className="ig-profile-container">
            {/* Header Section */}
            <header className="ig-profile-header">
                <div className="ig-avatar-section">
                    <div className="ig-avatar-ring">
                        <img
                            src={profile.profileImage || `https://ui-avatars.com/api/?name=${userName}&background=random&size=150`}
                            alt={userName}
                            className="ig-avatar-img"
                        />
                    </div>
                </div>

                <div className="ig-info-section">
                    <div className="ig-info-top">
                        <h2 className="ig-username">{userName}</h2>
                        <div className="ig-action-buttons">
                            {isOwnProfile ? (
                                <>
                                    <button className="ig-btn ig-btn-secondary" onClick={() => navigate('/edit-profile')}>Edit profile</button>
                                    <button className="ig-btn ig-btn-logout" onClick={handleLogout}>Logout</button>
                                </>
                            ) : (
                                <>
                                    <button
                                        className={`ig-btn ${isFollowing ? 'ig-btn-secondary' : 'ig-btn-primary'}`}
                                        onClick={handleFollow}
                                    >
                                        {isFollowing ? 'Following' : 'Follow'}
                                    </button>
                                    <button className="ig-btn ig-btn-secondary">Message</button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="ig-stats">
                        <span><strong>{posts.length}</strong> posts</span>
                        <span style={{ cursor: 'pointer' }}><strong>{profile.followers?.length || 0}</strong> followers</span>
                        <span style={{ cursor: 'pointer' }}><strong>{profile.following?.length || 0}</strong> following</span>
                    </div>

                    <div className="ig-bio-section">
                        <h1 className="ig-full-name">{userName}</h1>
                        <p className="ig-bio-text">{profile.bio}</p>
                        {profile.location && (
                            <p className="ig-location text-muted">📍 {profile.location}</p>
                        )}
                        {profile.website && (
                            <a href={`http://${profile.website}`} target="_blank" rel="noreferrer" className="ig-website-link">
                                🔗 {profile.website}
                            </a>
                        )}
                    </div>
                </div>
            </header>

            {/* Stories Highlights Placeholder (Optional UI Polish) */}
            <div className="ig-highlights-container">
                {/* Empty for now, but gives the authentic padding separating bio and tabs */}
            </div>

            {/* Divider and Tabs */}
            <div className="ig-tabs-container">
                <div className={`ig-tab ${activeTab === 'POSTS' ? 'active' : ''}`} onClick={() => setActiveTab('POSTS')} style={{ cursor: 'pointer' }}>
                    <svg aria-label="Posts" color="currentColor" fill="currentColor" height="12" role="img" viewBox="0 0 24 24" width="12"><rect fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" width="18" x="3" y="3"></rect><line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="9.015" x2="9.015" y1="3" y2="21"></line><line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="14.985" x2="14.985" y1="3" y2="21"></line><line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="21" x2="3" y1="9.015" y2="9.015"></line><line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="21" x2="3" y1="14.985" y2="14.985"></line></svg>
                    <span>POSTS</span>
                </div>
                {isOwnProfile && (
                    <div className={`ig-tab ${activeTab === 'SAVED' ? 'active' : ''}`} onClick={() => setActiveTab('SAVED')} style={{ cursor: 'pointer' }}>
                        <svg aria-label="Saved" color="currentColor" fill="currentColor" height="12" role="img" viewBox="0 0 24 24" width="12"><polygon fill="none" points="20 21 12 13.44 4 21 4 3 20 3 20 21" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></polygon></svg>
                        <span>SAVED POSTS</span>
                    </div>
                )}
            </div>

            {/* Post Grid */}
            <div className="ig-post-grid">
                {(activeTab === 'POSTS' ? posts : savedPosts).length === 0 ? (
                    <div className="ig-empty-state">
                        <div className="ig-empty-icon">{activeTab === 'POSTS' ? '📷' : '🔖'}</div>
                        <h2>No Posts Yet</h2>
                        <p>{activeTab === 'POSTS' ? "When this user posts videos and photos, they'll appear here." : "Save your favorite posts to read them later."}</p>
                    </div>
                ) : (
                    (activeTab === 'POSTS' ? posts : savedPosts).map(post => (
                        <div
                            key={post._id}
                            className="ig-grid-item"
                            onClick={() => navigate(`/post/${post._id}`)}
                        >
                            <img
                                src={post.image || `https://placehold.co/600x600/E2E8F0/64748B?text=Pixie+Pages`}
                                alt={post.title}
                                className="ig-grid-img"
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x600/E2E8F0/64748B?text=Pixie+Pages'; }}
                            />
                            <div className="ig-grid-overlay">
                                <div className="ig-overlay-stat">
                                    <svg aria-label="Like" color="currentColor" fill="currentColor" height="18" role="img" viewBox="0 0 24 24" width="18"><path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.174 2.369 1.174 3.208 0A4.21 4.21 0 0 1 16.792 3.904Z"></path></svg>
                                    <span>{post.likes || 0}</span>
                                </div>
                                <div className="ig-overlay-stat">
                                    <svg aria-label="Comment" color="currentColor" fill="currentColor" height="18" role="img" viewBox="0 0 24 24" width="18"><path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></path></svg>
                                    <span>{post.comments?.length || 0}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default UserProfile;
