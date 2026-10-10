import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

function Sidebar() {
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("sidebarCollapsed") === "true"
  );

  const handleSidebarToggle = () => {
    setCollapsed((current) => {
      const newState = !current;
      localStorage.setItem("sidebarCollapsed", newState);
      return newState;
    });
  };

  const isActive = (path) => {
    return location.pathname === path
      ? "sidebar-link active"
      : "sidebar-link";
  };

  return (
    <aside
      className={
        collapsed
          ? "sidebar sidebar--collapsed"
          : "sidebar"
      }
    >
      {/* TOP */}
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <Link to="/dashboard" className="sidebar-brand-link">
            <span className="sidebar-brand-mark">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </span>
            <span className="sidebar-brand-text">TaskFlow</span>
          </Link>
        </div>

        <button
          type="button"
          className="sidebar-toggle-button"
          onClick={handleSidebarToggle}
          aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
        >
          {collapsed ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          )}
        </button>
      </div>

      {/* MAIN NAVIGATION */}
      <nav className="sidebar-nav">
        <Link to="/dashboard" className={isActive("/dashboard")}>
          <span className="sidebar-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
              <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
              <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
              <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
            </svg>
          </span>
          <span className="sidebar-text">Dashboard</span>
        </Link>

        <Link to="/tasks" className={isActive("/tasks")}>
          <span className="sidebar-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4"></path>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
          </span>
          <span className="sidebar-text">My Tasks</span>
        </Link>

        <Link to="/completed-tasks" className={isActive("/completed-tasks")}>
          <span className="sidebar-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9"></circle>
              <polyline points="15 10 11 14 9 12"></polyline>
            </svg>
          </span>
          <span className="sidebar-text">Completed Tasks</span>
        </Link>

        <Link to="/analytics" className={isActive("/analytics")}>
          <span className="sidebar-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </span>
          <span className="sidebar-text">Analytics</span>
        </Link>
      </nav>

      {/* CATEGORIES */}
      <div className="sidebar-section">
        <p className="sidebar-title">Categories</p>

        <Link to="/tasks?category=College" className="sidebar-category">
          <span className="category-dot college"></span>
          <span className="sidebar-text">College</span>
        </Link>

        <Link to="/tasks?category=Work" className="sidebar-category">
          <span className="category-dot work"></span>
          <span className="sidebar-text">Work</span>
        </Link>

        <Link to="/tasks?category=Personal" className="sidebar-category">
          <span className="category-dot personal"></span>
          <span className="sidebar-text">Personal</span>
        </Link>

        <Link to="/tasks?category=Projects" className="sidebar-category">
          <span className="category-dot projects"></span>
          <span className="sidebar-text">Projects</span>
        </Link>

        <Link to="/tasks?category=Other" className="sidebar-category">
          <span className="category-dot other"></span>
          <span className="sidebar-text">Other</span>
        </Link>
      </div>

      {/* BOTTOM (Profile and Settings only - Logout kept in Settings) */}
      <div className="sidebar-bottom">
        <Link to="/profile" className={isActive("/profile")}>
          <span className="sidebar-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </span>
          <span className="sidebar-text">Profile</span>
        </Link>

        <Link to="/settings" className={isActive("/settings")}>
          <span className="sidebar-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </span>
          <span className="sidebar-text">Settings</span>
        </Link>
      </div>
    </aside>
  );
}

export default Sidebar;