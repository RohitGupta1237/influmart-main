const mongoose = require("mongoose");

// Manual (OTP-over-DM) social verification requests.
// Fully parallel to the OAuth flow — nothing here touches the OAuth fields.
const socialVerificationRequestSchema = new mongoose.Schema(
  {
    influencer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "influencer",
      required: true,
    },
    influencerName: String,
    influencerUserName: String,
    influencerEmail: String,
    platform: {
      type: String,
      enum: ["instagram", "facebook"],
      required: true,
    },
    socialUsername: { type: String, required: true },
    otp: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "SocialVerificationRequest",
  socialVerificationRequestSchema
);
