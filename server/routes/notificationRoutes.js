const express = require("express");
const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const Task = require("../models/Task");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// HELPER: Sync task reminders into in-app notifications (Idempotent)
const syncTaskReminders = async (userId) => {
  try {
    const tasks = await Task.find({
      user: userId,
      status: "Pending",
      dueDate: { $ne: null },
    });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const dayAfterTomorrow = new Date(todayStart);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    const dateKey = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const notificationsToInsert = [];

    for (const task of tasks) {
      const due = new Date(task.dueDate);
      const dueDateOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());

      // 1. Overdue
      if (dueDateOnly < todayStart) {
        const fingerprint = `${userId}_${task._id}_overdue_${dateKey}`;
        notificationsToInsert.push({
          user: userId,
          taskId: task._id,
          type: "overdue",
          title: "Overdue Task",
          message: `"${task.title}" was due on ${due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`,
          priority: task.priority,
          dueDate: task.dueDate,
          link: "/tasks",
          fingerprint,
        });
      }
      // 2. Due Today
      else if (dueDateOnly.getTime() === todayStart.getTime()) {
        const fingerprint = `${userId}_${task._id}_due_today_${dateKey}`;
        notificationsToInsert.push({
          user: userId,
          taskId: task._id,
          type: "due_today",
          title: "Due Today",
          message: `"${task.title}" is due today!`,
          priority: task.priority,
          dueDate: task.dueDate,
          link: "/tasks",
          fingerprint,
        });
      }
      // 3. Deadline Approaching (Tomorrow)
      else if (dueDateOnly.getTime() === tomorrowStart.getTime() && task.priority === "High") {
        const fingerprint = `${userId}_${task._id}_deadline_approaching_${dateKey}`;
        notificationsToInsert.push({
          user: userId,
          taskId: task._id,
          type: "deadline_approaching",
          title: "Urgent Deadline Approaching",
          message: `High-priority task "${task.title}" is due tomorrow.`,
          priority: task.priority,
          dueDate: task.dueDate,
          link: "/tasks",
          fingerprint,
        });
      }
    }

    if (notificationsToInsert.length > 0) {
      const ops = notificationsToInsert.map((n) => ({
        updateOne: {
          filter: { fingerprint: n.fingerprint },
          update: { $setOnInsert: n },
          upsert: true,
        },
      }));
      await Notification.bulkWrite(ops, { ordered: false }).catch(() => {
        // Duplicate key errors are silently ignored by $setOnInsert
      });
    }
  } catch (error) {
    console.error("Sync task reminders error:", error.message);
  }
};

// GET ALL IN-APP NOTIFICATIONS
router.get("/", authMiddleware, async (req, res) => {
  try {
    // Generate fresh idempotent notifications based on current tasks
    await syncTaskReminders(req.userId);

    const notifications = await Notification.find({
      user: req.userId,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      user: req.userId,
      isRead: false,
    });

    res.status(200).json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error.message);
    res.status(500).json({
      message: "Something went wrong while fetching notifications.",
    });
  }
});

// GET UNREAD COUNT FAST
router.get("/count", authMiddleware, async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      user: req.userId,
      isRead: false,
    });

    res.status(200).json({
      unreadCount,
    });
  } catch (error) {
    console.error("Get unread count error:", error.message);
    res.status(500).json({
      message: "Something went wrong while fetching unread count.",
    });
  }
});

// MARK SINGLE NOTIFICATION AS READ
router.put("/:id/read", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid notification ID format." });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    res.status(200).json({
      message: "Notification marked as read.",
      notification,
    });
  } catch (error) {
    console.error("Mark read error:", error.message);
    res.status(500).json({
      message: "Something went wrong while updating notification.",
    });
  }
});

// MARK ALL AS READ
router.put("/read-all", authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("Mark all read error:", error.message);
    res.status(500).json({
      message: "Something went wrong while updating notifications.",
    });
  }
});

// DISMISS / DELETE SINGLE NOTIFICATION
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid notification ID format." });
    }

    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    res.status(200).json({
      message: "Notification dismissed successfully.",
    });
  } catch (error) {
    console.error("Delete notification error:", error.message);
    res.status(500).json({
      message: "Something went wrong while deleting notification.",
    });
  }
});

// CLEAR ALL READ NOTIFICATIONS
router.delete("/clear-read", authMiddleware, async (req, res) => {
  try {
    await Notification.deleteMany({
      user: req.userId,
      isRead: true,
    });

    res.status(200).json({
      message: "Cleared all read notifications.",
    });
  } catch (error) {
    console.error("Clear read notifications error:", error.message);
    res.status(500).json({
      message: "Something went wrong while clearing read notifications.",
    });
  }
});

module.exports = router;
