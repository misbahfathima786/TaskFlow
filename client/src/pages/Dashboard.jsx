import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import { getTasks, updateTask } from "../services/taskService";

function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getTasks()
      .then((data) => {
        if (active) {
          setTasks(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Failed to load tasks.");
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleToggleTask = async (task) => {
    try {
      const updated = await updateTask(task._id, {
        status: task.status === "Completed" ? "Pending" : "Completed",
      });
      setTasks((prev) =>
        prev.map((t) => (t._id === updated._id ? updated : t))
      );
    } catch (err) {
      setError(err.message || "Failed to update task.");
    }
  };

  // GET TASK DATE STATUS
  const getDateStatus = (date) => {
    if (!date) {
      return "No due date";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);

    const difference =
      (taskDate - today) /
      (1000 * 60 * 60 * 24);

    if (difference < 0) {
      return "Overdue";
    }

    if (difference === 0) {
      return "Today";
    }

    if (difference === 1) {
      return "Tomorrow";
    }

    return "Upcoming";
  };

  // DASHBOARD STATISTICS
  const stats = useMemo(() => {
    const activeTasks = tasks.filter(
      (task) => task.status === "Pending"
    ).length;

    const todayTasks = tasks.filter(
      (task) =>
        task.status === "Pending" &&
        getDateStatus(task.dueDate) === "Today"
    ).length;

    const overdue = tasks.filter(
      (task) =>
        task.status === "Pending" &&
        getDateStatus(task.dueDate) === "Overdue"
    ).length;

    const now = new Date();

    const completedThisMonth = tasks.filter((task) => {
      if (
        task.status !== "Completed" ||
        !task.completedAt
      ) {
        return false;
      }

      const completedDate = new Date(task.completedAt);

      return (
        completedDate.getMonth() === now.getMonth() &&
        completedDate.getFullYear() === now.getFullYear()
      );
    }).length;

    const total = tasks.length;

    const completed = tasks.filter(
      (task) => task.status === "Completed"
    ).length;

    const progress =
      total === 0
        ? 0
        : Math.round((completed / total) * 100);

    return {
      activeTasks,
      completedThisMonth,
      todayTasks,
      overdue,
      progress,
      total,
      completed,
    };
  }, [tasks]);

  // TODAY'S FOCUS (Top pending focus tasks: overdue, due today, or high priority)
  const todaysFocusTasks = useMemo(() => {
    const priorityWeights = { High: 3, Medium: 2, Low: 1 };
    return tasks
      .filter((task) => task.status === "Pending")
      .filter((task) => {
        const ds = getDateStatus(task.dueDate);
        return ds === "Overdue" || ds === "Today" || task.priority === "High";
      })
      .sort((a, b) => {
        const aStatus = getDateStatus(a.dueDate);
        const bStatus = getDateStatus(b.dueDate);
        if (aStatus === "Overdue" && bStatus !== "Overdue") return -1;
        if (bStatus === "Overdue" && aStatus !== "Overdue") return 1;
        if (aStatus === "Today" && bStatus !== "Today") return -1;
        if (bStatus === "Today" && aStatus !== "Today") return 1;
        return (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
      })
      .slice(0, 3);
  }, [tasks]);

  // TASKS NEEDING ATTENTION (Due soonest)
  const attentionTasks = useMemo(() => {
    return tasks
      .filter(
        (task) =>
          task.status === "Pending" &&
          task.dueDate
      )
      .sort(
        (a, b) =>
          new Date(a.dueDate) -
          new Date(b.dueDate)
      )
      .slice(0, 5);
  }, [tasks]);

  // RECENT TASKS
  const recentTasks = tasks
    .filter((task) => task.status === "Pending")
    .slice(0, 5);

  // FORMAT DATE
  const formatDueDate = (date) => {
    if (!date) {
      return "No due date";
    }

    const taskDate = new Date(date);

    return taskDate.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
  };

  // TIME-BASED GREETING
  const currentHour = new Date().getHours();

  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 18
      ? "Good afternoon"
      : "Good evening";

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        {/* DASHBOARD HEADER */}
        <header className="dashboard-header">
          <div>
            <p className="dashboard-label">
              OVERVIEW
            </p>

            <h1>
              {greeting}, {user?.name || "there"}.
            </h1>

            <p>
              Here's a quick look at your productivity and priority items today.
            </p>
          </div>

          <div className="dashboard-header-actions">
            {/* NOTIFICATIONS */}
            <Link
              to="/tasks"
              className="notification-indicator"
              title="View tasks needing attention"
              aria-label="View tasks needing attention"
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

              {stats.overdue + stats.todayTasks > 0 && (
                <span className="notification-count">
                  {stats.overdue + stats.todayTasks}
                </span>
              )}
            </Link>

            {/* ADD TASK */}
            <Link
              to="/tasks"
              className="dashboard-add-button"
            >
              + Add Task
            </Link>
          </div>
        </header>

        {/* ERROR */}
        {error && (
          <p className="form-error task-page-error">
            {error}
          </p>
        )}

        {/* STATISTICS */}
        <section className="dashboard-stats">
          <div className="stat-card">
            <span>Active Tasks</span>
            <strong>
              {loading ? "—" : stats.activeTasks}
            </strong>
            <small>Tasks remaining</small>
          </div>

          <div className="stat-card">
            <span>Completed This Month</span>
            <strong>
              {loading ? "—" : stats.completedThisMonth}
            </strong>
            <small>Completed this month</small>
          </div>

          <div className="stat-card">
            <span>Due Today</span>
            <strong>
              {loading ? "—" : stats.todayTasks}
            </strong>
            <small>Needs attention</small>
          </div>

          <div className="stat-card">
            <span>Overdue</span>
            <strong className={stats.overdue > 0 ? "danger-number" : ""}>
              {loading ? "—" : stats.overdue}
            </strong>
            <small>Needs attention</small>
          </div>
        </section>

        {/* TODAY'S FOCUS SECTION */}
        <section className="todays-focus-section">
          <div className="section-top">
            <div>
              <p className="dashboard-label">PRIORITY TARGETS</p>
              <h2>Today's Focus</h2>
            </div>
            <Link to="/tasks" className="focus-section-link">
              Go to My Tasks
            </Link>
          </div>

          {loading ? (
            <div className="dashboard-empty">
              Loading today's focus...
            </div>
          ) : todaysFocusTasks.length === 0 ? (
            <div className="focus-empty-card">
              <div className="focus-empty-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="focus-empty-text">
                <h3>All caught up for today</h3>
                <p>You have no overdue or pending tasks due today. Keep the momentum going or plan ahead.</p>
              </div>
              <Link to="/tasks" className="hero-secondary-button" style={{ padding: "8px 14px", fontSize: "13px" }}>
                Browse All Tasks
              </Link>
            </div>
          ) : (
            <div className="focus-task-list">
              {todaysFocusTasks.map((task) => {
                const dateStatus = getDateStatus(task.dueDate);
                return (
                  <div key={task._id} className="focus-task-card">
                    <button
                      type="button"
                      className="task-check"
                      onClick={() => handleToggleTask(task)}
                      aria-label="Mark task as completed"
                      title="Mark task as completed"
                    >
                      {task.status === "Completed" && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </button>

                    <div className="focus-task-content">
                      <div className="focus-task-title-row">
                        <h3>{task.title}</h3>
                        <span className={`priority-badge ${task.priority.toLowerCase()}`}>
                          {task.priority}
                        </span>
                      </div>

                      {task.description && (
                        <p className="focus-task-desc">{task.description}</p>
                      )}

                      <div className="focus-task-meta">
                        <span className="task-category">{task.category}</span>
                        <span className="task-due-date">
                          Due {formatDueDate(task.dueDate)}
                        </span>
                        <span
                          className={`task-date-status ${dateStatus
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          {dateStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* PRODUCTIVITY PROGRESS */}
        <section className="dashboard-progress">
          <div className="section-top">
            <div>
              <p className="dashboard-label">
                PROGRESS
              </p>

              <h2>
                Your productivity
              </h2>
            </div>

            <strong>
              {loading
                ? "—"
                : `${stats.progress}%`}
            </strong>
          </div>

          <div className="dashboard-progress-bar">
            <div
              className="dashboard-progress-fill"
              style={{
                width: `${stats.progress}%`,
              }}
            ></div>
          </div>

          <p className="progress-description">
            {loading
              ? "Loading your progress..."
              : stats.total === 0
              ? "Create your first task to start tracking progress."
              : `${stats.completed} of ${stats.total} tasks completed.`}
          </p>
        </section>

        {/* TASKS NEEDING ATTENTION */}
        <section className="attention-section">
          <div className="section-top">
            <div>
              <p className="dashboard-label">
                ATTENTION
              </p>

              <h2>
                Tasks needing attention
              </h2>
            </div>

            <Link to="/tasks">
              View all
            </Link>
          </div>

          {loading ? (
            <div className="dashboard-empty">
              Loading...
            </div>
          ) : attentionTasks.length === 0 ? (
            <div className="attention-empty">
              <span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </span>

              <div>
                <h3>
                  You're all caught up
                </h3>

                <p>
                  No overdue or upcoming tasks need
                  your attention.
                </p>
              </div>
            </div>
          ) : (
            <div className="attention-list">
              {attentionTasks.map((task) => {
                const dateStatus =
                  getDateStatus(task.dueDate);

                return (
                  <div
                    className="attention-task"
                    key={task._id}
                  >
                    <div className="attention-task-info">
                      <h3>
                        {task.title}
                      </h3>

                      <p>
                        {task.category} · Due{" "}
                        {formatDueDate(task.dueDate)}
                      </p>
                    </div>

                    <span
                      className={`date-status ${dateStatus
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {dateStatus}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* RECENT TASKS */}
        <section className="recent-tasks">
          <div className="section-top">
            <div>
              <p className="dashboard-label">
                TASKS
              </p>

              <h2>
                Recent tasks
              </h2>
            </div>

            <Link to="/tasks">
              View all
            </Link>
          </div>

          {loading ? (
            <div className="dashboard-empty">
              Loading your tasks...
            </div>
          ) : recentTasks.length === 0 ? (
            <div className="dashboard-empty">
              <h3>
                No tasks yet
              </h3>

              <p>
                Create your first task to see it here.
              </p>

              <Link
                to="/tasks"
                className="dashboard-add-button"
              >
                Create Task
              </Link>
            </div>
          ) : (
            <div className="task-preview-list">
              {recentTasks.map((task) => {
                const dateStatus =
                  getDateStatus(task.dueDate);

                return (
                  <div
                    className={
                      task.status === "Completed"
                        ? "task-preview completed"
                        : "task-preview"
                    }
                    key={task._id}
                  >
                    {/* CHECK */}
                    <button
                      type="button"
                      className="task-preview-check"
                      onClick={() => handleToggleTask(task)}
                      aria-label="Toggle task status"
                      style={{ cursor: "pointer", background: "transparent", border: "1px solid var(--border-color)" }}
                    >
                      {task.status === "Completed"
                        ? "✓"
                        : ""}
                    </button>

                    {/* TASK INFORMATION */}
                    <div className="task-preview-content">
                      <h3>
                        {task.title}
                      </h3>

                      <p>
                        {task.category} ·{" "}
                        {task.status === "Completed"
                          ? "Completed"
                          : dateStatus}
                      </p>
                    </div>

                    {/* PRIORITY */}
                    <span
                      className={`priority-badge ${task.priority.toLowerCase()}`}
                    >
                      {task.priority}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;