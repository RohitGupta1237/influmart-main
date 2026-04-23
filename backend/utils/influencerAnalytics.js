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

      // Reels averages
      if (reels.length > 0) {
        const totR = reels.reduce((s, r) => s + (r.reactions_count || 0), 0);
        const totC = reels.reduce((s, r) => s + (r.comments_count || 0), 0);
        const totS = reels.reduce((s, r) => s + (r.reshare_count || 0), 0);
        const totP = reels.reduce((s, r) => s + (r.play_count || 0), 0);
        avgReelReactions = Math.round(totR / reels.length);
        avgReelComments = Math.round(totC / reels.length);
        avgReelShares = Math.round(totS / reels.length);
        avgReelPlayCount = Math.round(totP / reels.length);
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

module.exports = {facebookData,InstagramData,trackingData}


// Facebook
// https://rapidapi.com/ousema.frikha/api/facebook-pages-scraper2/playground/apiendpoint_83045a77-1cfc-47b2-a51c-e9008e6eb5da

// you tube
// https://rapidapi.com/ytjar/api/yt-api/playground/apiendpoint_3d10cfc9-0699-452b-8ed6-eaafb3efafcf

// you tube 2
// https://rapidapi.com/dataverse-dataverse-default/api/youtube-data-apis/playground/apiendpoint_e466b510-e081-4f8a-b480-f80aa19c92b3

// Instagram
// https://rapidapi.com/artemlipko/api/instagram-statistics-api/playground/apiendpoint_68509d50-85d1-4dae-8060-92be061602d3
