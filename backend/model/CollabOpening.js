const mongoose = require('mongoose');

const collabOpeningSchema = new mongoose.Schema({
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  },
  campaignTitle: { type: String, default: "" },
  campaignType: String,
  earningCapacity: {
    min: Number,
    max: Number
  },
  campaignTimelines: String,
  minEligibilityCriteria: String,
  postInfo: String,
  productReviewInstructions: String,
  campaignSteps: String,
  compensationType: {
    type: String,
    enum: ['Barter', 'Cashback', 'Payout', 'Voucher'],
  },
  numberOfInfluencers: Number,
  brandDescription: String,
  photoUrl: String,
  // When true, this opening is handled by Influmart (premium) and is routed to
  // the admin "Business Collaboration Requests" section instead of the public
  // influencer collab list. Old openings have no field → treated as false.
  premiumRequested: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['active', 'successfully_closed', 'cancelled'],
    default: 'active'
  },
  collaboratedInfluencers: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CollabOpening', collabOpeningSchema);
