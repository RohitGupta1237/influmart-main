const mongoose = require("mongoose");
const InfluencerSignupRequest = require("../model/influencerSignupRequestModel");
const Brand = require("../model/brandDbRequestModel");
const Subscription = require("../model/Subscription");
const Deal = require("../model/Deal");
const SocialVerificationRequest = require("../model/socialVerificationRequest");
const CollabOpenRequest = require("../model/CollabOpenRequest");
const SiteVisit = require("../model/SiteVisit");

// POST /track/visit  (public) — body: { visitorId, path, platform }
// Records one page/screen view. Fire-and-forget from the client.
const trackVisit = async (req, res) => {
  try {
    const { visitorId, path, platform } = req.body || {};
    await SiteVisit.create({
      visitorId: (visitorId || "").slice(0, 64),
      path: (path || "").slice(0, 200),
      platform: platform === "app" ? "app" : "web",
    });
    return res.status(204).end();
  } catch (error) {
    // Never surface tracking errors to the client.
    return res.status(204).end();
  }
};

// Resolve ?period= into a "since" Date. "all" → epoch (no lower bound).
const sinceForPeriod = (period) => {
  const now = new Date();
  switch (period) {
    case "today": {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "all":
    default:
      return new Date(0);
  }
};

// Most collections have no createdAt — use the ObjectId's embedded timestamp so
// we can still count "new in period" without a schema change.
const idSince = (since) =>
  mongoose.Types.ObjectId.createFromTime(Math.floor(since.getTime() / 1000));

// GET /admin/metrics?period=today|7d|30d|all   (admin-only)
const getMetrics = async (req, res) => {
  try {
    const period = ["today", "7d", "30d", "all"].includes(req.query.period)
      ? req.query.period
      : "all";
    const now = new Date();
    const since = sinceForPeriod(period);
    const isAll = period === "all";

    // Date filters (empty for "all" so we count everything).
    const idFilter = isAll ? {} : { _id: { $gte: idSince(since) } };
    const sealedFilter = isAll ? {} : { sealedAt: { $gte: since } };
    const subDateFilter = isAll ? {} : { startDate: { $gte: since } };

    const [
      // Lifetime / point-in-time "stock" metrics (period-independent)
      totalInfluencers,
      totalBrands,
      activeSubscriptions,
      pendingVerifications,
      openApplications,
      // Period-scoped "flow" metrics
      newInfluencers,
      newBrands,
      newPaidSubscriptions,
      dealsSealed,
      gmvAgg,
      pageViews,
      uniqueVisitors,
      appViews,
    ] = await Promise.all([
      InfluencerSignupRequest.countDocuments({}),
      Brand.countDocuments({}),
      Subscription.countDocuments({ endDate: { $gt: now } }),
      SocialVerificationRequest.countDocuments({ status: "pending" }),
      CollabOpenRequest.countDocuments({ status: { $nin: ["rejected", "closed"] } }),
      InfluencerSignupRequest.countDocuments(idFilter),
      Brand.countDocuments(idFilter),
      Subscription.countDocuments({ isFree: { $ne: true }, ...subDateFilter }),
      Deal.countDocuments({ status: "sealed", ...sealedFilter }),
      Deal.aggregate([
        { $match: { status: "sealed", ...sealedFilter } },
        { $group: { _id: null, total: { $sum: "$price" } } },
      ]),
      // Traffic (first-party). "created in period" via createdAt.
      SiteVisit.countDocuments(isAll ? {} : { createdAt: { $gte: since } }),
      SiteVisit.distinct("visitorId", isAll ? {} : { createdAt: { $gte: since } }),
      SiteVisit.countDocuments({
        platform: "app",
        ...(isAll ? {} : { createdAt: { $gte: since } }),
      }),
    ]);

    return res.status(200).json({
      period,
      since,
      generatedAt: now,
      // Absolute totals (ignore the period selector)
      lifetime: {
        totalInfluencers,
        totalBrands,
        totalUsers: totalInfluencers + totalBrands,
        activeSubscriptions,
        pendingVerifications,
        openApplications,
      },
      // Scoped to the selected period ("all" = lifetime)
      window: {
        newInfluencers,
        newBrands,
        newPaidSubscriptions,
        dealsSealed,
        gmv: gmvAgg?.[0]?.total || 0,
      },
      traffic: {
        pageViews,
        uniqueVisitors: uniqueVisitors?.length || 0,
        appViews,
        webViews: Math.max(0, pageViews - appViews),
      },
    });
  } catch (error) {
    console.error("[getMetrics]", error);
    return res.status(500).json({ message: "Could not load metrics" });
  }
};

module.exports = { getMetrics, trackVisit };
