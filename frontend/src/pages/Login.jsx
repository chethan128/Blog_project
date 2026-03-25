import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.msg || "Invalid Email or Password ❌");
        return;
      }

      // Store JWT token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user_email", data.user.email);
      localStorage.setItem("user_name", data.user.name);
      localStorage.setItem("user_id", data.user.id);

      setIsAuthenticated(true);
      alert("Login Successful ✅");
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Server error. Please make sure the backend is running.");
    }
  };

  return (
    <div className="login-container">
      {/* Animated Background Elements */}
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      <div className="bg-shape shape-3"></div>

      <div className="login-card premium-login">
        <div className="login-visuals">
          <div className="visuals-content">
            <h2>Welcome Back</h2>
            <p>Connect with the Pixie Pages community and share your story.</p>
            <div className="interactive-badge">✨ Share Your Voice</div>
          </div>
        </div>

        <div className="login-form-area">
          <div className="form-header">
            <h3>Sign In</h3>
            <p>Enter your details to access your account</p>
          </div>

          <form onSubmit={handleLogin} className="interactive-form">
            {error && <div className="error-message shake-animation">{error}</div>}

            <div className="input-animate-group">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder=" "
              />
              <label htmlFor="email">Email address</label>
              <span className="input-highlight"></span>
            </div>

            <div className="input-animate-group">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder=" "
              />
              <label htmlFor="password">Password</label>
              <span className="input-highlight"></span>
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span className="checkmark"></span>
                Remember me
              </label>
              <span className="forgot-link" onClick={() => navigate("/forgot-password")}>
                Forgot Password?
              </span>
            </div>

            <button type="submit" className="login-action-btn">
              <span>Sign In</span>
              <div className="btn-glow"></div>
            </button>
          </form>

          <div className="demo-hint-modern">
            <small>Demo: Register to create your account or use any registered credentials</small>
          </div>

          <p className="signup-text-modern">
            Don’t have an account?{" "}
            <span onClick={() => navigate("/register")} className="signup-link-modern">
              Create an account
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;