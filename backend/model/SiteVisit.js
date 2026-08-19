const mongoose = require("mongoose");

// Lightweight first-party traffic tracking. One row per page/screen view.
// visitorId is an anonymous id persisted on the client (localStorage / AsyncStorage)
// so we can count unique visitors without any third-party analytics.
const siteVisitSchema = new mongoose.Schema(
  {
    visitorId: { type: String, index: true },
    path: { type: String, default: "" },
    platform: { type: String, enum: ["web", "app"], default: "web" },
  },
  { timestamps: true }
);

siteVisitSchema.index({ createdAt: 1 });

module.exports = mongoose.model("SiteVisit", siteVisitSchema);
