function TaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
}) {
  const isCompleted = task.status === "Completed";

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

  const formattedDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString(
        "en-IN",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        }
      )
    : "No due date";

  const dateStatus = getDateStatus(task.dueDate);

  return (
    <article
      className={
        isCompleted
          ? "task-card completed"
          : dateStatus === "Overdue"
          ? "task-card overdue"
          : "task-card"
      }
    >
      <div className="task-card-main">
        <button
          type="button"
          className={
            isCompleted
              ? "task-check checked"
              : "task-check"
          }
          onClick={() => onToggle(task)}
          aria-label={
            isCompleted
              ? "Mark as pending"
              : "Mark as completed"
          }
          title={
            isCompleted
              ? "Mark as pending"
              : "Mark as completed"
          }
        >
          {isCompleted && (
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

        <div className="task-content">
          <h3>{task.title}</h3>

          {task.description && (
            <p className="task-description">
              {task.description}
            </p>
          )}

          <div className="task-meta">
            <span className="task-category">
              {task.category}
            </span>

            <span className="task-due-date">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ verticalAlign: "middle", marginRight: "4px", opacity: 0.7 }}
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Due {formattedDate}
            </span>

            {!isCompleted && (
              <span
                className={`task-date-status ${dateStatus
                  .toLowerCase()
                  .replace(" ", "-")}`}
              >
                {dateStatus}
              </span>
            )}

            <span
              className={`task-priority ${task.priority.toLowerCase()}`}
            >
              {task.priority}
            </span>
          </div>
        </div>
      </div>

      <div className="task-actions">
        <button
          type="button"
          onClick={() => onEdit(task)}
          aria-label={`Edit ${task.title}`}
        >
          Edit
        </button>

        <button
          type="button"
          className="delete-task-button"
          onClick={() => onDelete(task._id)}
          aria-label={`Delete ${task.title}`}
        >
          Delete
        </button>
      </div>
    </article>
  );
}

export default TaskCard;