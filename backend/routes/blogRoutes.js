const express = require("express");
const router = express.Router();
const adminSecretMiddleware = require("../middleware/adminSecretMiddleware");
const blogAuthorAuthentication = require("../middleware/blogAuthorAuthentication");
const {
  listPublishedArticles,
  getPublishedArticle,
  submitArticle,
  listMyArticles,
  listPendingArticles,
  listAllArticlesForAdmin,
  reviewArticle,
  deleteMyArticle,
  deleteArticleAsAdmin,
} = require("../controllers/blogController");

router.get("/articles", listPublishedArticles);
router.get("/articles/:articleId", getPublishedArticle);
router.post("/articles", blogAuthorAuthentication, submitArticle);
router.get("/my-articles", blogAuthorAuthentication, listMyArticles);
router.delete("/my-articles/:articleId", blogAuthorAuthentication, deleteMyArticle);
router.get("/admin/pending", adminSecretMiddleware, listPendingArticles);
router.get("/admin/articles", adminSecretMiddleware, listAllArticlesForAdmin);
router.patch("/admin/:articleId/:action", adminSecretMiddleware, reviewArticle);
router.delete("/admin/:articleId", adminSecretMiddleware, deleteArticleAsAdmin);

module.exports = router;
