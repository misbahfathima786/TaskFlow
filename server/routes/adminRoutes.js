const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const Task = require("../models/Task");
const AnalyticsEvent = require("../models/AnalyticsEvent");
const authMiddleware = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/roleMiddleware");

const router = express.Router();

// Enforce authentication AND admin role on all admin routes
router.use(authMiddleware);
router.use(requireAdmin);

// ==========================================
// 1. ADMIN OVERVIEW METRICS
// ==========================================
router.get("/overview", async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // User counts
    const totalUsers = await User.countDocuments();
    const newUsersToday = await User.countDocuments({ createdAt: { $gte: todayStart } });
    const newUsers7d = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const newUsers30d = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    // Active users (users with activity timestamp recorded within window)
    const activeUsers7d = await User.countDocuments({ lastActivityAt: { $gte: sevenDaysAgo } });
    const activeUsers30d = await User.countDocuments({ lastActivityAt: { $gte: thirtyDaysAgo } });

    // Task metrics across entire platform
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: "Completed" });
    const pendingTasks = await Task.countDocuments({ status: "Pending" });
    const completionRate =
      totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    // Overdue tasks platform-wide
    const overdueTasks = await Task.countDocuments({
      status: "Pending",
      dueDate: { $lt: todayStart, $ne: null },
    });

    // Priority distribution platform-wide
    const priorityCounts = await Task.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);
    const priorityDistribution = {
      High: 0,
      Medium: 0,
      Low: 0,
    };
    priorityCounts.forEach((p) => {
      if (p._id && priorityDistribution[p._id] !== undefined) {
        priorityDistribution[p._id] = p.count;
      }
    });

    // Visitor metrics
    const totalPageviews = await AnalyticsEvent.countDocuments({ type: "pageview" });
    const uniqueVisitorsList = await AnalyticsEvent.distinct("visitorId");
    const totalUniqueVisitors = uniqueVisitorsList.length;
    const uniqueSessionsList = await AnalyticsEvent.distinct("sessionId");
    const totalSessions = uniqueSessionsList.length;

    const conversionRate =
      totalUniqueVisitors === 0
        ? 0
        : Math.min(100, Math.round((totalUsers / totalUniqueVisitors) * 100));

    res.status(200).json({
      overview: {
        totalUsers,
        newUsersToday,
        newUsers7d,
        newUsers30d,
        activeUsers7d,
        activeUsers30d,
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        completionRate,
        priorityDistribution,
        visitorMetrics: {
          totalPageviews,
          totalUniqueVisitors,
          totalSessions,
          conversionRate,
        },
      },
    });
  } catch (error) {
    console.error("Admin overview error:", error.message);
    res.status(500).json({
      message: "Something went wrong while fetching admin overview.",
    });
  }
});

// ==========================================
// 2. USER MANAGEMENT (PAGINATED & SEARCHABLE)
// ==========================================
router.get("/users", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const search = (req.query.search || "").trim();

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .select("-password") // Strictly omit password hash
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Compute task counts for listed users efficiently
    const userIds = users.map((u) => u._id);
    const taskAggregates = await Task.aggregate([
      { $match: { user: { $in: userIds } } },
      {
        $group: {
          _id: "$user",
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
          },
        },
      },
    ]);

    const taskCountMap = new Map();
    taskAggregates.forEach((t) => {
      taskCountMap.set(t._id.toString(), {
        total: t.total,
        completed: t.completed,
      });
    });

    const sanitizedUsers = users.map((u) => {
      const stats = taskCountMap.get(u._id.toString()) || { total: 0, completed: 0 };
      return {
        id: u._id,
        name: u.name,
        email: u.email,
        avatar: u.avatar || "",
        role: u.role || "user",
        authProvider: u.authProvider || "local",
        isDeactivated: Boolean(u.isDeactivated),
        createdAt: u.createdAt,
        lastActivityAt: u.lastActivityAt,
        taskCount: stats.total,
        completedTaskCount: stats.completed,
      };
    });

    res.status(200).json({
      users: sanitizedUsers,
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit) || 1,
      },
    });
  } catch (error) {
    console.error("Admin user list error:", error.message);
    res.status(500).json({
      message: "Something went wrong while fetching user accounts.",
    });
  }
});

// ==========================================
// 3. ACTIVATE / DEACTIVATE USER ACCOUNT
// ==========================================
router.put("/users/:id/status", async (req, res) => {
  try {
    const { isDeactivated } = req.body;
    const targetUserId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    if (typeof isDeactivated !== "boolean") {
      return res.status(400).json({ message: "isDeactivated boolean is required." });
    }

    // Safety guard: Admin cannot deactivate their own account!
    if (targetUserId === req.userId && isDeactivated) {
      return res.status(400).json({
        message: "Action rejected. You cannot deactivate your own administrative account.",
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    // Safety guard: Prevent deactivating the last active administrator
    if (targetUser.role === "admin" && isDeactivated) {
      const activeAdminCount = await User.countDocuments({
        role: "admin",
        isDeactivated: false,
      });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          message: "Action rejected. Cannot deactivate the last remaining administrator.",
        });
      }
    }

    targetUser.isDeactivated = isDeactivated;
    await targetUser.save();

    res.status(200).json({
      message: `User account ${isDeactivated ? "deactivated" : "reactivated"} successfully.`,
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        isDeactivated: targetUser.isDeactivated,
      },
    });
  } catch (error) {
    console.error("Admin user status error:", error.message);
    res.status(500).json({
      message: "Something went wrong while updating user status.",
    });
  }
});

// ==========================================
// 4. ASSIGN / REVOKE ADMIN ROLE
// ==========================================
router.put("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    const targetUserId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Role must be 'user' or 'admin'." });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    // Safety guard: If demoting an admin, ensure at least one other active admin remains
    if (targetUser.role === "admin" && role === "user") {
      const activeAdminCount = await User.countDocuments({
        role: "admin",
        isDeactivated: false,
      });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          message: "Action rejected. Cannot demote the last remaining administrator.",
        });
      }
    }

    targetUser.role = role;
    await targetUser.save();

    res.status(200).json({
      message: `User role changed to '${role}' successfully.`,
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
    });
  } catch (error) {
    console.error("Admin user role error:", error.message);
    res.status(500).json({
      message: "Something went wrong while updating user role.",
    });
  }
});

// ==========================================
// 5. ACTIVITY & SYSTEM TRENDS (Past 14 Days)
// ==========================================
router.get("/activity-trends", async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const trends = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - i);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      const [newUsers, tasksCreated, tasksCompleted] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: d, $lt: nextD } }),
        Task.countDocuments({ createdAt: { $gte: d, $lt: nextD } }),
        Task.countDocuments({
          status: "Completed",
          $or: [
            { completedAt: { $gte: d, $lt: nextD } },
            { updatedAt: { $gte: d, $lt: nextD } },
          ],
        }),
      ]);

      trends.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        newUsers,
        tasksCreated,
        tasksCompleted,
      });
    }

    res.status(200).json({
      trends,
    });
  } catch (error) {
    console.error("Admin activity trends error:", error.message);
    res.status(500).json({
      message: "Something went wrong while fetching activity trends.",
    });
  }
});

module.exports = router;
