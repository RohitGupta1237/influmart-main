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

function transformFB(inputData) {
  let transformedData = {
    fbdata: {
      followers: [],
      avgER: [],
      avgPostReactions: [],
      avgPostComments: [],
      avgReelReactions: [],
      trackingData: [],
    },
  };
  // Only use the last 6 snapshots
  const fbSlice = inputData?.fbData?.slice(-6) || [];
  fbSlice.forEach((item) => {
    transformedData.fbdata.followers.push(item?.followers || 0);
    transformedData.fbdata.avgER.push(item?.avgER || 0);
    transformedData.fbdata.avgPostReactions.push(item?.avgPostReactions || 0);
    transformedData.fbdata.avgPostComments.push(item?.avgPostComments || 0);
    transformedData.fbdata.avgReelReactions.push(item?.avgReelReactions || 0);
    transformedData.fbdata.trackingData.push(item?.trackingData);
  });

  // Compute monthly gained followers from real data before padding
  const fbGained = transformedData.fbdata.followers.map((f, i) =>
    i === 0 ? 0 : (f || 0) - (transformedData.fbdata.followers[i - 1] || 0)
  );

  // Pad to 6 months
  const fbFields = ["followers", "avgER", "avgPostReactions", "avgPostComments", "avgReelReactions"];
  fbFields.forEach((key) => {
    while (transformedData.fbdata[key].length < 6) transformedData.fbdata[key].unshift(0);
  });
  while (fbGained.length < 6) fbGained.unshift(0);
  transformedData.fbdata.followersGained = fbGained;

  // Always use computed last-6-month labels so X-axis shows real month names
  transformedData.fbdata.trackingData = getLast6MonthLabels(6);

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

  // Only use last 6 snapshots
  const ytSlice = data.slice(-6);
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

  // Pad all arrays to 6 months with zeros
  const ytFields = ["views", "likes", "comments", "shares", "subscribersGained", "subscribersLost", "engagementRate"];
  ytFields.forEach((key) => {
    while (youtubedata[key].length < 6) youtubedata[key].unshift(0);
  });

  // Net subscribers gained per month (gained - lost)
  youtubedata.subscribersNetGained = youtubedata.subscribersGained.map(
    (g, i) => g - (youtubedata.subscribersLost[i] || 0)
  );

  // Always use last-6-month labels
  youtubedata.trackingData = getLast6MonthLabels(6);

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
      trackingData: [],
    },
  };
  // Only use the last 6 snapshots
  const igSlice = inputData?.instaData?.slice(-6) || [];
  igSlice.forEach((item) => {
    transformedData.instadata.followers.push(item?.followers);
    transformedData.instadata.avgComments.push(item?.avgComments);
    transformedData.instadata.trackingData.push(item?.trackingDate);
    transformedData.instadata.avgER.push(item?.avgER * 1000);
    transformedData.instadata.avgInteractions.push(item?.avgInteractions);
    transformedData.instadata.avgLikes.push(item?.avgLikes);
  });

  // Compute monthly gained followers from real data before padding
  const igGained = transformedData.instadata.followers.map((f, i) =>
    i === 0 ? 0 : (f || 0) - (transformedData.instadata.followers[i - 1] || 0)
  );

  // Pad to 6 months so the graph always shows a 6-month window
  while (transformedData.instadata.followers.length < 6) {
    transformedData.instadata.followers.unshift(0);
  }
  while (transformedData.instadata.avgComments.length < 6) {
    transformedData.instadata.avgComments.unshift(0);
  }
  while (transformedData.instadata.avgER.length < 6) {
    transformedData.instadata.avgER.unshift(0);
  }
  while (transformedData.instadata.avgInteractions.length < 6) {
    transformedData.instadata.avgInteractions.unshift(0);
  }
  while (transformedData.instadata.avgLikes.length < 6) {
    transformedData.instadata.avgLikes.unshift(0);
  }
  // Pad gained array and attach
  while (igGained.length < 6) igGained.unshift(0);
  transformedData.instadata.followersGained = igGained;

  // Always use computed last-6-month labels so X-axis shows real month names
  transformedData.instadata.trackingData = getLast6MonthLabels(6);

  return transformedData;
}

function formatNumber(num) {
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
  var milliSeconds=(new Date() - new Date(timestamp))
  if(milliSeconds>=86400000)
      return `${Math.floor(milliSeconds/(24*60*60*1000))} days ago`
  else if(milliSeconds>=3600000)
      return `${Math.floor(milliSeconds/(60*60*1000))} hour ago`
  else
      return `${Math.floor(milliSeconds/(60*1000))} mins ago`
}


export { transformFB, transformIG, transformYT, formatNumber, timeStampFormatter, getLast6MonthLabels };
