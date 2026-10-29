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
  reviewArticle,
} = require("../controllers/blogController");

router.get("/articles", listPublishedArticles);
router.get("/articles/:articleId", getPublishedArticle);
router.post("/articles", blogAuthorAuthentication, submitArticle);
router.get("/my-articles", blogAuthorAuthentication, listMyArticles);
router.get("/admin/pending", adminSecretMiddleware, listPendingArticles);
router.patch("/admin/:articleId/:action", adminSecretMiddleware, reviewArticle);

module.exports = router;
