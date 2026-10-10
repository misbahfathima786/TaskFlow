const express = require("express");
const Task = require("../models/Task");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// CREATE TASK
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      category,
      dueDate,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "Task title is required.",
      });
    }

    const task = await Task.create({
      user: req.userId,
      title,
      description,
      priority,
      category,
      dueDate,
    });

    res.status(201).json({
      message: "Task created successfully.",
      task,
    });
  } catch (error) {
    console.error("Create task error:", error.message);

    res.status(500).json({
      message: "Something went wrong while creating the task.",
    });
  }
});


// GET ALL TASKS
router.get("/", authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({
      user: req.userId,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      tasks,
    });
  } catch (error) {
    console.error("Get tasks error:", error.message);

    res.status(500).json({
      message: "Something went wrong while fetching tasks.",
    });
  }
});

// GET COMPLETED TASKS
router.get("/completed", authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({
      user: req.userId,
      status: "Completed",
    }).sort({
      updatedAt: -1,
    });

    res.status(200).json({
      tasks,
    });
  } catch (error) {
    console.error("Get completed tasks error:", error.message);

    res.status(500).json({
      message: "Something went wrong while fetching completed tasks.",
    });
  }
});

// GET PRODUCTIVITY ANALYTICS (REAL MONGODB DATA ONLY)
router.get("/analytics", authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({
      user: req.userId,
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "Completed");
    const pendingTasks = tasks.filter((t) => t.status === "Pending");

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Overdue tasks
    const overdueTasks = pendingTasks.filter((t) => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      due.setHours(0, 0, 0, 0);
      return due < todayStart;
    });

    // Overall completion rate
    const completionRate =
      totalTasks === 0
        ? 0
        : Math.round((completedTasks.length / totalTasks) * 100);

    // Priority breakdown
    const priorityDistribution = {
      High: tasks.filter((t) => t.priority === "High").length,
      Medium: tasks.filter((t) => t.priority === "Medium").length,
      Low: tasks.filter((t) => t.priority === "Low").length,
    };

    // Category breakdown
    const categories = ["College", "Work", "Personal", "Projects", "Other"];
    const categoryBreakdown = categories.map((cat) => {
      const catTasks = tasks.filter((t) => t.category === cat);
      const catCompleted = catTasks.filter((t) => t.status === "Completed").length;
      return {
        category: cat,
        total: catTasks.length,
        completed: catCompleted,
        pending: catTasks.length - catCompleted,
        rate:
          catTasks.length === 0
            ? 0
            : Math.round((catCompleted / catTasks.length) * 100),
      };
    });

    // Tasks completed per day (Last 7 Days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - i);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
      const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      const completedCount = tasks.filter((t) => {
        if (t.status !== "Completed") return false;
        const compTimestamp = t.completedAt || t.updatedAt;
        if (!compTimestamp) return false;
        const compDate = new Date(compTimestamp);
        return compDate >= d && compDate < nextD;
      }).length;

      last7Days.push({
        day: dayLabel,
        date: dateLabel,
        completed: completedCount,
      });
    }

    // Weekly completion trend (Past 4 Weeks)
    const last4Weeks = [];
    for (let w = 3; w >= 0; w--) {
      const start = new Date(todayStart);
      start.setDate(start.getDate() - (w * 7 + 6));
      const end = new Date(todayStart);
      end.setDate(end.getDate() - (w * 7) + 1);

      const weekLabel = w === 0 ? "This Week" : `${w}w ago`;
      const count = tasks.filter((t) => {
        if (t.status !== "Completed") return false;
        const compTimestamp = t.completedAt || t.updatedAt;
        if (!compTimestamp) return false;
        const compDate = new Date(compTimestamp);
        return compDate >= start && compDate < end;
      }).length;

      last4Weeks.push({
        week: weekLabel,
        completed: count,
      });
    }

    res.status(200).json({
      analytics: {
        totalTasks,
        completedCount: completedTasks.length,
        pendingCount: pendingTasks.length,
        overdueCount: overdueTasks.length,
        completionRate,
        priorityDistribution,
        categoryBreakdown,
        last7Days,
        last4Weeks,
      },
    });
  } catch (error) {
    console.error("Get analytics error:", error.message);
    res.status(500).json({
      message: "Something went wrong while fetching analytics.",
    });
  }
});

// UPDATE TASK
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    const {
      title,
      description,
      priority,
      category,
      dueDate,
      status,
    } = req.body;

    task.title = title ?? task.title;
    task.description = description ?? task.description;
    task.priority = priority ?? task.priority;
    task.category = category ?? task.category;
    task.dueDate = dueDate ?? task.dueDate;

    if (status === "Completed") {
      task.status = "Completed";
      task.completedAt = new Date();
    } else if (status === "Pending") {
      task.status = "Pending";
      task.completedAt = null;
    }

    await task.save();

    res.status(200).json({
      message: "Task updated successfully.",
      task,
    });
  } catch (error) {
    console.error("Update task error:", error.message);

    res.status(500).json({
      message: "Something went wrong while updating the task.",
    });
  }
});


// DELETE TASK
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    res.status(200).json({
      message: "Task deleted successfully.",
    });
  } catch (error) {
    console.error("Delete task error:", error.message);

    res.status(500).json({
      message: "Something went wrong while deleting the task.",
    });
  }
});


module.exports = router;