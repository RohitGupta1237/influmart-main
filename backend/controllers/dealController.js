const mongoose = require("mongoose");
const Deal = require("../model/Deal");
const Message = require("../model/Message");
const Conversation = require("../model/conversation");
const { io, getReceiverSocketId } = require("../socket/socket");

// Drop a status update into the chat thread so the other party sees what
// happened to the deal (proposed / sealed / declined). Persisted like a normal
// message and pushed over the socket so an open chat can pick it up live.
const postSystemMessage = async (conversationId, senderId, receiverId, content) => {
  try {
    if (!conversationId || !senderId || !receiverId) return;
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return;
    const message = new Message({ sender: senderId, receiver: receiverId, content });
    conversation.messages.push(message._id);
    await Promise.all([conversation.save(), message.save()]);
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId && io) {
      io.to(receiverSocketId).emit("newMessage", message);
    }
  } catch (e) {
    // Never fail a deal action just because the status note couldn't be posted.
    console.error("[postSystemMessage]", e.message);
  }
};

// Resolve display names from the DB so they're correct no matter who proposes
// (the client only reliably knows the *other* party's name).
const resolveNames = async (influencerId, brandId) => {
  let brandName = "";
  let influencerName = "";
  try {
    const Brand = mongoose.model("Brand");
    const Influencer = mongoose.model("influencer");
    const [brand, influencer] = await Promise.all([
      Brand.findById(brandId).select("brandName").lean(),
      Influencer.findById(influencerId).select("influencerName").lean(),
    ]);
    brandName = brand?.brandName || "";
    influencerName = influencer?.influencerName || "";
  } catch (e) {
    // Non-fatal — fall back to whatever the client sent.
  }
  return { brandName, influencerName };
};

// POST /deals/propose
// One side locks a price. body: { influencerId, brandId, brandName,
// influencerName, conversationId, price, proposedBy: 'influencer'|'brand' }
const proposeDeal = async (req, res) => {
  try {
    const {
      influencerId,
      brandId,
      brandName,
      influencerName,
      conversationId,
      price,
      proposedBy,
      senderId,
      receiverId,
    } = req.body;

    if (!influencerId || !brandId || !conversationId) {
      return res.status(400).json({ message: "Missing deal participants" });
    }
    const amount = Number(price);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Enter a valid price" });
    }
    if (!["influencer", "brand"].includes(proposedBy)) {
      return res.status(400).json({ message: "Invalid proposer" });
    }

    // Only one live proposal per conversation — supersede any prior pending one.
    // (Sealed deals are kept as history so repeat collaborations still show.)
    await Deal.updateMany(
      { conversation: conversationId, status: "proposed" },
      { status: "declined" }
    );

    const resolved = await resolveNames(influencerId, brandId);

    const deal = await Deal.create({
      influencer: influencerId,
      brand: brandId,
      brandName: resolved.brandName || brandName || "",
      influencerName: resolved.influencerName || influencerName || "",
      conversation: conversationId,
      price: amount,
      proposedBy,
      status: "proposed",
    });

    // A new deal reopens a previously closed chat.
    await Conversation.findByIdAndUpdate(conversationId, {
      closed: false,
      closeRequestBy: null,
    });

    await postSystemMessage(
      conversationId,
      senderId,
      receiverId,
      `🤝 Locked a deal price: ₹${amount}. Waiting for the other party to accept.`
    );

    return res.status(201).json({ message: "Price locked", deal });
  } catch (error) {
    console.error("[proposeDeal]", error);
    return res.status(500).json({ message: "Could not lock price" });
  }
};

// PATCH /deals/:dealId/seal   body: { userType: 'influencer'|'brand' }
// The OTHER party (not the proposer) accepts → the deal is sealed.
const sealDeal = async (req, res) => {
  try {
    const { userType, senderId, receiverId } = req.body;
    const deal = await Deal.findById(req.params.dealId);
    if (!deal) return res.status(404).json({ message: "Deal not found" });
    if (deal.status !== "proposed") {
      return res.status(400).json({ message: `Deal already ${deal.status}` });
    }
    // Mutual confirm: the proposer cannot seal their own proposal.
    if (userType && userType === deal.proposedBy) {
      return res
        .status(403)
        .json({ message: "Waiting for the other party to accept" });
    }

    deal.status = "sealed";
    deal.sealedAt = new Date();
    await deal.save();

    await postSystemMessage(
      deal.conversation,
      senderId,
      receiverId,
      `✅ Deal accepted & sealed at ₹${deal.price}.`
    );

    return res.status(200).json({ message: "Deal sealed", deal });
  } catch (error) {
    console.error("[sealDeal]", error);
    return res.status(500).json({ message: "Could not seal deal" });
  }
};

// PATCH /deals/:dealId/decline
const declineDeal = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    const deal = await Deal.findById(req.params.dealId);
    if (!deal) return res.status(404).json({ message: "Deal not found" });
    if (deal.status !== "proposed") {
      return res.status(400).json({ message: `Deal already ${deal.status}` });
    }
    deal.status = "declined";
    await deal.save();

    await postSystemMessage(
      deal.conversation,
      senderId,
      receiverId,
      `❌ Deal declined (₹${deal.price}).`
    );

    return res.status(200).json({ message: "Deal declined", deal });
  } catch (error) {
    console.error("[declineDeal]", error);
    return res.status(500).json({ message: "Could not decline deal" });
  }
};

