const express = require("express");
const router = express.Router();
const {
  requestVerification,
  fetchLatestStats,
  getPendingRequests,
  approveRequest,
  rejectRequest,
} = require("../controllers/socialVerificationController");
const influencerAuthenticationMiddleware = require("../middleware/influencers/influencerAuthenticationMiddleware");
const adminSecretMiddleware = require("../middleware/adminSecretMiddleware");

// Influencer requests an OTP for a platform (Instagram / Facebook).
router.post("/request/:id", influencerAuthenticationMiddleware, requestVerification);

// Influencer fetches fresh public stats for a verified account.
router.post("/fetch/:id", influencerAuthenticationMiddleware, fetchLatestStats);

// Admin-only: list & moderate pending requests.
router.get("/pending", adminSecretMiddleware, getPendingRequests);
router.post("/:requestId/approve", adminSecretMiddleware, approveRequest);
router.post("/:requestId/reject", adminSecretMiddleware, rejectRequest);

module.exports = router;
