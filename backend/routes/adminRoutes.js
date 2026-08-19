const express = require("express");
const router = express.Router();
const adminSecretMiddleware = require("../middleware/adminSecretMiddleware");
const { getMetrics } = require("../controllers/adminMetricsController");

router.get("/metrics", adminSecretMiddleware, getMetrics);

module.exports = router;
