import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Bell, CheckCheck, Megaphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config/api";
import { getNotificationSocket } from "../services/socket";
import {
  getBrowserNotificationPermission,
  initializeBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  showBrowserNotification,
} from "../utils/browserNotifications";
import { initializeNotificationSound, playNotificationSound } from "../utils/notificationSound";
// import "./NotificationButton.css";

const NOTIFICATION_REQUEST_TIMEOUT_MS = Number(process.env.REACT_APP_NOTIFICATION_REQUEST_TIMEOUT_MS || 5000);

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
  const shownNotificationsRef = useRef(new Set());
  const previousUnreadCountRef = useRef(null);
  const latestNotificationsRef = useRef([]);

  const authConfig = useMemo(
    () => ({
      headers: { Authorization: `Bearer ${token}` },
      timeout: NOTIFICATION_REQUEST_TIMEOUT_MS,
    }),
    [token]
  );

  const triggerIncomingNotification = useCallback((payload) => {
    playNotificationSound();

    const permission = getBrowserNotificationPermission();
    if (permission !== "granted") {
      return;
    }

    const targetPath = payload?.targetPath || "/tasks";
    const message = payload?.message || "You have a new notification.";
    const notificationTag = [
      payload?._id || "",
      payload?.type || "general",
      payload?.taskId?._id || payload?.taskId || "",
      message,
    ].join(":");

    if (shownNotificationsRef.current.has(notificationTag)) {
      return;
    }

    shownNotificationsRef.current.add(notificationTag);
    showBrowserNotification({
      title: "Netcradus CRM",
      body: message,
      tag: notificationTag,
      onClick: () => {
        window.focus();
        navigate(targetPath);
      },
    });

    window.setTimeout(() => {
      shownNotificationsRef.current.delete(notificationTag);
    }, 10000);
  }, [navigate]);

  const fetchNotifications = useCallback(async (options = {}) => {
    if (!token) return;

    try {
      setLoading(true);
      const { data } = await axios.get(apiUrl("/api/notifications?limit=10"), authConfig);
      const nextNotifications = data.data || [];
      const nextUnreadCount = data.unreadCount || 0;
      const previousUnreadCount = previousUnreadCountRef.current;

      setNotifications(nextNotifications);
      setUnreadCount(nextUnreadCount);
      setNotificationsAvailable(true);
      latestNotificationsRef.current = nextNotifications;

      if (options.triggerAlert && previousUnreadCount !== null && nextUnreadCount > previousUnreadCount) {
        const latestNotification = nextNotifications.find((item) => !item.isRead) || nextNotifications[0];
        if (latestNotification) {
          triggerIncomingNotification(latestNotification);
        }
      }

    } catch (error) {
      setNotifications([]);
      setUnreadCount(0);
      setNotificationsAvailable(false);
    } finally {
      setLoading(false);
    }
  }, [authConfig, token, triggerIncomingNotification]);

  useEffect(() => {
    initializeNotificationSound();
    initializeBrowserNotificationPermission();
  }, []);

  useEffect(() => {
    const previousUnreadCount = previousUnreadCountRef.current;
    if (previousUnreadCount === null) {
      previousUnreadCountRef.current = unreadCount;
      return;
    }

    if (unreadCount > previousUnreadCount) {
      const latestNotification = latestNotificationsRef.current.find((item) => !item.isRead) || latestNotificationsRef.current[0];
      if (latestNotification) {
        triggerIncomingNotification(latestNotification);
      } else {
        playNotificationSound();
      }
    }

    previousUnreadCountRef.current = unreadCount;
  }, [triggerIncomingNotification, unreadCount]);

  useEffect(() => {
    if (!isOpen) return undefined;

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 120000);
    return () => clearInterval(interval);
  }, [fetchNotifications, isOpen]);

  useEffect(() => {
    if (!token || !notificationsAvailable || !isOpen) return undefined;

    const socket = getNotificationSocket(token);
    if (!socket) return undefined;

    const handleNewNotification = (payload) => {
      triggerIncomingNotification(payload);
      fetchNotifications({ triggerAlert: false });
    };

    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, [fetchNotifications, isOpen, notificationsAvailable, token, triggerIncomingNotification]);

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

  const handleBellClick = async () => {
    if (getBrowserNotificationPermission() === "default") {
      await requestBrowserNotificationPermission();
    }

    setIsOpen((open) => {
      const nextOpen = !open;
      if (nextOpen) {
        fetchNotifications();
      }
      return nextOpen;
    });
  };

  return (
    <div className="notification-container" ref={containerRef}>
      <button
        type="button"
        className="bell-pill"
        onClick={handleBellClick}
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
                    style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-2)", textAlign: "left" }}
                  >
                    {notification.type === "announcement" && (
                      <Megaphone size={14} style={{ marginTop: "3px", flexShrink: 0, color: "var(--primary)" }} />
                    )}
                    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                      <span className="popup-item-message">{notification.message}</span>
                      <span className="popup-item-time">{formatTimeAgo(notification.createdAt)}</span>
                    </div>
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
