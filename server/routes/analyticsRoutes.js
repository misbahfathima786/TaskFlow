const express = require("express");
const AnalyticsEvent = require("../models/AnalyticsEvent");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/roleMiddleware");

const router = express.Router();

// Memory store for basic rate-limiting analytics event submissions (prevent spam)
const rateLimitMap = new Map();

// Helper to sanitize path (strips query parameters, hashes, credentials)
const sanitizePath = (rawPath) => {
  if (!rawPath || typeof rawPath !== "string") return "/";
  try {
    const parsed = new URL(rawPath, "http://localhost");
    return parsed.pathname;
  } catch {
    return rawPath.split("?")[0].split("#")[0].slice(0, 100);
  }
};

// ==========================================
// 1. PUBLIC: RECORD ANALYTICS EVENT / PAGEVIEW
// ==========================================
router.post("/event", async (req, res) => {
  try {
    const { type, name, path, visitorId, sessionId, referrer } = req.body;

    if (!visitorId || !sessionId) {
      return res.status(400).json({ message: "visitorId and sessionId are required." });
    }

    // Rate-limiting: Max 60 events per minute per visitor
    const now = Date.now();
    const visitorKey = `${visitorId}`;
    const visitorEvents = rateLimitMap.get(visitorKey) || [];
    const recentEvents = visitorEvents.filter((t) => now - t < 60 * 1000);

    if (recentEvents.length >= 60) {
      return res.status(429).json({ message: "Too many tracking events." });
    }

    recentEvents.push(now);
    rateLimitMap.set(visitorKey, recentEvents);

    // Clean up rateLimitMap periodically
    if (rateLimitMap.size > 2000) {
      for (const [k, v] of rateLimitMap.entries()) {
        if (v.length === 0 || now - v[v.length - 1] > 60 * 1000) {
          rateLimitMap.delete(k);
        }
      }
    }

    const cleanPath = sanitizePath(path);
    const eventType = type === "event" ? "event" : "pageview";
    const eventName = typeof name === "string" ? name.slice(0, 50) : eventType;

    // Create privacy-conscious event record (never store IP or personal info)
    await AnalyticsEvent.create({
      type: eventType,
      name: eventName,
      path: cleanPath,
      visitorId: String(visitorId).slice(0, 64),
      sessionId: String(sessionId).slice(0, 64),
      referrer: typeof referrer === "string" ? sanitizePath(referrer) : "",
      userAgent: req.headers["user-agent"] ? req.headers["user-agent"].slice(0, 150) : "",
      timestamp: new Date(),
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Record analytics event error:", error.message);
    res.status(500).json({ message: "Failed to record event." });
  }
});

// ==========================================
// 2. ADMIN ONLY: GET VISITOR ANALYTICS
// ==========================================
router.get("/stats", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. Total pageviews
    const totalPageviews = await AnalyticsEvent.countDocuments({ type: "pageview" });

    // 2. Unique visitors (distinct visitorId)
    const uniqueVisitorsList = await AnalyticsEvent.distinct("visitorId");
    const totalUniqueVisitors = uniqueVisitorsList.length;

    // 3. Unique sessions (distinct sessionId)
    const uniqueSessionsList = await AnalyticsEvent.distinct("sessionId");
    const totalSessions = uniqueSessionsList.length;

    // 4. Visitors in last 30 days
    const visitorsLast30Days = await AnalyticsEvent.distinct("visitorId", {
      timestamp: { $gte: thirtyDaysAgo },
    });

    // 5. Visitors in last 7 days
    const visitorsLast7Days = await AnalyticsEvent.distinct("visitorId", {
      timestamp: { $gte: sevenDaysAgo },
    });

    // 6. Top Visited Pages
    const topPages = await AnalyticsEvent.aggregate([
      { $match: { type: "pageview" } },
      { $group: { _id: "$path", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    // 7. Last 7 Days Pageviews Trend
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dailyPageviews = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - i);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      const count = await AnalyticsEvent.countDocuments({
        type: "pageview",
        timestamp: { $gte: d, $lt: nextD },
      });

      dailyPageviews.push({
        date: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        pageviews: count,
      });
    }

    // 8. Registration Conversion Rate
    const totalRegisteredUsers = await User.countDocuments();
    const conversionRate =
      totalUniqueVisitors === 0
        ? 0
        : Math.min(100, Math.round((totalRegisteredUsers / totalUniqueVisitors) * 100));

    res.status(200).json({
      visitorAnalytics: {
        totalPageviews,
        totalUniqueVisitors,
        totalSessions,
        activeVisitors7d: visitorsLast7Days.length,
        activeVisitors30d: visitorsLast30Days.length,
        conversionRate,
        topPages: topPages.map((p) => ({ path: p._id, views: p.count })),
        dailyPageviews,
      },
    });
  } catch (error) {
    console.error("Get visitor analytics error:", error.message);
    res.status(500).json({
      message: "Something went wrong while fetching visitor analytics.",
    });
  }
});

module.exports = router;
