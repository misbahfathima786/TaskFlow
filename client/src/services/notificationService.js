import { API_BASE_URL, getAuthToken, getAuthHeaders } from "./apiConfig";

const NOTIF_URL = `${API_BASE_URL}/notifications`;

export const getNotifications = async () => {
  const response = await fetch(NOTIF_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch notifications.");
  }

  return data;
};

export const getUnreadCount = async () => {
  const response = await fetch(`${NOTIF_URL}/count`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch unread count.");
  }

  return data.unreadCount;
};

export const markNotificationAsRead = async (id) => {
  const response = await fetch(`${NOTIF_URL}/${id}/read`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to mark notification as read.");
  }

  return data.notification;
};

export const markAllNotificationsAsRead = async () => {
  const response = await fetch(`${NOTIF_URL}/read-all`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to mark all as read.");
  }

  return data;
};

export const deleteNotification = async (id) => {
  const response = await fetch(`${NOTIF_URL}/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to delete notification.");
  }

  return data;
};

export const clearReadNotifications = async () => {
  const response = await fetch(`${NOTIF_URL}/clear-read`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to clear read notifications.");
  }

  return data;
};
