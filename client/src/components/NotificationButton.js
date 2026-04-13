import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Bell, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config/api";
import { getNotificationSocket } from "../services/socket";
import "./NotificationButton.css";

function formatTimeAgo(value) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(Math.floor(diffMs / 60000), 0);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export default function NotificationButton() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const token = localStorage.getItem("token");
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notificationsAvailable, setNotificationsAvailable] = useState(false);

  const authConfig = useMemo(
    () => ({
      headers: { Authorization: `Bearer ${token}` },
    }),
    [token]
  );

  const fetchNotifications = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const { data } = await axios.get(apiUrl("/api/notifications?limit=10"), authConfig);
      setNotifications(data.data || []);
      setUnreadCount(data.unreadCount || 0);
      setNotificationsAvailable(true);
    } catch (error) {
      setNotifications([]);
      setUnreadCount(0);
      setNotificationsAvailable(false);
    } finally {
      setLoading(false);
    }
  }, [authConfig, token]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!token || !notificationsAvailable) return undefined;

    const socket = getNotificationSocket(token);
    if (!socket) return undefined;

    const handleNewNotification = () => {
      fetchNotifications();
    };

    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, [fetchNotifications, notificationsAvailable, token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openTaskFromNotification = async (notification) => {
    try {
      if (!notification.isRead) {
        await axios.patch(apiUrl(`/api/notifications/${notification._id}/read`), {}, authConfig);
      }
    } finally {
      setIsOpen(false);
      fetchNotifications();
      navigate(notification.targetPath || (notification.taskId?._id ? `/tasks?task=${notification.taskId._id}` : "/tasks"));
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch(apiUrl("/api/notifications/read-all"), {}, authConfig);
      fetchNotifications();
    } catch {}
  };

  return (
    <div className="notification-container" ref={containerRef}>
      <button
        type="button"
        className="bell-pill"
        onClick={() => setIsOpen((open) => !open)}
        aria-label="Open notifications"
      >
        <span className="bell-icon-wrap">
          <Bell size={18} />
          {unreadCount > 0 && <span className="bell-dot">{unreadCount}</span>}
        </span>
        <span className="bell-label">Notifications</span>
      </button>

      {isOpen && (
        <div className="popup-box">
          <div className="popup-head">
            <div>
              <h4>Notifications</h4>
              <p>{unreadCount} unread</p>
            </div>
            <button
              type="button"
              className="popup-action"
              onClick={markAllAsRead}
              disabled={!unreadCount}
            >
              <CheckCheck size={14} />
              Mark all
            </button>
          </div>

          {loading ? (
            <p className="popup-empty">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <p className="popup-empty">No notifications yet.</p>
          ) : (
            <ul>
              {notifications.map((notification) => (
                <li key={notification._id}>
                  <button
                    type="button"
                    className={`popup-item ${notification.isRead ? "" : "is-unread"}`}
                    onClick={() => openTaskFromNotification(notification)}
                  >
                    <span className="popup-item-message">{notification.message}</span>
                    <span className="popup-item-time">{formatTimeAgo(notification.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
