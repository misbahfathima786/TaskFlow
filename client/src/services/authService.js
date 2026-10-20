import { API_BASE_URL, getAuthToken, getAuthHeaders } from "./apiConfig";

const AUTH_URL = `${API_BASE_URL}/auth`;

// GET CURRENT USER PROFILE
export const getUserProfile = async () => {
  const response = await fetch(`${AUTH_URL}/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch user profile.");
  }

  return data.user;
};

// LOGIN WITH GOOGLE ID TOKEN
export const loginWithGoogle = async (credential) => {
  const response = await fetch(`${AUTH_URL}/google`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ credential }),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || "Google authentication failed.");
    error.status = response.status;
    error.requiresLinking = data.requiresLinking;
    error.email = data.email;
    error.notConfigured = data.notConfigured;
    throw error;
  }

  return data;
};

// LINK GOOGLE ACCOUNT TO EXISTING LOCAL ACCOUNT
export const linkGoogleAccount = async (credential, password) => {
  const response = await fetch(`${AUTH_URL}/google/link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ credential, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to link Google account.");
  }

  return data;
};

// UPDATE PROFILE NAME
export const updateProfile = async (profileData) => {
  const response = await fetch(`${AUTH_URL}/profile`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(profileData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update profile.");
  }

  return data.user;
};

// CHANGE PASSWORD
export const changePassword = async (passwordData) => {
  const response = await fetch(`${AUTH_URL}/change-password`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(passwordData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to change password.");
  }

  return data;
};

// UPDATE EMAIL (Requires password verification)
export const updateEmail = async ({ newEmail, password }) => {
  const response = await fetch(`${AUTH_URL}/email`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ newEmail, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update email.");
  }

  return data.user;
};

// UPLOAD / UPDATE PROFILE AVATAR
export const uploadProfileAvatar = async (avatar) => {
  const response = await fetch(`${AUTH_URL}/profile/avatar`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ avatar }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update profile picture.");
  }

  return data.user;
};

// REMOVE PROFILE AVATAR
export const removeProfileAvatar = async () => {
  const response = await fetch(`${AUTH_URL}/profile/avatar`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to remove profile picture.");
  }

  return data.user;
};

// GET EMAIL LOGIN HISTORY
export const getLoginHistory = async () => {
  const response = await fetch(`${AUTH_URL}/login-history`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch login history.");
  }

  return data.loginHistory;
};