// GET /deals/conversation/:conversationId
// The current live deal for a chat: the newest proposed-or-sealed one.
const getConversationDeal = async (req, res) => {
  try {
    const deal = await Deal.findOne({
      conversation: req.params.conversationId,
      status: { $in: ["proposed", "sealed"] },
    }).sort({ createdAt: -1 });
    return res.status(200).json({ deal: deal || null });
  } catch (error) {
    console.error("[getConversationDeal]", error);
    return res.status(500).json({ message: "Could not fetch deal" });
  }
};

// GET /deals/influencer/:influencerId
// All sealed deals for an influencer + total earnings — powers the dashboard.
const getInfluencerDeals = async (req, res) => {
  try {
    const deals = await Deal.find({
      influencer: req.params.influencerId,
      status: "sealed",
    }).sort({ sealedAt: -1 });

    const totalEarnings = deals.reduce((sum, d) => sum + (d.price || 0), 0);

    return res
      .status(200)
      .json({ deals, totalEarnings, count: deals.length });
  } catch (error) {
    console.error("[getInfluencerDeals]", error);
    return res.status(500).json({ message: "Could not fetch deals" });
  }
};

// ── Chat close flow + payment nudge ─────────────────────────────────────────

// GET /deals/chat/:conversationId/state → { closed, closeRequestBy }
const getChatState = async (req, res) => {
  try {
    const c = await Conversation.findById(req.params.conversationId).select(
      "closed closeRequestBy"
    );
    if (!c) return res.status(404).json({ message: "Conversation not found" });
    return res
      .status(200)
      .json({ closed: !!c.closed, closeRequestBy: c.closeRequestBy || null });
  } catch (error) {
    console.error("[getChatState]", error);
    return res.status(500).json({ message: "Could not fetch chat state" });
  }
};

// POST /deals/chat/:conversationId/payment-pending
// body: { senderId, receiverId }  — a nudge from the influencer to the brand.
const paymentPending = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    await postSystemMessage(
      req.params.conversationId,
      senderId,
      receiverId,
      "💰 Payment pending — please complete the payment so we can close this chat."
    );
    return res.status(200).json({ message: "Reminder sent" });
  } catch (error) {
    console.error("[paymentPending]", error);
    return res.status(500).json({ message: "Could not send reminder" });
  }
};

// POST /deals/chat/:conversationId/request-close
// body: { requestedBy: 'influencer'|'brand', senderId, receiverId }
const requestClose = async (req, res) => {
  try {
    const { requestedBy, senderId, receiverId } = req.body;
    const c = await Conversation.findById(req.params.conversationId);
    if (!c) return res.status(404).json({ message: "Conversation not found" });
    if (c.closed) return res.status(400).json({ message: "Chat already closed" });
    c.closeRequestBy = requestedBy;
    await c.save();
    await postSystemMessage(
      c._id,
      senderId,
      receiverId,
      "🔒 Requested to close this chat — campaign complete. Accept or decline to confirm."
    );
    return res.status(200).json({ message: "Close requested", closeRequestBy: c.closeRequestBy });
  } catch (error) {
    console.error("[requestClose]", error);
    return res.status(500).json({ message: "Could not request close" });
  }
};

// PATCH /deals/chat/:conversationId/accept-close
// body: { userType, senderId, receiverId } — only the OTHER side can accept.
const acceptClose = async (req, res) => {
  try {
    const { userType, senderId, receiverId } = req.body;
    const c = await Conversation.findById(req.params.conversationId);
    if (!c) return res.status(404).json({ message: "Conversation not found" });
    if (!c.closeRequestBy) {
      return res.status(400).json({ message: "No close request to accept" });
    }
    if (userType && userType === c.closeRequestBy) {
      return res.status(403).json({ message: "Waiting for the other party to accept" });
    }
    c.closed = true;
    c.closeRequestBy = null;
    await c.save();
    await postSystemMessage(
      c._id,
      senderId,
      receiverId,
      "✅ Chat closed — campaign completed successfully. Start a new deal to reopen."
    );
    return res.status(200).json({ message: "Chat closed", closed: true });
  } catch (error) {
    console.error("[acceptClose]", error);
    return res.status(500).json({ message: "Could not close chat" });
  }
};

// PATCH /deals/chat/:conversationId/decline-close
// body: { senderId, receiverId }
const declineClose = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    const c = await Conversation.findById(req.params.conversationId);
    if (!c) return res.status(404).json({ message: "Conversation not found" });
    c.closeRequestBy = null;
    await c.save();
    await postSystemMessage(
      c._id,
      senderId,
      receiverId,
      "↩️ Close request declined — the chat stays open."
    );
    return res.status(200).json({ message: "Close declined" });
  } catch (error) {
    console.error("[declineClose]", error);
    return res.status(500).json({ message: "Could not decline close" });
  }
};

module.exports = {
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
};
