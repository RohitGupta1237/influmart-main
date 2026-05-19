const express = require("express");
const passport = require("passport");
const config = require("../config/configs");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const InstagramStrategy = require("passport-instagram").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const session = require("express-session");
const morgan = require("morgan");
const router = express.Router();
const mongoose = require("mongoose");
const axios = require("axios");
const crypto = require("crypto");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const TWITTER_REDIRECT_URI = `${BASE_URL}/auth/twitter/callback`;
// In-memory store for PKCE verifiers keyed by state (expires after 10 minutes)
const twitterStateMap = new Map();

const YOUTUBE_REDIRECT_URI = `${BASE_URL}/auth/youtube/callback`;

const FB_APP_ID = process.env.FACEBOOK_APP_ID;
const FB_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const FACEBOOK_REDIRECT_URI = `${BASE_URL}/auth/facebook/callback`;
const INSTAGRAM_REDIRECT_URI = `${BASE_URL}/auth/instagram/callback`;
const facebookStateMap = new Map();
const instagramStateMap = new Map();
// In-memory store: state → { influencerId } for YouTube OAuth
const youtubeStateMap = new Map();
// Cache for Instagram Graph API analytics fetched during OAuth callback
// keyed by lowercase igHandle, TTL 30 minutes
const instagramAnalyticsCache = new Map();
const InfluencerSignupRequest = require("../model/influencerSignupRequestModel");
const { InstagramData, InstagramGraphData, facebookData, trackingData } = require("../utils/influencerAnalytics");

const User = mongoose.model(
  "User",
  new mongoose.Schema({
    test: {},
    test2: String
  })
);
// Use morgan to log requests
router.use(morgan("combined"));

router.use(
  session({
    secret: config.JWT_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production" },
  })
);

router.use(passport.initialize());
router.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID:
        process.env.GOOGLE_CLIENT_ID ||
        "329932494226-rkpausht5lbbm9umvspatt9973pco2q6.apps.googleusercontent.com",
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET ||
        "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",
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log("Google Profile:", profile);
        const user = new User({
          test: profile,
          test2: JSON.stringify(profile)
        });
        await user.save();
      console.log("Authenticated User:", user);
      return done(null, user);
    }
  )
);

passport.use(
  new InstagramStrategy(
    {
      clientID: process.env.INSTAGRAM_CLIENT_ID || "your_instagram_client_id",
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || "your_instagram_client_secret",
      callbackURL: "/auth/instagram/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log("Instagram Profile:", profile);
      const user = new User({
        test: profile,
        test2: JSON.stringify(profile)
      });
      await user.save();
      return done(null, user);
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID || "your_facebook_app_id",
      clientSecret: process.env.FACEBOOK_APP_SECRET || "your_facebook_app_secret",
      callbackURL: "/auth/facebook/callback",
      profileFields: ["id", "displayName", "photos", "email"]
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log("Facebook Profile:", profile);
      const user = new User({
        test: profile,
        test2: JSON.stringify(profile)
      });
      await user.save();
      return done(null, user);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

router.get(
  "/auth/google",
  (req, res, next) => {
    console.log("Auth Request to Google:", req.url);
    next();
  },
  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/youtube.readonly",
    ],
  })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect(`influmart://auth?token=${req.user.token}`);
  }
);

// Facebook OAuth — Step 1: redirect to Facebook login
// influencerId param is optional; pass "none" during signup (no DB save needed)
router.get("/auth/facebook", (req, res) => {
  const { state, influencerId, redirectUri, fbHandle } = req.query;
  if (!state) return res.status(400).send("Missing state");

  facebookStateMap.set(state, { influencerId: influencerId || "none", redirectUri: redirectUri || "influmart://auth", fbHandle: fbHandle || "" });
  setTimeout(() => facebookStateMap.delete(state), 10 * 60 * 1000);

  const params = new URLSearchParams({
    client_id: FB_APP_ID,
    redirect_uri: FACEBOOK_REDIRECT_URI,
    state,
    scope: "public_profile,pages_show_list,pages_read_engagement",
    response_type: "code",
  });

  res.redirect(`https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`);
});

