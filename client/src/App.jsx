import { Routes, Route, useLocation } from "react-router-dom";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import CompletedTasks from "./pages/CompletedTasks";
import Analytics from "./pages/Analytics";

import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";

function App() {
  const location = useLocation();

  const isProtectedArea =
    location.pathname === "/dashboard" ||
    location.pathname === "/tasks" ||
    location.pathname === "/completed-tasks" ||
    location.pathname === "/analytics" ||
    location.pathname === "/settings" ||
    location.pathname === "/profile";

  return (
    <>
      {!isProtectedArea && <Navbar />}

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/tasks"
            element={<Tasks />}
          />
          <Route
            path="/completed-tasks"
            element={<CompletedTasks />}
          />
          <Route
            path="/analytics"
            element={<Analytics />}
          />
          <Route
            path="/profile"
            element={<Profile />}
          />
          <Route
            path="/settings"
            element={<Settings />}
          />
        </Route>
      </Routes>
    </>
  );
}

export default App;