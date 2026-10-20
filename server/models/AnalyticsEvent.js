const mongoose = require("mongoose");

const analyticsEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["pageview", "event"],
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    path: {
      type: String,
      required: true,
      trim: true,
    },

    visitorId: {
      type: String,
      required: true,
      index: true,
    },

    sessionId: {
      type: String,
      required: true,
      index: true,
    },

    referrer: {
      type: String,
      default: "",
    },

    userAgent: {
      type: String,
      default: "",
    },

    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Expire old analytics events automatically after 90 days to maintain privacy and database hygiene
analyticsEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

const AnalyticsEvent = mongoose.model("AnalyticsEvent", analyticsEventSchema);

module.exports = AnalyticsEvent;