// Facebook OAuth — Step 2: exchange code, verify identity, deep-link back
router.get("/auth/facebook/callback", async (req, res) => {
  const { code, state, error } = req.query;
  if (error || !code || !state) {
    return res.redirect("influmart://auth?error=facebook_auth_failed");
  }

  const stateData = facebookStateMap.get(state);
  facebookStateMap.delete(state);
  if (!stateData) return res.redirect("influmart://auth?error=facebook_state_mismatch");

  const { influencerId, redirectUri: fbRedirectUri, fbHandle } = stateData;
  const appRedirectUri = fbRedirectUri || "influmart://auth";

  try {
    // Exchange code for short-lived access token
    const tokenRes = await axios.get("https://graph.facebook.com/v19.0/oauth/access_token", {
      params: { client_id: FB_APP_ID, client_secret: FB_APP_SECRET, redirect_uri: FACEBOOK_REDIRECT_URI, code },
    });
    const shortToken = tokenRes.data.access_token;
    if (!shortToken) return res.redirect("influmart://auth?error=facebook_token_failed");

    // Exchange for long-lived token (~60 days)
    let longToken = shortToken;
    try {
      const longTokenRes = await axios.get("https://graph.facebook.com/v19.0/oauth/access_token", {
        params: { grant_type: "fb_exchange_token", client_id: FB_APP_ID, client_secret: FB_APP_SECRET, fb_exchange_token: shortToken },
      });
      longToken = longTokenRes.data.access_token || shortToken;
    } catch (e) {
      console.warn("[Facebook OAuth] Long-lived token exchange failed, using short-lived token:", e.message);
    }

    // Fetch authenticated user's ID and name
    const userRes = await axios.get("https://graph.facebook.com/me", {
      params: { fields: "id,name", access_token: longToken },
    });
    const { id: myFbId, name: fbName } = userRes.data;

    // Fetch Facebook pages — extract page usernames from links to verify ownership
    let fbDataArr = [];
    let fbUsername = null; // username of the page that matches the entered handle
    let fbLinked = false;
    const { fbHandle } = stateData; // entered handle from frontend

    try {
      const pagesRes = await axios.get("https://graph.facebook.com/me/accounts", {
        params: {
          fields: "id,name,username,fan_count,followers_count,link,posts{likes.summary(true),comments.summary(true)}",
          access_token: longToken,
        },
      });
      for (const page of (pagesRes.data.data || [])) {
        // Extract page username from link e.g. "https://www.facebook.com/mypagename" → "mypagename"
        const pageUsername = page.username ||
          (page.link ? page.link.replace(/\/$/, "").split("/").pop() : null);

        // Check if this page matches the entered handle
        if (fbHandle && pageUsername && fbHandle.toLowerCase() === pageUsername.toLowerCase()) {
          fbUsername = pageUsername;
          fbLinked = true;
        }

        // Build analytics entry for this page
        let pageEntry = null;
        if (page.link) {
          try { pageEntry = await facebookData(page.link); } catch (e) {}
        }
        if (!pageEntry || Object.keys(pageEntry).length === 0) {
          const followers = page.fan_count || page.followers_count || 0;
          const postsData = page.posts?.data || [];
          let avgLikes = 0, avgComments = 0, avgER = 0;
          if (postsData.length > 0) {
            const totalLikes = postsData.reduce((s, p) => s + (p.likes?.summary?.total_count || 0), 0);
            const totalComments = postsData.reduce((s, p) => s + (p.comments?.summary?.total_count || 0), 0);
            avgLikes = Math.round(totalLikes / postsData.length);
            avgComments = Math.round(totalComments / postsData.length);
            avgER = followers > 0 ? parseFloat(((totalLikes + totalComments) / postsData.length / followers).toFixed(4)) : 0;
          }
          pageEntry = { pageId: page.id, pageName: page.name, followers, likes: page.fan_count || 0, avgLikes, avgComments, avgER, trackingData: trackingData() };
        }
        fbDataArr.push(pageEntry);
      }
    } catch (e) {
      console.warn("[Facebook OAuth] Pages/analytics fetch failed:", e.message);
    }

    // If no page matched, look up the entered handle directly via Graph API
    // If it resolves to the same user ID as the authenticated user → they own it
    if (!fbLinked && fbHandle && myFbId) {
      try {
        const lookupRes = await axios.get(`https://graph.facebook.com/v19.0/${encodeURIComponent(fbHandle)}`, {
          params: { fields: "id", access_token: longToken },
        });
        if (lookupRes.data?.id && lookupRes.data.id === myFbId) {
          fbUsername = fbHandle;
          fbLinked = true;
        }
      } catch (e) {
        console.warn("[Facebook OAuth] Username lookup failed:", e.message);
      }
    }

    console.log("[Facebook OAuth] myFbId:", myFbId, "| enteredHandle:", fbHandle, "| resolvedUsername:", fbUsername, "| fbLinked:", fbLinked);

    // Save to DB if this is a profile edit (influencerId exists)
    if (influencerId && influencerId !== "none") {
      try {
        const update = { fbAccessToken: longToken };
        if (fbUsername) update.facebookProfile = fbUsername;
        if (fbDataArr.length > 0) update.fbData = fbDataArr;
        await InfluencerSignupRequest.findByIdAndUpdate(influencerId, update);
      } catch (dbErr) {
        console.warn("[Facebook OAuth] DB save failed:", dbErr.message);
      }
    }

    res.redirect(
      `${appRedirectUri}?fbSuccess=true&fbUsername=${encodeURIComponent(fbUsername || "")}&fbLinked=${fbLinked}&fbName=${encodeURIComponent(fbName || "")}&state=${encodeURIComponent(state)}`
    );
  } catch (err) {
    console.error("[Facebook OAuth callback] Error:", err.response?.data || err.message);
    res.redirect("influmart://auth?error=facebook_auth_failed");
  }
});

