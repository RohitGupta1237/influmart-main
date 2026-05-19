const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userName: { type: String, required: true, unique: true},
  plan: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  isFree: { type: Boolean, required: true },
  amount: { type: String },
  paymentMode: { type: String },
  transactionDate: { type: Date },
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
