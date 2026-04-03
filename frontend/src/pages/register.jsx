import React, { useState } from "react";
import "./register.css";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";


function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validate = () => {
    let newErrors = {};

    if (!formData.name) newErrors.name = "Name is required";

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Minimum 6 characters required";
    }

    if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLoading(false);
        showError(data.msg || "Registration failed. Please try again.");
        return;
      }

      setLoading(false);
      setSuccess(true);

      setTimeout(() => {
        showSuccess("Registration successful! You can now login.");
        setFormData({ name: "", email: "", password: "", confirmPassword: "" });
        navigate("/login");
      }, 1200);
    } catch (err) {
      setLoading(false);
      console.error(err);
      showError("Server error. Please make sure the backend is running.");
    }
  };

  return (
    <div className="register-wrapper simple">
      <div className="register-card simple-card">
        <h2>Create Account</h2>
        <p className="muted">Join Pixie Pages — share stories and ideas.</p>

        <form onSubmit={handleSubmit} className="register-form simple-form">
          <label>Full name</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your name"
            disabled={loading}
          />
          {errors.name && <div className="error-text">{errors.name}</div>}

          <label>Email</label>
          <input
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@domain.com"
            disabled={loading}
          />
          {errors.email && <div className="error-text">{errors.email}</div>}

          <label>Password</label>
          <div className="password-row">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              placeholder="Create password"
              disabled={loading}
            />
            <button
              type="button"
              className="toggle"
              onClick={() => setShowPassword(s => !s)}
              disabled={loading}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password && <div className="error-text">{errors.password}</div>}

          <label>Confirm password</label>
          <input
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Repeat password"
            disabled={loading}
          />
          {errors.confirmPassword && <div className="error-text">{errors.confirmPassword}</div>}

          <button
            className={`register-btn ${loading ? 'loading' : ''} ${success ? 'success' : ''}`}
            disabled={loading}
          >
            {success ? (
              <>✓ Created!</>
            ) : loading ? (
              <>Creating account...</>
            ) : (
              <>Create Account</>
            )}
          </button>
        </form>

        <div className="register-footer simple-footer">Already have an account? <Link to="/login">Login</Link></div>
      </div>
    </div>
  );
}

export default Register;
