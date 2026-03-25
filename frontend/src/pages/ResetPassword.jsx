import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ResetPassword.css";

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`http://localhost:5000/api/auth/resetpassword/${token}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.msg || "Invalid or expired token");
            } else {
                setMessage("Password updated successfully! You can now log in.");
                setTimeout(() => {
                    navigate("/login");
                }, 3000);
            }
        } catch (err) {
            console.error(err);
            setError("Server error. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reset-container">
            <div className="reset-card">
                <div className="reset-header">
                    <h2>Create New Password</h2>
                    <p>Your new password must be different from previously used passwords.</p>
                </div>

                <form onSubmit={handleSubmit} className="reset-form">
                    {error && <div className="error-message shake-animation">{error}</div>}
                    {message && <div className="success-message">{message}</div>}

                    <div className="input-group">
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder=" "
                        />
                        <label htmlFor="password">New Password</label>
                    </div>

                    <div className="input-group">
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder=" "
                        />
                        <label htmlFor="confirmPassword">Confirm Password</label>
                    </div>

                    <button type="submit" className="reset-submit-btn" disabled={loading || message}>
                        {loading ? "Saving..." : "Reset Password"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
