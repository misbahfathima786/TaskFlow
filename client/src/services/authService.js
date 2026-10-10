const API_URL = "http://localhost:5000/api/auth";

const getToken = () => {
  return localStorage.getItem("token");
};

// GET CURRENT USER PROFILE
export const getUserProfile = async () => {
  const response = await fetch(`${API_URL}/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch user profile.");
  }

  return data.user;
};

// UPDATE PROFILE NAME
export const updateProfile = async (profileData) => {
  const response = await fetch(`${API_URL}/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
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
  const response = await fetch(`${API_URL}/change-password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
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
  const response = await fetch(`${API_URL}/email`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
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
  const response = await fetch(`${API_URL}/profile/avatar`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
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
  const response = await fetch(`${API_URL}/profile/avatar`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${getToken()}`,
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
  const response = await fetch(`${API_URL}/login-history`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch login history.");
  }

  return data.loginHistory;
};

