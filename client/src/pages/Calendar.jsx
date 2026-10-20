import { useState, useEffect, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import TaskForm from "../components/TaskForm";
import { getTasks, createTask, updateTask } from "../services/taskService";

// Helper: Convert Date to local YYYY-MM-DD string without UTC offset issues
const toLocalDateKey = (d) => {
  if (!d) return "";
  const dateObj = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return "";
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function Calendar() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 'month' | 'week'
  const [viewMode, setViewMode] = useState("month");

  // Selected reference date (defaults to today)
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Task form modal states
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Unscheduled tasks toggle
  const [showUnscheduled, setShowUnscheduled] = useState(false);

  // Fetch tasks on mount
  useEffect(() => {
    let active = true;

    getTasks()
      .then((data) => {
        if (active) {
          setTasks(data || []);
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

  // Today key for comparison
  const todayKey = useMemo(() => toLocalDateKey(new Date()), []);

  // Group tasks by local YYYY-MM-DD
  const tasksByDate = useMemo(() => {
    const map = new Map();
    tasks.forEach((task) => {
      if (task.dueDate) {
        const key = toLocalDateKey(task.dueDate);
        if (key) {
          if (!map.has(key)) map.set(key, []);
          map.get(key).push(task);
        }
      }
    });
    return map;
  }, [tasks]);

  // Unscheduled tasks (tasks with no due date)
  const unscheduledTasks = useMemo(() => {
    return tasks.filter((t) => !t.dueDate);
  }, [tasks]);

  // NAVIGATION HANDLERS
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === "month") {
        next.setMonth(next.getMonth() - 1);
      } else {
        next.setDate(next.getDate() - 7);
      }
      return next;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === "month") {
        next.setMonth(next.getMonth() + 1);
      } else {
        next.setDate(next.getDate() + 7);
      }
      return next;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // OPEN MODAL FOR SPECIFIC DATE
  const handleDayClick = (dateKey) => {
    setEditingTask({
      title: "",
      description: "",
      priority: "Medium",
      category: "Other",
      dueDate: dateKey,
    });
    setShowForm(true);
  };

  // OPEN MODAL TO EDIT EXISTING TASK
  const handleTaskClick = (e, task) => {
    e.stopPropagation();
    setEditingTask(task);
    setShowForm(true);
  };

  // CREATE OR UPDATE TASK
  const handleFormSubmit = async (formData) => {
    try {
      setFormLoading(true);
      setError("");

      if (editingTask && editingTask._id) {
        // Updating existing task
        const updated = await updateTask(editingTask._id, formData);
        setTasks((prev) =>
          prev.map((t) => (t._id === updated._id ? updated : t))
        );
      } else {
        // Creating new task
        const created = await createTask(formData);
        setTasks((prev) => [created, ...prev]);
      }

      setShowForm(false);
      setEditingTask(null);
    } catch (err) {
      setError(err.message || "Failed to save task.");
    } finally {
      setFormLoading(false);
    }
  };

  // QUICK COMPLETE / REOPEN TOGGLE
  const handleToggleTask = async (e, task) => {
    e.stopPropagation();
    try {
      const targetStatus = task.status === "Completed" ? "Pending" : "Completed";
      const updated = await updateTask(task._id, { status: targetStatus });
      setTasks((prev) =>
        prev.map((t) => (t._id === updated._id ? updated : t))
      );
    } catch (err) {
      setError(err.message || "Failed to update task.");
    }
  };

  // MONTH VIEW CALCULATION
  const monthData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Trailing days from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      days.push({
        date: d,
        dateKey: toLocalDateKey(d),
        isCurrentMonth: false,
      });
    }

    // Days of current month
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateObj = new Date(year, month, d);
      days.push({
        date: dateObj,
        dateKey: toLocalDateKey(dateObj),
        isCurrentMonth: true,
      });
    }

    // Leading days from next month to fill complete grid (up to 35 or 42 cells)
    const totalCells = days.length <= 35 ? 35 : 42;
    const remaining = totalCells - days.length;
    for (let d = 1; d <= remaining; d++) {
      const dateObj = new Date(year, month + 1, d);
      days.push({
        date: dateObj,
        dateKey: toLocalDateKey(dateObj),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  // WEEK VIEW CALCULATION
  const weekData = useMemo(() => {
    const curr = new Date(currentDate);
    const day = curr.getDay(); // 0 = Sun
    const firstDayOfWeek = new Date(curr);
    firstDayOfWeek.setDate(curr.getDate() - day);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(firstDayOfWeek);
      d.setDate(firstDayOfWeek.getDate() + i);
      weekDays.push({
        date: d,
        dateKey: toLocalDateKey(d),
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        monthDay: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      });
    }
    return weekDays;
  }, [currentDate]);

  // MONTH / YEAR DISPLAY HEADER
  const formattedHeaderTitle = useMemo(() => {
    if (viewMode === "month") {
      return currentDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }
    // Week view range
    const start = weekData[0].date;
    const end = weekData[6].date;
    return `${start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} – ${end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  }, [currentDate, viewMode, weekData]);

  const weekDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main calendar-main">
        {/* CALENDAR HEADER */}
        <header className="dashboard-header calendar-header">
          <div>
            <p className="dashboard-label">PLANNING & SCHEDULE</p>
            <h1>Calendar</h1>
            <p>Track deadlines and plan your schedule across months and weeks.</p>
          </div>

          <div className="calendar-top-actions">
            {/* VIEW TOGGLE */}
            <div className="view-toggle-group">
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === "month" ? "active" : ""}`}
                onClick={() => setViewMode("month")}
              >
                Month
              </button>
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === "week" ? "active" : ""}`}
                onClick={() => setViewMode("week")}
              >
                Week
              </button>
            </div>

            {/* NEW TASK BUTTON */}
            <button
              type="button"
              className="dashboard-add-button"
              onClick={() => {
                setEditingTask(null);
                setShowForm(true);
              }}
            >
              + Add Task
            </button>
          </div>
        </header>

        {error && (
          <div className="alert-box error" style={{ margin: "0 0 20px 0" }}>
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}>✕</button>
          </div>
        )}

        {/* CALENDAR TOOLBAR */}
        <div className="calendar-toolbar">
          <div className="calendar-nav-controls">
            <button
              type="button"
              className="calendar-btn-nav"
              onClick={handlePrev}
              title="Previous"
              aria-label="Previous"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <button
              type="button"
              className="calendar-btn-today"
              onClick={handleToday}
            >
              Today
            </button>

            <button
              type="button"
              className="calendar-btn-nav"
              onClick={handleNext}
              title="Next"
              aria-label="Next"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>

            <h2 className="calendar-current-title">{formattedHeaderTitle}</h2>
          </div>

          <div className="calendar-aux-controls">
            <button
              type="button"
              className={`calendar-unscheduled-toggle ${showUnscheduled ? "active" : ""}`}
              onClick={() => setShowUnscheduled(!showUnscheduled)}
            >
              Unscheduled Tasks ({unscheduledTasks.length})
            </button>
          </div>
        </div>

        {/* LOADING INDICATOR */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your calendar...</p>
          </div>
        ) : (
          <div className="calendar-body-layout">
            {/* MAIN CALENDAR GRID */}
            <div className="calendar-grid-container">
              {viewMode === "month" ? (
                /* ==================== MONTH VIEW ==================== */
                <div className="calendar-month-grid">
                  {/* WEEKDAY HEADERS */}
                  <div className="calendar-weekday-row">
                    {weekDayNames.map((dayName) => (
                      <div key={dayName} className="calendar-weekday-cell">
                        {dayName}
                      </div>
                    ))}
                  </div>

                  {/* DAYS GRID */}
                  <div className="calendar-days-grid">
                    {monthData.map(({ date, dateKey, isCurrentMonth }) => {
                      const dayTasks = tasksByDate.get(dateKey) || [];
                      const isToday = dateKey === todayKey;

                      return (
                        <div
                          key={dateKey}
                          className={`calendar-day-cell ${
                            !isCurrentMonth ? "day-other-month" : ""
                          } ${isToday ? "day-today" : ""}`}
                          onClick={() => handleDayClick(dateKey)}
                        >
                          <div className="calendar-day-header">
                            <span className={`day-number ${isToday ? "today-badge" : ""}`}>
                              {date.getDate()}
                            </span>
                            {dayTasks.length > 0 && (
                              <span className="day-count-badge">
                                {dayTasks.length}
                              </span>
                            )}
                          </div>

                          <div className="calendar-day-tasks">
                            {dayTasks.slice(0, 3).map((task) => {
                              const isCompleted = task.status === "Completed";
                              const isOverdue =
                                !isCompleted && dateKey < todayKey;

                              return (
                                <div
                                  key={task._id}
                                  className={`calendar-task-chip priority-${(
                                    task.priority || "medium"
                                  ).toLowerCase()} ${
                                    isCompleted ? "task-completed" : ""
                                  } ${isOverdue ? "task-overdue" : ""}`}
                                  onClick={(e) => handleTaskClick(e, task)}
                                  title={`${task.title} (${task.priority})`}
                                >
                                  <span
                                    className="task-status-indicator"
                                    onClick={(e) => handleToggleTask(e, task)}
                                  >
                                    {isCompleted ? "✓" : "○"}
                                  </span>
                                  <span className="task-title-text">
                                    {task.title}
                                  </span>
                                </div>
                              );
                            })}

                            {dayTasks.length > 3 && (
                              <div className="calendar-more-tasks">
                                +{dayTasks.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* ==================== WEEK VIEW ==================== */
                <div className="calendar-week-grid">
                  {weekData.map(({ date, dateKey, dayName, monthDay }) => {
                    const dayTasks = tasksByDate.get(dateKey) || [];
                    const isToday = dateKey === todayKey;

                    return (
                      <div
                        key={dateKey}
                        className={`calendar-week-column ${
                          isToday ? "week-today" : ""
                        }`}
                      >
                        <div
                          className="calendar-week-column-header"
                          onClick={() => handleDayClick(dateKey)}
                        >
                          <span className="week-day-name">{dayName}</span>
                          <span
                            className={`week-day-number ${
                              isToday ? "today-badge" : ""
                            }`}
                          >
                            {date.getDate()}
                          </span>
                          <span className="week-month-day">{monthDay}</span>
                        </div>

                        <div className="calendar-week-column-body">
                          {dayTasks.length === 0 ? (
                            <div
                              className="week-empty-slot"
                              onClick={() => handleDayClick(dateKey)}
                            >
                              <span>+ Add task</span>
                            </div>
                          ) : (
                            dayTasks.map((task) => {
                              const isCompleted = task.status === "Completed";
                              const isOverdue =
                                !isCompleted && dateKey < todayKey;

                              return (
                                <div
                                  key={task._id}
                                  className={`week-task-card priority-${(
                                    task.priority || "medium"
                                  ).toLowerCase()} ${
                                    isCompleted ? "task-completed" : ""
                                  } ${isOverdue ? "task-overdue" : ""}`}
                                  onClick={(e) => handleTaskClick(e, task)}
                                >
                                  <div className="week-task-header">
                                    <button
                                      type="button"
                                      className={`task-checkbox ${
                                        isCompleted ? "checked" : ""
                                      }`}
                                      onClick={(e) => handleToggleTask(e, task)}
                                      title={
                                        isCompleted
                                          ? "Reopen task"
                                          : "Mark completed"
                                      }
                                    >
                                      {isCompleted && "✓"}
                                    </button>
                                    <span className="week-task-title">
                                      {task.title}
                                    </span>
                                  </div>

                                  <div className="week-task-meta">
                                    <span className="meta-badge category">
                                      {task.category}
                                    </span>
                                    <span
                                      className={`meta-badge priority priority-${(
                                        task.priority || "medium"
                                      ).toLowerCase()}`}
                                    >
                                      {task.priority}
                                    </span>
                                    {isOverdue && (
                                      <span className="meta-badge overdue">
                                        Overdue
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* UNSCHEDULED TASKS DRAWER / SIDE PANEL */}
            {showUnscheduled && (
              <aside className="calendar-unscheduled-drawer">
                <div className="drawer-header">
                  <h3>Unscheduled Tasks ({unscheduledTasks.length})</h3>
                  <button
                    type="button"
                    className="drawer-close-btn"
                    onClick={() => setShowUnscheduled(false)}
                  >
                    ✕
                  </button>
                </div>
                <p className="drawer-sub">
                  Tasks without a due date. Click to assign a deadline.
                </p>

                <div className="unscheduled-list">
                  {unscheduledTasks.length === 0 ? (
                    <div className="empty-state-mini">
                      <p>All tasks have due dates!</p>
                    </div>
                  ) : (
                    unscheduledTasks.map((task) => (
                      <div
                        key={task._id}
                        className="unscheduled-task-card"
                        onClick={(e) => handleTaskClick(e, task)}
                      >
                        <div className="card-top">
                          <span className="unscheduled-title">{task.title}</span>
                          <span
                            className={`badge-priority priority-${(
                              task.priority || "medium"
                            ).toLowerCase()}`}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <div className="card-bottom">
                          <span className="category-tag">{task.category}</span>
                          <button
                            type="button"
                            className="btn-set-date"
                            onClick={(e) => handleTaskClick(e, task)}
                          >
                            Set date →
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </aside>
            )}
          </div>
        )}

        {/* TASK CREATION & EDIT MODAL */}
        {showForm && (
          <TaskForm
            task={editingTask}
            onSubmit={handleFormSubmit}
            onClose={() => {
              setShowForm(false);
              setEditingTask(null);
            }}
            loading={formLoading}
          />
        )}
      </main>
    </div>
  );
}

export default Calendar;
