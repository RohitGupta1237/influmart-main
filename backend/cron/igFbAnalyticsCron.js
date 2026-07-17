const cron = require("node-cron");
const InfluencerSignupRequest = require("../model/influencerSignupRequestModel");
const { InstagramData, InstagramGraphData, facebookData, buildInstagramHistory, buildFacebookHistory } = require("../utils/influencerAnalytics");

const MAX_MONTHS = 10;

// Main job: runs on the 1st of every month at 3am
const startIgFbAnalyticsCron = () => {
  cron.schedule("0 3 1 * *", async () => {
    console.log("[IG/FB Cron] Starting monthly Instagram & Facebook analytics refresh...");

    const influencers = await InfluencerSignupRequest.find({
      $or: [
        { instaProfile: { $nin: [null, ""] } },
        { facebookProfile: { $nin: [null, ""] } },
      ],
    }).select("_id instaProfile facebookProfile instaData instaGraphData fbData igAccessToken");

    console.log(`[IG/FB Cron] Found ${influencers.length} influencers to process`);

    for (const influencer of influencers) {
      try {
        const updates = {};

        if (influencer.instaProfile) {
          // Full history via /community (cid) + /statistics/retrospective.
          // Overwrites instaData each run (idempotent, same as the YT cron) so
          // the graph always shows a complete, accurate window.
          // GUARD: only overwrite when the fresh build has at least as many
          // months as what's stored. A failed/partial fetch returns a short
          // fallback (e.g. 1 snapshot) and must NOT wipe good history.
          const igHistory = await buildInstagramHistory(influencer.instaProfile, MAX_MONTHS);
          const igExistingLen = influencer.instaData?.length || 0;
          if (igHistory && igHistory.length > 0 && igHistory.length >= igExistingLen) {
            updates.instaData = igHistory;
          } else if (igHistory && igHistory.length > 0) {
            console.warn(`[IG/FB Cron] Kept existing instaData for ${influencer._id}: fresh build ${igHistory.length} < stored ${igExistingLen}`);
          }

          // Graph API snapshot → instaGraphData (only if access token exists)
          if (influencer.igAccessToken) {
            try {
              const igGraphSnap = await InstagramGraphData(null, influencer.igAccessToken);
              if (igGraphSnap && Object.keys(igGraphSnap).length > 0) {
                const updated = [...(influencer.instaGraphData || []), igGraphSnap].slice(-MAX_MONTHS);
                updates.instaGraphData = updated;
              }
            } catch (e) {
              console.warn(`[IG/FB Cron] Graph API refresh failed for ${influencer._id}:`, e.message);
            }
          }
        }

        if (influencer.facebookProfile) {
          const fbUrl = influencer.facebookProfile.startsWith("http")
            ? influencer.facebookProfile
            : `https://www.facebook.com/${influencer.facebookProfile}`;
          // Full history (scraper detail + retrospective trend), overwritten
          // each run — same idempotent pattern as IG/YT. Same guard: don't let
          // a failed/partial fetch wipe good stored history.
          const fbHistory = await buildFacebookHistory(fbUrl, MAX_MONTHS);
          const fbExistingLen = influencer.fbData?.length || 0;
          if (fbHistory && fbHistory.length > 0 && fbHistory.length >= fbExistingLen) {
            updates.fbData = fbHistory;
          } else if (fbHistory && fbHistory.length > 0) {
            console.warn(`[IG/FB Cron] Kept existing fbData for ${influencer._id}: fresh build ${fbHistory.length} < stored ${fbExistingLen}`);
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
