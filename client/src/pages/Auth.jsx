import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Auth() {
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);

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

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  /* =========================
     LOGIN
     ========================= */

  const handleLoginChange = (event) => {
    const { name, value } = event.target;

    setLoginData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setLoginError("");
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    setLoginError("");

    try {
      setLoginLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(loginData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.message || "Login failed.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      navigate("/dashboard");
    } catch {
      setLoginError(
        "Unable to connect to the server."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  /* =========================
     REGISTER
     ========================= */

  const handleRegisterChange = (event) => {
    const { name, value } = event.target;

    setRegisterData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setRegisterError("");
    setRegisterMessage("");
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();

    setRegisterError("");
    setRegisterMessage("");

    if (
      registerData.password !==
      registerData.confirmPassword
    ) {
      setRegisterError("Passwords do not match.");
      return;
    }

    if (registerData.password.length < 6) {
      setRegisterError(
        "Password must be at least 6 characters."
      );
      return;
    }

    try {
      setRegisterLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: registerData.name,
            email: registerData.email,
            password: registerData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setRegisterError(
          data.message || "Registration failed."
        );
        return;
      }

      setRegisterMessage(
        data.message || "Account created successfully."
      );

      setRegisterData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      /*
        After successful registration, keep the
        user on the same page and switch to Login.
      */
      setTimeout(() => {
        setIsRegister(false);
        setRegisterMessage("");
      }, 1200);
    } catch {
      setRegisterError(
        "Unable to connect to the server."
      );
    } finally {
      setRegisterLoading(false);
    }
  };

  /* =========================
     SWITCH AUTH MODE
     ========================= */

  const switchToLogin = () => {
    setIsRegister(false);
    setLoginError("");
    setRegisterError("");
    setRegisterMessage("");
  };

  const switchToRegister = () => {
    setIsRegister(true);
    setLoginError("");
    setRegisterError("");
    setRegisterMessage("");
  };

  return (
    <main className="combined-auth-page">

      {/* BACKGROUND BRAND */}
      <div className="auth-background-content">
        <p className="auth-label">WELCOME TO TASKFLOW</p>

        <h1>
          Plan better.
          <br />
          Work smarter.
        </h1>

        <p>
          Organize your tasks, manage your time,
          and stay on track.
        </p>
      </div>

      {/* AUTH CARD */}
      <div
        className={`combined-auth-card ${
          isRegister ? "show-register" : ""
        }`}
      >

        {/* LOGIN PANEL */}
        <section className="auth-panel login-panel">

          <div className="auth-panel-content">

            <p className="auth-label">
              WELCOME BACK
            </p>

            <h2>Log in to TaskFlow</h2>

            <p className="auth-description">
              Continue managing your tasks and stay
              on top of your work.
            </p>

            <form
              className="auth-form"
              onSubmit={handleLoginSubmit}
            >

              <div className="form-group">
                <label htmlFor="login-email">
                  Email address
                </label>

                <input
                  type="email"
                  id="login-email"
                  name="email"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="form-group">

                <label htmlFor="login-password">
                  Password
                </label>

                <div className="password-wrapper">

                  <input
                    type={
                      showLoginPassword
                        ? "text"
                        : "password"
                    }
                    id="login-password"
                    name="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    placeholder="Enter your password"
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowLoginPassword(
                        !showLoginPassword
                      )
                    }
                  >
                    {showLoginPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>
              </div>

              {loginError && (
                <p className="form-error">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                className="auth-button"
                disabled={loginLoading}
              >
                {loginLoading
                  ? "Logging In..."
                  : "Log In"}
              </button>

            </form>

            <p className="auth-switch-text">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={switchToRegister}
              >
                Create an account
              </button>
            </p>

          </div>

        </section>


        {/* REGISTER PANEL */}
        <section className="auth-panel register-panel">

          <div className="auth-panel-content">

            <p className="auth-label">
              GET STARTED
            </p>

            <h2>Create your account</h2>

            <p className="auth-description">
              Start organizing your tasks with
              TaskFlow.
            </p>

            <form
              className="auth-form"
              onSubmit={handleRegisterSubmit}
            >

              <div className="form-group">
                <label htmlFor="register-name">
                  Full name
                </label>

                <input
                  type="text"
                  id="register-name"
                  name="name"
                  value={registerData.name}
                  onChange={handleRegisterChange}
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="register-email">
                  Email address
                </label>

                <input
                  type="email"
                  id="register-email"
                  name="email"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="form-group">

                <label htmlFor="register-password">
                  Password
                </label>

                <div className="password-wrapper">

                  <input
                    type={
                      showRegisterPassword
                        ? "text"
                        : "password"
                    }
                    id="register-password"
                    name="password"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    placeholder="Create a password"
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowRegisterPassword(
                        !showRegisterPassword
                      )
                    }
                  >
                    {showRegisterPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>

              </div>

              <div className="form-group">

                <label htmlFor="confirm-password">
                  Confirm password
                </label>

                <div className="password-wrapper">

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    id="confirm-password"
                    name="confirmPassword"
                    value={
                      registerData.confirmPassword
                    }
                    onChange={handleRegisterChange}
                    placeholder="Confirm your password"
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                  >
                    {showConfirmPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>

              </div>

              {registerError && (
                <p className="form-error">
                  {registerError}
                </p>
              )}

              {registerMessage && (
                <p className="form-success">
                  {registerMessage}
                </p>
              )}

              <button
                type="submit"
                className="auth-button"
                disabled={registerLoading}
              >
                {registerLoading
                  ? "Creating Account..."
                  : "Create Account"}
              </button>

            </form>

            <p className="auth-switch-text">
              Already have an account?{" "}
              <button
                type="button"
                onClick={switchToLogin}
              >
                Log in
              </button>
            </p>

          </div>

        </section>

      </div>

      {/* BACK TO HOME */}
      <button
        type="button"
        className="auth-back-button"
        onClick={() => navigate("/")}
      >
        ← Back to home
      </button>

    </main>
  );
}

export default Auth;