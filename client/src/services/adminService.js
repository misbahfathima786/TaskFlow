import { API_BASE_URL, getAuthToken, getAuthHeaders } from "./apiConfig";

const ADMIN_URL = `${API_BASE_URL}/admin`;
const ANALYTICS_URL = `${API_BASE_URL}/analytics`;

export const getAdminOverview = async () => {
  const response = await fetch(`${ADMIN_URL}/overview`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch admin overview.");
  }

  return data.overview;
};

export const getAdminUsers = async ({ page = 1, limit = 10, search = "" } = {}) => {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    search,
  });

  const response = await fetch(`${ADMIN_URL}/users?${query.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch users.");
  }

  return data;
};

export const updateUserStatus = async (id, isDeactivated) => {
  const response = await fetch(`${ADMIN_URL}/users/${id}/status`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ isDeactivated }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update user status.");
  }

  return data;
};

export const updateUserRole = async (id, role) => {
  const response = await fetch(`${ADMIN_URL}/users/${id}/role`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ role }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update user role.");
  }

  return data;
};

export const getAdminActivityTrends = async () => {
  const response = await fetch(`${ADMIN_URL}/activity-trends`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch activity trends.");
  }

  return data.trends;
};

export const getVisitorAnalytics = async () => {
  const response = await fetch(`${ANALYTICS_URL}/stats`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch visitor analytics.");
  }

  return data.visitorAnalytics;
};
