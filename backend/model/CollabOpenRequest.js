const mongoose = require('mongoose');

const CollabOpenRequestSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'influencer' },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
  collabOpeningId: { type: mongoose.Schema.Types.ObjectId, ref: 'CollabOpening', default: null },
  requestedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
});

module.exports = mongoose.model('CollabOpenRequest', CollabOpenRequestSchema);