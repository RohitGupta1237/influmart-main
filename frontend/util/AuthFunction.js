import AsyncStorage from "@react-native-async-storage/async-storage";

// Youtube analyticts funtion

const fetchYouTubeAnalytics = async () => {
  const accessToken = await AsyncStorage.getItem("ytAccessToken");
  const channelId = await AsyncStorage.getItem("ytChannelId");

  // Set endDate to the first day of the current month
  const endDate = new Date();
  endDate.setDate(1);
  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth() + 1;

  // Set startDate to the first day of the month 6 months ago
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);
  startDate.setDate(1);
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth() + 1;

  // Fetch data with additional metrics
  const response = await fetch(
    `https://youtubeanalytics.googleapis.com/v2/reports?dimensions=month&endDate=${endYear}-${String(
      endMonth
    ).padStart(
      2,
      "0"
    )}-01&ids=channel==${channelId}&metrics=views,estimatedMinutesWatched,subscribersGained,subscribersLost,likes,comments,shares&startDate=${startYear}-${String(
      startMonth
    ).padStart(2, "0")}-01`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await response.json();

  // Initialize an array to hold data for each month
  const formattedData = [];
  let currentDate = new Date(startDate);

  // Create a map of the fetched data for quick access
  const dataMap = new Map(data.rows.map((row) => [row[0], row]));

  // Loop through the 6 months to ensure all months are covered
  while (currentDate < endDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.toLocaleString("default", { month: "long" });
    const monthKey = `${year}-${String(currentDate.getMonth() + 1).padStart(
      2,
      "0"
    )}`;

    // Check if the data for the current month exists in the dataMap
    const row = dataMap.get(monthKey);
    const views = row ? row[1] : 0;
    const likes = row ? row[5] : 0;
    const comments = row ? row[6] : 0;
    const shares = row ? row[7] : 0;

    // Calculate engagement rate
    const engagementRate = views ? (likes + comments + shares) / views : 0;

    formattedData.push({
      month: `${month} ${year}`,
      views,
      watchTime: row ? row[2] : 0,
      subscribersGained: row ? row[3] : 0,
      subscribersLost: row ? row[4] : 0,
      likes,
      comments,
      shares,
      engagementRate: engagementRate.toFixed(2),
    });

    // Move to the next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  return formattedData;
};

// Youtube analyticts funtion overall

const fetchYouTubeAnalyticsOverAll = async () => {
  const accessToken = await AsyncStorage.getItem("ytAccessToken");
  const channelId = await AsyncStorage.getItem("ytChannelId");

  // Set endDate to the first day of the current month
  const endDate = new Date();
  endDate.setDate(1);
  const endYear = endDate.getFullYear();
  const endMonth = String(endDate.getMonth() + 1).padStart(2, "0");
  const formattedEndDate = `${endYear}-${endMonth}-01`;

  // Set startDate to 6 months before endDate
  const startDate = new Date(endDate);
  startDate.setMonth(startDate.getMonth() - 9);
  const startYear = startDate.getFullYear();
  const startMonth = String(startDate.getMonth() + 1).padStart(2, "0");
  const formattedStartDate = `${startYear}-${startMonth}-01`;

  // Fetch data with additional metrics
  const response = await fetch(
    `https://youtubeanalytics.googleapis.com/v2/reports?dimensions=month&ids=channel==${channelId}&metrics=views,estimatedMinutesWatched,subscribersGained,subscribersLost,likes,comments,shares&startDate=${formattedStartDate}&endDate=${formattedEndDate}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await response.json();

  // Check if there is any error in the response
  if (data.error) {
    console.error(data.error);
    throw new Error(data.error.message);
  }

  // Initialize variables to accumulate data
  let totalViews = 0;
  let totalWatchTime = 0;
  let totalSubscribersGained = 0;
  let totalSubscribersLost = 0;
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;
  let monthsCount = 0;

  // Accumulate data across the last 6 months
  data.rows.forEach(row => {
    totalViews += row[1] || 0;
    totalWatchTime += row[2] || 0;
    totalSubscribersGained += row[3] || 0;
    totalSubscribersLost += row[4] || 0;
    totalLikes += row[5] || 0;
    totalComments += row[6] || 0;
    totalShares += row[7] || 0;
    monthsCount++;
  });

  // Calculate engagement rate
  const engagementRate = totalViews ? ((totalLikes + totalComments + totalShares) / totalViews) : 0;
  const overallData = {
    totalComments,
    totalLikes,
    totalShares,
    totalSubscribersGained,
    totalSubscribersLost,
    totalViews,
    totalWatchTime,
    engagementRate
  }
  console.log("overall",overallData)
  return overallData;
};


// Youtube Highlight Videos

const fetchRecentHighlightVideos = async () => {
  const accessToken = await AsyncStorage.getItem("ytAccessToken");
  const channelId = await AsyncStorage.getItem("ytChannelId");
  // 1. Get the channel's upload playlist ID
  const channelResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=YOUR_API_KEY`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const channelData = await channelResponse.json();
  const uploadPlaylistId =
    channelData.items[0].contentDetails.relatedPlaylists.uploads;

  // 2. Fetch the most recent videos from the playlist
  const videosResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadPlaylistId}&maxResults=3&key=YOUR_API_KEY`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const videosData = await videosResponse.json();

  // 3. Map the response to extract relevant video details
  const highlightVideos = videosData.items.map((item) => ({
    videoId: item.contentDetails.videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnail: item.snippet.thumbnails.high.url,
    publishedAt: item.snippet.publishedAt,
  }));

  console.log("Recent Highlight Videos", highlightVideos);
  return highlightVideos;
};

export { fetchYouTubeAnalytics, fetchRecentHighlightVideos, fetchYouTubeAnalyticsOverAll };
