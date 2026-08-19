const express = require("express");
const router = express.Router();
const { trackVisit } = require("../controllers/adminMetricsController");

// Public — the web/app client pings this on page/screen views.
router.post("/visit", trackVisit);

module.exports = router;
