const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Returns the last N month labels as ["Nov", "Dec", "Jan", ...]
function getLast6MonthLabels(n = 6) {
  const labels = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(MONTH_ABBR[d.getMonth()]);
  }
  return labels;
}

const MONTHS_WINDOW = 10; // how many months of history the IG/FB graphs show

function transformFB(inputData) {
  let transformedData = {
    fbdata: {
      followers: [],
      avgER: [],
      avgPostReactions: [],
      avgPostComments: [],
      avgReelReactions: [],
      avgPostShares: [],
      postsCount: [],
      qualityScore: [],
      trackingData: [],
    },
  };
  // Only use the last N snapshots
  const fbSlice = inputData?.fbData?.slice(-MONTHS_WINDOW) || [];
  fbSlice.forEach((item) => {
    transformedData.fbdata.followers.push(item?.followers || 0);
    // avgER is stored as a fraction (e.g. 0.003) → show as a percentage.
    transformedData.fbdata.avgER.push((item?.avgER || 0) * 100);
    transformedData.fbdata.avgPostReactions.push(item?.avgPostReactions || 0);
    transformedData.fbdata.avgPostComments.push(item?.avgPostComments || 0);
    transformedData.fbdata.avgReelReactions.push(item?.avgReelReactions || 0);
    transformedData.fbdata.avgPostShares.push(item?.avgPostShares || 0);
    transformedData.fbdata.postsCount.push(item?.postsCount || 0);
    transformedData.fbdata.qualityScore.push((item?.qualityScore || 0) * 100);
    transformedData.fbdata.trackingData.push(item?.trackingData);
  });

  // Compute monthly gained followers from real data before padding
  const fbGained = transformedData.fbdata.followers.map((f, i) =>
    i === 0 ? 0 : (f || 0) - (transformedData.fbdata.followers[i - 1] || 0)
  );

  // Pad to N months
  const fbFields = ["followers", "avgER", "avgPostReactions", "avgPostComments",
                    "avgReelReactions", "avgPostShares", "postsCount", "qualityScore"];
  fbFields.forEach((key) => {
    while (transformedData.fbdata[key].length < MONTHS_WINDOW) transformedData.fbdata[key].unshift(0);
  });
  while (fbGained.length < MONTHS_WINDOW) fbGained.unshift(0);
  transformedData.fbdata.followersGained = fbGained;

  // Always use computed last-N-month labels so X-axis shows real month names
  transformedData.fbdata.trackingData = getLast6MonthLabels(MONTHS_WINDOW);

  return transformedData;
}

function transformYT(data) {
  if (!data || !Array.isArray(data)) data = [];
  const youtubedata = {
    views: [],
    likes: [],
    comments: [],
    shares: [],
    subscribersGained: [],
    subscribersLost: [],
    engagementRate: [],
    trackingData: [],
  };

  // Only use last MONTHS_WINDOW snapshots (matches IG/FB)
  const ytSlice = data.slice(-MONTHS_WINDOW);
  ytSlice.forEach((item) => {
    const { month, views, likes, comments, shares, subscribersGained, subscribersLost } = item;

    youtubedata.views.push(views || 0);
    youtubedata.likes.push(likes || 0);
    youtubedata.comments.push(comments || 0);
    youtubedata.shares.push(shares || 0);
    youtubedata.subscribersGained.push(subscribersGained || 0);
    youtubedata.subscribersLost.push(subscribersLost || 0);

    const er = views > 0
      ? parseFloat(((likes + comments + shares) / views * 100).toFixed(2))
      : 0;
    youtubedata.engagementRate.push(er);

    youtubedata.trackingData.push(month.slice(0, 3));
  });

  // Pad all arrays to MONTHS_WINDOW months with zeros
  const ytFields = ["views", "likes", "comments", "shares", "subscribersGained", "subscribersLost", "engagementRate"];
  ytFields.forEach((key) => {
    while (youtubedata[key].length < MONTHS_WINDOW) youtubedata[key].unshift(0);
  });

  // Net subscribers gained per month (gained - lost)
  youtubedata.subscribersNetGained = youtubedata.subscribersGained.map(
    (g, i) => g - (youtubedata.subscribersLost[i] || 0)
  );

  // Always use last-N-month labels
  youtubedata.trackingData = getLast6MonthLabels(MONTHS_WINDOW);

  return youtubedata;
}

function transformIG(inputData) {
  let transformedData = {
    instadata: {
      followers: [],
      avgInteractions: [],
      avgER: [],
      avgLikes: [],
      avgComments: [],
      postsCount: [],
      qualityScore: [],
      trackingData: [],
    },
  };
  // Only use the last N snapshots
  const igSlice = inputData?.instaData?.slice(-MONTHS_WINDOW) || [];
  igSlice.forEach((item) => {
    transformedData.instadata.followers.push(item?.followers);
    transformedData.instadata.avgComments.push(item?.avgComments);
    transformedData.instadata.trackingData.push(item?.trackingDate);
    // avgER is a fraction (e.g. 0.015) → ×100 for a true percentage (1.5%).
    transformedData.instadata.avgER.push((item?.avgER || 0) * 100);
    transformedData.instadata.avgInteractions.push(item?.avgInteractions);
    transformedData.instadata.avgLikes.push(item?.avgLikes);
    transformedData.instadata.postsCount.push(item?.postsCount || 0);
    transformedData.instadata.qualityScore.push((item?.qualityScore || 0) * 100);
  });

  // Compute monthly gained followers from real data before padding
  const igGained = transformedData.instadata.followers.map((f, i) =>
    i === 0 ? 0 : (f || 0) - (transformedData.instadata.followers[i - 1] || 0)
  );

  // Pad to N months so the graph always shows a full window
  const igFields = ["followers", "avgComments", "avgER", "avgInteractions",
                    "avgLikes", "postsCount", "qualityScore"];
  igFields.forEach((key) => {
    while (transformedData.instadata[key].length < MONTHS_WINDOW) {
      transformedData.instadata[key].unshift(0);
    }
  });
  // Pad gained array and attach
  while (igGained.length < MONTHS_WINDOW) igGained.unshift(0);
  transformedData.instadata.followersGained = igGained;

  // Always use computed last-N-month labels so X-axis shows real month names
  transformedData.instadata.trackingData = getLast6MonthLabels(MONTHS_WINDOW);

  return transformedData;
}

function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return "0";
  let res;
  if (num >= 1000000) {
    res = (num / 1000000).toFixed(1).toString() + "M";
  } else if (num >= 1000) {
    res = (num / 1000).toFixed(1).toString() + "k";
  } else {
    res = num.toString();
  }
  return res;
}

function timeStampFormatter(timestamp){
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}


export { transformFB, transformIG, transformYT, formatNumber, timeStampFormatter, getLast6MonthLabels };
