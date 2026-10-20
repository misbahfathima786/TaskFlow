import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { API_BASE_URL } from "../services/apiConfig";
import { loginWithGoogle, linkGoogleAccount } from "../services/authService";
import { trackPageView, trackEvent } from "../utils/analyticsTracker";

function Auth() {
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const initialIsRegister =
    location.pathname === "/register" ||
    searchParams.get("mode") === "register";

  const [isRegister, setIsRegister] = useState(initialIsRegister);

  // Sync state if user navigates via browser history or direct route
  useEffect(() => {
    const isReg =
      location.pathname === "/register" ||
      new URLSearchParams(location.search).get("mode") === "register";
    setIsRegister(isReg);
  }, [location.pathname, location.search]);

  // Login state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Register state
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerMessage, setRegisterMessage] = useState("");

  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Non-intrusive in-app Google setup banner state
  const [showGoogleSetupNotice, setShowGoogleSetupNotice] = useState(false);

  // Secure Account Linking State
  const [linkingState, setLinkingState] = useState({
    isOpen: false,
    credential: "",
    email: "",
    password: "",
    error: "",
    loading: false,
  });

  const googleLoginBtnRef = useRef(null);
  const googleRegisterBtnRef = useRef(null);

  useEffect(() => {
    trackPageView("/auth");
  }, []);

  // Initialize Google Identity Services
  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    const handleGoogleCallback = async (response) => {
      if (!response.credential) return;

      try {
        setGoogleLoading(true);
        setLoginError("");
        setRegisterError("");

        const result = await loginWithGoogle(response.credential);

        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));

        trackEvent("login_completed", { provider: "google" });
        navigate("/dashboard");
      } catch (err) {
        if (err.requiresLinking) {
          // Open secure account linking modal
          setLinkingState({
            isOpen: true,
            credential: response.credential,
            email: err.email || "",
            password: "",
            error: "",
            loading: false,
          });
        } else if (err.notConfigured) {
          setLoginError(
            "Google Sign-In is not configured on the server. Please set GOOGLE_CLIENT_ID in server/.env."
          );
        } else {
          setLoginError(err.message || "Google authentication failed.");
        }
      } finally {
        setGoogleLoading(false);
      }
    };

    if (
      googleClientId &&
      googleClientId !== "your-client-id.apps.googleusercontent.com"
    ) {
      const loadGoogleScript = () => {
        if (window.google?.accounts?.id) {
          try {
            window.google.accounts.id.initialize({
              client_id: googleClientId,
              callback: handleGoogleCallback,
              auto_select: false,
            });

            const btnWidth = Math.min(
              320,
              Math.max(240, window.innerWidth - 64)
            );

            if (googleLoginBtnRef.current) {
              googleLoginBtnRef.current.innerHTML = "";
              window.google.accounts.id.renderButton(googleLoginBtnRef.current, {
                theme: "outline",
                size: "large",
                width: btnWidth,
                text: "continue_with",
                shape: "rectangular",
              });
            }

            if (googleRegisterBtnRef.current) {
              googleRegisterBtnRef.current.innerHTML = "";
              window.google.accounts.id.renderButton(
                googleRegisterBtnRef.current,
                {
                  theme: "outline",
                  size: "large",
                  width: btnWidth,
                  text: "signup_with",
                  shape: "rectangular",
                }
              );
            }
          } catch (e) {
            console.warn("Google One Tap render notice:", e.message);
          }
        }
      };

      if (!window.google?.accounts?.id) {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = loadGoogleScript;
        script.onerror = () => {
          console.warn("Google Identity Services script failed to load.");
        };
        document.body.appendChild(script);
      } else {
        loadGoogleScript();
      }
    }
  }, [isRegister, navigate]);

  // Handle fallback click when Google Client ID is not yet configured in environment
  const handleUnconfiguredGoogleClick = () => {
    setShowGoogleSetupNotice((prev) => !prev);
  };

  /* =========================
     LOGIN
     ========================= */
  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setLoginError("");
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setLoginError("");

    try {
      setLoginLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.message || "Login failed.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      trackEvent("login_completed", { provider: "local" });
      navigate("/dashboard");
    } catch {
      setLoginError("Unable to connect to the server.");
    } finally {
      setLoginLoading(false);
    }
  };

  /* =========================
     REGISTER
     ========================= */
  const handleRegisterChange = (event) => {
    const { name, value } = event.target;
    setRegisterData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setRegisterError("");
    setRegisterMessage("");
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    setRegisterError("");
    setRegisterMessage("");

    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError("Passwords do not match.");
      return;
    }

    if (registerData.password.length < 6) {
      setRegisterError("Password must be at least 6 characters.");
      return;
    }

    try {
      setRegisterLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: registerData.name,
          email: registerData.email,
          password: registerData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setRegisterError(data.message || "Registration failed.");
        return;
      }

      trackEvent("signup_completed", { provider: "local" });

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/dashboard");
      } else {
        setRegisterMessage("Account created successfully! Please log in.");
        setIsRegister(false);
      }
    } catch {
      setRegisterError("Unable to connect to the server.");
    } finally {
      setRegisterLoading(false);
    }
  };

  /* =========================
     SECURE ACCOUNT LINKING
     ========================= */
  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    try {
      setLinkingState((prev) => ({ ...prev, loading: true, error: "" }));

      const result = await linkGoogleAccount(
        linkingState.credential,
        linkingState.password
      );

      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));

      setLinkingState({
        isOpen: false,
        credential: "",
        email: "",
        password: "",
        error: "",
        loading: false,
      });
      navigate("/dashboard");
    } catch (err) {
      setLinkingState((prev) => ({
        ...prev,
        error:
          err.message ||
          "Failed to link account. Please verify your password.",
        loading: false,
      }));
    }
  };

  const switchToRegister = () => {
    setIsRegister(true);
    setLoginError("");
    setRegisterError("");
    setRegisterMessage("");
    navigate("/register", { replace: true });
    trackEvent("signup_started");
  };

  const switchToLogin = () => {
    setIsRegister(false);
    setLoginError("");
    setRegisterError("");
    setRegisterMessage("");
    navigate("/login", { replace: true });
  };

  const hasConfiguredGoogle =
    Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID) &&
    import.meta.env.VITE_GOOGLE_CLIENT_ID !==
      "your-client-id.apps.googleusercontent.com";

  return (
    <div className="auth-page">
      <div className="auth-page-header">
        <Link to="/" className="auth-brand-logo">
          <span className="navbar-brand-mark">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </span>
          TaskFlow
        </Link>
        <p className="auth-page-sub">
          The Intelligent Productivity & Task Management Workspace
        </p>
      </div>

      {/* MOBILE SEGMENTED CONTROL */}
      <div
        className="mobile-auth-switch"
        role="tablist"
        aria-label="Authentication Mode"
      >
        <button
          type="button"
          role="tab"
          aria-selected={!isRegister}
          className={`mobile-switch-btn ${!isRegister ? "active" : ""}`}
          onClick={switchToLogin}
        >
          Sign In
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isRegister}
          className={`mobile-switch-btn ${isRegister ? "active" : ""}`}
          onClick={switchToRegister}
        >
          Create Account
        </button>
      </div>

      {/* GOOGLE SETUP INLINE NOTICE (NON-INTRUSIVE) */}
      {showGoogleSetupNotice && (
        <div
          className="google-setup-notice"
          role="region"
          aria-label="Google Sign-In Configuration Guide"
        >
          <div className="setup-notice-header">
            <div className="setup-notice-title-wrap">
              <span className="setup-notice-badge">Setup Guide</span>
              <strong>Google OAuth Configuration</strong>
            </div>
            <button
              type="button"
              className="setup-notice-close"
              onClick={() => setShowGoogleSetupNotice(false)}
              aria-label="Dismiss setup guide"
            >
              ✕
            </button>
          </div>
          <p className="setup-notice-intro">
            Google Sign-In is fully built and ready! To activate it on your
            local machine or server:
          </p>
          <ol className="setup-notice-steps">
            <li>
              Open the{" "}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
              >
                Google Cloud Console Credentials Page
              </a>
              .
            </li>
            <li>
              Create an <strong>OAuth 2.0 Client ID</strong> for a{" "}
              <strong>Web application</strong>.
            </li>
            <li>
              Under <strong>Authorized JavaScript origins</strong>, add:
              <br />
              <code>http://localhost:5173</code> and{" "}
              <code>http://127.0.0.1:5173</code>
            </li>
            <li>
              Under <strong>Authorized redirect URIs</strong>, add:
              <br />
              <code>http://localhost:5173</code>
            </li>
            <li>
              Copy your Client ID and add it to:
              <br />
              <code>server/.env</code> as <code>GOOGLE_CLIENT_ID</code>
              <br />
              <code>client/.env</code> as <code>VITE_GOOGLE_CLIENT_ID</code>
            </li>
            <li>Restart your frontend and backend dev servers.</li>
          </ol>
        </div>
      )}

      {/* SLIDING AUTH CONTAINER */}
      <div
        className={`sliding-auth-container ${
          isRegister ? "right-panel-active" : ""
        }`}
      >
        {/* SIGN IN FORM PANEL */}
        <section
          className="form-panel sign-in-panel"
          aria-label="Sign In Panel"
        >
          <div className="panel-inner-content">
            <p className="auth-label">WELCOME BACK</p>
            <h2>Log in to TaskFlow</h2>
            <p className="auth-description">
              Access your tasks, calendar schedule, and focus metrics.
            </p>

            {registerMessage && (
              <p className="form-success">{registerMessage}</p>
            )}

            {/* GOOGLE SIGN-IN */}
            <div className="google-auth-container">
              {hasConfiguredGoogle ? (
                <div ref={googleLoginBtnRef} className="google-btn-slot"></div>
              ) : (
                <button
                  type="button"
                  className="btn-google-unconfigured"
                  onClick={handleUnconfiguredGoogleClick}
                  title="Click to view Google OAuth configuration steps"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    className="google-icon"
                  >
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              )}
              {googleLoading && (
                <p className="google-loading-text">Verifying with Google...</p>
              )}
            </div>

            <div className="auth-divider">
              <span>or continue with email</span>
            </div>

            <form className="auth-form" onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label htmlFor="login-email">Email address</label>
                <input
                  type="email"
                  id="login-email"
                  name="email"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="login-password">Password</label>
                <div className="password-wrapper">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    id="login-password"
                    name="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    aria-label={
                      showLoginPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showLoginPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {loginError && <p className="form-error">{loginError}</p>}

              <button
                type="submit"
                className="auth-button"
                disabled={loginLoading}
              >
                {loginLoading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <p className="auth-mobile-switch">
              Don't have an account?{" "}
              <button
                type="button"
                className="inline-switch-btn"
                onClick={switchToRegister}
              >
                Create an account
              </button>
            </p>
          </div>
        </section>

        {/* SIGN UP FORM PANEL */}
        <section
          className="form-panel sign-up-panel"
          aria-label="Registration Panel"
        >
          <div className="panel-inner-content">
            <p className="auth-label">GET STARTED</p>
            <h2>Create your account</h2>
            <p className="auth-description">
              Start organizing your daily priorities with TaskFlow.
            </p>

            {/* GOOGLE SIGN-UP */}
            <div className="google-auth-container">
              {hasConfiguredGoogle ? (
                <div
                  ref={googleRegisterBtnRef}
                  className="google-btn-slot"
                ></div>
              ) : (
                <button
                  type="button"
                  className="btn-google-unconfigured"
                  onClick={handleUnconfiguredGoogleClick}
                  title="Click to view Google OAuth configuration steps"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    className="google-icon"
                  >
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Sign up with Google</span>
                </button>
              )}
            </div>

            <div className="auth-divider">
              <span>or register with email</span>
            </div>

            <form className="auth-form" onSubmit={handleRegisterSubmit}>
              <div className="form-group">
                <label htmlFor="register-name">Full name</label>
                <input
                  type="text"
                  id="register-name"
                  name="name"
                  value={registerData.name}
                  onChange={handleRegisterChange}
                  placeholder="Enter your name"
                  autoComplete="name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="register-email">Email address</label>
                <input
                  type="email"
                  id="register-email"
                  name="email"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="register-password">Password</label>
                <div className="password-wrapper">
                  <input
                    type={showRegisterPassword ? "text" : "password"}
                    id="register-password"
                    name="password"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowRegisterPassword(!showRegisterPassword)
                    }
                    aria-label={
                      showRegisterPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showRegisterPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password">Confirm password</label>
                <div className="password-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirm-password"
                    name="confirmPassword"
                    value={registerData.confirmPassword}
                    onChange={handleRegisterChange}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {registerError && (
                <p className="form-error">{registerError}</p>
              )}

              <button
                type="submit"
                className="auth-button"
                disabled={registerLoading}
              >
                {registerLoading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <p className="auth-mobile-switch">
              Already have an account?{" "}
              <button
                type="button"
                className="inline-switch-btn"
                onClick={switchToLogin}
              >
                Sign in
              </button>
            </p>
          </div>
        </section>

        {/* SLIDING OVERLAY CONTAINER (Desktop) */}
        <div className="overlay-container" aria-hidden="true">
          <div className="overlay">
            {/* Overlay Left: visible when user is in Register mode */}
            <div className="overlay-panel overlay-left">
              <span className="overlay-badge">WELCOME BACK</span>
              <h2>Already organized?</h2>
              <p>
                Sign in to check your Today's Focus, upcoming deadlines, and
                continue your progress streak.
              </p>
              <button
                type="button"
                className="ghost-btn"
                onClick={switchToLogin}
              >
                Sign In
              </button>
            </div>

            {/* Overlay Right: visible when user is in Login mode */}
            <div className="overlay-panel overlay-right">
              <span className="overlay-badge">TASKFLOW WORKSPACE</span>
              <h2>Hello, Friend!</h2>
              <p>
                Join TaskFlow to organize your tasks with smart prioritization,
                visual Kanban boards, and desktop reminders.
              </p>
              <button
                type="button"
                className="ghost-btn"
                onClick={switchToRegister}
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECURE ACCOUNT LINKING MODAL */}
      {linkingState.isOpen && (
        <div className="task-modal-overlay">
          <div className="task-modal linking-modal">
            <div className="task-modal-header">
              <div>
                <p className="dashboard-label">SECURITY VERIFICATION</p>
                <h2>Link Google Account</h2>
              </div>
              <button
                type="button"
                className="task-modal-close"
                onClick={() =>
                  setLinkingState({
                    isOpen: false,
                    credential: "",
                    email: "",
                    password: "",
                    error: "",
                    loading: false,
                  })
                }
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLinkSubmit} className="task-modal-form">
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--secondary-text)",
                  marginBottom: "16px",
                  lineHeight: "1.5",
                }}
              >
                An existing password account uses{" "}
                <strong>{linkingState.email}</strong>. To prevent account
                takeover and securely connect your Google login, enter your
                account password:
              </p>

              <div className="form-group">
                <label htmlFor="link-password">Account Password</label>
                <input
                  type="password"
                  id="link-password"
                  value={linkingState.password}
                  onChange={(e) =>
                    setLinkingState((prev) => ({
                      ...prev,
                      password: e.target.value,
                      error: "",
                    }))
                  }
                  placeholder="Enter current password"
                  required
                  autoFocus
                />
              </div>

              {linkingState.error && (
                <p className="form-error">{linkingState.error}</p>
              )}

              <div className="task-modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    setLinkingState({
                      isOpen: false,
                      credential: "",
                      email: "",
                      password: "",
                      error: "",
                      loading: false,
                    })
                  }
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="dashboard-add-button"
                  disabled={linkingState.loading}
                >
                  {linkingState.loading
                    ? "Verifying..."
                    : "Verify & Link Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Auth;