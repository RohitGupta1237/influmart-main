const InfluencerSignupRequest = require("../model/influencerSignupRequestModel");
const SocialVerificationRequest = require("../model/socialVerificationRequest");
const { InstagramData, facebookData } = require("../utils/influencerAnalytics");

const MAX_MONTHS = 6; // keep the last 6 snapshots, same as the analytics cron

// Where the OTP notifications go. Override with ADMIN_NOTIFY_EMAIL in .env.
const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || "rohitgupta12371380@gmail.com";
// The official Influmart handles the user DMs the OTP to.
const INFLUMART_IG = process.env.INFLUMART_IG_HANDLE || "influmart";
const INFLUMART_FB = process.env.INFLUMART_FB_HANDLE || "influmart";

const SUPPORTED = ["instagram", "facebook"];
const OTP_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Same Resend HTTP helper used by otpController — kept local to avoid coupling.
const sendResendEmail = async ({ to, subject, text }) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Influmart <noreply@influmart.in>",
      to,
      subject,
      text,
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Resend email failed");
  }
  return response.json();
};

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// POST /social-verification/request/:id  (influencer auth)
// body: { platform, socialUsername }
// Generates an OTP, stores a pending request, emails the admin, returns the OTP
// to display to the user (so they can DM it from their social account).
exports.requestVerification = async (req, res) => {
  try {
    const influencerId = req.params.id;
    const { platform, socialUsername } = req.body;

    if (!SUPPORTED.includes(platform)) {
      return res.status(400).json({ message: "Unsupported platform" });
    }
    const handle = (socialUsername || "").trim().replace(/^@/, "");
    if (!handle) {
      return res.status(400).json({ message: "Social username is required" });
    }

    const influencer = await InfluencerSignupRequest.findById(influencerId);
    if (!influencer) {
      return res.status(404).json({ message: "Influencer not found" });
    }

    // Already verified via this flow? Nothing to do.
    if ((influencer.otpVerifiedAccounts || []).includes(platform)) {
      return res.status(400).json({ message: "This account is already verified" });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    // One pending request per influencer+platform — overwrite any previous one.
    const request = await SocialVerificationRequest.findOneAndUpdate(
      { influencer: influencerId, platform, status: "pending" },
      {
        influencer: influencerId,
        influencerName: influencer.influencerName,
        influencerUserName: influencer.userName,
        influencerEmail: influencer.email,
        platform,
        socialUsername: handle,
        otp,
        status: "pending",
        expiresAt,
      },
      { upsert: true, new: true }
    );

    const influmartHandle = platform === "instagram" ? INFLUMART_IG : INFLUMART_FB;

    // Notify the admin so they can match the incoming DM against this OTP.
    try {
      await sendResendEmail({
        to: ADMIN_EMAIL,
        subject: `Social verification request — ${platform} @${handle}`,
        text:
          `A new ${platform} verification request was submitted.\n\n` +
          `Influencer: ${influencer.influencerName} (@${influencer.userName})\n` +
          `Influencer email: ${influencer.email}\n` +
          `Platform: ${platform}\n` +
          `Claimed ${platform} username: @${handle}\n` +
          `OTP: ${otp}\n\n` +
          `The user has been asked to DM this OTP from @${handle} to the ` +
          `official Influmart ${platform} account (@${influmartHandle}).\n` +
          `When you receive a DM from @${handle} containing "${otp}", ` +
          `approve the request in the admin panel.\n\n` +
          `Request ID: ${request._id}`,
      });
    } catch (mailErr) {
      console.error("Verification email failed:", mailErr.message);
      // Don't fail the whole request just because the email bounced —
      // the request is still stored and visible in the admin panel.
    }

    return res.status(200).json({
      message: "Verification request created",
      otp,
      platform,
      socialUsername: handle,
      influmartHandle,
      requestId: request._id,
    });
  } catch (err) {
    console.error("requestVerification error:", err);
    return res.status(500).json({ message: "Server error", error: err.toString() });
  }
};

// POST /social-verification/fetch/:id  (influencer auth)
// body: { platform }  — pulls fresh public stats via RapidAPI for a verified
// account, appends the snapshot (capped to 6), saves, and returns the data.
exports.fetchLatestStats = async (req, res) => {
  try {
    const influencerId = req.params.id;
    const { platform } = req.body;
    if (!SUPPORTED.includes(platform)) {
      return res.status(400).json({ message: "Unsupported platform" });
    }

    const influencer = await InfluencerSignupRequest.findById(influencerId);
    if (!influencer) return res.status(404).json({ message: "Influencer not found" });

    // A verified account = OTP-verified OR already OAuth-connected (has data).
    const otpVerified = (influencer.otpVerifiedAccounts || []).includes(platform);
    const profileField = platform === "instagram" ? "instaProfile" : "facebookProfile";
    // Prefer a username sent from the client; fall back to the stored one.
    const provided = (req.body.username || "").trim().replace(/^@/, "");
    const handle = provided || influencer[profileField];
    if (!handle) {
      return res.status(400).json({ message: "No username on file — please enter your username" });
    }
    const hasData =
      platform === "instagram"
        ? influencer.instaData?.length > 0
        : influencer.fbData?.length > 0;
    if (!otpVerified && !hasData) {
      return res.status(403).json({ message: "This account is not verified yet" });
    }

    // Fetch fresh snapshot from the same RapidAPI helpers the cron uses.
    let snapshot;
    if (platform === "instagram") {
      snapshot = await InstagramData(handle);
    } else {
      const url = handle.startsWith("http") ? handle : `https://www.facebook.com/${handle}`;
      snapshot = await facebookData(url);
    }

    if (!snapshot || Object.keys(snapshot).length === 0) {
      return res.status(502).json({
        message: "Could not fetch stats right now. Please try again in a moment.",
      });
    }

    const field = platform === "instagram" ? "instaData" : "fbData";
    const existing = influencer[field] || [];
    const updated = [...existing, snapshot].slice(-MAX_MONTHS);
    influencer[field] = updated;
    // Persist the handle so future fetches (and the cron) know it.
    if (!influencer[profileField]) influencer[profileField] = handle;
    await influencer.save();

    return res.status(200).json({
      message: "Statistics updated",
      platform,
      snapshot,
      [field]: updated,
    });
  } catch (err) {
    console.error("fetchLatestStats error:", err);
    return res.status(500).json({ message: "Server error", error: err.toString() });
  }
};

// GET /social-verification/pending  (admin)
exports.getPendingRequests = async (req, res) => {
  try {
    const requests = await SocialVerificationRequest.find({ status: "pending" }).sort({
      createdAt: -1,
    });
    return res.status(200).json(requests);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.toString() });
  }
};

// POST /social-verification/:requestId/approve  (admin)
exports.approveRequest = async (req, res) => {
  try {
    const request = await SocialVerificationRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "pending") {
      return res.status(400).json({ message: `Request already ${request.status}` });
    }

    // Save the verified handle so "fetch latest stats" knows which username
    // to query on RapidAPI (mirrors the field the analytics cron reads).
    const profileField = request.platform === "instagram" ? "instaProfile" : "facebookProfile";
    await InfluencerSignupRequest.findByIdAndUpdate(request.influencer, {
      $addToSet: { otpVerifiedAccounts: request.platform },
      $pull: { unverifiedAccounts: request.platform },
      [profileField]: request.socialUsername,
    });

    request.status = "approved";
    await request.save();

    return res.status(200).json({ message: "Approved", request });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.toString() });
  }
};

// POST /social-verification/:requestId/reject  (admin)
exports.rejectRequest = async (req, res) => {
  try {
    const request = await SocialVerificationRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "pending") {
      return res.status(400).json({ message: `Request already ${request.status}` });
    }
    request.status = "rejected";
    await request.save();
    return res.status(200).json({ message: "Rejected", request });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.toString() });
  }
};
