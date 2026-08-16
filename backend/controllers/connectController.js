const express = require("express");
const Request = require("../model/Request");
const Message = require("../model/Message");
const InfluencerSignupRequest = require("../model/influencerSignupRequestModel");
const Brand = require("../model/brandDbRequestModel");
const Conversation = require("../model/conversation");
const { getReceiverSocketId } = require("../socket/socket");

// Send a connection request
const sendRequest = async (req, res) => {
  const { senderId, receiverId } = req.body;
  const isRequestExists=await Request.findOne({sender:senderId,receiver:receiverId});
  if(isRequestExists)
    return res.status(500).json({message:"Request already exists"})
  const request = new Request({ sender: senderId, receiver: receiverId });
  await request.save();
  await InfluencerSignupRequest.findByIdAndUpdate(receiverId, {
    $push: { notifications: request._id },
  })
  res.status(200).json({ message: "Request sent" });
};

// View all requests for a user
const allRequests = async (req, res) => {
  const { userId } = req.params;
  const user = await InfluencerSignupRequest.findById(userId).populate({
    path: "notifications",
    match: { status: { $ne: "closed" } }, // closed tickets drop off the board
    populate: {
      path: "sender",
      model: "Brand",
      options: { select: "name category profileUrl isSelectedImage" }
    },
  });
  res.status(200).json({ user: user?.notifications?.filter((n) => n !== null) });
};

// Move a connection request through the status pipeline (Jira-style board).
const PIPELINE = ['pending', 'accepted', 'negotiation', 'in_campaign', 'brief_docs', 'rejected', 'closed'];
const updateRequestStatus = async (req, res) => {
  try {
    const { requestId, status } = req.body;
    if (!requestId || !PIPELINE.includes(status)) {
      return res.status(400).json({ message: "Missing requestId or invalid status" });
    }
    const updated = await Request.findByIdAndUpdate(requestId, { status }, { new: true });
    if (!updated) return res.status(404).json({ message: "Request not found" });
    res.status(200).json({ message: "Status updated", status: updated.status });
  } catch (err) {
    console.error("[updateRequestStatus] error:", err.message);
    res.status(500).json({ message: "Something went wrong while updating status." });
  }
};

// Accept a connection request
const accept = async (req, res, next) => {
  try {
    const { requestId } = req.body;
    const request = await Request.findById(requestId).populate("sender receiver");

    // The request, or the brand (sender) / influencer (receiver) it points to, may
    // have been deleted — populate returns null in that case. Guard before using them.
    if (!request || !request.sender || !request.receiver) {
      return res.status(404).json({
        message: "This request is no longer valid. The brand or influencer may have been removed.",
      });
    }

    // Send automatic message
    const autoMessage = new Message({
      sender: request.receiver._id,
      receiver: request.sender._id,
      content: "I am interested in collaborating with you",
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
    await InfluencerSignupRequest.findByIdAndUpdate(request.receiver._id, {
      $addToSet: { conversations: conversation._id }
    });
    await Brand.findByIdAndUpdate(request.sender._id, {
      $addToSet: { conversations: conversation._id }
    });

    await Promise.all([
      autoMessage.save(),
      conversation.save(),
      // Keep the request on the board and mark it accepted (was: delete).
      Request.findByIdAndUpdate(requestId, { status: "accepted" }),
    ]);

    res.status(200).json({ message: "Request accepted and message sent", senderId: request.sender._id, receiverId: request.receiver._id });
  } catch (err) {
    console.error("[connect accept] error:", err.message);
    res.status(500).json({ message: "Something went wrong while accepting the request." });
  }
};

// Reject a connection request

const reject = async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId) {
      return res.status(400).json({ message: "Missing requestId" });
    }
    await Request.findByIdAndDelete(requestId);
    res.status(200).json({ message: "Request rejected" });
  } catch (err) {
    console.error("[connect reject] error:", err.message);
    res.status(500).json({ message: "Something went wrong while rejecting the request." });
  }
};

const closeChat = async (req, res) => {
  const { userId, chatUserId, conversationId } = req.body;
  try {
    // Delete all messages between the two users
    await Message.deleteMany({
      $or: [
        { sender: userId, receiver: chatUserId },
        { sender: chatUserId, receiver: userId },
      ],
    });

    // Find and delete the conversation document
    let conv = null;
    if (conversationId) {
      conv = await Conversation.findByIdAndDelete(conversationId);
    } else {
      conv = await Conversation.findOneAndDelete({
        participants: { $all: [userId, chatUserId] },
      });
    }

    // Remove conversation ref from both users' arrays
    if (conv) {
      await Brand.updateMany({}, { $pull: { conversations: conv._id } });
      await InfluencerSignupRequest.updateMany({}, { $pull: { conversations: conv._id } });
    }

    res.status(200).json({ message: "Chat deleted" });
  } catch (err) {
    console.error("[closeChat]", err);
    res.status(500).json({ message: "Failed to delete chat", error: err.message });
  }
};

