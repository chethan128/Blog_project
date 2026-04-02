import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import "./Toast.css";

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

const Toast = ({ id, type, message, onClose }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onClose(id), 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => onClose(id), 300);
  };

  const icons = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
  };

  return (
    <div className={`toast toast-${type} ${exiting ? "toast-exiting" : ""}`} onClick={handleClose}>
      <span className="toast-icon">{icons[type]}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={handleClose}>×</button>
      <div className="toast-progress"></div>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const showSuccess = useCallback((msg) => addToast(msg, "success"), [addToast]);
  const showError = useCallback((msg) => addToast(msg, "error"), [addToast]);
  const showInfo = useCallback((msg) => addToast(msg, "info"), [addToast]);

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showInfo }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default Toast;
