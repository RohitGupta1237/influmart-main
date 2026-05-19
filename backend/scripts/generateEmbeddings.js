/**
 * One-time script to generate embeddings for all existing influencers.
 * Run with: node scripts/generateEmbeddings.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const config = require("../config/configs");
const InfluencerSignupRequest = require("../model/influencerSignupRequestModel");
const { generateEmbedding, buildInfluencerText } = require("../utils/embeddings");

const run = async () => {
  await mongoose.connect(config.MONGO_DB_URL);
  console.log("Connected to MongoDB");

  const influencers = await InfluencerSignupRequest.find(
    { embedding: { $in: [null, [], undefined] } },
    { influencerName: 1, description: 1, hashtags: 1, category: 1, location: 1, gender: 1, instaData: 1 }
  );

  console.log(`Found ${influencers.length} influencers without embeddings`);

  let success = 0, failed = 0;
  for (const inf of influencers) {
    const text = buildInfluencerText(inf);
    const vec = await generateEmbedding(text);
    if (vec) {
      await InfluencerSignupRequest.findByIdAndUpdate(inf._id, { embedding: vec });
      success++;
      console.log(`✓ [${success}] ${inf.influencerName || inf._id}`);
    } else {
      failed++;
      console.log(`✗ Failed: ${inf.influencerName || inf._id}`);
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nDone. Success: ${success}, Failed: ${failed}`);
  process.exit(0);
};

run().catch(err => { console.error(err); process.exit(1); });
