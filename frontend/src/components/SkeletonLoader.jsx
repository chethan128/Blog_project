import React from "react";
import "./SkeletonLoader.css";

export const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton-header">
      <div className="skeleton-avatar"></div>
      <div className="skeleton-header-lines">
        <div className="skeleton-line short"></div>
        <div className="skeleton-line" style={{ width: "40%", height: "10px" }}></div>
      </div>
    </div>
    <div className="skeleton-image"></div>
    <div className="skeleton-content">
      <div className="skeleton-line title"></div>
      <div className="skeleton-line full"></div>
      <div className="skeleton-line medium"></div>
    </div>
  </div>
);

export const SkeletonGrid = ({ count = 4 }) => (
  <div className="skeleton-grid">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export default SkeletonCard;
