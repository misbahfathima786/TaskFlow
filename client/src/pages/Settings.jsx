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
            <p>Manage your application preferences and account actions.</p>
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
              Your account details. To update your name, email, photo, or password, visit your{" "}
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
            <p>Customize how TaskFlow looks and behaves.</p>
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

          {/* TASK REMINDERS */}
          <div className="settings-option">
            <div>
              <strong>Task reminders</strong>
              <p>Reminder settings will be available in a future update.</p>
            </div>

            <span className="settings-badge">Coming soon</span>
          </div>
        </section>

        {/* EMAIL LOGIN HISTORY */}
        <section className="settings-section">
          <div className="settings-section-header">
            <p className="dashboard-label">SECURITY & AUDIT</p>
            <h2>Email Login History</h2>
            <p>
              Review recent successful logins to your account. Records preserve the original email used at the time of each login.
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
                    <th>Date &amp; Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loginHistory.map((item, index) => (
                    <tr key={item._id || index}>
                      <td>
                        <strong>{item.email}</strong>
                      </td>
                      <td>
                        {new Date(item.loginAt).toLocaleString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td>
                        <span className="history-badge">Successful</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ACCOUNT ACTIONS */}
        <section className="settings-section">
          <div className="settings-section-header">
            <p className="dashboard-label">ACCOUNT ACTIONS</p>
            <h2>Session Management</h2>
            <p>Manage your active session or sign out of your account.</p>
          </div>

          <div className="settings-option">
            <div>
              <strong>Log out</strong>
              <p>Sign out of your active session on this browser.</p>
            </div>

            <button
              type="button"
              className="task-cancel-button"
              onClick={handleLogout}
              style={{
                color: "var(--danger-color)",
                borderColor: "var(--border-color)",
              }}
            >
              Log Out
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Settings;