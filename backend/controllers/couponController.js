const Coupon = require("../model/coupon");

// The three fixed coupon tiers. Seeded once if the collection is empty.
const SEED = [
  { code: "SAVE30", label: "30% off", discount: 0.3 },
  { code: "SAVE60", label: "60% off", discount: 0.6 },
  { code: "FREE100", label: "100% off", discount: 1.0 },
];

const ensureSeeded = async () => {
  const count = await Coupon.countDocuments();
  if (count === 0) {
    await Coupon.insertMany(SEED.map((c) => ({ ...c, active: false })));
  }
};

// GET /coupons/active  (public) — the single active coupon, or null.
exports.getActiveCoupon = async (req, res) => {
  try {
    await ensureSeeded();
    const coupon = await Coupon.findOne({ active: true });
    if (!coupon) return res.status(200).json(null);
    return res.status(200).json({
      code: coupon.code,
      label: coupon.label,
      discount: coupon.discount,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.toString() });
  }
};

// GET /coupons  (admin) — all coupons with their active state.
exports.getAllCoupons = async (req, res) => {
  try {
    await ensureSeeded();
    const coupons = await Coupon.find().sort({ discount: 1 });
    return res.status(200).json(coupons);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.toString() });
  }
};

// POST /coupons/set  (admin)  body: { code, active }
// Activating a coupon deactivates all others (only one active at a time).
exports.setCoupon = async (req, res) => {
  try {
    await ensureSeeded();
    const { code, active } = req.body;
    const coupon = await Coupon.findOne({ code });
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });

    if (active) {
      // Deactivate everything, then activate this one.
      await Coupon.updateMany({}, { active: false });
      coupon.active = true;
      await coupon.save();
    } else {
      coupon.active = false;
      await coupon.save();
    }

    const all = await Coupon.find().sort({ discount: 1 });
    return res.status(200).json(all);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.toString() });
  }
};
