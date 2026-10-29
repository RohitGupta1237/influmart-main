const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const Brand = require("../model/brandDbRequestModel");
const Influencer = require("../model/influencerSignupRequestModel");

const blogAuthorAuthentication = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Please log in to submit an article" });
  }

  try {
    const decoded = await promisify(jwt.verify)(
      authHeader.slice(7),
      process.env.JWT_SECRET_KEY
    );

    if (decoded.brandId) {
      const brand = await Brand.findById(decoded.brandId).select("brandName name");
      if (!brand) return res.status(401).json({ message: "Brand account not found" });
      req.blogAuthor = {
        id: brand._id,
        role: "brand",
        name: brand.brandName || brand.name || "Brand",
      };
    } else if (decoded.userId) {
      const influencer = await Influencer.findById(decoded.userId).select("influencerName userName");
      if (!influencer) return res.status(401).json({ message: "Influencer account not found" });
      req.blogAuthor = {
        id: influencer._id,
        role: "influencer",
        name: influencer.influencerName || influencer.userName || "Influencer",
      };
    } else {
      return res.status(401).json({ message: "Not authorized to submit articles" });
    }
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Authentication failed" });
  }
};

module.exports = blogAuthorAuthentication;
