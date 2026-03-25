import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./create.css";

function Create() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [category, setCategory] = useState("General");
  const [image, setImage] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const editingPost = location.state?.post || null;

  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title || "");
      setContent(editingPost.content || "");
      setCategory(editingPost.category || "General");
      setTagsInput((editingPost.tags || []).join(", "));
      setImage(editingPost.image || null);
    }
  }, [editingPost]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result); // Set base64 string
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const tagsArray = tagsInput
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const postData = {
      title,
      content,
      tags: tagsArray,
      image,
      author: localStorage.getItem("user_email") || "Guest"
    };

    try {
      if (editingPost && editingPost._id) {
        // Update existing post
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/posts/${editingPost._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title,
            content,
            tags: tagsArray,
            category,
            image,
            author: localStorage.getItem("user_email") || "Guest"
          })
        });
        if (!res.ok) throw new Error('Failed to update post');
      } else {
        // Create new post
        const token = localStorage.getItem("token");
        const res = await fetch('http://localhost:5000/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title,
            content,
            tags: tagsArray,
            category,
            image
          })
        });
        if (!res.ok) throw new Error('Failed to create post');
      }
      navigate("/explore");
    } catch (error) {
      console.error("Error saving post:", error);
      alert("Failed to save post. Please make sure the backend server is running.");
    }
  };

  return (
    <div className="editor-wrapper">
      <div className="editor-container glass-effect">
        <div className="editor-header">
          <h1>Create Your Story</h1>
          <p>Share your ideas with the Pixie Pages community ✨</p>
        </div>

        <form onSubmit={handleSubmit} className="editor-form">
          <input
            type="text"
            className="title-input"
            placeholder="Your amazing title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <input
            type="text"
            className="tags-input"
            placeholder="Add tags (comma separated, e.g. tech, lifestyle, art)"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />

          <select
            className="category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "var(--input-bg)", color: "var(--input-text)", marginBottom: "15px" }}
          >
            <option value="General">General</option>
            <option value="Technology">Technology</option>
            <option value="Lifestyle">Lifestyle</option>
            <option value="Art">Art</option>
            <option value="Business">Business</option>
            <option value="Travel">Travel</option>
          </select>

          <textarea
            className="content-input"
            placeholder="Start writing your story..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />

          <div className="image-section">
            <label className="image-btn">
              <span className="material-icon">📷</span> Add Image
              <input type="file" accept="image/*" onChange={handleImageChange} />
            </label>
          </div>

          {image && (
            <div className="image-preview">
              <img src={image} alt="preview" />
            </div>
          )}

          <button
            type="submit"
            className="publish-btn"
            disabled={!title || !content}
          >
            Publish Story
          </button>
        </form>
      </div>
    </div>
  );
}

export default Create;
