import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./ForgotPassword.css";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/auth/forgotpassword`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.msg || "Error processing request");
            } else {
                setMessage("Success! Please check the backend server console for the reset link.");
                setEmail(""); // clear input
            }
        } catch (err) {
            console.error(err);
            setError("Server error. Please make sure the backend is running.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-container">
            <div className="forgot-card">
                <div className="forgot-header">
                    <h2>Reset Password</h2>
                    <p>Enter the email address associated with your account and we will send you a link to reset your password.</p>
                </div>

                <form onSubmit={handleSubmit} className="forgot-form">
                    {error && <div className="error-message shake-animation">{error}</div>}
                    {message && <div className="success-message">{message}</div>}

                    <div className="input-group">
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder=" "
                        />
                        <label htmlFor="email">Email address</label>
                    </div>

                    <button type="submit" className="forgot-submit-btn" disabled={loading}>
                        {loading ? "Processing..." : "Continue"}
                    </button>
                </form>

                <div className="forgot-footer">
                    <Link to="/login" className="back-link">
                        ← Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
