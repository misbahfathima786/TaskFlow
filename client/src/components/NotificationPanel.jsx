import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearReadNotifications,
} from "../services/notificationService";

// Helper to dispatch browser notifications
const triggerBrowserNotifications = (notifs) => {
  const browserNotifEnabled =
    typeof window !== "undefined" &&
    localStorage.getItem("tf_browser_notifications") === "true";

  if (
    browserNotifEnabled &&
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    const unreadAlerts = notifs.filter(
      (n) => !n.isRead && (n.type === "due_today" || n.type === "overdue")
    );
    unreadAlerts.slice(0, 2).forEach((n) => {
      const notifKey = `shown_notif_${n._id}`;
      if (!sessionStorage.getItem(notifKey)) {
        sessionStorage.setItem(notifKey, "true");
        try {
          new Notification(`TaskFlow: ${n.title}`, {
            body: n.message,
            icon: "/favicon.ico",
          });
        } catch {
          // Silently handle browser notification dispatch failure
        }
      }
    });
  }
};

function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const panelRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Load notifications on mount and set up periodic refresh
  useEffect(() => {
    let active = true;

    getNotifications()
      .then((data) => {
        if (active) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
          triggerBrowserNotifications(data.notifications || []);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Failed to load notifications.");
        }
      });

    // Poll notifications every 2 minutes while tab is open
    const interval = setInterval(() => {
      getNotifications()
        .then((data) => {
          if (active) {
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
            triggerBrowserNotifications(data.notifications || []);
          }
        })
        .catch(() => {});
    }, 120000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      setLoading(true);
      setError("");
      getNotifications()
        .then((data) => {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
          triggerBrowserNotifications(data.notifications || []);
        })
        .catch((err) => {
          setError(err.message || "Failed to load notifications.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn("Could not mark notification as read:", err.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn("Could not mark all as read:", err.message);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      const target = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.warn("Could not delete notification:", err.message);
    }
  };

  const handleClearRead = async () => {
    try {
      await clearReadNotifications();
      setNotifications((prev) => prev.filter((n) => !n.isRead));
    } catch (err) {
      console.warn("Could not clear read notifications:", err.message);
    }
  };

  return (
    <div className="notification-panel-wrapper" ref={panelRef}>
      {/* BELL BUTTON */}
      <button
        type="button"
        className="notification-indicator-btn"
        onClick={handleToggle}
        aria-label="View notifications and reminders"
        title="View notifications and reminders"
      >
        <span className="notification-icon">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </span>
        {unreadCount > 0 && (
          <span className="notification-badge-count">{unreadCount}</span>
        )}
      </button>

      {/* DROPDOWN POPUP */}
      {isOpen && (
        <div className="notification-dropdown">
          <div className="notif-dropdown-header">
            <div>
              <h4>Notifications</h4>
              <span className="notif-unread-status">
                {unreadCount} unread
              </span>
            </div>
            <div className="notif-header-actions">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="btn-mark-all"
                  onClick={handleMarkAllRead}
                >
                  Mark all read
                </button>
              )}
              {notifications.some((n) => n.isRead) && (
                <button
                  type="button"
                  className="btn-clear-read"
                  onClick={handleClearRead}
                >
                  Clear read
                </button>
              )}
            </div>
          </div>

          <div className="notif-list-container">
            {loading ? (
              <div className="notif-loading">
                <div className="spinner-small"></div>
                <p>Loading reminders...</p>
              </div>
            ) : error ? (
              <div className="notif-error">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty">
                <span className="notif-empty-icon">🔔</span>
                <p>You're all caught up!</p>
                <span className="notif-empty-sub">
                  No upcoming deadlines or overdue tasks.
                </span>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`notif-item ${!notif.isRead ? "unread" : ""}`}
                  onClick={(e) => handleMarkAsRead(notif._id, e)}
                >
                  <div className="notif-item-left">
                    <span
                      className={`notif-type-dot ${notif.type}`}
                      title={notif.type}
                    ></span>
                  </div>

                  <div className="notif-item-content">
                    <div className="notif-title-row">
                      <span className="notif-item-title">{notif.title}</span>
                      <span className={`notif-priority-tag priority-${(notif.priority || "medium").toLowerCase()}`}>
                        {notif.priority}
                      </span>
                    </div>

                    <p className="notif-item-msg">{notif.message}</p>

                    <div className="notif-item-footer">
                      <Link
                        to={notif.link || "/tasks"}
                        className="notif-action-link"
                        onClick={() => setIsOpen(false)}
                      >
                        View task →
                      </Link>
                      <button
                        type="button"
                        className="notif-dismiss-btn"
                        onClick={(e) => handleDelete(notif._id, e)}
                        title="Dismiss"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="notif-dropdown-footer">
            <Link
              to="/tasks"
              className="footer-link"
              onClick={() => setIsOpen(false)}
            >
              Go to My Tasks
            </Link>
            <Link
              to="/settings"
              className="footer-link-sub"
              onClick={() => setIsOpen(false)}
            >
              Notification Settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationPanel;
