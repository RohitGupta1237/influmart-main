const axios = require("axios");
const config = require("../config/configs");

// RapidAPI request with automatic key rotation.
// Tries each key in config.X_RAPIDAPI_KEYS; on 429 (quota) or 403 (forbidden)
// it moves to the next key. Other errors are thrown immediately.
const rapidRequest = async (options) => {
  const keys =
    config.X_RAPIDAPI_KEYS && config.X_RAPIDAPI_KEYS.length
      ? config.X_RAPIDAPI_KEYS
      : [config.X_RAPIDAPI_KEY];
  let lastErr;
  for (let i = 0; i < keys.length; i++) {
    try {
      return await axios.request({
        ...options,
        headers: { ...(options.headers || {}), "x-rapidapi-key": keys[i] },
      });
    } catch (e) {
      const status = e?.response?.status;
      lastErr = e;
      // 429 = quota exhausted, 403 = forbidden, 405 = provider disabled access
      // for that key/subscription — in all cases try the next key.
      if (status === 429 || status === 403 || status === 405) {
        console.warn(
          `[rapidRequest] key #${i + 1}/${keys.length} unavailable (status ${status}); trying next key`
        );
        continue;
      }
      throw e; // non-quota error — don't waste other keys
    }
  }
  throw lastErr;
};

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
      "x-rapidapi-host": config.X_RAPIDAPI_HOST_INSTA,
    },
  };

  try {
    const response = await rapidRequest(options);
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

// ---- Instagram historical (6-month) backfill via Retrospective ----
// artemlipko exposes two endpoints on the same host:
//   /community                → Profile-by-URL: cid + current stats + demographics
//   /statistics/retrospective → daily time-series (per-day deltas + cumulative usersCount)
// buildInstagramHistory combines them into up to 6 monthly instaData snapshots
// matching the exact shape InstagramData produces, so the IG graph fills all
// six months instantly (the same way the YouTube Analytics cron backfills ytData).

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// "DD.MM.YYYY" → { year, month(0-11) }
const parseRetroDate = (s) => {
  const [d, m, y] = String(s).split(".").map(Number);
  return { year: y, month: m - 1 };
};

// /community (Profile-by-URL) → raw data object (cid + stats + demographics).
// The artemlipko endpoint is multi-platform: pass any instagram.com OR
// facebook.com URL and it returns that platform's cid (INST:… / FB:…).
const fetchCommunityByUrl = async (url) => {
  const res = await rapidRequest({
    method: "GET",
    url: config.INSTA_ENDPOINT,
    params: { url },
    headers: { "x-rapidapi-host": config.X_RAPIDAPI_HOST_INSTA },
  });
  if (res.status !== 200) return null;
  return res.data?.data || null;
};

const fetchIgProfile = (handle) =>
  fetchCommunityByUrl(`https://www.instagram.com/${handle}/`);

// /statistics/retrospective → daily series array (data.series.current)
const fetchIgRetrospective = async (cid, fromDate, toDate) => {
  const fmt = (dt) =>
    `${String(dt.getDate()).padStart(2, "0")}.${String(dt.getMonth() + 1).padStart(2, "0")}.${dt.getFullYear()}`;
  const res = await rapidRequest({
    method: "GET",
    url: `https://${config.X_RAPIDAPI_HOST_INSTA}/statistics/retrospective`,
    params: { cid, from: fmt(fromDate), to: fmt(toDate) },
    headers: { "x-rapidapi-host": config.X_RAPIDAPI_HOST_INSTA },
  });
  if (res.status !== 200) return [];
  return res.data?.data?.series?.current || [];
};

// Build up to `months` monthly instaData snapshots (oldest → newest).
// Falls back to a single live InstagramData snapshot when the account has no
// cid / a sparse (COLLECTING) history, so nothing breaks for new accounts.
const buildInstagramHistory = async (handle, months = 10) => {
  try {
    const profile = await fetchIgProfile(handle);
    if (!profile || !profile.cid) {
      const snap = await InstagramData(handle);
      return snap && Object.keys(snap).length ? [snap] : [];
    }

    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    const series = await fetchIgRetrospective(profile.cid, from, now);

    // Group daily points by calendar month.
    const buckets = new Map();
    for (const pt of series) {
      const { year, month } = parseRetroDate(pt.date);
      const key = `${year}-${month}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(pt);
    }

    const history = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const days = buckets.get(`${d.getFullYear()}-${d.getMonth()}`);
      if (!days || !days.length) continue; // skip months with no data

      const last = days[days.length - 1];
      const totPosts = days.reduce((s, x) => s + (x.deltaPosts || 0), 0);
      const totLikes = days.reduce((s, x) => s + (x.deltaLikes || 0), 0);
      const totComments = days.reduce((s, x) => s + (x.deltaComments || 0), 0);
      const totInteractions = days.reduce((s, x) => s + (x.deltaInteractions || 0), 0);

      history.push({
        followers: last.usersCount,
        avgER: last.avgER,
        avgInteractions: totPosts ? Math.round(totInteractions / totPosts) : 0,
        avgLikes: totPosts ? Math.round(totLikes / totPosts) : 0,
        avgComments: totPosts ? Math.round(totComments / totPosts) : 0,
        postsCount: totPosts,
        qualityScore: last.qualityScore || 0,
        trackingDate: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
      });
    }

    // Retrospective empty/sparse → fall back to a single live snapshot.
    if (!history.length) {
      const snap = await InstagramData(handle);
      return snap && Object.keys(snap).length ? [snap] : [];
    }

    // Retrospective carries no demographics/tags, but the UI reads those off
    // instaData snapshots by index (e.g. instaData[0]). To match the previous
    // behaviour — where every snapshot stored the current demographics — attach
    // them to ALL months. Only the numeric time-series (followers, avg*) stays
    // per-month so the graph shows real history.
    const demographics = {
      memberCities: profile.membersCities,
      ages: profile.ages,
      genders: profile.genders,
      lastPosts: profile.lastPosts,
      membersReachability: profile.membersReachability,
      tags: profile.tags,
    };
    history.forEach((snap) => Object.assign(snap, demographics));

    // NOTE: the numeric series (followers, avgER, avgLikes, avgComments,
    // avgInteractions, qualityScore) is left as the RETROSPECTIVE value for
    // every month — including the latest — so all points are computed the same
    // way and the last point never "jumps". /community is used ONLY for the
    // demographics the retrospective doesn't provide (attached above).

    return history.slice(-months);
  } catch (error) {
    console.log("[buildInstagramHistory] error:", error.message);
    const snap = await InstagramData(handle);
    return snap && Object.keys(snap).length ? [snap] : [];
  }
};

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
    "x-rapidapi-host": config.X_RAPIDAPI_HOST_FB,
  };

  try {
    // Fetch page info (followers, bio etc.)
    const pageRes = await rapidRequest({
      method: "GET",
      url: config.FB_ENDPOINT,
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
        rapidRequest({
          method: "GET",
          url: `https://${config.X_RAPIDAPI_HOST_FB}/get_facebook_posts_details`,
          params: { link: facebookUrl, timezone: "UTC" }, headers,
        }),
        rapidRequest({
          method: "GET",
          url: `https://${config.X_RAPIDAPI_HOST_FB}/get_facebook_reels_details`,
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

// ---- Facebook historical (6-month) backfill — HYBRID ----
// facebook-pages-scraper2 gives the current post/reel breakdown (reels have no
// history anywhere), while artemlipko's retrospective gives the follower &
// post-engagement trend. We combine them: retrospective builds the monthly
// series, and the scraper snapshot is merged onto the newest month (real reels
// + accurate current values). Falls back to the plain scraper snapshot when the
// account has no cid / a sparse history.
const buildFacebookHistory = async (fbUrl, months = 10) => {
  let scraper = {};
  try {
    scraper = (await facebookData(fbUrl)) || {};
    // facebookData() returns avgER already as a percentage (engagements/
    // followers*100); every other path here (retrospective) stores avgER as a
    // fraction and transformFB multiplies ×100. Normalise the scraper's value
    // to a fraction ONCE so all paths — merge AND fallback — stay consistent
    // and never show a 100×-inflated ER.
    if (typeof scraper.avgER === "number") scraper.avgER = scraper.avgER / 100;
    const profile = await fetchCommunityByUrl(fbUrl);
    if (!profile || !profile.cid) {
      return Object.keys(scraper).length ? [scraper] : [];
    }

    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    const series = await fetchIgRetrospective(profile.cid, from, now);

    const buckets = new Map();
    for (const pt of series) {
      const { year, month } = parseRetroDate(pt.date);
      const key = `${year}-${month}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(pt);
    }

    const history = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const days = buckets.get(`${d.getFullYear()}-${d.getMonth()}`);
      if (!days || !days.length) continue;

      const last = days[days.length - 1];
      const totPosts = days.reduce((s, x) => s + (x.deltaPosts || 0), 0);
      const totLikes = days.reduce((s, x) => s + (x.deltaLikes || 0), 0);
      const totComments = days.reduce((s, x) => s + (x.deltaComments || 0), 0);
      const totShares = days.reduce((s, x) => s + (x.deltaRePosts || 0), 0);

      history.push({
        followers: last.usersCount,
        avgER: last.avgER,
        avgPostReactions: totPosts ? Math.round(totLikes / totPosts) : 0,
        avgPostComments: totPosts ? Math.round(totComments / totPosts) : 0,
        avgPostShares: totPosts ? Math.round(totShares / totPosts) : 0,
        postsCount: totPosts,
        qualityScore: last.qualityScore || 0,
        trackingData: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
      });
    }

    if (!history.length) {
      return Object.keys(scraper).length ? [scraper] : [];
    }

    // Use the scraper ONLY for what the retrospective can't provide: reel-level
    // stats, lastReels, and page meta. The numeric series (followers, avgER,
    // avgPostReactions/Comments/Shares) stays retrospective for EVERY month so
    // all points are apples-to-apples and the latest point never "jumps".
    if (Object.keys(scraper).length) {
      const SCRAPER_ONLY = [
        "avgReelReactions", "avgReelComments", "avgReelShares", "avgReelPlayCount",
        "lastReels", "title", "bio", "category", "image",
      ];
      const last = history[history.length - 1];
      for (const k of SCRAPER_ONLY) {
        if (scraper[k] !== undefined) last[k] = scraper[k];
      }
    }

    return history.slice(-months);
  } catch (error) {
    console.log("[buildFacebookHistory] error:", error.message);
    return Object.keys(scraper).length ? [scraper] : [];
  }
};

// ─────────────────────────────────────────────────────────────────────────
// AI CONTENT INSIGHTS
// Uses artemlipko /posts (multi-platform via cid) to pull recent posts + a
// ready-made `summary` (per-format/hashtag/caption-length ER & grade). Hard
// numbers come from that summary (rule-based, free). Gemini (free tier) reads
// the captions to infer TOPICS and write the recommendation. If the Gemini key
// is missing or rate-limited, we fall back to a rule-based summary — so this
// never breaks and never costs money.
// ─────────────────────────────────────────────────────────────────────────

// /posts → { posts[], summary } for a given cid over a date range.
const fetchPosts = async (cid, fromDate, toDate) => {
  const fmt = (dt) =>
    `${String(dt.getDate()).padStart(2, "0")}.${String(dt.getMonth() + 1).padStart(2, "0")}.${dt.getFullYear()}`;
  const res = await rapidRequest({
    method: "GET",
    url: `https://${config.X_RAPIDAPI_HOST_INSTA}/posts`,
    params: { cid, from: fmt(fromDate), to: fmt(toDate), type: "posts", sort: "date" },
    headers: { "x-rapidapi-host": config.X_RAPIDAPI_HOST_INSTA },
  });
  if (res.status !== 200) return { posts: [], summary: null };
  return { posts: res.data?.data?.posts || [], summary: res.data?.data?.summary || null };
};

// Ask Gemini (free tier) to infer topics + write the coaching summary.
// Returns { summary, recommendations[], topTopics[], weakTopics[] } or null.
const geminiInsight = async ({ platform, formats, captionLength, topPosts, bottomPosts }) => {
  const key = config.GEMINI_API_KEY;
  if (!key) return null;
  const model = config.GEMINI_MODEL || "gemini-2.0-flash";
  const slim = (p) => ({
    type: p.type,
    grade: p.grade,
    engagementRate: p.er,
    views: p.videoViews || null, // reach for videos/reels (null for photos/carousels)
    caption: p.caption,
  });
  const prompt =
    `You are a social media content coach analysing a creator's ${platform} performance.\n` +
    `Return STRICT JSON only: {"summary": string (2-3 sentences, friendly, specific), "recommendations": string[] (3-5 short actionable tips), "topTopics": string[] (themes that perform well), "weakTopics": string[] (themes that underperform)}.\n` +
    `Infer the TOPIC/theme of each post from its caption (e.g. gym/fitness, family, business, motivation, product promo, travel, food).\n` +
    `Judge performance by BOTH engagementRate and views (views = reach for videos/reels). Recommend posting MORE of high-performing topics/formats and LESS of low-performing ones. Be concrete and reference the creator's actual themes.\n\n` +
    `FORMAT PERFORMANCE (engagement rate & grade): ${JSON.stringify(formats)}\n` +
    `CAPTION LENGTH PERFORMANCE: ${JSON.stringify(captionLength)}\n` +
    `TOP POSTS (highest engagement): ${JSON.stringify(topPosts.map(slim))}\n` +
    `WORST POSTS (lowest engagement): ${JSON.stringify(bottomPosts.map(slim))}`;
  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
      },
      { headers: { "Content-Type": "application/json" }, timeout: 20000 }
    );
    const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed.summary !== "string") return null;
    return {
      summary: parsed.summary,
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 5) : [],
      topTopics: Array.isArray(parsed.topTopics) ? parsed.topTopics.slice(0, 6) : [],
      weakTopics: Array.isArray(parsed.weakTopics) ? parsed.weakTopics.slice(0, 6) : [],
    };
  } catch (e) {
    console.warn("[geminiInsight] failed:", e.response?.data?.error?.message || e.message);
    return null;
  }
};

