import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import TaskCard from "../components/TaskCard";
import {
  getCompletedTasks,
  updateTask,
  deleteTask,
} from "../services/taskService";

function CompletedTasks() {
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getCompletedTasks()
      .then((tasks) => {
        if (active) {
          setCompletedTasks(tasks);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Failed to load completed tasks.");
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleToggleTask = async (task) => {
    try {
      setError("");

      await updateTask(task._id, {
        status: "Pending",
      });

      // Remove it from completed tasks view
      setCompletedTasks((previousTasks) =>
        previousTasks.filter((item) => item._id !== task._id)
      );
    } catch (err) {
      setError(err.message || "Failed to update task.");
    }
  };

  const handleDeleteTask = async (taskId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this completed task?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteTask(taskId);

      setCompletedTasks((previousTasks) =>
        previousTasks.filter((task) => task._id !== taskId)
      );
    } catch (err) {
      setError(err.message || "Failed to delete task.");
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main tasks-main">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-label">
              ARCHIVE &amp; HISTORY
            </p>

            <h1>Completed Tasks</h1>

            <p>
              Review all finished tasks, milestones accomplished, and historical work.
            </p>
          </div>

          <div className="dashboard-header-actions">
            <Link
              to="/tasks"
              className="dashboard-add-button"
            >
              Back to My Tasks
            </Link>
          </div>
        </header>

        {error && (
          <p className="form-error task-page-error">
            {error}
          </p>
        )}

        <section className="task-summary">
          <div>
            <span>Completed Count</span>
            <strong>{completedTasks.length}</strong>
          </div>
        </section>

        <section className="tasks-list-section">
          <div className="section-top">
            <div>
              <p className="dashboard-label">
                FINISHED WORK
              </p>

              <h2>
                {completedTasks.length}{" "}
                {completedTasks.length === 1
                  ? "task"
                  : "tasks"}
              </h2>
            </div>

            <Link to="/tasks">
              View Active Tasks
            </Link>
          </div>

          {loading ? (
            <div className="tasks-empty">
              <p>Loading completed tasks...</p>
            </div>
          ) : completedTasks.length === 0 ? (
            <div className="tasks-empty">
              <div className="empty-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>

              <h3>No completed tasks yet</h3>

              <p>
                Tasks you mark as done in My Tasks will be archived here.
              </p>

              <Link
                to="/tasks"
                className="dashboard-add-button"
              >
                Go to My Tasks
              </Link>
            </div>
          ) : (
            <div className="tasks-list">
              {completedTasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onToggle={handleToggleTask}
                  onEdit={() => {}}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default CompletedTasks;