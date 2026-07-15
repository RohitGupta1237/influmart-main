const express = require("express");
const router = express.Router();
const {
  getActiveCoupon,
  getAllCoupons,
  setCoupon,
} = require("../controllers/couponController");
const adminSecretMiddleware = require("../middleware/adminSecretMiddleware");

// Public — the app reads the currently active coupon.
router.get("/active", getActiveCoupon);

// Admin-only — list & toggle coupons.
router.get("/", adminSecretMiddleware, getAllCoupons);
router.post("/set", adminSecretMiddleware, setCoupon);

module.exports = router;
