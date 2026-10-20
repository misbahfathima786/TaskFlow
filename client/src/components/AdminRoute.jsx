import { Navigate, Outlet } from "react-router-dom";

function AdminRoute() {
  const token = localStorage.getItem("token");
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  })();

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  if (user?.role !== "admin") {
    return (
      <div className="access-denied-page">
        <div className="access-denied-card">
          <span className="access-denied-icon">🔒</span>
          <h2>Access Restricted</h2>
          <p>
            The page you are trying to view requires Administrator privileges.
            Your account ({user?.email || "current user"}) is currently assigned the Standard User role.
          </p>
          <a href="/dashboard" className="dashboard-add-button">
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

export default AdminRoute;
