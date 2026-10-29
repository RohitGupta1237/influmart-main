const BlogArticle = require("../model/BlogArticle");

const cardFields = "title summary coverImageUrl authorName authorRole createdAt reviewedAt";
const articleFields = `${cardFields} content`;

exports.listPublishedArticles = async (_req, res) => {
  try {
    const articles = await BlogArticle.find({ status: "approved" }, cardFields)
      .sort({ reviewedAt: -1, createdAt: -1 })
      .limit(100)
      .lean();
    return res.json({ articles });
  } catch (error) {
    console.error("[blog] list published articles:", error.message);
    return res.status(500).json({ message: "Could not load blog articles" });
  }
};

exports.getPublishedArticle = async (req, res) => {
  try {
    const article = await BlogArticle.findOne({ _id: req.params.articleId, status: "approved" }, articleFields).lean();
    if (!article) return res.status(404).json({ message: "Article not found" });
    return res.json({ article });
  } catch (error) {
    if (error.name === "CastError") return res.status(404).json({ message: "Article not found" });
    console.error("[blog] get article:", error.message);
    return res.status(500).json({ message: "Could not load article" });
  }
};

exports.submitArticle = async (req, res) => {
  const title = String(req.body.title || "").trim();
  const summary = String(req.body.summary || "").trim();
  const content = String(req.body.content || "").trim();
  const coverImageUrl = String(req.body.coverImageUrl || "").trim();

  if (req.body.submitForReview !== true) {
    return res.status(400).json({ message: "Confirm submission for admin review" });
  }
  if (!title || !summary || !content) {
    return res.status(400).json({ message: "Title, summary, and article content are required" });
  }
  if (title.length > 140 || summary.length > 280 || content.length > 30000) {
    return res.status(400).json({ message: "The article exceeds the allowed length" });
  }
  if (coverImageUrl) {
    try {
      const url = new URL(coverImageUrl);
      if (!/^https?:$/.test(url.protocol)) throw new Error("Invalid protocol");
    } catch (_error) {
      return res.status(400).json({ message: "Cover image must be a valid http or https URL" });
    }
  }

  try {
    const article = await BlogArticle.create({
      title,
      summary,
      content,
      coverImageUrl,
      authorId: req.blogAuthor.id,
      authorRole: req.blogAuthor.role,
      authorName: req.blogAuthor.name,
      status: "pending",
      submittedAt: new Date(),
    });
    return res.status(201).json({ message: "Article submitted for review", article });
  } catch (error) {
    console.error("[blog] submit article:", error.message);
    return res.status(500).json({ message: "Could not submit article" });
  }
};

exports.listMyArticles = async (req, res) => {
  try {
    const articles = await BlogArticle.find({
      authorId: req.blogAuthor.id,
      authorRole: req.blogAuthor.role,
    })
      .select("title summary status rejectionNote submittedAt reviewedAt createdAt updatedAt")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return res.json({ articles });
  } catch (error) {
    console.error("[blog] list my articles:", error.message);
    return res.status(500).json({ message: "Could not load your articles" });
  }
};

exports.listPendingArticles = async (_req, res) => {
  try {
    const articles = await BlogArticle.find({ status: "pending" })
      .sort({ submittedAt: 1 })
      .limit(100)
      .lean();
    return res.json({ articles });
  } catch (error) {
    console.error("[blog admin] list pending articles:", error.message);
    return res.status(500).json({ message: "Could not load pending articles" });
  }
};

exports.listAllArticlesForAdmin = async (_req, res) => {
  try {
    const articles = await BlogArticle.find({})
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(500)
      .lean();
    return res.json({ articles });
  } catch (error) {
    console.error("[blog admin] list all articles:", error.message);
    return res.status(500).json({ message: "Could not load blog articles" });
  }
};

exports.deleteMyArticle = async (req, res) => {
  try {
    const article = await BlogArticle.findOneAndDelete({
      _id: req.params.articleId,
      authorId: req.blogAuthor.id,
      authorRole: req.blogAuthor.role,
    });
    if (!article) return res.status(404).json({ message: "Your article was not found" });
    return res.json({ message: "Article deleted" });
  } catch (error) {
    if (error.name === "CastError") return res.status(404).json({ message: "Article not found" });
    console.error("[blog] delete my article:", error.message);
    return res.status(500).json({ message: "Could not delete your article" });
  }
};

exports.deleteArticleAsAdmin = async (req, res) => {
  try {
    const article = await BlogArticle.findByIdAndDelete(req.params.articleId);
    if (!article) return res.status(404).json({ message: "Article not found" });
    return res.json({ message: "Article deleted" });
  } catch (error) {
    if (error.name === "CastError") return res.status(404).json({ message: "Article not found" });
    console.error("[blog admin] delete article:", error.message);
    return res.status(500).json({ message: "Could not delete article" });
  }
};

exports.reviewArticle = async (req, res) => {
  const action = req.params.action;
  if (!["approve", "reject"].includes(action)) {
    return res.status(400).json({ message: "Unsupported review action" });
  }
  const rejectionNote = String(req.body.rejectionNote || "").trim();
  if (action === "reject" && rejectionNote.length > 1000) {
    return res.status(400).json({ message: "Rejection note is too long" });
  }

  try {
    const article = await BlogArticle.findOneAndUpdate(
      { _id: req.params.articleId, status: "pending" },
      {
        status: action === "approve" ? "approved" : "rejected",
        rejectionNote: action === "reject" ? rejectionNote : "",
        reviewedAt: new Date(),
      },
      { new: true, runValidators: true }
    );
    if (!article) return res.status(404).json({ message: "Pending article not found" });
    return res.json({ message: action === "approve" ? "Article published" : "Article rejected", article });
  } catch (error) {
    if (error.name === "CastError") return res.status(404).json({ message: "Article not found" });
    console.error("[blog admin] review article:", error.message);
    return res.status(500).json({ message: "Could not update article" });
  }
};
