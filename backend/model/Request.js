const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'influencer' },
  requestedAt: { type: Date, default: Date.now },
  // Pipeline status managed by the receiver (influencer) — Jira-style board.
  status: {
    type: String,
    enum: ['pending', 'accepted', 'negotiation', 'in_campaign', 'brief_docs', 'rejected', 'closed'],
    default: 'pending',
  },
});

module.exports = mongoose.model('Request', RequestSchema);