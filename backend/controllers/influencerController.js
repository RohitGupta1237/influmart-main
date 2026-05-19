/**
 * Signup (firstName, lastName, nickName, InstaProfile, twitterProfile, linkedInProfile, facebook profile, other social handle profiles, a brief about yourself, category of influence, active residence area[the place where you market a lot/live], price)
 */
// influencerController.js
const jwt = require("jsonwebtoken"); // For generating JSON Web Tokens
const bcrypt = require("bcrypt"); // For password hashing
const InfluencerSignupRequest = require("../model/influencerSignupRequestModel");
const Subscription = require("../model/Subscription");
const mongoose = require("mongoose");
const {
  facebookData,
  InstagramData,
  YoutubeData,
  trackingData,
} = require("../utils/influencerAnalytics");
const { parseQueryWithGroq } = require("../utils/aiSearch");
const { generateEmbedding, cosineSimilarity, buildInfluencerText } = require("../utils/embeddings");
const { encrypt, decrypt } = require("../utils/encryption");
const { refundPayment } = require("./paymentController");
const { deleteSubscription } = require("./subscriptionController");

exports.verifyUser = async (req, res) => {
  const influencerData = req.body;
  console.log(influencerData)
  try {
    // Check if a user with the same mail already exists
    const existingMail = await InfluencerSignupRequest.findOne({
      email: influencerData.email,
    });

    if (existingMail) {
      // If an influencer with the same mail exists, return a 400 Bad Request response
      return res.status(200).json({ message: "Email is already in use" });
    }

    // Check if a user with the same userName already exists
    const existingInfluencer = await InfluencerSignupRequest.findOne({
      userName: influencerData.userName,
    });

    if (existingInfluencer) {
      // If an influencer with the same userName exists, return a 400 Bad Request response
      return res.status(200).json({ message: "Username is already in use" });
    }
    if (!existingInfluencer && !existingMail) {
      return res.status(201).json({ message: "User doesn't exist" });
    }
  } catch (err) {
    return res.status(500).json({ message: "Something Went Wrong" });
  }
};

// Signup an influencer
exports.signup = async (req, res) => {
  const influencerData = req.body;

  let _fbData = {};
  let _instaData = {};
  try {
    // Check if a user with the same mail already exists
    const existingMail = await InfluencerSignupRequest.findOne({
      email: influencerData?.email,
    });

    if (existingMail) {
      // If an influencer with the same mail exists, return a 400 Bad Request response
      return res.status(400).json({ message: "Email is already in use" });
    }

    // Check if a user with the same userName already exists
    const existingInfluencer = await InfluencerSignupRequest.findOne({
      userName: influencerData?.userName,
    });

    if (existingInfluencer) {
      // If an influencer with the same userName exists, return a 400 Bad Request response
      return res.status(400).json({ message: "Username is already in use" });
    }

    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(influencerData.password, 10);
    //data
    // const fbData = await facebookData(
    //   `https://www.facebook.com/${influencerData.facebookProfile}`
    // );
    // const instaData = await InstagramData(influencerData.instaProfile);
    _fbData = {};
    _instaData = {};
    const track = trackingData();
    const encryptedPhoneNo = "";
    // Create a new InfluencerSignupRequest with the hashed password
    // Parse cached analytics from signup verification step
    let instaData = [];
    let instaGraphData = [];
    let fbData = [];
    let unverifiedAccounts = [];
    try {
      const social = JSON.parse(influencerData.social || "{}");
      if (Array.isArray(social.unverifiedAccounts)) unverifiedAccounts = social.unverifiedAccounts;
    } catch (e) { console.warn("social parse failed:", e.message); }
    try {
      if (influencerData.igAnalytics && influencerData.igAnalytics !== "") {
        const parsed = JSON.parse(influencerData.igAnalytics);
        if (parsed && Object.keys(parsed).length > 0) instaData = [parsed];
      }
    } catch (e) { console.warn("igAnalytics parse failed:", e.message); }
    try {
      if (influencerData.igGraphAnalytics && influencerData.igGraphAnalytics !== "") {
        const parsed = JSON.parse(influencerData.igGraphAnalytics);
        if (parsed && Object.keys(parsed).length > 0) instaGraphData = [parsed];
      }
    } catch (e) { console.warn("igGraphAnalytics parse failed:", e.message); }
    try {
      if (influencerData.fbAnalytics && influencerData.fbAnalytics !== "") {
        const parsed = JSON.parse(influencerData.fbAnalytics);
        if (parsed && Object.keys(parsed).length > 0) fbData = [parsed];
      }
    } catch (e) { console.warn("fbAnalytics parse failed:", e.message); }

    const influencer = new InfluencerSignupRequest({
      ...influencerData,
      password: hashedPassword||"",
      instagramOwnershipVerified: false,
      unverifiedAccounts,
      phoneNo: { country: "", number: "" },
      instaData,
      instaGraphData,
      fbData,
      ytData: [influencerData.yt],
      tracked: track,
      profileUrl: influencerData?.isSelectedImage
        ? influencerData?.profileUrl
        : req.file?.path,
    });
    // Save the influencer data to the database
    await influencer.save();
    // Generate semantic embedding in background (don't block signup)
    generateEmbedding(buildInfluencerText(influencer)).then(vec => {
      if (vec) InfluencerSignupRequest.findByIdAndUpdate(influencer._id, { embedding: vec }).catch(() => {});
    });
    console.log(influencer)
    res.status(201).json({ message: "Influencer signed up successfully" });
  } catch (err) {
    try {
      const _amount = parseInt(influencerData?.amount) * 100;
      await refundPayment(influencerData?.paymentId, _amount);
      await deleteSubscription(influencerData?.subscriptionId);
      res
        .status(400)
        .json({ message: "Account creation failed, refund initiated" });
    } catch (refundError) {
      res.status(500).json({
        message:
          "Account creation failed, refund failed. Can you please contact Us.",
        error: refundError,
      });
    }
  }
};

