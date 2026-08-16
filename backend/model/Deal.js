const mongoose = require("mongoose");

// A "sealed deal" between an influencer and a brand, agreed inside a chat.
// Flow: one side proposes a locked price (status "proposed"); the OTHER side
// must accept before it counts (status "sealed"). Sealed deals feed the
// influencer earnings dashboard. One live (non-declined) deal per conversation.
const dealSchema = new mongoose.Schema(
  {
    influencer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "influencer",
      required: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    // Denormalised names so the dashboard/chat can render without extra joins.
    brandName: { type: String, default: "" },
    influencerName: { type: String, default: "" },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["proposed", "sealed", "declined"],
      default: "proposed",
    },
    // Who locked the price — so the other side is the one who can seal it.
    proposedBy: { type: String, enum: ["influencer", "brand"], required: true },
    sealedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Deal", dealSchema);
