const mongoose = require("mongoose");

// Admin-controlled discount coupons for subscriptions/campaigns.
// Only one is active at a time (enforced in the controller).
const couponSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, required: true },
    label: { type: String, required: true },
    discount: { type: Number, required: true }, // 0.30, 0.60, 1.0
    active: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);
