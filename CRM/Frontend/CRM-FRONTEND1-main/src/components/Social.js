import React from "react";
import "./Social.css";

const Social = () => {
  const socialPlatforms = [
   
  ];

  return (
    <div className="social-container">
      <h2 className="social-title">Social Media Integration</h2>

      <div className="platforms-wrapper">
        {socialPlatforms.map((platform, index) => (
          <div
            className="social-card"
            key={index}
            style={{ borderLeft: `6px solid ${platform.color}` }}
          >
            <div className="platform-name">{platform.name}</div>
            <div
              className={`platform-status ${
                platform.status === "Connected" ? "connected" : "not-connected"
              }`}
            >
              {platform.status}
            </div>
            <button className="social-btn">
              {platform.status === "Connected" ? "Manage" : "Connect"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Social;
