const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: [],
      },
    ],
    // Chat close flow. When closed, neither side can message until a new deal
    // is proposed (which reopens it). closeRequestBy holds the side ('influencer'
    // /'brand') that requested close, pending the other side's accept/decline.
    closed: { type: Boolean, default: false },
    closeRequestBy: { type: String, enum: ["influencer", "brand", null], default: null },
  },
  { timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

module.exports = Conversation;
