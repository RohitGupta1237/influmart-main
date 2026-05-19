const axios = require("axios");
const config = require("../config/configs");

const trackingData = () => {
  const now = new Date();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentMonthName = monthNames[now.getMonth()];
  const currentYear = now.getFullYear();
  const formattedDate = `${currentMonthName} ${currentYear}`;
  return formattedDate;
};

//Instagram
const InstagramData = async (instagramId) => {
  const options = {
    method: 'GET',
    url: config.INSTA_ENDPOINT,
    params: {
      url: `https://www.instagram.com/${instagramId}/`
    },
    headers: {
      "x-rapidapi-key": config.X_RAPIDAPI_KEY,
      "x-rapidapi-host": config.X_RAPIDAPI_HOST_INSTA,
    },
  };
  
  try {
    const response = await axios.request(options);
    console.log(`[InstagramData] handle=${instagramId} status=${response.status} keys=${Object.keys(response.data || {}).join(",")}`);
    console.log(`[InstagramData] data keys=${Object.keys(response.data?.data || {}).join(",")}`);
    if(response.status !== 200) return {}
    const data = response.data?.data
    const track = trackingData();
    const store = {
      followers: data?.usersCount,
      avgER: data?.avgER,
      avgInteractions: data?.avgInteractions,
      avgLikes: data?.avgLikes,
      avgComments: data?.avgComments,
      memberCities:data?.membersCities,
      ages: data?.ages,
      genders: data?.genders,
      lastPosts: data?.lastPosts,
      membersReachability: data?.membersReachability,
      tags: data?.tags,
      trackingDate: track,
    };
    return store
  } catch (error) {
    console.log(error);
    return {};
  }
};

// Fetch Instagram analytics directly from Instagram Graph API
// Works only for Business/Creator accounts linked to a Facebook Page
// igAccountId = the numeric Instagram Business Account ID (from Graph API)
// accessToken = long-lived user access token
const InstagramGraphData = async (igAccountId, accessToken) => {
  try {
    const track = trackingData();

    // 1. Basic profile — followers, media count
    const profileRes = await axios.get(`https://graph.instagram.com/v19.0/me`, {
      params: { fields: "username,followers_count,media_count,biography", access_token: accessToken },
    });
    const profile = profileRes.data;
    const followers = profile.followers_count || 0;

    // 2. Recent media — calculate avg likes, comments, ER
    let avgLikes = 0, avgComments = 0, avgInteractions = 0, avgER = 0, lastPosts = [];
    try {
      const mediaRes = await axios.get(`https://graph.instagram.com/v19.0/me/media`, {
        params: {
          fields: "like_count,comments_count,timestamp,media_url,thumbnail_url,permalink,caption",
          limit: 20,
          access_token: accessToken,
        },
      });
      const posts = mediaRes.data?.data || [];
      if (posts.length > 0) {
        const totalLikes = posts.reduce((s, p) => s + (p.like_count || 0), 0);
        const totalComments = posts.reduce((s, p) => s + (p.comments_count || 0), 0);
        avgLikes = Math.round(totalLikes / posts.length);
        avgComments = Math.round(totalComments / posts.length);
        avgInteractions = avgLikes + avgComments;
        avgER = followers > 0 ? parseFloat(((avgInteractions / followers) * 100).toFixed(2)) : 0;
        lastPosts = posts.slice(0, 5).map((p) => ({
          url: p.permalink,
          thumbnail: p.thumbnail_url || p.media_url,
          caption: p.caption?.slice(0, 100),
          likes: p.like_count,
          comments: p.comments_count,
          timestamp: p.timestamp,
        }));
      }
    } catch (e) {
      console.warn("[InstagramGraphData] Media fetch failed:", e.message);
    }

    // 3. Audience demographics — requires instagram_manage_insights + 100+ followers
    let memberCities = null, genders = null, ages = null;
    try {
      const insightsRes = await axios.get(`https://graph.instagram.com/v19.0/me/insights`, {
        params: { metric: "audience_city,audience_gender_age", period: "lifetime", access_token: accessToken },
      });
      const insightData = insightsRes.data?.data || [];

      const cityData = insightData.find((d) => d.name === "audience_city");
      const genderAgeData = insightData.find((d) => d.name === "audience_gender_age");

      if (cityData?.values?.[0]?.value) {
        const cityObj = cityData.values[0].value;
        const total = Object.values(cityObj).reduce((s, v) => s + v, 0);
        memberCities = Object.entries(cityObj)
          .map(([city, count]) => ({
            city,
            percent: total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0,
          }))
          .sort((a, b) => b.percent - a.percent)
          .slice(0, 10);
      }

      if (genderAgeData?.values?.[0]?.value) {
        const gaObj = genderAgeData.values[0].value;
        const total = Object.values(gaObj).reduce((s, v) => s + v, 0);
        let femaleTotal = 0, maleTotal = 0;
        const ageGroups = {};
        Object.entries(gaObj).forEach(([key, count]) => {
          const [gender, ageRange] = key.split(".");
          if (gender === "F") femaleTotal += count;
          if (gender === "M") maleTotal += count;
          if (!ageGroups[ageRange]) ageGroups[ageRange] = 0;
          ageGroups[ageRange] += count;
        });
        genders = {
          female: total > 0 ? parseFloat(((femaleTotal / total) * 100).toFixed(1)) : 0,
          male: total > 0 ? parseFloat(((maleTotal / total) * 100).toFixed(1)) : 0,
        };
        ages = Object.entries(ageGroups)
          .map(([range, count]) => ({
            range,
            percent: total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0,
          }))
          .sort((a, b) => b.percent - a.percent);
      }
    } catch (e) {
      console.warn("[InstagramGraphData] Audience insights failed:", e.response?.data?.error?.message || e.message);
    }

    console.log(`[InstagramGraphData] igId=${igAccountId} followers=${followers} avgLikes=${avgLikes} avgComments=${avgComments} cities=${memberCities?.length || 0}`);

    return {
      followers,
      avgER,
      avgInteractions,
      avgLikes,
      avgComments,
      memberCities,
      ages,
      genders,
      lastPosts,
      membersReachability: null,
      tags: null,
      trackingDate: track,
      source: "graph_api",
    };
  } catch (err) {
    console.error("[InstagramGraphData] Error:", err.response?.data || err.message);
    return null;
  }
};