// Instagram OAuth (via Instagram Business Login) — Step 1
// Works directly with Creator/Business accounts, no Facebook Page required
router.get("/auth/instagram", (req, res) => {
  const { state, influencerId, igHandle, redirectUri } = req.query;
  if (!state) return res.status(400).send("Missing state");

  instagramStateMap.set(state, { influencerId: influencerId || "none", igHandle: igHandle || "", redirectUri: redirectUri || "influmart://auth" });
  setTimeout(() => instagramStateMap.delete(state), 10 * 60 * 1000);

  const IG_APP_ID = process.env.INSTAGRAM_APP_ID || process.env.INSTAGRAM_CLIENT_ID;
  const params = new URLSearchParams({
    client_id: IG_APP_ID,
    redirect_uri: INSTAGRAM_REDIRECT_URI,
    state,
    scope: "instagram_business_basic,instagram_business_manage_insights",
    response_type: "code",
  });

  res.redirect(`https://www.instagram.com/oauth/authorize?${params.toString()}`);
});

// Instagram OAuth — Step 2: exchange code, fetch IG account data, deep-link back
router.get("/auth/instagram/callback", async (req, res) => {
  const { code, state, error } = req.query;
  if (error || !code || !state) {
    return res.redirect("influmart://auth?error=instagram_auth_failed");
  }

  const stateData = instagramStateMap.get(state);
  instagramStateMap.delete(state);
  if (!stateData) return res.redirect("influmart://auth?error=instagram_state_mismatch");

  const { influencerId, igHandle, redirectUri: igRedirectUri } = stateData;
  const appRedirectUri = igRedirectUri || "influmart://auth";

  const IG_APP_ID = process.env.INSTAGRAM_APP_ID || process.env.INSTAGRAM_CLIENT_ID;
  const IG_APP_SECRET = process.env.INSTAGRAM_APP_SECRET || process.env.INSTAGRAM_CLIENT_SECRET;

  try {
    // Exchange code for short-lived token
    const tokenRes = await axios.post(
      "https://api.instagram.com/oauth/access_token",
      new URLSearchParams({ client_id: IG_APP_ID, client_secret: IG_APP_SECRET, grant_type: "authorization_code", redirect_uri: INSTAGRAM_REDIRECT_URI, code }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    const shortToken = tokenRes.data.access_token;
    const igUserId = tokenRes.data.user_id;
    if (!shortToken) return res.redirect("influmart://auth?error=instagram_token_failed");

    // Exchange for long-lived token (~60 days)
    let longToken = shortToken;
    try {
      const longTokenRes = await axios.get("https://graph.instagram.com/access_token", {
        params: { grant_type: "ig_exchange_token", client_id: IG_APP_ID, client_secret: IG_APP_SECRET, access_token: shortToken },
      });
      longToken = longTokenRes.data.access_token || shortToken;
    } catch (e) {
      console.warn("[Instagram OAuth] Long-lived token exchange failed:", e.message);
    }

    // Fetch username directly from Instagram Graph API using /me endpoint
    let igUsername = null;
    try {
      const profileRes = await axios.get(`https://graph.instagram.com/v19.0/me`, {
        params: { fields: "username,name", access_token: longToken },
      });
      igUsername = profileRes.data?.username || null;
      console.log("[Instagram OAuth] /me response:", profileRes.data);
    } catch (e) {
      console.warn("[Instagram OAuth] Profile fetch failed:", e.response?.data || e.message);
    }

    console.log("[Instagram OAuth] enteredHandle:", igHandle, "| graphApiUsername:", igUsername, "| igUserId:", igUserId);

    const resolvedIgUsername = igUsername || igHandle || "";

    // Fetch analytics via Instagram Graph API
    let instaAnalytics = null;
    if (igUserId && longToken) {
      try {
        instaAnalytics = await InstagramGraphData(igUserId, longToken);
        if (!instaAnalytics || Object.keys(instaAnalytics).length === 0) instaAnalytics = null;
      } catch (e) {
        console.warn("[Instagram OAuth] Graph API analytics failed:", e.message);
      }
    }

    if (!instaAnalytics) {
      // Fall back to RapidAPI
      const handleToFetch = igUsername || igHandle;
      if (handleToFetch) {
        try {
          instaAnalytics = await InstagramData(handleToFetch);
          if (instaAnalytics && Object.keys(instaAnalytics).length === 0) instaAnalytics = null;
        } catch (e) {
          console.warn("[Instagram OAuth] RapidAPI analytics fallback failed:", e.message);
        }
      }
    }

    // Only cache Graph API data — RapidAPI fallback must NOT pollute the graph cache
    if (instaAnalytics && instaAnalytics.source === "graph_api" && resolvedIgUsername) {
      const cacheKey = resolvedIgUsername.toLowerCase();
      instagramAnalyticsCache.set(cacheKey, instaAnalytics);
      setTimeout(() => instagramAnalyticsCache.delete(cacheKey), 30 * 60 * 1000); // 30 min TTL
    }

    // Save to DB if profile edit
    if (influencerId && influencerId !== "none") {
      try {
        const update = {
          igAccessToken: longToken,
          instaProfile: resolvedIgUsername,
          instagramOwnershipVerified: !!igUsername,
        };
        if (instaAnalytics && instaAnalytics.source === "graph_api") {
          update.instaGraphData = [instaAnalytics];
        }
        await InfluencerSignupRequest.findByIdAndUpdate(influencerId, update);
      } catch (dbErr) {
        console.warn("[Instagram OAuth] DB save failed:", dbErr.message);
      }
    }

    res.redirect(
      `${appRedirectUri}?igSuccess=true&igUsername=${encodeURIComponent(resolvedIgUsername)}&igLinked=${igUsername ? "true" : "false"}&state=${encodeURIComponent(state)}`
    );
  } catch (err) {
    console.error("[Instagram OAuth callback] Error:", err.response?.data || err.message);
    res.redirect("influmart://auth?error=instagram_auth_failed");
  }
});

// Analytics-only endpoints — fetch platform analytics by username, no DB save
// Used during signup: frontend caches result in AsyncStorage, submitted with signup form

// Returns cached Graph API data (from OAuth callback) — consumed once
router.get("/auth/instagram/analytics", async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: "Missing username" });

  const cacheKey = username.toLowerCase();
  const cached = instagramAnalyticsCache.get(cacheKey);
  if (cached && Object.keys(cached).length > 0) {
    console.log(`[Instagram analytics] Returning cached Graph API data for @${username}`);
    instagramAnalyticsCache.delete(cacheKey); // consume once
    return res.json(cached);
  }

  return res.json({});
});

