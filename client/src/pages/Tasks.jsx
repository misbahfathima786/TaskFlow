import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import TaskCard from "../components/TaskCard";
import TaskForm from "../components/TaskForm";
import { parseNaturalLanguageTask } from "../utils/nlpParser";

import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../services/taskService";

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [searchParams] = useSearchParams();

  const categoryFromUrl = searchParams.get("category");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(
    categoryFromUrl || "All"
  );
  const [status, setStatus] = useState("All");

  // View toggle: 'list' | 'board'
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem("taskflow_view_mode") || "list";
  });

  // Smart natural language task input state
  const [smartInput, setSmartInput] = useState("");
  const [showSmartInput, setShowSmartInput] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  const [prevCategoryFromUrl, setPrevCategoryFromUrl] = useState(categoryFromUrl);

  if (categoryFromUrl !== prevCategoryFromUrl) {
    setPrevCategoryFromUrl(categoryFromUrl);
    setCategory(categoryFromUrl || "All");
  }

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

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem("taskflow_view_mode", mode);
  };

  const handleCreateTask = async (formData) => {
    try {
      setFormLoading(true);
      setError("");

      const newTask = await createTask(formData);

      setTasks((previousTasks) => [
        newTask,
        ...previousTasks,
      ]);

      setShowForm(false);
      setEditingTask(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateTask = async (formData) => {
    try {
      setFormLoading(true);
      setError("");

      const updatedTask = await updateTask(
        editingTask._id,
        formData
      );

      setTasks((previousTasks) =>
        previousTasks.map((task) =>
          task._id === updatedTask._id
            ? updatedTask
            : task
        )
      );

      setEditingTask(null);
      setShowForm(false);
    } catch (error) {
      setError(error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleTask = async (task) => {
    try {
      setError("");

      const targetStatus = task.status === "Completed" ? "Pending" : "Completed";

      const updatedTask = await updateTask(
        task._id,
        {
          status: targetStatus,
        }
      );

      setTasks((previousTasks) =>
        previousTasks.map((item) =>
          item._id === updatedTask._id
            ? updatedTask
            : item
        )
      );
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteTask(taskId);

      setTasks((previousTasks) =>
        previousTasks.filter(
          (task) => task._id !== taskId
        )
      );
    } catch (error) {
      setError(error.message);
    }
  };

  // CHECK TASK DATE STATUS
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

  // Natural language parsing of smart input
  const parsedSmartTask = useMemo(() => {
    if (!smartInput.trim()) return null;
    return parseNaturalLanguageTask(smartInput);
  }, [smartInput]);

  const handleQuickCreateSmartTask = async () => {
    if (!parsedSmartTask || !parsedSmartTask.title) return;
    try {
      setFormLoading(true);
      setError("");
      const newTask = await createTask({
        title: parsedSmartTask.title,
        description: "",
        priority: parsedSmartTask.priority,
        category: parsedSmartTask.category,
        dueDate: parsedSmartTask.dueDate || null,
      });

      setTasks((prev) => [newTask, ...prev]);
      setSmartInput("");
    } catch (err) {
      setError(err.message || "Failed to create task from smart input.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSmartTaskInForm = () => {
    if (!parsedSmartTask) return;
    setEditingTask({
      title: parsedSmartTask.title,
      description: "",
      priority: parsedSmartTask.priority,
      category: parsedSmartTask.category,
      dueDate: parsedSmartTask.dueDate || "",
    });
    setShowForm(true);
  };

  // FILTER AND SORT TASKS
  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      const matchesSearch =
        task.title
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        task.description
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesCategory =
        category === "All" ||
        task.category === category;

      // In board view, we show all statuses distributed across columns
      const matchesStatus =
        viewMode === "board"
          ? true
          : status === "All"
          ? task.status === "Pending"
          : task.status === status;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    });

    const datePriority = {
      Overdue: 1,
      Today: 2,
      Tomorrow: 3,
      Upcoming: 4,
      "No due date": 5,
    };

    return filtered.sort((a, b) => {
      const aDateStatus = getDateStatus(a.dueDate);
      const bDateStatus = getDateStatus(b.dueDate);

      return (
        datePriority[aDateStatus] -
        datePriority[bDateStatus]
      );
    });
  }, [tasks, search, category, status, viewMode]);

  const completedCount = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  const pendingCount = tasks.filter(
    (task) => task.status === "Pending"
  ).length;

  // Board columns
  const boardPendingTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.status === "Pending");
  }, [filteredTasks]);

  const boardCompletedTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.status === "Completed");
  }, [filteredTasks]);

  // Drag and Drop handlers for Kanban
  const handleDragStart = (event, taskId) => {
    event.dataTransfer.setData("text/plain", taskId);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleDropOnColumn = async (event, targetStatus) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/plain");
    if (!taskId) return;

    const task = tasks.find((t) => t._id === taskId);
    if (task && task.status !== targetStatus) {
      await handleToggleTask(task);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main tasks-main">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-label">
              TASK MANAGEMENT
            </p>

            <h1>My Tasks</h1>

            <p>
              Organize your work, prioritize milestones, and manage workflows.
            </p>
          </div>

          <div className="dashboard-header-actions">
            <button
              type="button"
              className={`smart-toggle-button ${showSmartInput ? "active" : ""}`}
              onClick={() => setShowSmartInput(!showSmartInput)}
              title="Toggle smart natural language task input"
            >
              <span className="smart-sparkle-icon">✨</span>
              <span>Smart Input</span>
            </button>

            <button
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

        {/* SUMMARY STATS */}
        <section className="task-summary">
          <div>
            <span>Total Tasks</span>
            <strong>{tasks.length}</strong>
          </div>

          <div>
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </div>

          <div>
            <span>Completed</span>
            <strong>{completedCount}</strong>
          </div>
        </section>

        {/* SMART NATURAL LANGUAGE INPUT BAR (PHASE 5) */}
        {showSmartInput && (
          <section className="smart-nlp-container">
            <div className="smart-nlp-card">
              <div className="smart-nlp-input-row">
                <span className="smart-sparkle-icon">✨</span>
                <input
                  type="text"
                  className="smart-nlp-input"
                  placeholder='Try: "Submit DBMS assignment tomorrow at 5pm high priority"'
                  value={smartInput}
                  onChange={(e) => setSmartInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && parsedSmartTask?.title) {
                      e.preventDefault();
                      handleQuickCreateSmartTask();
                    }
                  }}
                  autoFocus
                />
                {smartInput && (
                  <button
                    type="button"
                    className="smart-clear-btn"
                    onClick={() => setSmartInput("")}
                    aria-label="Clear smart input"
                  >
                    ×
                  </button>
                )}
              </div>

              {parsedSmartTask && parsedSmartTask.title && (
                <div className="smart-nlp-preview-bar">
                  <div className="smart-preview-chips">
                    <span className="smart-preview-title">
                      <strong>{parsedSmartTask.title}</strong>
                    </span>

                    {parsedSmartTask.dueDate && (
                      <span className="smart-chip date-chip">
                        📅 Due: {parsedSmartTask.dueDate}
                      </span>
                    )}

                    <span className={`priority-badge ${parsedSmartTask.priority.toLowerCase()}`}>
                      {parsedSmartTask.priority}
                    </span>

                    <span className="task-category">
                      {parsedSmartTask.category}
                    </span>
                  </div>

                  <div className="smart-preview-actions">
                    <button
                      type="button"
                      className="smart-create-button"
                      onClick={handleQuickCreateSmartTask}
                      disabled={formLoading}
                    >
                      {formLoading ? "Creating..." : "Create Task"}
                    </button>

                    <button
                      type="button"
                      className="smart-review-button"
                      onClick={handleEditSmartTaskInForm}
                    >
                      Review &amp; Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {error && (
          <p className="form-error task-page-error">
            {error}
          </p>
        )}

        {/* TOOLBAR: SEARCH, FILTERS & VIEW TOGGLE (PHASE 4) */}
        <section className="task-toolbar-container">
          <div className="task-toolbar">
            <input
              type="search"
              placeholder="Search tasks..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
            >
              <option value="All">All categories</option>
              <option value="College">College</option>
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
              <option value="Projects">Projects</option>
              <option value="Other">Other</option>
            </select>

            {viewMode === "list" && (
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
              >
                <option value="All">Pending tasks</option>
                <option value="Completed">Completed tasks</option>
              </select>
            )}
          </div>

          {/* VIEW TOGGLE [List] [Board] */}
          <div className="view-toggle-group">
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => handleSetViewMode("list")}
              aria-label="Switch to List view"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
              <span>List</span>
            </button>

            <button
              type="button"
              className={`view-toggle-btn ${viewMode === "board" ? "active" : ""}`}
              onClick={() => handleSetViewMode("board")}
              aria-label="Switch to Board view"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="18" rx="1.5"></rect>
                <rect x="14" y="3" width="7" height="18" rx="1.5"></rect>
              </svg>
              <span>Board</span>
            </button>
          </div>
        </section>

        {/* TASKS VIEW SECTION */}
        {viewMode === "list" ? (
          /* LIST VIEW */
          <section className="tasks-list-section">
            <div className="section-top">
              <div>
                <p className="dashboard-label">
                  YOUR WORKSPACE
                </p>

                <h2>
                  {filteredTasks.length}{" "}
                  {filteredTasks.length === 1
                    ? "task"
                    : "tasks"}
                </h2>
              </div>

              <Link to="/dashboard">
                Back to Dashboard
              </Link>
            </div>

            {loading ? (
              <div className="tasks-empty">
                <p>Loading your tasks...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="tasks-empty">
                <div className="empty-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>

                <h3>No tasks found</h3>

                <p>
                  {tasks.length === 0
                    ? "Create your first task to get started."
                    : "Try changing your search or filters."}
                </p>

                {tasks.length === 0 && (
                  <button
                    className="dashboard-add-button"
                    onClick={() => {
                      setEditingTask(null);
                      setShowForm(true);
                    }}
                  >
                    Create Your First Task
                  </button>
                )}
              </div>
            ) : (
              <div className="tasks-list">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onToggle={handleToggleTask}
                    onEdit={(selectedTask) => {
                      setEditingTask(selectedTask);
                      setShowForm(true);
                    }}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>
            )}
          </section>
        ) : (
          /* KANBAN BOARD VIEW (PHASE 4) */
          <section className="kanban-board-section">
            <div className="kanban-board">
              {/* PENDING COLUMN */}
              <div
                className="kanban-column"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnColumn(e, "Pending")}
              >
                <div className="kanban-column-header">
                  <div className="kanban-column-title">
                    <span className="kanban-status-dot pending"></span>
                    <h3>Pending</h3>
                  </div>
                  <span className="kanban-count-badge">
                    {boardPendingTasks.length}
                  </span>
                </div>

                <div className="kanban-cards-container">
                  {boardPendingTasks.length === 0 ? (
                    <div className="kanban-column-empty">
                      <p>No pending tasks</p>
                      <small>Drop completed tasks here to resume</small>
                    </div>
                  ) : (
                    boardPendingTasks.map((task) => {
                      const dateStatus = getDateStatus(task.dueDate);
                      return (
                        <div
                          key={task._id}
                          className="kanban-card"
                          draggable
                          onDragStart={(e) => handleDragStart(e, task._id)}
                        >
                          <div className="kanban-card-top">
                            <span className="task-category">{task.category}</span>
                            <span className={`priority-badge ${task.priority.toLowerCase()}`}>
                              {task.priority}
                            </span>
                          </div>

                          <h4 className="kanban-card-title">{task.title}</h4>

                          {task.description && (
                            <p className="kanban-card-desc">{task.description}</p>
                          )}

                          <div className="kanban-card-bottom">
                            <span className={`task-date-status ${dateStatus.toLowerCase().replace(" ", "-")}`}>
                              {dateStatus}
                            </span>

                            <div className="kanban-card-actions">
                              <button
                                type="button"
                                className="kanban-action-btn complete-btn"
                                onClick={() => handleToggleTask(task)}
                                title="Move to Completed"
                              >
                                ✓
                              </button>
                              <button
                                type="button"
                                className="kanban-action-btn"
                                onClick={() => {
                                  setEditingTask(task);
                                  setShowForm(true);
                                }}
                                title="Edit Task"
                              >
                                ✎
                              </button>
                              <button
                                type="button"
                                className="kanban-action-btn delete-btn"
                                onClick={() => handleDeleteTask(task._id)}
                                title="Delete Task"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* COMPLETED COLUMN */}
              <div
                className="kanban-column"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnColumn(e, "Completed")}
              >
                <div className="kanban-column-header">
                  <div className="kanban-column-title">
                    <span className="kanban-status-dot completed"></span>
                    <h3>Completed</h3>
                  </div>
                  <span className="kanban-count-badge">
                    {boardCompletedTasks.length}
                  </span>
                </div>

                <div className="kanban-cards-container">
                  {boardCompletedTasks.length === 0 ? (
                    <div className="kanban-column-empty">
                      <p>No completed tasks</p>
                      <small>Drop pending tasks here to mark complete</small>
                    </div>
                  ) : (
                    boardCompletedTasks.map((task) => (
                      <div
                        key={task._id}
                        className="kanban-card completed"
                        draggable
                        onDragStart={(e) => handleDragStart(e, task._id)}
                      >
                        <div className="kanban-card-top">
                          <span className="task-category">{task.category}</span>
                          <span className="priority-badge low">
                            Done
                          </span>
                        </div>

                        <h4 className="kanban-card-title">{task.title}</h4>

                        {task.description && (
                          <p className="kanban-card-desc">{task.description}</p>
                        )}

                        <div className="kanban-card-bottom">
                          <span className="task-date-status completed">
                            Completed
                          </span>

                          <div className="kanban-card-actions">
                            <button
                              type="button"
                              className="kanban-action-btn resume-btn"
                              onClick={() => handleToggleTask(task)}
                              title="Move back to Pending"
                            >
                              ↺
                            </button>
                            <button
                              type="button"
                              className="kanban-action-btn delete-btn"
                              onClick={() => handleDeleteTask(task._id)}
                              title="Delete Task"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {showForm && (
        <TaskForm
          task={editingTask}
          onSubmit={
            editingTask && editingTask._id
              ? handleUpdateTask
              : handleCreateTask
          }
          onClose={() => {
            setShowForm(false);
            setEditingTask(null);
          }}
          loading={formLoading}
        />
      )}
    </div>
  );
}

export default Tasks;
