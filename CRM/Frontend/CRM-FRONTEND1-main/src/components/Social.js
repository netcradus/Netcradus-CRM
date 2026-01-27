import React from "react";
import "./Social.css";

const Social = () => {
  const socialPlatforms = [
    { name: "Facebook", status: "Connected", color: "#3b5998" },
    { name: "Twitter", status: "Not Connected", color: "#1da1f2" },
    { name: "LinkedIn", status: "Connected", color: "#0077b5" },
    { name: "Instagram", status: "Not Connected", color: "#e1306c" },
    { name: "YouTube", status: "Connected", color: "#ff0000" },
    { name: "Reddit", status: "Not Connected", color: "#ff4500" },
    { name: "Threads", status: "Connected", color: "#000000" },
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