// Always calls RapidAPI — used to fetch public stats regardless of OAuth
router.get("/auth/instagram/rapidapi-analytics", async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: "Missing username" });
  try {
    const data = await InstagramData(username);
    res.json(data || {});
  } catch (err) {
    console.error("[Instagram rapidapi-analytics] Error:", err.message);
    res.status(500).json({ error: "Failed to fetch Instagram analytics" });
  }
});

router.get("/auth/facebook/analytics", async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: "Missing username" });
  try {
    const data = await facebookData(`https://www.facebook.com/${username}`);
    res.json(data || {});
  } catch (err) {
    console.error("[Facebook analytics] Error:", err.message);
    res.status(500).json({ error: "Failed to fetch Facebook analytics" });
  }
});

// Step 1 — Frontend opens this URL to start Twitter OAuth
// Backend generates PKCE, stores verifier, redirects to Twitter
router.get("/auth/twitter", (req, res) => {
  const { state } = req.query;
  if (!state) return res.status(400).send("Missing state");

  const codeVerifier = crypto.randomBytes(64).toString("base64url");
  const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");

  // Store verifier for 10 minutes
  twitterStateMap.set(state, codeVerifier);
  setTimeout(() => twitterStateMap.delete(state), 10 * 60 * 1000);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.TWITTER_CLIENT_ID,
    redirect_uri: TWITTER_REDIRECT_URI,
    scope: "tweet.read users.read",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  res.redirect(`https://twitter.com/i/oauth2/authorize?${params.toString()}`);
});

