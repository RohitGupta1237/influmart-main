/**
 * Signup (firstName, lastName, nickName, InstaProfile, twitterProfile, linkedInProfile, facebook profile, other social handle profiles, a brief about yourself, category of influence, active residence area[the place where you market a lot/live], price)
 */
// influencerController.js
const jwt = require("jsonwebtoken"); // For generating JSON Web Tokens
const bcrypt = require("bcrypt"); // For password hashing
const InfluencerSignupRequest = require("../model/influencerSignupRequestModel");
const mongoose = require("mongoose");
const {
  facebookData,
  InstagramData,
  YoutubeData,
  trackingData,
} = require("../utils/influencerAnalytics");
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
    const encryptedPhoneNo = encrypt(influencerData.phoneNo.number);
    // Create a new InfluencerSignupRequest with the hashed password
    // Parse cached analytics from signup verification step
    let instaData = [];
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
      phoneNo: {
        country: influencerData?.phoneNo?.country||"",
        number: encryptedPhoneNo||"",
      },
      instaData,
      fbData,
      ytData: [influencerData.yt],
      tracked: track,
      profileUrl: influencerData?.isSelectedImage
        ? influencerData?.profileUrl
        : req.file?.path,
    });
    // Save the influencer data to the database
    await influencer.save();
    console.log(influencer)
    res.status(201).json({ message: "Influencer signed up successfully" });
  } catch (err) {
    try {
      const _amount =
        parseInt(influencerData?.amount) *
        JSON.parse(influencerData.price)[0]?.currency.subunits;
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
  } = req.body;
  const updatedFields = {
    userName: userName || undefined,
    email: email || undefined,
    category: category || undefined,
    influencerName: influencerName || undefined,
    isSelectedImage: isSelectedImage || undefined,
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

    if (
      filters.followers &&
      filters.followers.min != null &&
      filters.followers.max != null
    ) {
      query["instaData.followers"] = { $gte: filters.followers.min };
    }

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
      query.gender = filters.gender;

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

    if (
      filters.viewCount &&
      filters.viewCount.min != null &&
      filters.viewCount.max != null
    ) {
      query["ytData.viewCount"] = { $gte: filters.viewCount.min };
    }

    if (filters.cities && filters.cities.length > 0) {
      query["instaData.memberCities"] = {
        $elemMatch: { name: { $in: filters.cities } },
      };
    }

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
    if (activePriceFields.length > 0) {
      result = influencers.filter(inf => {
        let priceObj = null;
        try {
          const raw = inf.price?.[0];
          if (raw) {
            const parsed = JSON.parse(raw);
            priceObj = Array.isArray(parsed) ? parsed[0] : parsed;
          }
        } catch (e) {}
        if (!priceObj) return false;

        return activePriceFields.every(field => {
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
