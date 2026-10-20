import { API_BASE_URL, getAuthToken, getAuthHeaders } from "./apiConfig";

const API_URL = `${API_BASE_URL}/tasks`;

// GET ALL TASKS
export const getTasks = async () => {
  const response = await fetch(API_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch tasks.");
  }

  return data.tasks;
};

// GET COMPLETED TASKS
export const getCompletedTasks = async () => {
  const response = await fetch(`${API_URL}/completed`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch completed tasks.");
  }

  return data.tasks;
};

// CREATE TASK
export const createTask = async (taskData) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(taskData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create task.");
  }

  return data.task;
};

// UPDATE TASK
export const updateTask = async (taskId, taskData) => {
  const response = await fetch(`${API_URL}/${taskId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(taskData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update task.");
  }

  return data.task;
};

// DELETE TASK
export const deleteTask = async (taskId) => {
  const response = await fetch(`${API_URL}/${taskId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete task.");
  }

  return data;
};

// GET PRODUCTIVITY ANALYTICS (REAL MONGODB DATA ONLY)
export const getAnalytics = async () => {
  const response = await fetch(`${API_URL}/analytics`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch analytics.");
  }

  return data.analytics;
};