// Login as an influencer
exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    // Find the influencer by their username
    const influencer = await InfluencerSignupRequest.findOne({
      userName: username,
    });
    // Check if the influencer exists
    if (!influencer) {
      return res.status(401).json({ message: "Authentication failed" });
    }

    // Compare the provided password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, influencer.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Authentication failed" });
    }

    // Check if subscription is active
    const subscription = await Subscription.findOne({ userName: username });
    if (!subscription || new Date(subscription.endDate) < new Date()) {
      return res.status(403).json({ message: "Your subscription has expired. Please register again to continue." });
    }

    // Generate a JSON Web Token (JWT) for the authenticated user
    const token = jwt.sign(
      { userId: influencer._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Create a modified influencer object without the password
    const modifiedInfluencer = { ...influencer._doc };
    delete modifiedInfluencer.password;

    // Return the token and the modified influencer object
    res.status(200).json({
      message: "Login successful",
      token,
      influencer: modifiedInfluencer,
    });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get influencer's profile by ID
exports.getProfile = async (req, res) => {
  const influencerId = req.params.id; // Get the influencer's ID from the request parameters

  try {
    // const influencerObjectId = new mongoose.Types.ObjectId(influencerId);
    const influencer = await InfluencerSignupRequest.findById(
      influencerId
    ).select("-password");

    if (!influencer) {
      return res.status(404).json({ message: "Influencer not found" });
    }
    try {
      influencer.phoneNo.number = decrypt(influencer.phoneNo.number);
    } catch (decryptErr) {
      console.warn("Phone number decryption failed — returning profile without decrypting phone.");
    }
    res.status(200).json({ influencer });
  } catch (err) {
    console.error("Error getting influencer profile:", err);
    res.status(500).json({ message: "Failed to retrieve profile" });
  }
};

// endpoint to get influencer's social handle
exports.getSocialData = async (req, res) => {
  const influencerId = req.params.id; // Get the influencer's ID from the request parameters

  try {
    // const influencerObjectId = new mongoose.Types.ObjectId(influencerId);
    const influencer = await InfluencerSignupRequest.findById(
      influencerId
    ).select("-password");

    if (!influencer) {
      return res.status(404).json({ message: "Influencer not found" });
    }
    res.status(200).json({
      instaData: influencer.instaData,
      fbData: influencer.fbData,
      ytData: influencer.ytData,
    });
  } catch (err) {
    console.error("Error getting influencer profile:", err);
    res.status(500).json({ message: "Failed to retrieve profile" });
  }
};

// Update influencer's profile by ID
exports.updateProfile = async (req, res) => {
  const influencerId = req.params.id; // Get the influencer's ID from the request parameters
  const {
    userName,
    email,
    category,
    isSelectedImage,
    influencerName,
    profileUrl,
    price,
  } = req.body;
  const updatedFields = {
    userName: userName || undefined,
    email: email || undefined,
    category: category || undefined,
    influencerName: influencerName || undefined,
    isSelectedImage: isSelectedImage || undefined,
    price: price ? [price] : undefined,
  };
  try {
    const influencer = await InfluencerSignupRequest.findById(influencerId);
    if (!influencer) {
      return res.status(404).json({ message: "influencer not found" });
    }

    // Check uniqueness of email and userName (excluding current influencer)
    if (email && email !== influencer.email) {
      const emailTaken = await InfluencerSignupRequest.findOne({ email, _id: { $ne: influencerId } });
      if (emailTaken) return res.status(400).json({ message: "Email is already in use by another account" });
    }
    if (userName && userName !== influencer.userName) {
      const userNameTaken = await InfluencerSignupRequest.findOne({ userName, _id: { $ne: influencerId } });
      if (userNameTaken) return res.status(400).json({ message: "Username is already taken" });
    }

    // Handle profile picture update
    if (req.file) {
      updatedFields.profileUrl = req.file.path;
    }
    if (isSelectedImage) {
      updatedFields.profileUrl = profileUrl;
    }

    Object.keys(updatedFields).forEach(
      (key) => updatedFields[key] === undefined && delete updatedFields[key]
    );

    const updatedInfluencer = await InfluencerSignupRequest.findByIdAndUpdate(influencerId, updatedFields, {
      new: false,
    });

    res.status(200).json({
      message: "Influencer profile updated successfully",
      influencer: {
        userName: updatedInfluencer?.userName,
        email: updatedInfluencer?.email,
        category: updatedInfluencer?.category,
        profileUrl: updatedInfluencer?.profileUrl,
        influencerName: updatedInfluencer?.influencerName,
        isSelectedImage: updatedInfluencer?.isSelectedImage,
      },
    });
  } catch (error) {
    console.error("Error updating influencer profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Save YouTube refresh token + channel ID for cron job use
exports.saveYtRefreshToken = async (req, res) => {
  const { id } = req.params;
  const { ytRefreshToken, ytChannelId } = req.body;
  try {
    await InfluencerSignupRequest.findByIdAndUpdate(id, { ytRefreshToken, ytChannelId });
    res.status(200).json({ message: "YouTube refresh token saved" });
  } catch (err) {
    console.error("Error saving YT refresh token:", err);
    res.status(500).json({ message: "Failed to save refresh token" });
  }
};

// Delete influencer's profile by ID
exports.deleteProfile = async (req, res) => {
  const influencerId = req.params.id; // Get the influencer's ID from the request parameters

  try {
    const influencer = await InfluencerSignupRequest.findByIdAndDelete(
      influencerId
    );

    if (!influencer) {
      return res.status(404).json({ message: "Influencer not found" });
    }

    res.status(200).json({ message: "Profile deleted successfully" });
  } catch (err) {
    console.error("Error deleting influencer profile:", err);
    res.status(500).json({ message: "Failed to delete profile" });
  }
};

// Get all influencers' profiles
exports.getAllProfiles = async (req, res) => {
  try {
    const influencers = await InfluencerSignupRequest.find(
      {},
      {
        category: 1,
        influencerName: 1,
        profileUrl: 1,
        _id: 1,
        userName: 1,
        ytData: 1,
        instaData: 1,
        fbData: 1,
        isSelectedImage: 1,
      }
    );
    res.status(200).json({ influencers });
  } catch (err) {
    console.error("Error getting all influencer profiles:", err);
    res.status(500).json({ message: "Failed to retrieve profiles" });
  }
};

exports.filterInfluencers = async (req, res) => {
  try {
    const filters = req.body;
    const query = {};
    if (filters.location && filters.location.trim() !== "")
      query.location = filters.location;

    if (filters.category && filters.category.length > 0)
      query.category = { $in: JSON.stringify(filters.category) };

    // Price is filtered in-memory after DB fetch because price is stored as a JSON string
    // e.g. price[0] = '[{"ig":"200","yt":"300","tr":"300","tt":"200"}]'

    // Per-platform followers handled in-memory below

    if (
      filters.likes &&
      filters.likes.min != null &&
      filters.likes.max != null
    ) {
      query["instaData.avgLikes"] = { $gte: filters.likes.min };
    }

    // Per-platform engagement rate — handled in-memory after fetch (same pattern as price)
    // ig → instaData[].avgER (stored as decimal, slider is 0-100 so divide by 100)
    // yt → ytData[].avgER, fb → fbData[].avgER

    if (
      filters.audienceAge &&
      filters.audienceAge.min != null &&
      filters.audienceAge.max != null
    ) {
      query["instaData.ages"] = {
        $elemMatch: {
          percent: { $gte: filters.audienceAge.min },
        },
      };
    }

    if (filters.gender && filters.gender.trim() !== "")
      query.gender = { $regex: new RegExp(`^${filters.gender.trim()}$`, 'i') };

    if (filters.tags && filters.tags.trim() !== "")
      query.tags = { $in: [filters.tags] };

    if (
      filters.reachability &&
      filters.reachability.min != null &&
      filters.reachability.max != null
    ) {
      query["instaData.membersReachability"] = {
        $elemMatch: {
          percent: { $gte: filters.reachability.min * 0.001 },
        },
      };
    }

    if (
      filters.avgComments &&
      filters.avgComments.min != null &&
      filters.avgComments.max != null
    ) {
      query["instaData.avgComments"] = { $gte: filters.avgComments.min };
    }

    // Per-platform view count handled in-memory below

    // Platform filter: array of selected platforms — influencer must match at least one
    const platforms = Array.isArray(filters.platform)
      ? filters.platform.map(p => p.toLowerCase()).filter(Boolean)
      : filters.platform ? [filters.platform.toLowerCase()] : [];

    if (platforms.length > 0) {
      const platformConditions = [];
      platforms.forEach(p => {
        switch (p) {
          case "youtube":
            platformConditions.push(
              { ytData: { $exists: true, $not: { $size: 0 } } },
              { youtubeChannel: { $exists: true, $nin: [null, ""] } }
            );
            break;
          case "instagram":
            platformConditions.push({ instaData: { $exists: true, $not: { $size: 0 } } });
            break;
          case "facebook":
            platformConditions.push({ fbData: { $exists: true, $not: { $size: 0 } } });
            break;
          case "twitter":
            platformConditions.push({ twitterProfile: { $exists: true, $nin: [null, ""] } });
            break;
          case "tiktok":
            platformConditions.push({ otherSocialHandles: { $exists: true, $not: { $size: 0 } } });
            break;
        }
      });
      if (platformConditions.length > 0) {
        query.$or = platformConditions;
      }
    }

    const influencers = await InfluencerSignupRequest.find(query);

    // Apply price filter in-memory (price stored as JSON string in array)
    const priceFilter = filters.price;
    const activePriceFields = ['ig', 'yt', 'fb'].filter(f => {
      const p = priceFilter?.[f];
      return p && p.min != null && p.max != null;
    });

    let result = influencers;

    // Cities filter in-memory (location field is a plain string)
    if (filters.cities && filters.cities.length > 0) {
      const cityLower = filters.cities.map(c => c.toLowerCase());
      result = result.filter(inf => {
        const loc = (inf.location || "").toLowerCase();
        return cityLower.some(c => loc.includes(c));
      });
    }

    if (activePriceFields.length > 0) {
      result = result.filter(inf => {
        let priceObj = null;
        try {
          const raw = inf.price?.[0];
          if (raw) {
            const parsed = JSON.parse(raw);
            priceObj = Array.isArray(parsed) ? parsed[0] : parsed;
          }
        } catch (e) {}
        if (!priceObj) return false;

        return activePriceFields.some(field => {
          const val = parseInt(priceObj[field]);
          const range = priceFilter[field];
          return !isNaN(val) && val >= range.min && val <= range.max;
        });
      });
    }

    // In-memory engagement rate filter per platform
    const erFilter = filters.engagementRate;
    const activeErFields = ['ig', 'yt', 'fb'].filter(f => {
      const p = erFilter?.[f];
      return p && p.min != null && p.max != null;
    });

    if (activeErFields.length > 0) {
      // Map field key to data array and field name on that array
      const erDataMap = {
        ig: { arrayKey: 'instaData', field: 'avgER' },
        yt: { arrayKey: 'ytData',   field: 'avgER' },
        fb: { arrayKey: 'fbData',   field: 'avgER' },
      };
      result = result.filter(inf => {
        return activeErFields.every(f => {
          const { arrayKey, field } = erDataMap[f];
          const dataArr = inf[arrayKey];
          if (!dataArr || dataArr.length === 0) return false;
          // avgER may be stored as decimal (0.05 = 5%) — slider is 0-100
          const raw = dataArr[0]?.[field];
          if (raw == null) return false;
          const erPercent = parseFloat(raw) > 1 ? parseFloat(raw) : parseFloat(raw) * 100;
          // Negative ER means bad/insufficient data — treat as passing (don't exclude)
          if (erPercent < 0) return true;
          const range = erFilter[f];
          return erPercent >= range.min && erPercent <= range.max;
        });
      });
    }

    // In-memory followers filter per platform
    const followersFilter = filters.followers;
    const activeFollowerFields = ['ig', 'yt', 'fb'].filter(f => {
      const p = followersFilter?.[f];
      return p && p.min != null && p.max != null;
    });

    if (activeFollowerFields.length > 0) {
      result = result.filter(inf => {
        return activeFollowerFields.every(f => {
          let count = null;
          if (f === 'ig') {
            count = inf.instaData?.[0]?.followers;
          } else if (f === 'fb') {
            count = inf.fbData?.[0]?.followers;
          } else if (f === 'yt') {
            const yt = inf.ytData?.[0];
            if (yt) {
              try {
                const parsed = typeof yt === 'string' ? JSON.parse(yt) : yt;
                count = parsed?.overAll?.subscriberCount ?? parsed?.subscriberCount;
              } catch (e) {}
            }
          }
          if (count == null) return false;
          const num = parseInt(count);
          if (isNaN(num) || num <= 0) return false;
          const range = followersFilter[f];
          return num >= range.min && num <= range.max;
        });
      });
    }

    // In-memory avg views filter per platform
    const viewCountFilter = filters.viewCount;
    const activeViewFields = ['ig', 'yt', 'fb'].filter(f => {
      const p = viewCountFilter?.[f];
      return p && p.min != null && p.max != null;
    });

    if (activeViewFields.length > 0) {
      result = result.filter(inf => {
        return activeViewFields.every(f => {
          let count = null;
          if (f === 'ig') {
            count = inf.instaData?.[0]?.avgViews ?? inf.instaData?.[0]?.avgLikes;
          } else if (f === 'fb') {
            count = inf.fbData?.[0]?.avgReelPlayCount ?? null;
          } else if (f === 'yt') {
            const yt = inf.ytData?.[0];
            if (yt) {
              try {
                const parsed = typeof yt === 'string' ? JSON.parse(yt) : yt;
                const videos = parsed?.lastPost?.data;
                if (videos && videos.length > 0) {
                  const totalViews = videos.reduce((sum, v) => sum + (parseInt(v.viewCount) || 0), 0);
                  count = Math.round(totalViews / videos.length);
                } else {
                  count = parsed?.avgViews ?? null;
                }
              } catch (e) {}
            }
          }
          if (count == null) return false;
          const num = parseInt(count);
          if (isNaN(num) || num <= 0) return false;
          const range = viewCountFilter[f];
          return num >= range.min && num <= range.max;
        });
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.changePassword = async (req, res) => {
  const { influencerId, currentPassword, newPassword } = req.body;
  try {
    const influencer = await InfluencerSignupRequest.findById(influencerId);
    if (!influencer) return res.status(404).json({ message: "Influencer not found" });

    const isMatch = await bcrypt.compare(currentPassword, influencer.password);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await InfluencerSignupRequest.findByIdAndUpdate(influencerId, { password: hashedPassword });

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

exports.aiSearchInfluencers = async (req, res) => {
  const { query } = req.body;
  if (!query || !query.trim()) {
    return res.status(400).json({ message: "Query is required" });
  }
  try {
    // Step 1: Parse natural language query via Groq
    const { success, filters, error } = await parseQueryWithGroq(query.trim());
    if (!success) {
      return res.status(500).json({ message: "AI parsing failed", error });
    }
    console.log("[aiSearch] parsed filters:", JSON.stringify(filters));

    // Step 2: Light DB query — only use indexed fields (gender, location, category)
    const dbQuery = {};
    if (filters.location && filters.location.trim() !== "")
      dbQuery.location = { $regex: new RegExp(filters.location.trim(), 'i') };
    if (filters.gender && filters.gender.trim() !== "")
      dbQuery.gender = { $regex: new RegExp(`^${filters.gender.trim()}$`, 'i') };

    // Step 3: Fetch all with full data for in-memory processing
    let result = await InfluencerSignupRequest.find(dbQuery, {
      influencerName: 1, profileUrl: 1, _id: 1, userName: 1, isSelectedImage: 1,
      category: 1, gender: 1, location: 1, price: 1,
      instaData: 1, fbData: 1, ytData: 1,
      hashtags: 1, description: 1, embedding: 1, unverifiedAccounts: 1,
    });

    // Helper: parse ytData JSON string
    const parseYt = (inf) => {
      try {
        const raw = inf.ytData?.[0];
        if (!raw) return null;
        return typeof raw === "string" ? JSON.parse(raw) : raw;
      } catch (e) { return null; }
    };

    // Helper: parse price JSON string
    const parsePrice = (inf) => {
      try {
        const raw = inf.price?.[0];
        if (!raw) return null;
        const p = typeof raw === "string" ? JSON.parse(raw) : raw;
        return Array.isArray(p) ? p[0] : p;
      } catch (e) { return null; }
    };

    // --- CATEGORY ---
    // NOTE: category is intentionally NOT a hard filter in AI search.
    // Semantic embeddings handle content/niche matching — "comedy" will score high
    // for influencers with #humour, #funny etc. without needing exact category match.
    // Category is only used to boost the query text sent to the embedding model.

    // --- CITIES: checks signup location OR instaData memberCities ---
    if (filters.cities && filters.cities.length > 0) {
      const cityLower = filters.cities.map(c => c.toLowerCase());
      // also add common aliases (gurgaon ↔ gurugram)
      const aliases = { gurgaon: "gurugram", gurugram: "gurgaon" };
      const cityLowerExpanded = [...cityLower];
      cityLower.forEach(c => { if (aliases[c]) cityLowerExpanded.push(aliases[c]); });

      result = result.filter(inf => {
        // Check signup location
        const loc = (inf.location || "").toLowerCase();
        if (cityLowerExpanded.some(c => loc.includes(c))) return true;
        // Check instaData memberCities (city name or category)
        const cities = inf.instaData?.[0]?.memberCities || [];
        return cities.some(mc => {
          const mcName = (mc.name || "").toLowerCase();
          const mcCat = (mc.category || "").toLowerCase();
          return cityLowerExpanded.some(c => mcName.includes(c) || mcCat.includes(c));
        });
      });
    }

    // --- AUDIENCE CITY MIN PERCENT (IG memberCities) ---
    if (filters.audienceCityMinPercent != null && filters.cities && filters.cities.length > 0) {
      const cityLower = filters.cities.map(c => c.toLowerCase());
      const minPct = filters.audienceCityMinPercent;
      result = result.filter(inf => {
        const cities = inf.instaData?.[0]?.memberCities || [];
        return cities.some(mc => {
          const mcName = (mc.name || "").toLowerCase();
          const mcCat = (mc.category || "").toLowerCase();
          const matchesCity = cityLower.some(c => mcName.includes(c) || mcCat.includes(c));
          return matchesCity && (mc.value || 0) >= minPct;
        });
      });
    }

    // --- PRICE ---
    if (filters.price) {
      const activePriceFields = ['ig', 'yt', 'fb'].filter(f => filters.price[f] && (filters.price[f].min != null || filters.price[f].max != null));
      if (activePriceFields.length > 0) {
        result = result.filter(inf => {
          const priceObj = parsePrice(inf);
          if (!priceObj) return false;
          return activePriceFields.some(f => {
            const val = parseInt(priceObj[f]);
            if (isNaN(val)) return false;
            const range = filters.price[f];
            if (range.min != null && val < range.min) return false;
            if (range.max != null && val > range.max) return false;
            return true;
          });
        });
      }
    }

    // --- FOLLOWERS ---
    if (filters.followers) {
      const activeFields = ['ig', 'yt', 'fb'].filter(f => filters.followers[f] && (filters.followers[f].min != null || filters.followers[f].max != null));
      if (activeFields.length > 0) {
        result = result.filter(inf => {
          return activeFields.every(f => {
            let count = null;
            if (f === 'ig') count = inf.instaData?.[0]?.followers;
            else if (f === 'fb') count = inf.fbData?.[0]?.followers;
            else if (f === 'yt') {
              const yt = parseYt(inf);
              count = yt?.overAll?.subscriberCount ?? yt?.subscriberCount;
            }
            if (count == null) return false;
            const num = parseInt(count);
            if (isNaN(num)) return false;
            const range = filters.followers[f];
            if (range.min != null && num < range.min) return false;
            if (range.max != null && num > range.max) return false;
            return true;
          });
        });
      }
    }

    // --- ENGAGEMENT RATE ---
    if (filters.engagementRate) {
      const activeFields = ['ig', 'fb'].filter(f => filters.engagementRate[f] && (filters.engagementRate[f].min != null || filters.engagementRate[f].max != null));
      if (activeFields.length > 0) {
        result = result.filter(inf => {
          return activeFields.every(f => {
            const raw = f === 'ig' ? inf.instaData?.[0]?.avgER : inf.fbData?.[0]?.avgER;
            if (raw == null) return false;
            const erPct = parseFloat(raw) > 1 ? parseFloat(raw) : parseFloat(raw) * 100;
            const range = filters.engagementRate[f];
            if (range.min != null && erPct < range.min) return false;
            if (range.max != null && erPct > range.max) return false;
            return true;
          });
        });
      }
    }

    // --- AVG INTERACTIONS (Instagram likes+comments per post) ---
    if (filters.avgInteractions?.ig) {
      const range = filters.avgInteractions.ig;
      result = result.filter(inf => {
        const val = parseInt(inf.instaData?.[inf.instaData.length-1]?.avgInteractions);
        if (isNaN(val)) return false;
        if (range.min != null && val < range.min) return false;
        if (range.max != null && val > range.max) return false;
        return true;
      });
    }

    // --- AVG LIKES (Instagram) ---
    if (filters.avgLikes?.ig) {
      const range = filters.avgLikes.ig;
      result = result.filter(inf => {
        const val = parseInt(inf.instaData?.[inf.instaData.length-1]?.avgLikes);
        if (isNaN(val)) return false;
        if (range.min != null && val < range.min) return false;
        if (range.max != null && val > range.max) return false;
        return true;
      });
    }

    // --- AVG COMMENTS (Instagram) ---
    if (filters.avgComments?.ig) {
      const range = filters.avgComments.ig;
      result = result.filter(inf => {
        const val = parseInt(inf.instaData?.[inf.instaData.length-1]?.avgComments);
        if (isNaN(val)) return false;
        if (range.min != null && val < range.min) return false;
        if (range.max != null && val > range.max) return false;
        return true;
      });
    }

    // --- AVG VIEWS (FB reelPlayCount, YT totalViews) ---
    if (filters.avgViews) {
      if (filters.avgViews.fb) {
        const range = filters.avgViews.fb;
        result = result.filter(inf => {
          const val = parseInt(inf.fbData?.[inf.fbData.length-1]?.avgReelPlayCount);
          if (isNaN(val)) return false;
          if (range.min != null && val < range.min) return false;
          if (range.max != null && val > range.max) return false;
          return true;
        });
      }
      if (filters.avgViews.yt) {
        const range = filters.avgViews.yt;
        result = result.filter(inf => {
          const yt = parseYt(inf);
          const val = parseInt(yt?.overAll?.totalViews);
          if (isNaN(val)) return false;
          if (range.min != null && val < range.min) return false;
          if (range.max != null && val > range.max) return false;
          return true;
        });
      }
    }

    // --- FACEBOOK POST/REEL METRICS ---
    const fbMetricMap = {
      fbPostReactions: 'avgPostReactions',
      fbPostComments: 'avgPostComments',
      fbPostShares: 'avgPostShares',
      fbReelReactions: 'avgReelReactions',
      fbReelComments: 'avgReelComments',
      fbReelShares: 'avgReelShares',
    };
    for (const [filterKey, dataKey] of Object.entries(fbMetricMap)) {
      if (filters[filterKey]) {
        const range = filters[filterKey];
        result = result.filter(inf => {
          const val = parseInt(inf.fbData?.[inf.fbData.length-1]?.[dataKey]);
          if (isNaN(val)) return false;
          if (range.min != null && val < range.min) return false;
          if (range.max != null && val > range.max) return false;
          return true;
        });
      }
    }

    // --- YOUTUBE AGGREGATE METRICS ---
    if (filters.ytSubscribersGained || filters.ytLikes || filters.ytComments || filters.ytShares || filters.ytWatchTime || filters.ytVideoCount) {
      result = result.filter(inf => {
        const yt = parseYt(inf);
        if (!yt) return false;
        const checks = [
          { range: filters.ytSubscribersGained, val: parseInt(yt?.overAll?.totalSubscribersGained) },
          { range: filters.ytLikes,             val: parseInt(yt?.overAll?.totalLikes) },
          { range: filters.ytComments,          val: parseInt(yt?.overAll?.totalComments) },
          { range: filters.ytShares,            val: parseInt(yt?.overAll?.totalShares) },
          { range: filters.ytWatchTime,         val: parseInt(yt?.overAll?.totalWatchTime) },
          { range: filters.ytVideoCount,        val: parseInt(yt?.overAll?.videoCount) },
        ];
        return checks.every(({ range, val }) => {
          if (!range) return true;
          if (isNaN(val)) return false;
          if (range.min != null && val < range.min) return false;
          if (range.max != null && val > range.max) return false;
          return true;
        });
      });
    }

    // --- YOUTUBE ENGAGEMENT RATE ---
    if (filters.engagementRate?.yt) {
      const range = filters.engagementRate.yt;
      result = result.filter(inf => {
        const yt = parseYt(inf);
        const er = parseFloat(yt?.overAll?.engagementRate);
        if (isNaN(er)) return false;
        if (range.min != null && er < range.min) return false;
        if (range.max != null && er > range.max) return false;
        return true;
      });
    }

    // --- AUDIENCE GENDER (Instagram) ---
    if (filters.audienceGender) {
      result = result.filter(inf => {
        const genders = inf.instaData?.[0]?.genders || [];
        const getGenderPct = (name) => {
          const g = genders.find(g => g.name === name);
          return g ? (g.percent * 100) : null;
        };
        if (filters.audienceGender.female) {
          const pct = getGenderPct('f');
          if (pct == null) return false;
          if (filters.audienceGender.female.min != null && pct < filters.audienceGender.female.min) return false;
          if (filters.audienceGender.female.max != null && pct > filters.audienceGender.female.max) return false;
        }
        if (filters.audienceGender.male) {
          const pct = getGenderPct('m');
          if (pct == null) return false;
          if (filters.audienceGender.male.min != null && pct < filters.audienceGender.male.min) return false;
          if (filters.audienceGender.male.max != null && pct > filters.audienceGender.male.max) return false;
        }
        return true;
      });
    }

    // --- AUDIENCE AGE (Instagram) ---
    if (filters.audienceAge) {
      const { group, minPercent } = filters.audienceAge;
      result = result.filter(inf => {
        const ages = inf.instaData?.[0]?.ages || [];
        const ageEntry = ages.find(a => a.name === group);
        if (!ageEntry) return false;
        return (ageEntry.percent || 0) >= (minPercent || 0);
      });
    }

    // --- AUDIENCE REACHABILITY (Instagram membersReachability) ---
    if (filters.reachability?.tier) {
      const { tier, minPercent = 0 } = filters.reachability;
      result = result.filter(inf => {
        const reachData = inf.instaData?.[inf.instaData.length - 1]?.membersReachability || [];
        const entry = reachData.find(r => r.name === tier);
        if (!entry) return false;
        const pct = (entry.percent || 0) * 100; // stored as 0-1, convert to 0-100
        return pct >= minPercent;
      });
    }

    // --- PLATFORM filter (must have data for that platform) ---
    if (filters.platform && filters.platform.length > 0) {
      const platforms = filters.platform.map(p => p.toLowerCase());
      result = result.filter(inf => {
        return platforms.some(p => {
          if (p === 'instagram') return inf.instaData?.length > 0;
          if (p === 'facebook') return inf.fbData?.length > 0;
          if (p === 'youtube') return inf.ytData?.length > 0;
          return false;
        });
      });
    }

    // --- SORT ---
    if (filters.sort) {
      const { field, order } = filters.sort;
      const dir = order === 'asc' ? 1 : -1;
      const getVal = (inf) => {
        switch (field) {
          case 'igFollowers': return parseInt(inf.instaData?.[inf.instaData?.length-1]?.followers) || 0;
          case 'fbFollowers': return parseInt(inf.fbData?.[inf.fbData?.length-1]?.followers) || 0;
          case 'ytSubscribers': { const yt = parseYt(inf); return parseInt(yt?.overAll?.subscriberCount ?? yt?.subscriberCount) || 0; }
          case 'igInteractions': return parseInt(inf.instaData?.[inf.instaData?.length-1]?.avgInteractions) || 0;
          case 'igLikes': return parseInt(inf.instaData?.[inf.instaData?.length-1]?.avgLikes) || 0;
          case 'igComments': return parseInt(inf.instaData?.[inf.instaData?.length-1]?.avgComments) || 0;
          case 'fbViews': return parseInt(inf.fbData?.[inf.fbData?.length-1]?.avgReelPlayCount) || 0;
          case 'fbReelReactions': return parseInt(inf.fbData?.[inf.fbData?.length-1]?.avgReelReactions) || 0;
          case 'ytViews': { const yt = parseYt(inf); return parseInt(yt?.overAll?.totalViews) || 0; }
          case 'ytSubscribersGained': { const yt = parseYt(inf); return parseInt(yt?.overAll?.totalSubscribersGained) || 0; }
          case 'ytLikes': { const yt = parseYt(inf); return parseInt(yt?.overAll?.totalLikes) || 0; }
          case 'ytWatchTime': { const yt = parseYt(inf); return parseInt(yt?.overAll?.totalWatchTime) || 0; }
          case 'igER': { const er = parseFloat(inf.instaData?.[inf.instaData?.length-1]?.avgER); return isNaN(er) ? 0 : (er > 1 ? er : er * 100); }
          case 'fbER': { const er = parseFloat(inf.fbData?.[inf.fbData?.length-1]?.avgER); return isNaN(er) ? 0 : (er > 1 ? er : er * 100); }
          case 'ytER': { const yt = parseYt(inf); return parseFloat(yt?.overAll?.engagementRate) || 0; }
          case 'igPrice': { const p = parsePrice(inf); return parseInt(p?.ig) || 0; }
          case 'ytPrice': { const p = parsePrice(inf); return parseInt(p?.yt) || 0; }
          default: return 0;
        }
      };
      result.sort((a, b) => (getVal(a) - getVal(b)) * dir);
    }

    // --- SEMANTIC SCORING ---
    // Build an enriched query text using the original query + extracted category/keywords
    // so that "comedy" expands to include category context before embedding
    const categoryContext = filters.category?.length ? `Content category: ${filters.category.join(", ")}.` : "";
    const keywordContext = filters.keywords?.length ? `Related terms: ${filters.keywords.join(", ")}.` : "";
    const enrichedQuery = [query.trim(), categoryContext, keywordContext].filter(Boolean).join(" ");

    const queryEmbedding = await generateEmbedding(enrichedQuery);
    if (queryEmbedding) {
      result = result.map(inf => {
        const score = inf.embedding?.length ? cosineSimilarity(queryEmbedding, inf.embedding) : 0;
        return { ...(inf.toObject ? inf.toObject() : inf), _semanticScore: score };
      });
      // If no explicit sort was requested, rank by semantic similarity
      if (!filters.sort) {
        result.sort((a, b) => b._semanticScore - a._semanticScore);
      }
    }

    // --- LIMIT ---
    const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 50) : result.length;
    result = result.slice(0, limit);

    res.json({ influencers: result, parsedFilters: filters });
  } catch (error) {
    console.error("[aiSearchInfluencers]", error);
    res.status(500).json({ message: "AI search failed", error: error.message });
  }
};

exports.updateDescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;
    if (res.locals.influencer?._id?.toString() !== id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    await InfluencerSignupRequest.findByIdAndUpdate(id, { description: description ?? "" });
    // Regenerate embedding in background
    InfluencerSignupRequest.findById(id).then(inf => {
      if (!inf) return;
      generateEmbedding(buildInfluencerText(inf)).then(vec => {
        if (vec) InfluencerSignupRequest.findByIdAndUpdate(id, { embedding: vec }).catch(() => {});
      });
    });
    res.status(200).json({ message: "Description updated" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update description", error });
  }
};

exports.updateHashtags = async (req, res) => {
  try {
    const { id } = req.params;
    const { hashtags } = req.body;
    if (res.locals.influencer?._id?.toString() !== id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (!Array.isArray(hashtags)) {
      return res.status(400).json({ message: "hashtags must be an array" });
    }
    await InfluencerSignupRequest.findByIdAndUpdate(id, { hashtags });
    // Regenerate embedding in background
    InfluencerSignupRequest.findById(id).then(inf => {
      if (!inf) return;
      generateEmbedding(buildInfluencerText(inf)).then(vec => {
        if (vec) InfluencerSignupRequest.findByIdAndUpdate(id, { embedding: vec }).catch(() => {});
      });
    });
    res.status(200).json({ message: "Hashtags updated" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update hashtags", error });
  }
};

exports.updatePrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { price } = req.body;
    if (res.locals.influencer?._id?.toString() !== id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (!price || typeof price !== "object") {
      return res.status(400).json({ message: "price must be an object" });
    }
    await InfluencerSignupRequest.findByIdAndUpdate(id, {
      price: JSON.stringify([price]),
    });
    res.status(200).json({ message: "Price updated" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update price", error });
  }
};
