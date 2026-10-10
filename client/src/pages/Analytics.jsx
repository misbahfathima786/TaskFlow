import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getAnalytics } from "../services/taskService";

function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState("7days"); // '7days' | '4weeks'

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let active = true;
    getAnalytics()
      .then((analyticsData) => {
        if (active) {
          setData(analyticsData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Failed to load productivity analytics.");
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [refreshing]);

  const loadAnalytics = () => {
    setLoading(true);
    setRefreshing((prev) => !prev);
  };

  // Max value calculation for bar chart scaling
  const trendList = timeRange === "7days" ? data?.last7Days || [] : data?.last4Weeks || [];
  const maxCompleted = Math.max(1, ...trendList.map((item) => item.completed || 0));

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main analytics-main">
        {/* HEADER */}
        <header className="dashboard-header">
          <div>
            <p className="dashboard-label">PERFORMANCE METRICS</p>
            <h1>Productivity Analytics</h1>
            <p>Real-time insights and trends calculated directly from your tasks.</p>
          </div>

          <div className="dashboard-header-actions">
            <button
              type="button"
              className="analytics-refresh-button"
              onClick={loadAnalytics}
              disabled={loading}
              title="Refresh analytics data"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={loading ? "spin" : ""}
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>Refresh</span>
            </button>

            <Link to="/tasks" className="dashboard-add-button">
              View Tasks
            </Link>
          </div>
        </header>

        {error && (
          <div className="form-error task-page-error">
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="analytics-loading-state">
            <div className="loading-spinner"></div>
            <p>Calculating your productivity analytics...</p>
          </div>
        ) : !data || data.totalTasks === 0 ? (
          <div className="analytics-empty-state">
            <div className="empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
            </div>
            <h3>No Task Data Available</h3>
            <p>Create and complete tasks to start generating productivity metrics.</p>
            <Link to="/tasks" className="dashboard-add-button" style={{ marginTop: "16px" }}>
              + Create Your First Task
            </Link>
          </div>
        ) : (
          <div className="analytics-content">
            {/* TOP METRIC CARDS */}
            <section className="dashboard-stats analytics-stats">
              <div className="stat-card">
                <span>Overall Completion</span>
                <strong>{data.completionRate}%</strong>
                <small>{data.completedCount} of {data.totalTasks} tasks done</small>
              </div>

              <div className="stat-card">
                <span>Completed Tasks</span>
                <strong style={{ color: "var(--success-color)" }}>{data.completedCount}</strong>
                <small>Finished work</small>
              </div>

              <div className="stat-card">
                <span>Pending Tasks</span>
                <strong>{data.pendingCount}</strong>
                <small>Currently in progress</small>
              </div>

              <div className="stat-card">
                <span>Overdue Tasks</span>
                <strong className={data.overdueCount > 0 ? "danger-number" : ""}>
                  {data.overdueCount}
                </strong>
                <small>{data.overdueCount > 0 ? "Requires prompt action" : "All deadlines on schedule"}</small>
              </div>
            </section>

            {/* CHARTS GRID */}
            <div className="analytics-grid">
              {/* WEEKLY / RECENT COMPLETION BAR CHART */}
              <section className="analytics-card trend-card">
                <div className="analytics-card-header">
                  <div>
                    <p className="dashboard-label">VELOCITY</p>
                    <h2>Tasks Completed Trend</h2>
                  </div>

                  <div className="analytics-toggle-group">
                    <button
                      type="button"
                      className={`analytics-toggle-btn ${timeRange === "7days" ? "active" : ""}`}
                      onClick={() => setTimeRange("7days")}
                    >
                      Last 7 Days
                    </button>
                    <button
                      type="button"
                      className={`analytics-toggle-btn ${timeRange === "4weeks" ? "active" : ""}`}
                      onClick={() => setTimeRange("4weeks")}
                    >
                      Past 4 Weeks
                    </button>
                  </div>
                </div>

                <div className="chart-bar-container">
                  {trendList.map((item, idx) => {
                    const heightPercent = maxCompleted > 0 ? Math.round((item.completed / maxCompleted) * 100) : 0;
                    return (
                      <div className="chart-bar-column" key={idx}>
                        <div className="chart-bar-tooltip">
                          <strong>{item.completed}</strong> {item.completed === 1 ? "task" : "tasks"}
                        </div>
                        <div className="chart-bar-track">
                          <div
                            className="chart-bar-fill"
                            style={{ height: `${Math.max(item.completed > 0 ? 12 : 3, heightPercent)}%` }}
                          ></div>
                        </div>
                        <span className="chart-bar-label">{item.day || item.week}</span>
                        <span className="chart-bar-sublabel">{item.date || ""}</span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* COMPLETED VS PENDING DISTRIBUTION */}
              <section className="analytics-card status-ratio-card">
                <div className="analytics-card-header">
                  <div>
                    <p className="dashboard-label">STATUS BALANCE</p>
                    <h2>Completed vs Pending</h2>
                  </div>
                </div>

                <div className="status-ratio-body">
                  <div className="donut-chart-wrapper">
                    <svg viewBox="0 0 36 36" className="circular-chart">
                      <path
                        className="circle-bg"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="circle-stroke"
                        strokeDasharray={`${data.completionRate}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="donut-center-text">
                      <strong>{data.completionRate}%</strong>
                      <span>Done</span>
                    </div>
                  </div>

                  <div className="status-legend-list">
                    <div className="status-legend-item">
                      <span className="legend-indicator completed-indicator"></span>
                      <div>
                        <strong>Completed ({data.completedCount})</strong>
                        <p>{data.totalTasks > 0 ? Math.round((data.completedCount / data.totalTasks) * 100) : 0}% of total workload</p>
                      </div>
                    </div>

                    <div className="status-legend-item">
                      <span className="legend-indicator pending-indicator"></span>
                      <div>
                        <strong>Pending ({data.pendingCount})</strong>
                        <p>{data.totalTasks > 0 ? Math.round((data.pendingCount / data.totalTasks) * 100) : 0}% remaining tasks</p>
                      </div>
                    </div>

                    {data.overdueCount > 0 && (
                      <div className="status-legend-item">
                        <span className="legend-indicator overdue-indicator"></span>
                        <div>
                          <strong style={{ color: "var(--danger-color)" }}>Overdue ({data.overdueCount})</strong>
                          <p>Past due deadline</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* TASKS BY CATEGORY */}
              <section className="analytics-card category-breakdown-card">
                <div className="analytics-card-header">
                  <div>
                    <p className="dashboard-label">CATEGORIES</p>
                    <h2>Tasks by Category</h2>
                  </div>
                  <span className="analytics-badge-total">{data.totalTasks} Total</span>
                </div>

                <div className="category-progress-list">
                  {data.categoryBreakdown.map((cat) => (
                    <div key={cat.category} className="category-progress-row">
                      <div className="category-row-meta">
                        <div className="category-row-name">
                          <span className={`category-dot ${cat.category.toLowerCase()}`}></span>
                          <strong>{cat.category}</strong>
                        </div>
                        <span className="category-row-counts">
                          {cat.completed} / {cat.total} completed ({cat.rate}%)
                        </span>
                      </div>

                      <div className="category-meter-track">
                        <div
                          className={`category-meter-fill ${cat.category.toLowerCase()}`}
                          style={{ width: `${cat.rate}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* PRIORITY DISTRIBUTION */}
              <section className="analytics-card priority-distribution-card">
                <div className="analytics-card-header">
                  <div>
                    <p className="dashboard-label">URGENCY</p>
                    <h2>Priority Distribution</h2>
                  </div>
                </div>

                <div className="priority-bars-container">
                  {["High", "Medium", "Low"].map((prio) => {
                    const count = data.priorityDistribution[prio] || 0;
                    const pct = data.totalTasks > 0 ? Math.round((count / data.totalTasks) * 100) : 0;
                    return (
                      <div key={prio} className="priority-meter-row">
                        <div className="priority-row-header">
                          <span className={`priority-badge ${prio.toLowerCase()}`}>
                            {prio} Priority
                          </span>
                          <span className="priority-count-val">
                            <strong>{count}</strong> ({pct}%)
                          </span>
                        </div>
                        <div className="priority-track">
                          <div
                            className={`priority-fill ${prio.toLowerCase()}`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Analytics;