const sendMessage = async (req, res) => {
  const { senderId, receiverId, content } = req.body;
  try {
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }
    // Chat is closed (campaign complete) — block new messages until a new deal
    // reopens it. System notes from the deal flow bypass this (posted directly).
    if (conversation.closed) {
      return res
        .status(403)
        .json({ message: "This chat is closed. Start a new deal to reopen it." });
    }
    const message = new Message({ sender: senderId, receiver: receiverId, content });
    if (message) {
      conversation.messages.push(message._id);
    }

    await Promise.all([conversation.save(), message.save()]);
    const receiverSocketId = getReceiverSocketId(receiverId);
		if (receiverSocketId) {
			// io.to(<socket_id>).emit() used to send events to specific client
			io.to(receiverSocketId).emit("newMessage", message);
		}
    res.status(200).json({ message: "Message sent" });
  } catch (error) {
    res.status(500).json({ message: "Message not sent" });
    console.log(error);
  }
};

const getMessages = async (req, res) => {
  const { conversationId } = req.params;
  try {
    let conversation;
    let conversation1;
      conversation = await Conversation.findById(conversationId).populate({
        path: 'messages',
        options: { sort: { createdAt: 1 } }, // Sort messages by creation date
        populate: [
          {
            path: 'receiver',
            model: 'influencer',
            select: 'influencerName profileUrl isSelectedImage',
          },
          {
            path: 'sender',
            model: 'Brand',
            select: 'brandName profileUrl isSelectedImage',
          },
        ],
      });
      conversation1 = await Conversation.findById(conversationId).populate({
        path: 'messages',
        options: { sort: { createdAt: 1 } }, // Sort messages by creation date
        populate: [
          {
            path: 'sender',
            model: 'influencer',
            select: 'influencerName profileUrl isSelectedImage',
          },
          {
            path: 'receiver',
            model: 'Brand',
            select: 'brandName profileUrl isSelectedImage',
          },
        ],
      });
    conversation.messages.map((message,index) => {
      if(message.sender==null){
        conversation.messages[index].sender=conversation1.messages[index].sender
        conversation.messages[index].receiver=conversation1.messages[index].receiver
      }}
    );
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.status(200).json({ messages: conversation.messages });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages' });
    console.error(error);
  }
};




const getAllConversations = async (req, res) => {
  const { userId, userType } = req.body; // userType can be 'influencer' or 'brand'
  try {
    let user;
    if (userType === 'influencer') {
      user = await InfluencerSignupRequest.findById(userId).populate({
        path: 'conversations',
        populate: [
          {
            path: 'participants',
            match: { _id: { $ne: userId } }, // Exclude the current user
            model: 'Brand',
            select: 'brandName category profileUrl isSelectedImage'
          },
          {
            path: 'messages',
            options: { sort: { createdAt: -1 } } // Sort messages by creation date
          }
        ]
      });
    } else if (userType === 'brand') {
      user = await Brand.findById(userId).populate({
        path: 'conversations',
        populate: [
          {
            path: 'participants',
            match: { _id: { $ne: userId } }, // Exclude the current user
            model: 'influencer',
            select: 'influencerName profileUrl isSelectedImage'
          },
          {
            path: 'messages',
            options: { sort: { createdAt: -1 } } // Sort messages by creation date
          }
        ]
      });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Deduplicate by conversation _id in case legacy duplicate entries exist in DB
    const seen = new Set();
    const uniqueConversations = (user.conversations || []).filter(c => {
      const id = c._id?.toString();
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    res.status(200).json({ conversations: uniqueConversations });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch conversations' });
    console.log(error);
  }
};


// Search influencers (for brands) or brands (for influencers) by name
const searchUsers = async (req, res) => {
  const { query, userType } = req.query;
  try {
    if (!query || query.trim() === '') {
      return res.status(200).json({ results: [] });
    }
    const regex = new RegExp(query, 'i');
    let results = [];
    if (userType === 'brand') {
      // Brand is searching for influencers
      const influencers = await InfluencerSignupRequest.find(
        { influencerName: regex },
        'influencerName profileUrl isSelectedImage _id'
      ).limit(20);
      results = influencers.map(u => ({
        _id: u._id,
        name: u.influencerName,
        profileUrl: u.profileUrl,
        isSelectedImage: u.isSelectedImage,
      }));
    } else if (userType === 'influencer') {
      // Influencer is searching for brands
      const brands = await Brand.find(
        { brandName: regex },
        'brandName profileUrl isSelectedImage _id'
      ).limit(20);
      results = brands.map(u => ({
        _id: u._id,
        name: u.brandName,
        profileUrl: u.profileUrl,
        isSelectedImage: u.isSelectedImage,
      }));
    }
    res.status(200).json({ results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Search failed' });
  }
};

// Find existing conversation between two users or create a new one
const findOrCreateConversation = async (req, res) => {
  const { userId, receiverId, userType } = req.body;
  try {
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, receiverId] },
    });
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, receiverId],
      });
      // Add conversation to both users' lists
      if (userType === 'brand') {
        await Brand.findByIdAndUpdate(userId, { $addToSet: { conversations: conversation._id } });
        await InfluencerSignupRequest.findByIdAndUpdate(receiverId, { $addToSet: { conversations: conversation._id } });
      } else {
        await InfluencerSignupRequest.findByIdAndUpdate(userId, { $addToSet: { conversations: conversation._id } });
        await Brand.findByIdAndUpdate(receiverId, { $addToSet: { conversations: conversation._id } });
      }
    }
    res.status(200).json({ conversationId: conversation._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to find or create conversation' });
  }
};

module.exports = { sendRequest, allRequests, accept, reject, updateRequestStatus, closeChat, sendMessage, getMessages, getAllConversations, searchUsers, findOrCreateConversation };
