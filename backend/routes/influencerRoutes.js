const express = require("express");
const router = express.Router();
const multer = require("multer");
const { nanoid } = require("nanoid");
const path = require("path");
const {
  signup,
  login,
  getProfile,
  updateProfile,
  deleteProfile,
  getAllProfiles,
  verifyUser,
  filterInfluencers,
  aiSearchInfluencers,
  saveYtRefreshToken,
  changePassword,
  updateDescription,
  updateHashtags,
  updatePrice,
} = require("../controllers/influencerController");
const influencerAuthenticationMiddleware = require("../middleware/influencers/influencerAuthenticationMiddleware");
const brandorInfluencerAuthenticationMiddleware = require("../middleware/brandorInfluencerAuthenticationMiddleware");

const store = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/influencerProfiles/";
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = nanoid() + path.extname(file.originalname);
    console.log(`Generated filename: ${uniqueFilename}`);
    cb(null, uniqueFilename);
  },
});
const upload = multer({ storage: store });

// Signup an influencer
router.post("/signup", upload.single("image"), signup);

// User existence verify
router.post("/verifyUser", verifyUser);

// Login as an influencer
router.post("/login", login);

// Get an influencer's profile by ID
router.get(
  "/profile/:id",
  brandorInfluencerAuthenticationMiddleware,
  getProfile
);

// Update an influencer's profile by ID
router.put(
  "/profile/:id",
  influencerAuthenticationMiddleware,
  upload.single("image"),
  updateProfile
);

// Delete an influencer's profile by ID
router.delete(
  "/profile/:id",
  influencerAuthenticationMiddleware,
  deleteProfile
);

// Route to get all influencers' profiles
router.get("/profiles", getAllProfiles);

// Route to get filtered influencers
router.post("/search-influencers", filterInfluencers);

// AI natural language search
router.post("/ai-search", aiSearchInfluencers);

// Save YouTube refresh token for cron job
router.put("/:id/yt-refresh-token", influencerAuthenticationMiddleware, saveYtRefreshToken);

// Change password
router.post("/change-password", influencerAuthenticationMiddleware, changePassword);

// Update influencer description
router.patch("/:id/description", influencerAuthenticationMiddleware, updateDescription);
router.patch("/:id/hashtags", influencerAuthenticationMiddleware, updateHashtags);
router.patch("/:id/price", influencerAuthenticationMiddleware, updatePrice);

module.exports = router;
