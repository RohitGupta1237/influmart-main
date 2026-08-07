const mongoose = require('mongoose');

const CollabOpenRequestSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'influencer' },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
  collabOpeningId: { type: mongoose.Schema.Types.ObjectId, ref: 'CollabOpening', default: null },
  requestedAt: { type: Date, default: Date.now },
  // Pipeline status managed by the receiver (brand) — Jira-style board.
  status: { type: String, enum: ['pending', 'accepted', 'negotiation', 'in_campaign', 'brief_docs', 'rejected'], default: 'pending' }
});

module.exports = mongoose.model('CollabOpenRequest', CollabOpenRequestSchema);