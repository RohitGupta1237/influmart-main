const cron = require("node-cron");
const InfluencerSignupRequest = require("../model/influencerSignupRequestModel");
const { InstagramData, facebookData } = require("../utils/influencerAnalytics");

const MAX_MONTHS = 6;

// Main job: runs on the 1st of every month at 3am
const startIgFbAnalyticsCron = () => {
  cron.schedule("0 3 1 * *", async () => {
    console.log("[IG/FB Cron] Starting monthly Instagram & Facebook analytics refresh...");

    const influencers = await InfluencerSignupRequest.find({
      $or: [
        { instaProfile: { $nin: [null, ""] } },
        { facebookProfile: { $nin: [null, ""] } },
      ],
    }).select("_id instaProfile facebookProfile instaData fbData");

    console.log(`[IG/FB Cron] Found ${influencers.length} influencers to process`);

    for (const influencer of influencers) {
      try {
        const updates = {};

        if (influencer.instaProfile) {
          const igSnap = await InstagramData(influencer.instaProfile);
          if (igSnap && Object.keys(igSnap).length > 0) {
            const updated = [...(influencer.instaData || []), igSnap].slice(-MAX_MONTHS);
            updates.instaData = updated;
          }
        }

        if (influencer.facebookProfile) {
          const fbUrl = influencer.facebookProfile.startsWith("http")
            ? influencer.facebookProfile
            : `https://www.facebook.com/${influencer.facebookProfile}`;
          const fbSnap = await facebookData(fbUrl);
          if (fbSnap && Object.keys(fbSnap).length > 0) {
            const updated = [...(influencer.fbData || []), fbSnap].slice(-MAX_MONTHS);
            updates.fbData = updated;
          }
        }

        if (Object.keys(updates).length > 0) {
          await InfluencerSignupRequest.findByIdAndUpdate(influencer._id, updates);
          console.log(`[IG/FB Cron] Updated ${influencer._id}`);
        }
      } catch (err) {
        console.error(`[IG/FB Cron] Failed for influencer ${influencer._id}:`, err.message);
      }
    }

    console.log("[IG/FB Cron] Monthly refresh complete.");
  });

  console.log("[IG/FB Cron] Scheduled — runs on 1st of every month at 3am");
};

module.exports = { startIgFbAnalyticsCron };
