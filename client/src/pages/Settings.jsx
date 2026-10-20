import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import { useTheme } from "../context/ThemeContext";
import { getUserProfile, getLoginHistory } from "../services/authService";

function Settings() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const [loginHistory, setLoginHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  // Real Browser Notification preferences
  const [browserNotifEnabled, setBrowserNotifEnabled] = useState(
    () => localStorage.getItem("tf_browser_notifications") === "true"
  );
  const [permissionStatus, setPermissionStatus] = useState(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission; // 'granted' | 'denied' | 'default'
    }
    return "unsupported";
  });
  const [notifMessage, setNotifMessage] = useState("");

  // Fetch latest profile info and login history on mount
  useEffect(() => {
    const fetchLatestProfile = async () => {
      try {
        const freshUser = await getUserProfile();
        setUser(freshUser);
        localStorage.setItem("user", JSON.stringify(freshUser));
      } catch (err) {
        console.warn("Could not sync profile from server:", err.message);
      }
    };

    const fetchHistory = async () => {
      try {
        setHistoryLoading(true);
        setHistoryError("");
        const history = await getLoginHistory();
        setLoginHistory(history || []);
      } catch (err) {
        setHistoryError(err.message || "Failed to load login history.");
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchLatestProfile();
    fetchHistory();
  }, []);

  const handleToggleBrowserNotifications = async () => {
    setNotifMessage("");

    if (!("Notification" in window)) {
      setNotifMessage("Desktop notifications are not supported by your browser.");
      return;
    }

    // If currently enabled, disable it
    if (browserNotifEnabled) {
      localStorage.setItem("tf_browser_notifications", "false");
      setBrowserNotifEnabled(false);
      setNotifMessage("Browser desktop notifications have been turned off.");
      return;
    }

    // Attempt to request permission if not already granted
    if (Notification.permission === "default") {
      try {
        const result = await Notification.requestPermission();
        setPermissionStatus(result);
        if (result === "granted") {
          localStorage.setItem("tf_browser_notifications", "true");
          setBrowserNotifEnabled(true);
          setNotifMessage("Browser notifications enabled successfully!");
          new Notification("TaskFlow Reminders", {
            body: "You will receive desktop alerts for due and overdue tasks while TaskFlow is open.",
          });
        } else if (result === "denied") {
          setNotifMessage("Notification permission was denied. You can enable them in your browser site settings.");
        }
      } catch {
        setNotifMessage("Could not request notification permission.");
      }
    } else if (Notification.permission === "granted") {
      localStorage.setItem("tf_browser_notifications", "true");
      setBrowserNotifEnabled(true);
      setNotifMessage("Browser desktop notifications are now active.");
    } else if (Notification.permission === "denied") {
      setNotifMessage("Notifications are blocked in your browser. Please allow notifications for this site in your browser address bar.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth");
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main settings-main">
        {/* SETTINGS HEADER */}
        <header className="dashboard-header">
          <div>
            <p className="dashboard-label">PREFERENCES & ACCOUNT</p>
            <h1>Settings</h1>
            <p>Manage your application preferences, notifications, and account actions.</p>
          </div>

          <Link to="/dashboard" className="dashboard-add-button">
            Back to Dashboard
          </Link>
        </header>

        {/* ACCOUNT OVERVIEW */}
        <section className="settings-section">
          <div className="settings-section-header">
            <p className="dashboard-label">ACCOUNT OVERVIEW</p>
            <h2>Account</h2>
            <p>
              Your account details and security credentials. To update your name, email, photo, or password, visit your{" "}
              <Link to="/profile" style={{ color: "var(--accent-color)" }}>
                Profile
              </Link>
              .
            </p>
          </div>

          <div className="profile-card">
            <div className="profile-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.name || "User"} />
              ) : (
                user?.name?.charAt(0).toUpperCase() || "U"
              )}
            </div>

            <div className="profile-info">
              <div>
                <span>Full name</span>
                <strong>{user?.name || "User"}</strong>
              </div>

              <div>
                <span>Email address</span>
                <strong>{user?.email || "No email available"}</strong>
              </div>

              <div>
                <span>Account Role</span>
                <strong style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  {user?.role === "admin" ? "🛡️ Administrator" : "Standard User"}
                </strong>
              </div>

              <div>
                <span>Authentication Method</span>
                <strong>
                  {user?.authProvider === "google" ? "Google Account" : "Email & Password"}
                </strong>
              </div>
            </div>

            <Link to="/profile" className="settings-edit-trigger">
              View Profile
            </Link>
          </div>
        </section>

        {/* APPLICATION PREFERENCES */}
        <section className="settings-section">
          <div className="settings-section-header">
            <p className="dashboard-label">PREFERENCES</p>
            <h2>Application Preferences</h2>
            <p>Customize how TaskFlow looks, alerts you, and behaves.</p>
          </div>

          {/* THEME CONTROL */}
          <div className="settings-option">
            <div>
              <strong>Theme Appearance</strong>
              <p>
                Current theme:{" "}
                <span
                  style={{
                    textTransform: "capitalize",
                    fontWeight: 600,
                    color: "var(--primary-color)",
                  }}
                >
                  {theme} mode
                </span>
                . Toggle between light and dark themes.
              </p>
            </div>

            <button
              type="button"
              className="settings-edit-trigger"
              onClick={toggleTheme}
              aria-label={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              {theme === "dark" ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                  Switch to Light Mode
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                  Switch to Dark Mode
                </>
              )}
            </button>
          </div>

          {/* REAL TASK REMINDERS & BROWSER NOTIFICATIONS */}
          <div className="settings-option">
            <div>
              <strong>Browser Desktop Reminders</strong>
              <p>
                Receive operating system notifications for due and overdue tasks while TaskFlow is active in your browser.
                {" "}
                <span style={{ fontSize: "12px", color: "var(--secondary-text)" }}>
                  (Permission: <strong>{permissionStatus}</strong>)
                </span>
              </p>
              {notifMessage && (
                <p style={{ fontSize: "13px", color: "var(--accent-color)", marginTop: "4px" }}>
                  {notifMessage}
                </p>
              )}
            </div>

            <button
              type="button"
              className={`settings-edit-trigger ${browserNotifEnabled ? "active-setting" : ""}`}
              onClick={handleToggleBrowserNotifications}
            >
              {browserNotifEnabled ? "Enabled ✓" : "Enable Reminders"}
            </button>
          </div>
        </section>

        {/* EMAIL LOGIN HISTORY */}
        <section className="settings-section">
          <div className="settings-section-header">
            <p className="dashboard-label">SECURITY & AUDIT</p>
            <h2>Login History</h2>
            <p>
              Review recent successful logins to your account, including provider and timestamp.
            </p>
          </div>

          {historyLoading ? (
            <p style={{ color: "var(--secondary-text)", fontSize: "14px", padding: "16px 0" }}>
              Loading login history...
            </p>
          ) : historyError ? (
            <p className="form-error" style={{ marginTop: "10px" }}>
              {historyError}
            </p>
          ) : loginHistory.length === 0 ? (
            <div className="history-empty">
              No login history recorded yet. Future logins will appear here.
            </div>
          ) : (
            <div className="history-table-container">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Email Used</th>
                    <th>Method</th>
                    <th>Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {loginHistory.map((item, index) => {
                    const parsedDate = new Date(item.loginAt);
                    const formatted = !isNaN(parsedDate.getTime())
                      ? parsedDate.toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "Unknown time";

                    return (
                      <tr key={index}>
                        <td>{item.email}</td>
                        <td>
                          <span className="meta-badge" style={{ fontSize: "11px" }}>
                            {item.provider === "google" ? "Google OAuth" : "Password"}
                          </span>
                        </td>
                        <td>{formatted}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* LOGOUT */}
        <section className="settings-section">
          <div className="settings-section-header">
            <p className="dashboard-label">SESSION</p>
            <h2>Log Out</h2>
            <p>End your current session. You will need to sign in again to access your tasks.</p>
          </div>

          <div className="settings-option">
            <div>
              <strong>Sign out of TaskFlow</strong>
              <p>Clears stored session tokens from this device.</p>
            </div>

            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
              aria-label="Logout of TaskFlow"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Settings;