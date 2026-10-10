import { useState } from "react";

const initialFormData = {
  title: "",
  description: "",
  priority: "Medium",
  category: "Other",
  dueDate: "",
};

function TaskForm({ task, onSubmit, onClose, loading }) {
  const [prevTask, setPrevTask] = useState(task);
  const [formData, setFormData] = useState(() => {
    if (task) {
      return {
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "Medium",
        category: task.category || "Other",
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
      };
    }
    return initialFormData;
  });

  if (task !== prevTask) {
    setPrevTask(task);
    setFormData(
      task
        ? {
            title: task.title || "",
            description: task.description || "",
            priority: task.priority || "Medium",
            category: task.category || "Other",
            dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
          }
        : initialFormData
    );
  }

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit(formData);
  };

  return (
    <div className="task-modal-overlay">
      <div className="task-modal">
        <div className="task-modal-header">
          <div>
            <p className="dashboard-label">
              {task ? "UPDATE TASK" : "NEW TASK"}
            </p>

            <h2>
              {task ? "Edit task" : "Create a task"}
            </h2>
          </div>

          <button
            className="modal-close-button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form
          className="task-form"
          onSubmit={handleSubmit}
        >
          <div className="form-group">
            <label htmlFor="task-title">
              Task title
            </label>

            <input
              type="text"
              id="task-title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="What needs to be done?"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="task-description">
              Description
            </label>

            <textarea
              id="task-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add some details..."
              rows="4"
            />
          </div>

          <div className="task-form-row">
            <div className="form-group">
              <label htmlFor="task-priority">
                Priority
              </label>

              <select
                id="task-priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="task-category">
                Category
              </label>

              <select
                id="task-category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="College">College</option>
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
                <option value="Projects">Projects</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="task-due-date">
              Due date
            </label>

            <input
              type="date"
              id="task-due-date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
            />
          </div>

          <div className="task-form-actions">
            <button
              type="button"
              className="task-cancel-button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="task-save-button"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : task
                ? "Update Task"
                : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskForm;