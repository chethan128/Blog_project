import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../components/Toast";
import { FiUploadCloud, FiEye, FiEdit3, FiSave, FiSend, FiChevronDown, FiX, FiClock } from "react-icons/fi";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import "./create.css";

const CATEGORIES = ["General", "Technology", "Lifestyle", "Art", "Business", "Travel"];

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block"],
    ["link"],
    ["clean"],
  ],
};

const QUILL_FORMATS = [
  "header", "bold", "italic", "underline", "strike",
  "list", "blockquote", "code-block", "link",
];

function Create() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [tags, setTags] = useState([]);
  const [category, setCategory] = useState("General");
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [image, setImage] = useState(null);
  const [activeTab, setActiveTab] = useState("editor"); // "editor" or "preview"
  const [saving, setSaving] = useState(false);
  const [lastAutoSaved, setLastAutoSaved] = useState(null);
  const catRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError, showInfo } = useToast();
  const editingPost = location.state?.post || null;

  // Load editing post data
  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title || "");
      setContent(editingPost.content || "");
      setCategory(editingPost.category || "General");
      setTags(editingPost.tags || []);
      setTagsInput("");
      setImage(editingPost.image || null);
    }
  }, [editingPost]);

  // Load auto-saved draft from localStorage (only for new posts)
  useEffect(() => {
    if (!editingPost) {
      const draft = localStorage.getItem("pixie_draft");
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          if (parsed.title || parsed.content) {
            setTitle(parsed.title || "");
            setContent(parsed.content || "");
            setCategory(parsed.category || "General");
            setTags(parsed.tags || []);
            setImage(parsed.image || null);
            showInfo("Restored your unsaved draft ✨");
          }
        } catch (e) { /* ignore */ }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save to localStorage every 30 seconds
  const autoSave = useCallback(() => {
    if (!editingPost && (title || content)) {
      localStorage.setItem("pixie_draft", JSON.stringify({
        title, content, category, tags, image
      }));
      setLastAutoSaved(new Date());
    }
  }, [title, content, category, tags, image, editingPost]);

  useEffect(() => {
    const interval = setInterval(autoSave, 30000);
    return () => clearInterval(interval);
  }, [autoSave]);

  // Close category dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) {
        setCatDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showError("Image too large. Please upload an image under 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => setImage(null);

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagsInput.trim().replace(/,/g, "");
      if (tag && !tags.includes(tag) && tags.length < 5) {
        setTags([...tags, tag]);
        setTagsInput("");
      }
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const getPlainText = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  };

  const isContentEmpty = (html) => {
    if (!html) return true;
    const text = getPlainText(html);
    const hasImage = html.includes("<img");
    return text.length === 0 && !hasImage;
  };

  const getWordCount = () => {
    const text = getPlainText(content);
    if (!text) return 0;
    return text.split(/\s+/).filter(w => w.length > 0).length;
  };

  const getReadTime = () => {
    const words = getWordCount();
    const mins = Math.ceil(words / 200);
    return mins < 1 ? 1 : mins;
  };

  const handleSubmit = async (status = "Published") => {
    if (!title.trim()) {
      showError("Please add a title");
      return;
    }
    if (status === "Published" && isContentEmpty(content)) {
      showError("Please add some content before publishing");
      return;
    }

    setSaving(true);

    const postData = {
      title,
      content,
      tags,
      category,
      image,
      status,
    };

    try {
      const token = localStorage.getItem("token");
      let res;
      if (editingPost && editingPost._id) {
        res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/posts/${editingPost._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(postData),
        });
      } else {
        res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/posts`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(postData),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.msg || "Server Error: Payload too large or invalid data");
      }

      showSuccess(status === "Draft" ? "Draft saved! 📝" : "Story published! 🎉");

      // Clear auto-saved draft
      localStorage.removeItem("pixie_draft");
      navigate(status === "Draft" ? "/drafts" : "/explore");
    } catch (error) {
      console.error("Error saving post:", error);
      showError(error.message || "Failed to save. Make sure the backend is running.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="editor-wrapper">
      <div className="editor-container glass-effect">
        {/* Header */}
        <div className="editor-header">
          <div className="editor-header-top">
            <h1>{editingPost ? "Edit Your Story" : "Create Your Story"}</h1>
            {lastAutoSaved && (
              <span className="auto-save-indicator">
                <FiClock size={13} />
                Auto-saved {lastAutoSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <p>Share your ideas with the Pixie Pages community ✨</p>
        </div>

        {/* Tab Switcher */}
        <div className="editor-tabs">
          <button
            className={`editor-tab ${activeTab === "editor" ? "active" : ""}`}
            onClick={() => setActiveTab("editor")}
          >
            <FiEdit3 size={16} /> Editor
          </button>
          <button
            className={`editor-tab ${activeTab === "preview" ? "active" : ""}`}
            onClick={() => setActiveTab("preview")}
            disabled={!title && !content}
          >
            <FiEye size={16} /> Preview
          </button>
        </div>

        {/* Editor Tab */}
        {activeTab === "editor" ? (
          <div className="editor-form">
            <input
              type="text"
              className="title-input"
              placeholder="Your amazing title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            {/* Tags Input */}
            <div className="tags-area">
              <div className="tags-chips">
                {tags.map((tag) => (
                  <span key={tag} className="tag-chip">
                    #{tag}
                    <button type="button" onClick={() => removeTag(tag)} className="tag-remove">
                      <FiX size={12} />
                    </button>
                  </span>
                ))}
                {tags.length < 5 && (
                  <input
                    type="text"
                    className="tags-input-inline"
                    placeholder={tags.length === 0 ? "Add tags (press Enter)..." : "Add more..."}
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                  />
                )}
              </div>
              <span className="tags-hint">{tags.length}/5 tags</span>
            </div>

            {/* Category Dropdown */}
            <div className="category-dropdown-wrapper" ref={catRef}>
              <button
                type="button"
                className={`category-trigger ${catDropdownOpen ? "open" : ""}`}
                onClick={() => setCatDropdownOpen(!catDropdownOpen)}
              >
                <span>📁 {category}</span>
                <FiChevronDown className={`cat-chevron ${catDropdownOpen ? "rotated" : ""}`} size={16} />
              </button>
              {catDropdownOpen && (
                <div className="category-menu">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`category-option ${category === cat ? "active" : ""}`}
                      onClick={() => { setCategory(cat); setCatDropdownOpen(false); }}
                    >
                      {cat}
                      {category === cat && <span className="cat-check">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Rich Text Editor */}
            <div className="quill-wrapper">
              <ReactQuill
                theme="snow"
                value={content}
                onChange={(value) => setContent(value)}
                modules={QUILL_MODULES}
                formats={QUILL_FORMATS}
                placeholder="Start writing your story..."
              />
            </div>

            {/* Word Count */}
            <div className="word-count-bar">
              <span>{getWordCount()} words</span>
              <span>~{getReadTime()} min read</span>
            </div>

            {/* Image Upload */}
            {!image ? (
              <div className="dark-upload-btn-wrapper">
                <label className="dark-upload-btn">
                  <FiUploadCloud size={36} />
                  <span>Click to upload cover image</span>
                  <span style={{ fontSize: "13px", opacity: 0.7 }}>SVG, PNG, JPG or GIF (max 800x400px)</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} />
                </label>
              </div>
            ) : (
              <div className="image-preview">
                <img src={image} alt="preview" />
                <button type="button" className="remove-image-btn" onClick={removeImage}>
                  <FiX size={18} /> Remove Image
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="editor-actions">
              <button
                type="button"
                className="draft-btn"
                onClick={() => handleSubmit("Draft")}
                disabled={saving}
              >
                <FiSave size={16} />
                {saving ? "Saving..." : "Save as Draft"}
              </button>
              <button
                type="button"
                className="publish-btn"
                onClick={() => handleSubmit("Published")}
                disabled={saving}
              >
                <FiSend size={16} />
                {saving ? "Publishing..." : "Publish Story"}
              </button>
            </div>
          </div>
        ) : (
          /* Preview Tab */
          <div className="preview-panel">
            <div className="preview-header">
              {image && (
                <div className="preview-cover">
                  <img src={image} alt="Cover" />
                </div>
              )}
              <div className="preview-meta">
                <span className="preview-category">{category}</span>
                <span className="preview-read-time">📖 {getReadTime()} min read</span>
              </div>
              <h1 className="preview-title">{title || "Untitled Post"}</h1>
              {tags.length > 0 && (
                <div className="preview-tags">
                  {tags.map((tag) => (
                    <span key={tag} className="preview-tag">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
            <div
              className="preview-content"
              dangerouslySetInnerHTML={{ __html: content || "<p>Your content will appear here...</p>" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Create;
