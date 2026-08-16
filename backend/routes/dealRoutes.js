const express = require("express");
const router = express.Router();
const {
  proposeDeal,
  sealDeal,
  declineDeal,
  getConversationDeal,
  getInfluencerDeals,
  getChatState,
  paymentPending,
  requestClose,
  acceptClose,
  declineClose,
} = require("../controllers/dealController");

router.post("/propose", proposeDeal);
router.patch("/:dealId/seal", sealDeal);
router.patch("/:dealId/decline", declineDeal);
router.get("/conversation/:conversationId", getConversationDeal);
router.get("/influencer/:influencerId", getInfluencerDeals);

// Chat close flow + payment nudge
router.get("/chat/:conversationId/state", getChatState);
router.post("/chat/:conversationId/payment-pending", paymentPending);
router.post("/chat/:conversationId/request-close", requestClose);
router.patch("/chat/:conversationId/accept-close", acceptClose);
router.patch("/chat/:conversationId/decline-close", declineClose);

module.exports = router;
