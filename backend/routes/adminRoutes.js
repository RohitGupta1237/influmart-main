const express = require("express");
const router = express.Router();
const adminSecretMiddleware = require("../middleware/adminSecretMiddleware");
const { getMetrics, getBusinessCollabs } = require("../controllers/adminMetricsController");

router.get("/metrics", adminSecretMiddleware, getMetrics);
router.get("/business-collabs", adminSecretMiddleware, getBusinessCollabs);

module.exports = router;
