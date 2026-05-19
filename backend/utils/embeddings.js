const axios = require("axios");
const config = require("../config/configs");

const HF_MODEL = "sentence-transformers/all-MiniLM-L6-v2";
const HF_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}/pipeline/feature-extraction`;

// Build a rich text profile from influencer data for embedding
const buildInfluencerText = (influencer) => {
  const parts = [];

  if (influencer.influencerName) parts.push(influencer.influencerName);
  if (influencer.description) parts.push(influencer.description);

  if (influencer.category?.length) {
    parts.push("Categories: " + influencer.category.join(", "));
  }

  if (influencer.hashtags?.length) {
    parts.push("Hashtags: " + influencer.hashtags.map(t => "#" + t).join(" "));
  }

  if (influencer.location) parts.push("Location: " + influencer.location);
  if (influencer.gender) parts.push("Gender: " + influencer.gender);

  // Instagram tags from social data
  try {
    const igTags = influencer.instaData?.[influencer.instaData.length - 1]?.tags;
    if (igTags?.length) {
      parts.push("Instagram tags: " + igTags.map(t => "#" + t).join(" "));
    }
  } catch (e) {}

  return parts.join(". ") || "influencer";
};

// Generate embedding vector using Hugging Face (free)
const generateEmbedding = async (text) => {
  try {
    const response = await axios.post(
      HF_URL,
      { inputs: text.slice(0, 512) },
      {
        headers: {
          Authorization: `Bearer ${config.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );
    const data = response.data;
    // HF returns [[...]] for single input — flatten if nested
    if (Array.isArray(data[0])) return data[0];
    return Array.isArray(data) ? data : null;
  } catch (err) {
    console.error("[embeddings] HuggingFace error:", err.message);
    return null;
  }
};

// Cosine similarity between two vectors
const cosineSimilarity = (a, b) => {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

module.exports = { buildInfluencerText, generateEmbedding, cosineSimilarity };
