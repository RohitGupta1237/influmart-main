const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const { encrypt, decrypt } = require("../utils/encryption");

const influencerSignupRequestSchema = new mongoose.Schema(
  {
    influencerName: String,
    instaProfile: String, // Use String data type for URL fields
    twitterProfile: String,
    linkedInProfile: String,
    facebookProfile: String,
    youtubeChannel: String,
    otherSocialHandles: [String], // Use String data type for URLs in an array
    briefAbout: String,
    category: [String],
    phoneNo: {
      country: String,
      number: {
        type: mongoose.Schema.Types.Mixed, // Change to Mixed type
        required: true,
      },
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other","Not prefer to say"], // Set the enum constraint to restrict the values to the specified ones
    },
    location: String,
    price: [],
    email: { type: String, unique: true }, // Set the unique constraint to ensure email uniqueness
    userName: { type: String, unique: true },
    password: String,
    role: {
      type: String,
      default: "influencer", // Set the default value to "influencer"
    },
    instaData: [], // Instagram data
    fbData: [], // Facebook data
    ytData: {}, // YouTube data
    tracked: { type: String, default: "" },
    agreedToTerms: { type: Boolean, default: false },
    appliedCollabPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CollabOpening' }],
    profileUrl: { type: String, default: "" },
    isSelectedImage: { type: Boolean, default: false },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },
    notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: "Request" }],
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
    ytRefreshToken: { type: String, default: null },
    ytChannelId: { type: String, default: null },
    fbAccessToken: { type: String, default: null },
    igAccessToken: { type: String, default: null },
    instagramOwnershipVerified: { type: Boolean, default: false },
    unverifiedAccounts: { type: [String], default: [] },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    conversations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
      },
    ],
  },
  {
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

const InfluencerSignupRequest = mongoose.model(
  "influencer",
  influencerSignupRequestSchema
);

module.exports = InfluencerSignupRequest;
