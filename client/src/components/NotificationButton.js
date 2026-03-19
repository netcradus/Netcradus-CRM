import React, { useState } from "react";
import { Bell } from "lucide-react";
import "./NotificationButton.css";

const NotificationButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const notifications = [
    "New lead added",
    "Task deadline today",
    "Quote approved",
    "Client replied to message",
  ];

  const togglePopup = () => {
    setIsOpen((open) => !open);
  };

  const unreadCount = notifications.length;

  return (
    <div className="notification-container">
      <button
        type="button"
        className="bell-pill"
        onClick={togglePopup}
        aria-label="Open notifications"
      >
        <span className="bell-icon-wrap">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="bell-dot">{unreadCount}</span>
          )}
        </span>
        <span className="bell-label">Activity</span>
      </button>

      {isOpen && (
        <div className="popup-box">
          <h4>Notifications</h4>
          {notifications.length === 0 ? (
            <p>No notifications</p>
          ) : (
            <ul>
              {notifications.map((note, index) => (
                <li key={index}>{note}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationButton;