// Step 2 — Twitter redirects here after user approves
// Backend exchanges code for token, fetches username, deep-links back into app
router.get("/auth/twitter/callback", async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) {
    return res.redirect("influmart://auth?error=twitter_auth_failed");
  }

  const codeVerifier = twitterStateMap.get(state);
  twitterStateMap.delete(state);

  if (!codeVerifier) {
    return res.redirect("influmart://auth?error=twitter_state_mismatch");
  }

  try {
    const tokenResponse = await axios.post(
      "https://api.twitter.com/2/oauth2/token",
      new URLSearchParams({
        code,
        grant_type: "authorization_code",
        client_id: config.TWITTER_CLIENT_ID,
        redirect_uri: TWITTER_REDIRECT_URI,
        code_verifier: codeVerifier,
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      return res.redirect("influmart://auth?error=twitter_token_failed");
    }

    const userResponse = await axios.get("https://api.twitter.com/2/users/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const username = userResponse.data?.data?.username;
    if (!username) {
      return res.redirect("influmart://auth?error=twitter_user_failed");
    }

    res.redirect(`influmart://auth?twitterUsername=${encodeURIComponent(username)}&state=${encodeURIComponent(state)}`);
  } catch (error) {
    console.error("Twitter callback error:", error.response?.data || error.message);
    res.redirect("influmart://auth?error=twitter_auth_failed");
  }
});

// YouTube OAuth — server-side authorization code flow to obtain refresh token
// Step 1: Frontend opens this URL → backend redirects to Google with access_type=offline
router.get("/auth/youtube", (req, res) => {
  const { state, influencerId } = req.query;
  if (!state || !influencerId) return res.status(400).send("Missing state or influencerId");

  youtubeStateMap.set(state, { influencerId });
  setTimeout(() => youtubeStateMap.delete(state), 10 * 60 * 1000);

  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "329932494226-rkpausht5lbbm9umvspatt9973pco2q6.apps.googleusercontent.com";
  const params = new URLSearchParams({
    response_type: "code",
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: YOUTUBE_REDIRECT_URI,
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/yt-analytics.readonly",
    ].join(" "),
    state,
    access_type: "offline",
    prompt: "consent",
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

// Step 2: Google redirects here → exchange code, fetch analytics, save to DB, deep-link back
router.get("/auth/youtube/callback", async (req, res) => {
  const { code, state, error } = req.query;
  if (error || !code || !state) {
    return res.redirect("influmart://auth?error=youtube_auth_failed");
  }

  const stateData = youtubeStateMap.get(state);
  youtubeStateMap.delete(state);
  if (!stateData) return res.redirect("influmart://auth?error=youtube_state_mismatch");

  const { influencerId } = stateData;
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "329932494226-rkpausht5lbbm9umvspatt9973pco2q6.apps.googleusercontent.com";
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "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";

  try {
    // Exchange authorization code for access_token + refresh_token
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: YOUTUBE_REDIRECT_URI,
        grant_type: "authorization_code",
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token, refresh_token } = tokenResponse.data;
    if (!access_token) return res.redirect("influmart://auth?error=youtube_token_failed");

    // Fetch user email
    const userInfoRes = await axios.get("https://www.googleapis.com/userinfo/v2/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const userEmail = userInfoRes.data.email;

    // Fetch YouTube channel info
    const channelRes = await axios.get("https://www.googleapis.com/youtube/v3/channels", {
      params: { part: "snippet,statistics", mine: true },
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const channel = channelRes.data.items?.[0];
    if (!channel) return res.redirect("influmart://auth?error=youtube_no_channel");

    const channelId = channel.id;
    const channelHandle = channel.snippet.customUrl || channel.snippet.title;
    const stats = channel.statistics;

    // Fetch YouTube Analytics — last 6 months monthly breakdown
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    const startDate = sixMonthsAgo.toISOString().split("T")[0];
    const endDate = now.toISOString().split("T")[0];

    let analyticsData = [];
    let overAllAnalytics = {};

    try {
      const analyticsRes = await axios.get("https://youtubeanalytics.googleapis.com/v2/reports", {
        params: {
          ids: "channel==MINE",
          startDate,
          endDate,
          metrics: "views,estimatedMinutesWatched,likes,dislikes,comments,shares,subscribersGained,subscribersLost",
          dimensions: "month",
          sort: "month",
        },
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const rows = analyticsRes.data.rows || [];
      const headers = analyticsRes.data.columnHeaders || [];
      const idx = (name) => headers.findIndex(h => h.name === name);

      analyticsData = rows.map(row => ({
        month: row[idx("month")],
        views: row[idx("views")] || 0,
        watchTime: row[idx("estimatedMinutesWatched")] || 0,
        likes: row[idx("likes")] || 0,
        comments: row[idx("comments")] || 0,
        shares: row[idx("shares")] || 0,
        subscribersGained: row[idx("subscribersGained")] || 0,
        subscribersLost: row[idx("subscribersLost")] || 0,
      }));

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

      overAllAnalytics = {
        totalViews,
        totalWatchTime,
        totalSubscribersGained: totalSubsGained,
        totalSubscribersLost: totalSubsLost,
        totalLikes,
        totalComments,
        totalShares,
        engagementRate,
        subscriberCount: parseInt(stats.subscriberCount || 0),
        videoCount: parseInt(stats.videoCount || 0),
        lastUpdated: new Date().toISOString(),
      };
    } catch (analyticsErr) {
      console.warn("[YouTube OAuth] Analytics fetch failed:", analyticsErr.response?.data || analyticsErr.message);
      // Fall back to public channel stats
      overAllAnalytics = {
        totalViews: parseInt(stats.viewCount || 0),
        totalWatchTime: 0,
        totalSubscribersGained: parseInt(stats.subscriberCount || 0),
        totalSubscribersLost: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        engagementRate: 0,
        subscriberCount: parseInt(stats.subscriberCount || 0),
        videoCount: parseInt(stats.videoCount || 0),
        lastUpdated: new Date().toISOString(),
      };
    }

    // Fetch recent 5 videos as highlights
    let highlights = [];
    try {
      const searchRes = await axios.get("https://www.googleapis.com/youtube/v3/search", {
        params: { part: "snippet", channelId, order: "date", maxResults: 5, type: "video" },
        headers: { Authorization: `Bearer ${access_token}` },
      });
      highlights = (searchRes.data.items || []).map(item => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high?.url,
        publishedAt: item.snippet.publishedAt,
      }));
    } catch (hlErr) {
      console.warn("[YouTube OAuth] Highlights fetch failed:", hlErr.message);
    }

    const ytData = { overAll: overAllAnalytics, analytics: analyticsData, highlights, ytChannelId: channelId };
    const updatePayload = { ytData: [JSON.stringify(ytData)], ytChannelId: channelId };
    if (refresh_token) updatePayload.ytRefreshToken = refresh_token;

    await InfluencerSignupRequest.findByIdAndUpdate(influencerId, updatePayload);

    res.redirect(
      `influmart://auth?ytSuccess=true&ytChannel=${encodeURIComponent(channelHandle)}&ytEmail=${encodeURIComponent(userEmail)}&state=${encodeURIComponent(state)}`
    );
  } catch (err) {
    console.error("[YouTube OAuth callback] Error:", err.response?.data || err.message);
    res.redirect("influmart://auth?error=youtube_auth_failed");
  }
});

// TikTok token exchange — must be done server-side because client_secret cannot be exposed
router.post("/auth/tiktok/verify", async (req, res) => {
  const { code, redirectUri, codeVerifier } = req.body;
  if (!code || !redirectUri) {
    return res.status(400).json({ message: "Missing code or redirectUri" });
  }
  try {
    const tokenResponse = await axios.post(
      "https://open.tiktokapis.com/v2/oauth/token/",
      new URLSearchParams({
        client_key: config.TIKTOK_CLIENT_KEY,
        client_secret: config.TIKTOK_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      return res.status(400).json({ message: "Token exchange failed", error: tokenResponse.data });
    }

    // Fetch TikTok username — requires user.info.profile scope (needs TikTok app review for production)
    const userResponse = await axios.get(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,username,display_name",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const user = userResponse.data?.data?.user;
    // username is the unique @handle; fall back to display_name if scope not approved
    const username = user?.username || user?.display_name;

    if (!username) {
      return res.status(400).json({ message: "Could not retrieve TikTok username" });
    }

    res.status(200).json({ username });
  } catch (error) {
    console.error("TikTok verify error:", error.response?.data || error.message);
    res.status(500).json({ message: "TikTok verification failed" });
  }
});

module.exports = router;