//InstagramData("mrbeast");

// //yt-api
// const YoutubeData = async (youtubeId) => {
//   const option = {
//     method: "GET",
//     url: config.YT_ENDPOINT,
//     params: {
//       forUsername: youtubeId,
//     },
//     headers: {
//       "x-rapidapi-key": config.X_RAPIDAPI_KEY,
//       "x-rapidapi-host": config.X_RAPIDAPI_HOST_YT,
//     },
//   };

//   try {
//     const response = await axios.request(option);
//     if(response.status !== 200) return {}
//     const _data = response.data?.meta;
//     const track = trackingData()
//     const store = {
//       channelId:_data?.channelId,
//       lastPost: [],
//       popularVideos: [],
//       popularVideo: {},
//       trackingData: track,
//     };
//     const popularVideosListing = response.data?.data?.find(
//       (listing) =>
//         listing.type === "video_listing" && listing.title === "Popular videos"
//     );
//     store.lastPost = response.data?.data[1];
//     store.popularVideos = popularVideosListing;
//     if (
//       popularVideosListing &&
//       popularVideosListing.data &&
//       popularVideosListing.data.length > 0
//     ) {
//       let maxViewCount = 0;
//       let mostPopularVideo = null;

//       popularVideosListing.data.forEach((video) => {
//         const viewCount = parseInt(video.viewCount.replace(/,/g, ""), 10); // Remove commas and convert to integer
//         if (viewCount > maxViewCount) {
//           maxViewCount = viewCount;
//           mostPopularVideo = video;
//         }
//       });

//       if (mostPopularVideo) {
//         store.popularVideo = {
//           videoId: mostPopularVideo.videoId,
//           title: mostPopularVideo.title,
//           viewCount: mostPopularVideo.viewCount,
//         };
//       } else {
//         console.log('No videos found in the "Popular videos" listing.');
//       }
//     } else {
//       console.log('No "Popular videos" listing found.');
//     }
//     const final = await YoutubeStats(store)
//     return final
//   } catch (error) {
//     console.log(error);
//     return {};
//   }
// };

// //YoutubeData("@MrBeast")

// const YoutubeStats = async (store) =>{
//   const options = {
//     method: 'POST',
//     url: config.YT_STAT_ENDPOINT,
//     headers: {
//       'x-rapidapi-key': config.X_RAPIDAPI_KEY,
//       'x-rapidapi-host': config.X_RAPIDAPI_HOST_YT_STAT,
//       'Content-Type': 'application/json'
//     },
//     data: {
//       id: store.channelId,
//       part: [
//         'general',
//         'statistics',
//         'content'
//       ]
//     }
//   };
  
//   try {
//     const response = await axios.request(options);
//     const data = response.data
//     const final = {...store, videoCount: data?.videoCount,viewCount: data?.viewCount,subscriberCount:data?.subscriberCount}
//     return final
//   } catch (error) {
//     console.log(error);
//     return {};
//   }
// }

