import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import CompletedTasks from "./pages/CompletedTasks";
import Analytics from "./pages/Analytics";
import Calendar from "./pages/Calendar";
import AdminDashboard from "./pages/AdminDashboard";

import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import { trackPageView } from "./utils/analyticsTracker";

function App() {
  const location = useLocation();

  // First-party privacy-conscious pageview tracking
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  const protectedPaths = [
    "/dashboard",
    "/tasks",
    "/calendar",
    "/completed-tasks",
    "/analytics",
    "/settings",
    "/profile",
    "/admin",
  ];

  const isProtectedArea = protectedPaths.includes(location.pathname);

  return (
    <>
      {!isProtectedArea && <Navbar />}

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth />} />

        {/* Protected user routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/completed-tasks" element={<CompletedTasks />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />

          {/* Admin only routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;