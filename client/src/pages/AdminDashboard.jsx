import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import {
  getAdminOverview,
  getAdminUsers,
  updateUserStatus,
  updateUserRole,
  getAdminActivityTrends,
  getVisitorAnalytics,
} from "../services/adminService";

function AdminDashboard() {
  // Current user from localStorage
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  })();

  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'users' | 'activity'

  // Overview data
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState("");

  // Users management data
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalUsers: 0, totalPages: 1 });
  const [searchQuery, setSearchQuery] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Activity trends data
  const [trends, setTrends] = useState([]);
  const [visitorStats, setVisitorStats] = useState(null);
  const [trendsLoading, setTrendsLoading] = useState(false);

  // Load Overview Data on mount
  useEffect(() => {
    let active = true;

    getAdminOverview()
      .then((data) => {
        if (active) {
          setOverview(data);
          setOverviewLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setOverviewError(err.message || "Failed to load admin overview.");
          setOverviewLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Fetch Users
  const fetchUsers = (page = 1, search = searchQuery) => {
    setUsersLoading(true);
    setActionError("");
    getAdminUsers({ page, limit: 10, search })
      .then((data) => {
        setUsers(data.users || []);
        setPagination(data.pagination || { page: 1, limit: 10, totalUsers: 0, totalPages: 1 });
        setUsersLoading(false);
      })
      .catch((err) => {
        setActionError(err.message || "Failed to load users.");
        setUsersLoading(false);
      });
  };

  // Fetch Activity Trends and Visitor Analytics
  const fetchTrendsAndVisitors = () => {
    setTrendsLoading(true);
    Promise.all([getAdminActivityTrends(), getVisitorAnalytics()])
      .then(([trendsData, visitorData]) => {
        setTrends(trendsData || []);
        setVisitorStats(visitorData || null);
        setTrendsLoading(false);
      })
      .catch((err) => {
        setActionError(err.message || "Failed to load trends.");
        setTrendsLoading(false);
      });
  };

  // Trigger data fetching on tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setActionError("");
    setActionSuccess("");
    if (tab === "users" && users.length === 0) {
      fetchUsers(1);
    } else if (tab === "activity" && trends.length === 0) {
      fetchTrendsAndVisitors();
    }
  };

  // Toggle user activation status
  const handleToggleStatus = async (user) => {
    const isDeactivating = !user.isDeactivated;
    const confirmMessage = isDeactivating
      ? `Are you sure you want to deactivate ${user.name}'s account? They will not be able to log in.`
      : `Reactivate ${user.name}'s account?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      setActionError("");
      setActionSuccess("");
      await updateUserStatus(user.id, isDeactivating);
      setActionSuccess(`Account ${user.name} has been ${isDeactivating ? "deactivated" : "reactivated"}.`);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isDeactivated: isDeactivating } : u))
      );
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Promote / Demote user role
  const handleToggleRole = async (user) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    const confirmMessage =
      newRole === "admin"
        ? `Promote ${user.name} (${user.email}) to Administrator? They will receive full platform control.`
        : `Demote ${user.name} (${user.email}) to Standard User?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      setActionError("");
      setActionSuccess("");
      await updateUserRole(user.id, newRole);
      setActionSuccess(`Updated ${user.name}'s role to '${newRole}'.`);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(1, searchQuery);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main admin-main">
        {/* ADMIN HEADER */}
        <header className="dashboard-header admin-header">
          <div>
            <div className="admin-badge-indicator">
              <span className="admin-shield-icon">🛡️</span>
              <span>ADMINISTRATOR CONSOLE</span>
            </div>
            <h1>Admin Dashboard</h1>
            <p>Platform health, user accounts, system metrics, and visitor analytics.</p>
          </div>

          <div className="admin-header-actions">
            <Link to="/dashboard" className="btn-secondary">
              Back to App
            </Link>
          </div>
        </header>

        {/* ALERTS */}
        {actionError && (
          <div className="alert-box error" style={{ margin: "0 0 20px 0" }}>
            <span>{actionError}</span>
            <button type="button" onClick={() => setActionError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}>✕</button>
          </div>
        )}
        {actionSuccess && (
          <div className="alert-box success" style={{ margin: "0 0 20px 0" }}>
            <span>{actionSuccess}</span>
            <button type="button" onClick={() => setActionSuccess("")} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}>✕</button>
          </div>
        )}

        {/* ADMIN TABS NAVIGATION */}
        <div className="admin-tabs-nav">
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => handleTabChange("overview")}
          >
            Platform Overview
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "users" ? "active" : ""}`}
            onClick={() => handleTabChange("users")}
          >
            User Management ({overview?.totalUsers || 0})
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "activity" ? "active" : ""}`}
            onClick={() => handleTabChange("activity")}
          >
            Activity & Trends
          </button>
        </div>

        {/* ==================================================== */}
        {/* TAB 1: OVERVIEW METRICS                              */}
        {/* ==================================================== */}
        {activeTab === "overview" && (
          <div className="admin-tab-content">
            {overviewLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading platform metrics...</p>
              </div>
            ) : overviewError ? (
              <div className="alert-box error">{overviewError}</div>
            ) : (
              <div className="admin-overview-grid">
                {/* ROW 1: USER METRICS */}
                <div className="admin-section-block">
                  <h3 className="admin-section-title">User Growth & Engagement</h3>
                  <div className="dashboard-stats-grid">
                    <div className="stat-card">
                      <div className="stat-card-header">
                        <span className="stat-title">Total Registered</span>
                        <span className="stat-icon-wrapper blue">👥</span>
                      </div>
                      <p className="stat-number">{overview.totalUsers}</p>
                      <p className="stat-subtext">All active & deactivated accounts</p>
                    </div>

                    <div className="stat-card">
                      <div className="stat-card-header">
                        <span className="stat-title">New (Today)</span>
                        <span className="stat-icon-wrapper teal">✨</span>
                      </div>
                      <p className="stat-number">{overview.newUsersToday}</p>
                      <p className="stat-subtext">Registered since midnight</p>
                    </div>

                    <div className="stat-card">
                      <div className="stat-card-header">
                        <span className="stat-title">New (Last 7 Days)</span>
                        <span className="stat-icon-wrapper blue">📈</span>
                      </div>
                      <p className="stat-number">{overview.newUsers7d}</p>
                      <p className="stat-subtext">Rolling 7-day registrations</p>
                    </div>

                    <div className="stat-card">
                      <div className="stat-card-header">
                        <span className="stat-title">Active Users (7d)</span>
                        <span className="stat-icon-wrapper navy">⚡</span>
                      </div>
                      <p className="stat-number">{overview.activeUsers7d}</p>
                      <p className="stat-subtext">{overview.activeUsers30d} active past 30 days</p>
                    </div>
                  </div>
                </div>

                {/* ROW 2: PLATFORM TASK METRICS */}
                <div className="admin-section-block">
                  <h3 className="admin-section-title">Platform Task Productivity</h3>
                  <div className="dashboard-stats-grid">
                    <div className="stat-card">
                      <div className="stat-card-header">
                        <span className="stat-title">Total Platform Tasks</span>
                        <span className="stat-icon-wrapper navy">📋</span>
                      </div>
                      <p className="stat-number">{overview.totalTasks}</p>
                      <p className="stat-subtext">{overview.pendingTasks} pending tasks</p>
                    </div>

                    <div className="stat-card">
                      <div className="stat-card-header">
                        <span className="stat-title">Completed Tasks</span>
                        <span className="stat-icon-wrapper teal">✓</span>
                      </div>
                      <p className="stat-number">{overview.completedTasks}</p>
                      <p className="stat-subtext">Global completed task count</p>
                    </div>

                    <div className="stat-card">
                      <div className="stat-card-header">
                        <span className="stat-title">Completion Rate</span>
                        <span className="stat-icon-wrapper teal">🎯</span>
                      </div>
                      <p className="stat-number">{overview.completionRate}%</p>
                      <p className="stat-subtext">Tasks resolved successfully</p>
                    </div>

                    <div className="stat-card">
                      <div className="stat-card-header">
                        <span className="stat-title">Overdue Tasks</span>
                        <span className="stat-icon-wrapper amber">⚠️</span>
                      </div>
                      <p className="stat-number">{overview.overdueTasks}</p>
                      <p className="stat-subtext">Pending past due date</p>
                    </div>
                  </div>
                </div>

                {/* ROW 3: WEBSITE VISITOR ANALYTICS */}
                <div className="admin-section-block">
                  <h3 className="admin-section-title">Website Visitor & Usage Metrics (First-Party)</h3>
                  <div className="dashboard-stats-grid">
                    <div className="stat-card">
                      <div className="stat-card-header">
                        <span className="stat-title">Total Pageviews</span>
                        <span className="stat-icon-wrapper blue">👁️</span>
                      </div>
                      <p className="stat-number">{overview.visitorMetrics.totalPageviews}</p>
                      <p className="stat-subtext">Total tracked route views</p>
                    </div>

                    <div className="stat-card">
                      <div className="stat-card-header">
                        <span className="stat-title">Unique Visitors</span>
                        <span className="stat-icon-wrapper teal">🌐</span>
                      </div>
                      <p className="stat-number">{overview.visitorMetrics.totalUniqueVisitors}</p>
                      <p className="stat-subtext">Distinct anonymous visitor IDs</p>
                    </div>

                    <div className="stat-card">
                      <div className="stat-card-header">
                        <span className="stat-title">User Sessions</span>
                        <span className="stat-icon-wrapper navy">⏱️</span>
                      </div>
                      <p className="stat-number">{overview.visitorMetrics.totalSessions}</p>
                      <p className="stat-subtext">Distinct browsing sessions</p>
                    </div>

                    <div className="stat-card">
                      <div className="stat-card-header">
                        <span className="stat-title">Visitor Conversion</span>
                        <span className="stat-icon-wrapper teal">🏆</span>
                      </div>
                      <p className="stat-number">{overview.visitorMetrics.conversionRate}%</p>
                      <p className="stat-subtext">Visitors becoming registered accounts</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: USER MANAGEMENT TABLE                         */}
        {/* ==================================================== */}
        {activeTab === "users" && (
          <div className="admin-tab-content">
            <div className="admin-table-toolbar">
              <form onSubmit={handleSearchSubmit} className="admin-search-form">
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <button type="submit" className="btn-search">
                  Search
                </button>
                {searchQuery && (
                  <button
                    type="button"
                    className="btn-clear-search"
                    onClick={() => {
                      setSearchQuery("");
                      fetchUsers(1, "");
                    }}
                  >
                    Clear
                  </button>
                )}
              </form>

              <div className="admin-count-info">
                Showing {users.length} of {pagination.totalUsers} users
              </div>
            </div>

            {usersLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="empty-state">
                <p>No user accounts found matching your query.</p>
              </div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-users-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Auth Provider</th>
                      <th>Status</th>
                      <th>Tasks</th>
                      <th>Registered</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const isSelf = currentUser && (currentUser.id === u.id || currentUser._id === u.id);

                      return (
                        <tr key={u.id} className={u.isDeactivated ? "row-deactivated" : ""}>
                          <td>
                            <div className="user-cell">
                              <div className="avatar-chip">
                                {u.avatar ? (
                                  <img src={u.avatar} alt={u.name} />
                                ) : (
                                  u.name.charAt(0).toUpperCase()
                                )}
                              </div>
                              <span className="user-name">
                                {u.name} {isSelf && <span className="you-tag">(You)</span>}
                              </span>
                            </div>
                          </td>
                          <td className="email-cell">{u.email}</td>
                          <td>
                            <span className={`role-badge ${u.role}`}>
                              {u.role === "admin" ? "🛡️ Admin" : "User"}
                            </span>
                          </td>
                          <td>
                            <span className={`provider-badge ${u.authProvider}`}>
                              {u.authProvider === "google" ? "G Google" : "Email/Pass"}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${u.isDeactivated ? "deactivated" : "active"}`}>
                              {u.isDeactivated ? "Deactivated" : "Active"}
                            </span>
                          </td>
                          <td>
                            <span className="task-count-text">
                              {u.completedTaskCount} / {u.taskCount}
                            </span>
                          </td>
                          <td className="date-cell">
                            {new Date(u.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                          <td>
                            <div className="admin-row-actions">
                              {/* STATUS TOGGLE */}
                              <button
                                type="button"
                                className={`btn-status-toggle ${u.isDeactivated ? "activate" : "deactivate"}`}
                                onClick={() => handleToggleStatus(u)}
                                disabled={isSelf}
                                title={isSelf ? "You cannot deactivate yourself" : u.isDeactivated ? "Reactivate user" : "Deactivate user"}
                              >
                                {u.isDeactivated ? "Reactivate" : "Deactivate"}
                              </button>

                              {/* ROLE TOGGLE */}
                              <button
                                type="button"
                                className="btn-role-toggle"
                                onClick={() => handleToggleRole(u)}
                                title={u.role === "admin" ? "Demote to standard user" : "Promote to administrator"}
                              >
                                {u.role === "admin" ? "Demote" : "Make Admin"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* PAGINATION */}
            {pagination.totalPages > 1 && (
              <div className="admin-pagination">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchUsers(pagination.page - 1)}
                  className="pagination-btn"
                >
                  ← Previous
                </button>
                <span className="pagination-text">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchUsers(pagination.page + 1)}
                  className="pagination-btn"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: ACTIVITY TRENDS & SYSTEM HEALTH               */}
        {/* ==================================================== */}
        {activeTab === "activity" && (
          <div className="admin-tab-content">
            {trendsLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Aggregating platform activity trends...</p>
              </div>
            ) : (
              <div className="admin-trends-container">
                {/* 14-DAY PLATFORM ACTIVITY BAR CHART */}
                <div className="analytics-card">
                  <div className="analytics-card-header">
                    <div>
                      <h3>14-Day Activity Velocity</h3>
                      <p className="analytics-sub">New registrations vs tasks created & completed</p>
                    </div>
                  </div>

                  <div className="admin-chart-bars">
                    {trends.map((t, idx) => {
                      const maxVal = Math.max(
                        ...trends.map((x) => Math.max(x.newUsers, x.tasksCreated, x.tasksCompleted)),
                        1
                      );
                      const userH = Math.round((t.newUsers / maxVal) * 120);
                      const createH = Math.round((t.tasksCreated / maxVal) * 120);
                      const compH = Math.round((t.tasksCompleted / maxVal) * 120);

                      return (
                        <div key={idx} className="trend-bar-column">
                          <div className="bars-group">
                            <div
                              className="bar user-bar"
                              style={{ height: `${Math.max(userH, 4)}px` }}
                              title={`New Users: ${t.newUsers}`}
                            ></div>
                            <div
                              className="bar create-bar"
                              style={{ height: `${Math.max(createH, 4)}px` }}
                              title={`Tasks Created: ${t.tasksCreated}`}
                            ></div>
                            <div
                              className="bar comp-bar"
                              style={{ height: `${Math.max(compH, 4)}px` }}
                              title={`Tasks Completed: ${t.tasksCompleted}`}
                            ></div>
                          </div>
                          <span className="trend-date-label">{t.date}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="trend-legend">
                    <span className="legend-item"><span className="legend-dot user-dot"></span> New Users</span>
                    <span className="legend-item"><span className="legend-dot create-dot"></span> Tasks Created</span>
                    <span className="legend-item"><span className="legend-dot comp-dot"></span> Tasks Completed</span>
                  </div>
                </div>

                {/* TOP VISITED PAGES TABLE */}
                {visitorStats?.topPages && (
                  <div className="analytics-card" style={{ marginTop: "24px" }}>
                    <div className="analytics-card-header">
                      <h3>Top Visited Application Routes</h3>
                      <p className="analytics-sub">Anonymized first-party page view distribution</p>
                    </div>

                    <div className="top-pages-list">
                      {visitorStats.topPages.map((page, idx) => (
                        <div key={idx} className="top-page-row">
                          <span className="page-path">{page.path}</span>
                          <span className="page-views-badge">{page.views} views</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
