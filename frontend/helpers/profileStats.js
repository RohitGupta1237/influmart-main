import { formatNumber } from "./GraphData";

// Average over the real months (ignore zero/empty months).
const avgOf = (arr) => {
  const vals = (arr || []).filter((v) => typeof v === "number" && v > 0);
  return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
};

// Build the scalar stat list ({heading, content}) for a platform from the raw
// social data. Shared by the influencer profile and the analytics dashboard so
// both render the same tiles via <ProfileAnalytics/>.
export function buildStatItems(social, price, platform) {
  if (!social) return [];

  if (platform === "instagram") {
    const insta = social.instaData;
    if (!insta || !insta.length) return [];
    const last = insta[insta.length - 1] || {};
    const ig = (k) => avgOf(insta.map((m) => m?.[k]));
    return [
      { heading: "Followers", content: last.followers ? formatNumber(last.followers) : "N/A" },
      { heading: "Avg Comments", content: ig("avgComments") ? formatNumber(ig("avgComments")) : "N/A" },
      { heading: "Avg Likes", content: ig("avgLikes") ? formatNumber(ig("avgLikes")) : "N/A" },
      { heading: "Avg ER", content: ig("avgER") ? `${(ig("avgER") * 100).toFixed(2)} %` : "N/A" },
      { heading: "Avg Interactions", content: ig("avgInteractions") ? formatNumber(ig("avgInteractions")) : "N/A" },
      { heading: "Price per Post", content: price?.[0]?.ig ? `₹ ${formatNumber(price[0].ig)}` : "N/A" },
    ];
  }

  if (platform === "facebook") {
    const fb = social.fbData;
    if (!fb || !fb.length) return [];
    const last = fb[fb.length - 1] || {};
    const f = (k) => avgOf(fb.map((m) => m?.[k]));
    return [
      { heading: "Followers", content: last.followers ? formatNumber(last.followers) : "N/A" },
      { heading: "Avg Post Reactions", content: f("avgPostReactions") ? formatNumber(f("avgPostReactions")) : "N/A" },
      { heading: "Avg Post Comments", content: f("avgPostComments") ? formatNumber(f("avgPostComments")) : "N/A" },
      { heading: "Avg Post Shares", content: f("avgPostShares") ? formatNumber(f("avgPostShares")) : "N/A" },
      { heading: "Avg Reel Reactions", content: f("avgReelReactions") ? formatNumber(f("avgReelReactions")) : "N/A" },
      { heading: "Avg Engagement Rate", content: f("avgER") ? `${(f("avgER") * 100).toFixed(2)} %` : "N/A" },
      { heading: "Price per Post", content: price?.[0]?.fb ? `₹ ${formatNumber(price[0].fb)}` : "N/A" },
    ];
  }

  // youtube — ytData may be a JSON string with an overAll block.
  let yt = social.ytData;
  if (typeof yt === "string") { try { yt = JSON.parse(yt); } catch (_) { yt = null; } }
  const o = yt?.overAll || {};
  return [
    { heading: "Total Views", content: o.totalViews != null ? formatNumber(o.totalViews) : "N/A" },
    { heading: "Total Watch Time", content: o.totalWatchTime != null ? formatNumber(o.totalWatchTime) : "N/A" },
    { heading: "Total Likes", content: o.totalLikes != null ? formatNumber(o.totalLikes) : "N/A" },
    { heading: "Total Comments", content: o.totalComments != null ? formatNumber(o.totalComments) : "N/A" },
    { heading: "Subscriber Gain", content: o.totalSubscribersGained != null ? formatNumber(o.totalSubscribersGained) : "N/A" },
    { heading: "Engagement Rate", content: o.engagementRate != null ? `${formatNumber(o.engagementRate)}` : "N/A" },
    { heading: "Price per Video", content: price?.[0]?.yt ? formatNumber(price[0].yt) : "N/A" },
  ];
}
