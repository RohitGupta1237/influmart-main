const mongoose = require("mongoose");

const blogArticleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    summary: { type: String, required: true, trim: true, maxlength: 280 },
    content: { type: String, required: true, trim: true, maxlength: 30000 },
    coverImageUrl: { type: String, trim: true, maxlength: 2048, default: "" },
    authorId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    authorRole: { type: String, required: true, enum: ["influencer", "brand"], index: true },
    authorName: { type: String, required: true, trim: true, maxlength: 120 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date, default: null },
    rejectionNote: { type: String, trim: true, maxlength: 1000, default: "" },
  },
  { timestamps: true }
);

blogArticleSchema.index({ status: 1, reviewedAt: -1, createdAt: -1 });

module.exports = mongoose.model("BlogArticle", blogArticleSchema);
