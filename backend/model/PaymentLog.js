const mongoose = require('mongoose');

const paymentLogSchema = new mongoose.Schema({
  orderId:   { type: String, required: true, unique: true },
  paymentId: { type: String, default: null },
  amount:    { type: Number },
  // type tells the webhook what to do after payment.captured
  type: {
    type: String,
    enum: ['subscription', 'renewal', 'campaign'],
    required: true,
  },
  // status lifecycle: pending → captured → processed | failed | refunded
  status: {
    type: String,
    enum: ['pending', 'captured', 'processed', 'failed', 'refunded'],
    default: 'pending',
  },
  // all data needed to complete the DB action (stored at order-creation time)
  metadata: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('PaymentLog', paymentLogSchema);
