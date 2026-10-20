const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          message: "Session expired. Please log in again.",
          isExpired: true,
        });
      }
      return res.status(401).json({
        message: "Invalid or expired token.",
      });
    }

    // Authoritative check against MongoDB User record
    const user = await User.findById(decoded.userId).select("role isDeactivated lastActivityAt");

    if (!user) {
      return res.status(401).json({
        message: "User account not found.",
      });
    }

    if (user.isDeactivated) {
      return res.status(403).json({
        message: "This account has been deactivated. Please contact an administrator.",
        isDeactivated: true,
      });
    }

    req.userId = user._id.toString();
    req.userRole = user.role || "user";

    // Throttle updating lastActivityAt to once every 5 minutes per user
    const now = new Date();
    if (!user.lastActivityAt || now - new Date(user.lastActivityAt) > 5 * 60 * 1000) {
      User.updateOne({ _id: user._id }, { $set: { lastActivityAt: now } }).catch((err) => {
        console.warn("Failed to update user activity timestamp:", err.message);
      });
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    return res.status(500).json({
      message: "Internal server error during authentication.",
    });
  }
};

module.exports = authMiddleware;