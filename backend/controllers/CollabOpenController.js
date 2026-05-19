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
        campaignTitle,
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
        campaignTitle: campaignTitle || "",
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

      // Fetch all openings, excluding applied posts and non-active campaigns
      const baseFilter = {
        $or: [{ status: 'active' }, { status: { $exists: false } }],
        ...(appliedPostIds.length > 0 ? { _id: { $nin: appliedPostIds } } : {}),
      };
      const collabOpenings = await CollabOpening.find(baseFilter).populate({
        path: 'brand',
        model: 'Brand',
        select: 'brandName category profileUrl isSelectedImage'
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
    populate: [
      {
        path: "sender",
        model: "influencer",
        select: "influencerName category profileUrl isSelectedImage"
      },
      {
        path: "collabOpeningId",
        model: "CollabOpening",
        select: "campaignTitle campaignType"
      }
    ],
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

    const collabOpenings = await CollabOpening.find({
      _id: { $in: appliedIds },
      $or: [{ status: 'active' }, { status: { $exists: false } }],
    }).populate({
      path: 'brand',
      model: 'Brand',
      select: 'brandName category profileUrl isSelectedImage'
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

const addCollaboratedInfluencer = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ message: 'Username is required' });
    }
    const campaign = await CollabOpening.findById(campaignId);
    if (!campaign || campaign.status !== 'successfully_closed') {
      return res.status(400).json({ message: 'Campaign not found or not successfully closed' });
    }
    // Validate influencer exists with this username
    const influencer = await InfluencerSignupRequest.findOne({ userName: username.trim() });
    if (!influencer) {
      return res.status(404).json({ message: `No influencer found with username "${username.trim()}"` });
    }
    await CollabOpening.findByIdAndUpdate(campaignId, {
      $addToSet: { collaboratedInfluencers: username.trim() }
    });
    res.status(200).json({ message: 'Influencer added' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add influencer', error });
  }
};

const getBrandCampaigns = async (req, res) => {
  try {
    const { brandId } = req.params;
    const collabOpenings = await CollabOpening.find({ brand: brandId })
      .populate({ path: 'brand', model: 'Brand', select: 'brandName category profileUrl isSelectedImage' })
      .sort({ createdAt: -1 });
    res.status(200).json({ collabOpenings });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch brand campaigns', error });
  }
};

const updateCampaignStatus = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { status } = req.body;
    if (!['successfully_closed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    await CollabOpening.findByIdAndUpdate(campaignId, { status });
    // Remove this campaign from all influencers' applied lists
    await InfluencerSignupRequest.updateMany(
      { appliedCollabPosts: campaignId },
      { $pull: { appliedCollabPosts: campaignId } }
    );
    res.status(200).json({ message: `Campaign marked as ${status}` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update campaign status', error });
  }
};

module.exports = { postCollabOpen, getAllCollabOpen, getAppliedCollabPosts, sendCollabOpenRequest, allCollabOpenRequests, acceptCollabOpen, rejectCollabOpen, getBrandCollabOpenCount, getBrandCampaigns, updateCampaignStatus, addCollaboratedInfluencer };