// Free, deterministic fallback when Gemini is unavailable.
const ruleBasedInsight = ({ bestFormat, bestCaptionLength, topHashtags }) => ({
  summary:
    `Your ${bestFormat || "posts"} tend to get the most engagement` +
    (bestCaptionLength ? `, especially with ${bestCaptionLength}-length captions` : "") +
    `. Lean into what's already working and cut the formats that underperform.`,
  recommendations: [
    bestFormat ? `Post more ${bestFormat} — they earn your highest engagement.` : null,
    bestCaptionLength ? `Keep captions ${bestCaptionLength}-length for best results.` : null,
    topHashtags && topHashtags.length
      ? `Reuse your best-performing hashtags: ${topHashtags.slice(0, 3).map((h) => "#" + h.name).join(" ")}.`
      : null,
    `Review your lowest-graded posts and avoid repeating those formats/topics.`,
  ].filter(Boolean),
  topTopics: [],
  weakTopics: [],
});

// Build the full content-insights object for a profile URL (IG/FB/YT).
// months = recency window (default 3). Returns null if no cid / no posts.
const buildContentInsights = async (url, months = 3) => {
  try {
    const profile = await fetchCommunityByUrl(url);
    if (!profile || !profile.cid) return null;

    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    const { posts, summary } = await fetchPosts(profile.cid, from, now);
    if (!posts.length) return null;

    const norm = posts
      .filter((p) => !p.isDeleted && !p.isAd) // exclude deleted + sponsored so advice reflects organic content
      .map((p) => ({
        postUrl: p.postUrl,
        thumbnail: p.postImage,
        caption: (p.text || "").slice(0, 200),
        type: p.type,
        likes: p.likes || 0,
        comments: p.comments || 0,
        videoViews: p.videoViews || 0,
        er: p.er || 0,
        grade: p.mainGrade || "",
        date: p.date,
      }));
    if (!norm.length) return null;

    const byPerf = [...norm].sort((a, b) => (b.er || 0) - (a.er || 0));
    const topPosts = byPerf.slice(0, 5);
    const bottomPosts = byPerf.slice(-5).reverse();

    const formats = (summary?.types || []).map((t) => ({
      name: t.name, count: t.count, er: t.er, grade: t.grade,
    }));
    const bestFormat = [...formats].sort((a, b) => (b.er || 0) - (a.er || 0))[0]?.name || null;

    const captionLength = (summary?.textLength || [])
      .filter((t) => t.count > 0)
      .map((t) => ({ name: t.name, count: t.count, er: t.er, grade: t.grade }));
    const bestCaptionLength = [...captionLength].sort((a, b) => (b.er || 0) - (a.er || 0))[0]?.name || null;

    const hashtags = summary?.hashTags || [];
    const topHashtags = [...hashtags]
      .sort((a, b) => (b.grade || 0) - (a.grade || 0))
      .slice(0, 5)
      .map((h) => ({ name: h.name, er: h.er, grade: h.grade }));
    const weakHashtags = [...hashtags]
      .sort((a, b) => (a.grade || 0) - (b.grade || 0))
      .slice(0, 5)
      .map((h) => ({ name: h.name, er: h.er, grade: h.grade }));

    const platform = String(profile.cid).startsWith("FB")
      ? "Facebook"
      : String(profile.cid).startsWith("YT")
      ? "YouTube"
      : "Instagram";

    let ai = await geminiInsight({ platform, formats, captionLength, topPosts, bottomPosts });
    let source = "gemini";
    if (!ai) {
      ai = ruleBasedInsight({ bestFormat, bestCaptionLength, topHashtags });
      source = "rule-based";
    }

    return {
      generatedAt: new Date().toISOString(),
      window: `last ${months} months`,
      postsAnalyzed: norm.length,
      bestFormat,
      formats,
      bestCaptionLength,
      captionLength,
      topHashtags,
      weakHashtags,
      topPosts,
      bottomPosts,
      ai,
      source,
    };
  } catch (e) {
    console.log("[buildContentInsights] error:", e.message);
    return null;
  }
};

module.exports = {facebookData,InstagramData,InstagramGraphData,trackingData,buildInstagramHistory,buildFacebookHistory,buildContentInsights}


// Facebook
// https://rapidapi.com/ousema.frikha/api/facebook-pages-scraper2/playground/apiendpoint_83045a77-1cfc-47b2-a51c-e9008e6eb5da

// you tube
// https://rapidapi.com/ytjar/api/yt-api/playground/apiendpoint_3d10cfc9-0699-452b-8ed6-eaafb3efafcf

// you tube 2
// https://rapidapi.com/dataverse-dataverse-default/api/youtube-data-apis/playground/apiendpoint_e466b510-e081-4f8a-b480-f80aa19c92b3

// Instagram
// https://rapidapi.com/artemlipko/api/instagram-statistics-api/playground/apiendpoint_68509d50-85d1-4dae-8060-92be061602d3
