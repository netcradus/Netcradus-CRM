import React, { useState } from "react";
import { FaBell } from "react-icons/fa";
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
    setIsOpen(!isOpen);
  };

  return (
    <div className="notification-container">
      <FaBell className="bell-icon" onClick={togglePopup} />

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
