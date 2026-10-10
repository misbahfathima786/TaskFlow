import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import {
  getUserProfile,
  updateProfile,
  updateEmail,
  uploadProfileAvatar,
  removeProfileAvatar,
  changePassword,
} from "../services/authService";

function Profile() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  // Profile Picture State
  const fileInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarSuccess, setAvatarSuccess] = useState("");

  // Personal Information / Edit Name State
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || "");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState("");

  // Edit Email State (requires re-authentication)
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState(user?.email || "");
  const [emailPassword, setEmailPassword] = useState("");
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");

  // Change Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Sync latest user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const freshUser = await getUserProfile();
        setUser(freshUser);
        setNameInput(freshUser.name || "");
        setEmailInput(freshUser.email || "");
        localStorage.setItem("user", JSON.stringify(freshUser));
      } catch (err) {
        console.warn("Could not sync profile from server:", err.message);
      }
    };

    fetchProfile();
  }, []);

  // Handle Profile Picture Selection
  const handleFileSelect = (event) => {
    setAvatarError("");
    setAvatarSuccess("");
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      setAvatarError(
        "Please select a valid image (JPEG, PNG, WebP, or GIF)."
      );
      return;
    }

    // 2MB maximum limit
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Image file size must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result);
    };
    reader.onerror = () => {
      setAvatarError("Failed to read image file.");
    };
    reader.readAsDataURL(file);

    event.target.value = "";
  };

  // Handle Save Profile Picture
  const handleSaveAvatar = async () => {
    if (!avatarPreview) return;

    try {
      setAvatarLoading(true);
      setAvatarError("");
      setAvatarSuccess("");

      const updatedUser = await uploadProfileAvatar(avatarPreview);
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setAvatarSuccess("Profile picture updated successfully.");
      setAvatarPreview(null);
    } catch (err) {
      setAvatarError(err.message || "Failed to update profile picture.");
    } finally {
      setAvatarLoading(false);
    }
  };

  // Handle Cancel Avatar Preview
  const handleCancelAvatarPreview = () => {
    setAvatarPreview(null);
    setAvatarError("");
  };

  // Handle Remove Profile Picture
  const handleRemoveAvatar = async () => {
    try {
      setAvatarLoading(true);
      setAvatarError("");
      setAvatarSuccess("");

      const updatedUser = await removeProfileAvatar();
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setAvatarSuccess("Profile picture removed successfully.");
      setAvatarPreview(null);
    } catch (err) {
      setAvatarError(err.message || "Failed to remove profile picture.");
    } finally {
      setAvatarLoading(false);
    }
  };

  // Handle Profile Name Update
  const handleUpdateName = async (event) => {
    event.preventDefault();
    setNameError("");
    setNameSuccess("");

    if (!nameInput.trim()) {
      setNameError("Name cannot be empty.");
      return;
    }

    try {
      setNameLoading(true);
      const updatedUser = await updateProfile({ name: nameInput.trim() });
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setNameSuccess("Name updated successfully.");
      setIsEditingName(false);
    } catch (err) {
      setNameError(err.message || "Failed to update profile name.");
    } finally {
      setNameLoading(false);
    }
  };

  // Handle Profile Email Update (with Password Verification)
  const handleUpdateEmail = async (event) => {
    event.preventDefault();
    setEmailError("");
    setEmailSuccess("");

    if (!emailInput.trim()) {
      setEmailError("Email address cannot be empty.");
      return;
    }

    if (!emailPassword) {
      setEmailError("Current password is required to verify email change.");
      return;
    }

    try {
      setEmailLoading(true);
      const updatedUser = await updateEmail({
        newEmail: emailInput.trim(),
        password: emailPassword,
      });

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setEmailSuccess(
        "Email updated successfully. Please use your new email for future logins."
      );
      setIsEditingEmail(false);
      setEmailPassword("");
    } catch (err) {
      setEmailError(err.message || "Failed to update email.");
    } finally {
      setEmailLoading(false);
    }
  };

  // Handle Password Input Change
  const handlePasswordInputChange = (event) => {
    const { name, value } = event.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPasswordError("");
    setPasswordSuccess("");
  };

  // Handle Change Password Submit
  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setPasswordError("All password fields are required.");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    try {
      setPasswordLoading(true);
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setPasswordSuccess("Password changed successfully.");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setPasswordError(err.message || "Failed to change password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main profile-main">
        {/* PROFILE HEADER */}
        <header className="dashboard-header">
          <div>
            <p className="dashboard-label">USER PROFILE</p>
            <h1>Profile</h1>
            <p>Manage your personal information, profile photo, and account security.</p>
          </div>

          <Link to="/dashboard" className="dashboard-add-button">
            Back to Dashboard
          </Link>
        </header>

        {/* PROFILE OVERVIEW CARD & PICTURE */}
        <section className="settings-section">
          <div className="profile-card">
            <div className="profile-avatar">
              {avatarPreview ? (
                <img src={avatarPreview} alt="New Preview" />
              ) : user?.avatar ? (
                <img src={user.avatar} alt={user?.name || "User"} />
              ) : (
                user?.name?.charAt(0).toUpperCase() || "U"
              )}
            </div>

            <div className="profile-info">
              <div>
                <span>Full name</span>
                <strong>{user?.name || "User"}</strong>
              </div>

              <div>
                <span>Email address</span>
                <strong>{user?.email || "No email available"}</strong>
              </div>
            </div>
          </div>

          {/* AVATAR UPLOAD / REMOVE OPTIONS */}
          <div
            className="settings-option"
            style={{ marginTop: "16px", paddingTop: "16px" }}
          >
            <div>
              <strong>Profile Picture</strong>
              <p>Upload a custom photo (JPEG, PNG, WebP, GIF up to 2MB).</p>
              {avatarError && (
                <p className="form-error" style={{ marginTop: "6px" }}>
                  {avatarError}
                </p>
              )}
              {avatarSuccess && (
                <p className="form-success" style={{ marginTop: "6px" }}>
                  {avatarSuccess}
                </p>
              )}
            </div>

            <div className="profile-avatar-actions">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />

              {avatarPreview ? (
                <>
                  <button
                    type="button"
                    className="avatar-upload-btn"
                    onClick={handleSaveAvatar}
                    disabled={avatarLoading}
                  >
                    {avatarLoading ? "Saving..." : "Save Picture"}
                  </button>
                  <button
                    type="button"
                    className="task-cancel-button"
                    onClick={handleCancelAvatarPreview}
                    disabled={avatarLoading}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="settings-edit-trigger"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarLoading}
                  >
                    {user?.avatar ? "Change Picture" : "Upload Picture"}
                  </button>

                  {user?.avatar && (
                    <button
                      type="button"
                      className="avatar-remove-btn"
                      onClick={handleRemoveAvatar}
                      disabled={avatarLoading}
                    >
                      {avatarLoading ? "Removing..." : "Remove Picture"}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* PERSONAL INFORMATION SECTION */}
        <section className="settings-section">
          <div className="settings-section-header">
            <p className="dashboard-label">PERSONAL DETAILS</p>
            <h2>Personal Information</h2>
            <p>Your name and registered email address.</p>
          </div>

          {/* EDIT NAME */}
          {!isEditingName ? (
            <div className="settings-option">
              <div>
                <strong>Display Name</strong>
                <p>{user?.name || "User"}</p>
              </div>

              <button
                type="button"
                className="settings-edit-trigger"
                onClick={() => {
                  setNameInput(user?.name || "");
                  setNameError("");
                  setNameSuccess("");
                  setIsEditingName(true);
                }}
              >
                Edit Name
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdateName} className="settings-form">
              <div className="form-group">
                <label htmlFor="profile-name-input">Full name</label>
                <input
                  type="text"
                  id="profile-name-input"
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value);
                    setNameError("");
                  }}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              {nameError && <p className="form-error">{nameError}</p>}

              <div className="settings-actions">
                <button
                  type="button"
                  className="task-cancel-button"
                  onClick={() => {
                    setIsEditingName(false);
                    setNameInput(user?.name || "");
                    setNameError("");
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="task-save-button"
                  disabled={nameLoading}
                >
                  {nameLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {nameSuccess && (
            <p className="form-success" style={{ marginTop: "14px" }}>
              {nameSuccess}
            </p>
          )}

          {/* EDIT EMAIL (Directly below Name-Editing section) */}
          {!isEditingEmail ? (
            <div className="settings-option">
              <div>
                <strong>Email Address</strong>
                <p>{user?.email || "No email available"}</p>
              </div>

              <button
                type="button"
                className="settings-edit-trigger"
                onClick={() => {
                  setEmailInput(user?.email || "");
                  setEmailPassword("");
                  setEmailError("");
                  setEmailSuccess("");
                  setIsEditingEmail(true);
                }}
              >
                Edit Email
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdateEmail} className="settings-form">
              <div className="form-group">
                <label htmlFor="profile-email-input">New email address</label>
                <input
                  type="email"
                  id="profile-email-input"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    setEmailError("");
                  }}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="profile-email-password">
                  Current password (verification required)
                </label>
                <div className="password-wrapper">
                  <input
                    type={showEmailPassword ? "text" : "password"}
                    id="profile-email-password"
                    value={emailPassword}
                    onChange={(e) => {
                      setEmailPassword(e.target.value);
                      setEmailError("");
                    }}
                    placeholder="Enter current password to verify"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowEmailPassword(!showEmailPassword)}
                  >
                    {showEmailPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {emailError && <p className="form-error">{emailError}</p>}

              <div className="settings-actions">
                <button
                  type="button"
                  className="task-cancel-button"
                  onClick={() => {
                    setIsEditingEmail(false);
                    setEmailInput(user?.email || "");
                    setEmailPassword("");
                    setEmailError("");
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="task-save-button"
                  disabled={emailLoading}
                >
                  {emailLoading ? "Updating..." : "Update Email"}
                </button>
              </div>
            </form>
          )}

          {emailSuccess && (
            <p className="form-success" style={{ marginTop: "14px" }}>
              {emailSuccess}
            </p>
          )}
        </section>

        {/* ACCOUNT SECURITY SECTION */}
        <section className="settings-section">
          <div className="settings-section-header">
            <p className="dashboard-label">ACCOUNT SECURITY</p>
            <h2>Change Password</h2>
            <p>Update your password to keep your account secure.</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="settings-form">
            <div className="form-group">
              <label htmlFor="profileCurrentPassword">Current password</label>
              <div className="password-wrapper">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  id="profileCurrentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordInputChange}
                  placeholder="Enter your current password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="profileNewPassword">New password</label>
              <div className="password-wrapper">
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="profileNewPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordInputChange}
                  placeholder="Create a new password (min. 6 characters)"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="profileConfirmPassword">Confirm new password</label>
              <div className="password-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="profileConfirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordInputChange}
                  placeholder="Confirm your new password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {passwordError && <p className="form-error">{passwordError}</p>}
            {passwordSuccess && (
              <p className="form-success">{passwordSuccess}</p>
            )}

            <div className="settings-actions">
              <button
                type="submit"
                className="task-save-button"
                disabled={passwordLoading}
              >
                {passwordLoading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

export default Profile;