//facebook
const facebookData = async (facebookUrl) => {
  const headers = {
    "x-rapidapi-key": config.X_RAPIDAPI_KEY,
    "x-rapidapi-host": config.X_RAPIDAPI_HOST_FB,
  };

  try {
    // Fetch page info (followers, bio etc.)
    const pageRes = await axios.get(config.FB_ENDPOINT, {
      params: { link: facebookUrl },
      headers,
    });
    if (pageRes.status !== 200) return {};
    const _data = pageRes.data[0];
    const track = trackingData();

    // Fetch posts and reels separately for engagement analytics
    const followers = _data?.followers_count || 1;
    let avgPostReactions = 0, avgPostComments = 0, avgPostShares = 0;
    let avgReelReactions = 0, avgReelComments = 0, avgReelShares = 0, avgReelPlayCount = 0;
    let avgER = 0, lastReels = [];

    try {
      const [postsRes, reelsRes] = await Promise.allSettled([
        axios.get(`https://${config.X_RAPIDAPI_HOST_FB}/get_facebook_posts_details`, {
          params: { link: facebookUrl, timezone: "UTC" }, headers,
        }),
        axios.get(`https://${config.X_RAPIDAPI_HOST_FB}/get_facebook_reels_details`, {
          params: { link: facebookUrl }, headers,
        }),
      ]);

      const posts = postsRes.status === "fulfilled" ? (postsRes.value.data?.data?.posts || []) : [];
      const reels = reelsRes.status === "fulfilled" ? (reelsRes.value.data?.data?.reels || []) : [];

      // Posts averages
      if (posts.length > 0) {
        const totR = posts.reduce((s, p) => s + (p.reactions?.total_reaction_count || 0), 0);
        const totC = posts.reduce((s, p) => s + (parseInt(p.details?.comments_count) || 0), 0);
        const totS = posts.reduce((s, p) => {
          const sc = p.details?.share_count || "0";
          return s + (parseInt(sc.toString().replace(/[^0-9]/g, "")) || 0);
        }, 0);
        avgPostReactions = Math.round(totR / posts.length);
        avgPostComments = Math.round(totC / posts.length);
        avgPostShares = Math.round(totS / posts.length);
      }

      // Reels averages (last 10 only)
      if (reels.length > 0) {
        const last10 = reels.slice(0, 10);
        const totR = last10.reduce((s, r) => s + (r.reactions_count || 0), 0);
        const totC = last10.reduce((s, r) => s + (r.comments_count || 0), 0);
        const totS = last10.reduce((s, r) => s + (r.reshare_count || 0), 0);
        const totP = last10.reduce((s, r) => s + (r.play_count || 0), 0);
        avgReelReactions = Math.round(totR / last10.length);
        avgReelComments = Math.round(totC / last10.length);
        avgReelShares = Math.round(totS / last10.length);
        avgReelPlayCount = Math.round(totP / last10.length);
      }

      // Overall ER across both
      const totalEngagements = (avgPostReactions + avgPostComments + avgReelReactions + avgReelComments) / 2;
      avgER = parseFloat((totalEngagements / followers * 100).toFixed(2));

      lastReels = reels.slice(0, 5).map(r => ({
        postId: r.post_id,
        url: r.url,
        description: r.description?.slice(0, 100),
        thumbnail: r.thumbnail_uri,
        playCount: r.play_count,
        reactions: r.reactions_count,
        comments: r.comments_count,
        shares: r.reshare_count,
        publishTime: r.timestamp,
      }));
    } catch (e) {
      console.warn("[facebookData] Posts/Reels fetch failed:", e.message);
    }

    const store = {
      followers: _data?.followers_count,
      title: _data?.title,
      bio: _data?.bio,
      category: _data?.category,
      image: _data?.image,
      avgPostReactions,
      avgPostComments,
      avgPostShares,
      avgReelReactions,
      avgReelComments,
      avgReelShares,
      avgReelPlayCount,
      avgER,
      lastReels,
      trackingData: track,
    };
    return store;
  } catch (error) {
    console.log(error);
    return {};
  }
};

//facebookData("https://www.facebook.com/MrBeast6000");

module.exports = {facebookData,InstagramData,InstagramGraphData,trackingData}


// Facebook
// https://rapidapi.com/ousema.frikha/api/facebook-pages-scraper2/playground/apiendpoint_83045a77-1cfc-47b2-a51c-e9008e6eb5da

// you tube
// https://rapidapi.com/ytjar/api/yt-api/playground/apiendpoint_3d10cfc9-0699-452b-8ed6-eaafb3efafcf

// you tube 2
// https://rapidapi.com/dataverse-dataverse-default/api/youtube-data-apis/playground/apiendpoint_e466b510-e081-4f8a-b480-f80aa19c92b3

// Instagram
// https://rapidapi.com/artemlipko/api/instagram-statistics-api/playground/apiendpoint_68509d50-85d1-4dae-8060-92be061602d3
