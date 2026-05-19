const { UPI_URL } = require("../config/configs");
const Subscription = require("../model/Subscription");


const calculateCharges = (followers) => {
  const maxFollowers = parseInt(followers);

  const quarterCharge = (((0.8 * maxFollowers) * 0.50) / 12) * 3 + (0.20 * (((0.8 * maxFollowers) * 0.50) / 12) * 3);
  const halfYearCharge = (((0.8 * maxFollowers) * 0.50) / 12) * 6 + (0.10 * (((0.8 * maxFollowers) * 0.50) / 12) * 6);
  const yearCharge = (0.8 * maxFollowers) * 0.50;

  return {
      quarterly: quarterCharge.toFixed(2),
      halfYearly: halfYearCharge.toFixed(2),
      annually: yearCharge.toFixed(2),
  };
};

const postSubscription = async (req, res) => {
  try {
    const { userName, plan, isFree, amount, paymentMode } = req.body;

    // Calculate dates on backend — never trust frontend dates
    const now = new Date();
    let startDate, endDate, transactionDate;

    if (isFree || !plan || !PLAN_DURATIONS[plan]) {
      startDate = now;
      endDate = addDuration(now, { months: 3 }); // free tier: 3 months
      transactionDate = null;
    } else {
      startDate = now;
      endDate = addDuration(now, PLAN_DURATIONS[plan]);
      transactionDate = now;
    }

    const newSubscription = new Subscription({
      userName,
      plan,
      startDate,
      endDate,
      isFree: isFree || false,
      amount:          isFree ? null : amount,
      paymentMode:     isFree ? null : paymentMode,
      transactionDate: isFree ? null : transactionDate,
    });
    await newSubscription.save();
    console.log("Subscription created successfully");
    res.status(201).json({ message: "Subscription created successfully", newSubscription });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Error creating subscription", error: error });
  }
};

const getPayment = async (req, res) => {
  try {
    if (UPI_URL) {
      res.status(200).json({ message: "Pay via UPI", upiURL: UPI_URL });
    } else {
      res.status(400).json({ message: "UPI URL not found" });
    }
  } catch (error) {
    res.status(400).json({ message: "Unable to find UPI URL" });
  }
};

const deleteSubscription = async (subscriptionId) => {
  try {
    await Subscription.findByIdAndDelete(subscriptionId);
  } catch (error) {
    throw new Error("Error deleting subscription");
  }
};

const getSubscription = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      userName: req.params.userName,
    });
    res.status(200).json(subscriptions);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error fetching subscriptions", error: error.message });
  }
};

// TODO: Implement the subscriptionPlans controller function dynamically fetch data without user entry
// 1. we need to get the platform and their account handle to get the followers count all possible platforms.
// eg: [{ platform: 'instagram', username: 'mrbeast' }, { platform: 'youtube', username: 'mrbeast' }, ...]
// 2. call the influencerAnalytics function to get the followers count for each platform. provide the parameters correctly as shown in comments in that file.
// 3. Now store the max followers count in followers variable. 
// 4. Now test the api working with the postman and check the response of getting subscription plans.
const subscriptionPlans = (req, res) => {
  const { platform, followers } = req.body;

  if (!platform || !followers) {
      return res.status(400).json({ error: 'Platform and followers are required' });
  }

  const charges = calculateCharges(followers);

  return res.json({
      charges
  });
};



const PLAN_DURATIONS = {
  quarterly: { months: 3 },
  halfYearly: { months: 6 },
  annually: { years: 1 },
};

const addDuration = (date, duration) => {
  const d = new Date(date);
  if (duration.months) d.setMonth(d.getMonth() + duration.months);
  if (duration.years) d.setFullYear(d.getFullYear() + duration.years);
  return d;
};

const renewSubscription = async (req, res) => {
  try {
    const { userName, plan, amount, paymentMode } = req.body;

    if (!PLAN_DURATIONS[plan]) {
      return res.status(400).json({ message: "Invalid plan" });
    }

    const existing = await Subscription.findOne({ userName });
    if (!existing) {
      return res.status(404).json({ message: "Subscription not found for this user" });
    }

    const now = new Date();
    const transactionDate = now;

    // If subscription is still active, extend from its current endDate; else from today
    const baseDate = existing.endDate && new Date(existing.endDate) > now
      ? new Date(existing.endDate)
      : now;

    const startDate = baseDate;
    const endDate = addDuration(baseDate, PLAN_DURATIONS[plan]);

    const updated = await Subscription.findOneAndUpdate(
      { userName },
      { plan, startDate, endDate, amount, paymentMode, transactionDate, isFree: false },
      { new: true }
    );

    res.status(200).json({ message: "Subscription renewed successfully", subscription: updated });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Error renewing subscription", error });
  }
};

module.exports = { postSubscription, getSubscription, getPayment, subscriptionPlans, deleteSubscription, renewSubscription, PLAN_DURATIONS, addDuration };
