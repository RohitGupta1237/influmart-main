import axios from "axios";
import API_ENDPOINT from "../config";

// Public — the single active coupon (or null).
export const fetchActiveCoupon = async () => {
  try {
    const res = await axios.get(`${API_ENDPOINT}/coupons/active`);
    return res.data; // { code, label, discount } or null
  } catch (e) {
    return null;
  }
};

// ─── Admin helpers ─────────────────────────────────────────────────────────
export const getAllCoupons = async (adminSecret) => {
  const res = await axios.get(`${API_ENDPOINT}/coupons`, {
    headers: { "x-admin-secret": adminSecret },
  });
  return res.data;
};

export const setCoupon = async (code, active, adminSecret) => {
  const res = await axios.post(
    `${API_ENDPOINT}/coupons/set`,
    { code, active },
    { headers: { "x-admin-secret": adminSecret } }
  );
  return res.data;
};
