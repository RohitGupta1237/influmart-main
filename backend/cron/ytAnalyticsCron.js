const cron = require("node-cron");
const axios = require("axios");
const InfluencerSignupRequest = require("../model/influencerSignupRequestModel");
const { buildContentInsights } = require("../utils/influencerAnalytics");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Exchange refresh token for a new access token
const getAccessToken = async (refreshToken) => {
  const response = await axios.post(
    "https://oauth2.googleapis.com/token",
    new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return response.data.access_token;
};

// Fetch YouTube Analytics — last 10 months monthly breakdown (matches IG/FB)
const fetchAnalytics = async (accessToken) => {
  const now = new Date();
  // month dimension requires BOTH start & end to be the 1st of a month.
  const pad = (n) => String(n).padStart(2, "0");
  const start = new Date(now.getFullYear(), now.getMonth() - 10, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1); // first day of current month
  const startDate = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-01`;
  const endDate = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-01`;

  const response = await axios.get("https://youtubeanalytics.googleapis.com/v2/reports", {
    params: {
      ids: "channel==MINE",
      startDate,
      endDate,
      metrics: "views,estimatedMinutesWatched,likes,dislikes,comments,shares,subscribersGained,subscribersLost",
      dimensions: "month",
      sort: "month",
    },
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const rows = response.data.rows || [];
  const headers = response.data.columnHeaders || [];
  const idx = (name) => headers.findIndex(h => h.name === name);

  return rows.map(row => ({
    month: row[idx("month")],
    views: row[idx("views")] || 0,
    watchTime: row[idx("estimatedMinutesWatched")] || 0,
    likes: row[idx("likes")] || 0,
    comments: row[idx("comments")] || 0,
    shares: row[idx("shares")] || 0,
    subscribersGained: row[idx("subscribersGained")] || 0,
    subscribersLost: row[idx("subscribersLost")] || 0,
  }));
};

// Fetch channel stats (subscriber count, view count, video count)
const fetchChannelStats = async (accessToken, channelId) => {
  const response = await axios.get("https://www.googleapis.com/youtube/v3/channels", {
    params: { part: "statistics", id: channelId },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const stats = response.data.items?.[0]?.statistics;
  if (!stats) throw new Error(`Channel stats not found for ${channelId}`);
  return {
    subscriberCount: parseInt(stats.subscriberCount || 0),
    totalViews: parseInt(stats.viewCount || 0),
    videoCount: parseInt(stats.videoCount || 0),
  };
};

// Fetch recent 5 videos as highlights
const fetchRecentVideos = async (accessToken, channelId) => {
  const response = await axios.get("https://www.googleapis.com/youtube/v3/search", {
    params: { part: "snippet", channelId, order: "date", maxResults: 5, type: "video" },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return (response.data.items || []).map(item => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails.high?.url,
    publishedAt: item.snippet.publishedAt,
  }));
};

// Refresh one influencer's YouTube data (analytics + channel + highlights +
// AI insights) using their stored refresh token, and persist it. Shared by the
// monthly cron and the manual ↻ refresh endpoint. Returns the ytData object.
const refreshYoutubeForInfluencer = async (influencer) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("YouTube OAuth not configured on the server");
  }
  if (!influencer.ytRefreshToken || !influencer.ytChannelId) {
    throw new Error("This account isn't connected to YouTube. Verify YouTube first.");
  }

  const accessToken = await getAccessToken(influencer.ytRefreshToken);
  const [analyticsData, channelStats, highlights] = await Promise.all([
    fetchAnalytics(accessToken).catch((e) => {
      console.warn("[YT] analytics failed:", e.response?.data?.error?.message || e.message);
      return [];
    }),
    fetchChannelStats(accessToken, influencer.ytChannelId),
    fetchRecentVideos(accessToken, influencer.ytChannelId).catch(() => []),
  ]);

  const totalViews = analyticsData.reduce((s, r) => s + r.views, 0);
  const totalWatchTime = analyticsData.reduce((s, r) => s + r.watchTime, 0);
  const totalLikes = analyticsData.reduce((s, r) => s + r.likes, 0);
  const totalComments = analyticsData.reduce((s, r) => s + r.comments, 0);
  const totalShares = analyticsData.reduce((s, r) => s + r.shares, 0);
  const totalSubsGained = analyticsData.reduce((s, r) => s + r.subscribersGained, 0);
  const totalSubsLost = analyticsData.reduce((s, r) => s + r.subscribersLost, 0);
  const engagementRate = totalViews > 0
    ? parseFloat(((totalLikes + totalComments + totalShares) / totalViews * 100).toFixed(2))
    : 0;

  const overAll = {
    totalViews,
    totalWatchTime,
    totalSubscribersGained: totalSubsGained,
    totalSubscribersLost: totalSubsLost,
    totalLikes,
    totalComments,
    totalShares,
    engagementRate,
    subscriberCount: channelStats.subscriberCount,
    videoCount: channelStats.videoCount,
    lastUpdated: new Date().toISOString(),
  };

  const ytData = { overAll, analytics: analyticsData, highlights, ytChannelId: influencer.ytChannelId };
  const ytUpdate = { ytData: [JSON.stringify(ytData)] };

  // AI content insights via artemlipko (non-blocking)
  try {
    const ytInsights = await buildContentInsights(
      `https://www.youtube.com/channel/${influencer.ytChannelId}`,
      3
    );
    if (ytInsights) ytUpdate["aiInsights.youtube"] = ytInsights;
  } catch (e) {
    console.warn(`[YT] insights failed for ${influencer._id}:`, e.message);
  }

  await InfluencerSignupRequest.findByIdAndUpdate(influencer._id, ytUpdate);
  return ytData;
};

// Main job: runs on the 1st of every month at 2am
const startYtAnalyticsCron = () => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn("[YT Cron] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set — cron job will not run");
    return;
  }

  cron.schedule("0 2 1 * *", async () => {
    console.log("[YT Cron] Starting monthly YouTube analytics refresh...");

    const influencers = await InfluencerSignupRequest.find({
      ytRefreshToken: { $nin: [null, ""] },
      ytChannelId: { $nin: [null, ""] },
    }).select("_id ytRefreshToken ytChannelId");

    console.log(`[YT Cron] Found ${influencers.length} influencers with YouTube OAuth tokens`);

    for (const influencer of influencers) {
      try {
        const ytData = await refreshYoutubeForInfluencer(influencer);
        console.log(`[YT Cron] Updated ${influencer._id} — ${ytData.overAll.subscriberCount} subscribers, engagement ${ytData.overAll.engagementRate}%`);
      } catch (err) {
        console.error(`[YT Cron] Failed for influencer ${influencer._id}:`, err.response?.data || err.message);
      }
    }

    console.log("[YT Cron] Monthly refresh complete.");
  });

  console.log("[YT Cron] Scheduled — runs on 1st of every month at 2am");
};

module.exports = { startYtAnalyticsCron, refreshYoutubeForInfluencer };
