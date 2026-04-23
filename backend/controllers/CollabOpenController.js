const Brand = require("../model/brandDbRequestModel");
const CollabOpening = require("../model/CollabOpening");
const CollabOpenRequest = require("../model/CollabOpenRequest");
const Conversation = require("../model/conversation");
const InfluencerSignupRequest = require("../model/influencerSignupRequestModel");
const Message = require("../model/Message");

const postCollabOpen = async (req, res) => {
    try {
      const {
        brandId,
        campaignType,
        earningCapacity,
        campaignTimelines,
        minEligibilityCriteria,
        postInfo,
        productReviewInstructions,
        campaignSteps,
        compensationType,
        numberOfInfluencers,
        brandDescription
      } = req.body;
  
      const collabOpening = new CollabOpening({
        brand: brandId, 
        campaignType,
        earningCapacity,
        campaignTimelines,
        minEligibilityCriteria,
        postInfo,
        productReviewInstructions,
        campaignSteps,
        compensationType,
        numberOfInfluencers,
        brandDescription,
        photoUrl: req.file?.path
      });
  
      await collabOpening.save();
  
      res.status(201).json({ message: 'Collaboration opening created successfully', collabOpening });
    } catch (error) {
      res.status(500).json({ message: 'Failed to create collaboration opening', error });
    }
  }

const getAllCollabOpen =  async (req, res) => {
    try {
      const { influencerId } = req.query;

      // Use influencer's appliedCollabPosts array as source of truth (persists through request lifecycle)
      let appliedPostIds = [];
      if (influencerId) {
        const influencer = await InfluencerSignupRequest.findById(influencerId, 'appliedCollabPosts');
        if (influencer?.appliedCollabPosts?.length > 0) {
          appliedPostIds = influencer.appliedCollabPosts.map(id => id.toString());
        }
      }

      // Fetch all openings, excluding only the specific posts the influencer applied to
      const collabOpenings = await CollabOpening.find(
        appliedPostIds.length > 0 ? { _id: { $nin: appliedPostIds } } : {}
      ).populate({
        path: 'brand',
        model: 'Brand',
        select: 'brandName category'
      });

      res.status(200).json({ collabOpenings });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch collaboration openings', error });
    }
  }

    // Send a apply/connection request
const sendCollabOpenRequest = async (req, res) => {
  const { influencerId, brandId, collabOpeningId } = req.body;
  const isRequestExist = await CollabOpenRequest.findOne({
    sender: influencerId,
    collabOpeningId: collabOpeningId || { $exists: false },
    ...(collabOpeningId ? {} : { receiver: brandId }),
  });
  if (isRequestExist)
    return res.status(500).json({ message: 'Request already exists' });
  const request = new CollabOpenRequest({ sender: influencerId, receiver: brandId, collabOpeningId: collabOpeningId || null });
  await request.save();
  await Brand.findByIdAndUpdate(brandId, {
    $push: { notifications: request._id },
  });
  if (collabOpeningId) {
    await InfluencerSignupRequest.findByIdAndUpdate(influencerId, {
      $addToSet: { appliedCollabPosts: collabOpeningId },
    });
  }
  res.status(200).json({ message: "Request sent" });
};

// View all requests/application for a influencer
const allCollabOpenRequests = async (req, res) => {
  const { userId } = req.params;
  const user = await Brand.findById(userId).populate({
    path: "notifications",
    match: { status: 'pending' },
    populate: {
      path: "sender",
      model: "influencer",
      options: { select: "influencerName category profileUrl isSelectedImage" }
    },
  });
  res.status(200).json({ user: user?.notifications?.filter(n => n !== null) });
};

// Accept a connection request
const acceptCollabOpen = async (req, res, next) => {
  const { requestId } = req.body;
  const request = await CollabOpenRequest.findById(requestId).populate("sender receiver");

  // Send automatic message
  const autoMessage = new Message({
    sender: request.receiver._id,
    receiver: request.sender._id,
    content: "Thank you for applying to our collaboration opening. We are interested in collaborating with you.",
  });

  // Find or create a conversation
  let conversation = await Conversation.findOne({
    participants: { $all: [request.sender._id, request.receiver._id] },
  });
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [request.sender._id, request.receiver._id],
    });
  }
  conversation.messages.push(autoMessage._id);

  // Add conversation to both users — $addToSet prevents duplicates
  await Brand.findByIdAndUpdate(request.receiver._id, {
    $addToSet: { conversations: conversation._id }
  });
  await InfluencerSignupRequest.findByIdAndUpdate(request.sender._id, {
    $addToSet: { conversations: conversation._id }
  });

  await Promise.all([
    autoMessage.save(),
    conversation.save(),
    CollabOpenRequest.findByIdAndUpdate(requestId, { status: 'accepted' }),
  ]);

  res.status(200).json({ message: "Request accepted and message sent", senderId: request.sender._id, receiverId: request.receiver._id });
};

// Reject a application/connection request

const rejectCollabOpen = async (req, res) => {
  const { requestId } = req.body;
  await CollabOpenRequest.findByIdAndDelete(requestId);
  res.status(200).json({ message: "Request rejected" });
};


const getAppliedCollabPosts = async (req, res) => {
  try {
    const { influencerId } = req.query;
    if (!influencerId) return res.status(400).json({ message: 'influencerId required' });

    const influencer = await InfluencerSignupRequest.findById(influencerId, 'appliedCollabPosts');
    const appliedIds = influencer?.appliedCollabPosts || [];

    const collabOpenings = await CollabOpening.find({ _id: { $in: appliedIds } }).populate({
      path: 'brand',
      model: 'Brand',
      select: 'brandName category'
    });

    res.status(200).json({ collabOpenings });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch applied posts', error });
  }
};

const getBrandCollabOpenCount = async (req, res) => {
  try {
    const { brandId } = req.params;
    const count = await CollabOpening.countDocuments({ brand: brandId });
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch collab opening count', error });
  }
};

module.exports = { postCollabOpen, getAllCollabOpen, getAppliedCollabPosts, sendCollabOpenRequest, allCollabOpenRequests, acceptCollabOpen, rejectCollabOpen, getBrandCollabOpenCount };