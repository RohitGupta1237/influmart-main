import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_ENDPOINT from "../config";

// Influencer asks for an OTP to verify a social account (instagram | facebook).
// Returns { otp, influmartHandle, platform, socialUsername } on success.
export const requestSocialVerification = async (influencerId, platform, socialUsername) => {
  const token = await AsyncStorage.getItem("token");
  const response = await axios.post(
    `${API_ENDPOINT}/social-verification/request/${influencerId}`,
    { platform, socialUsername },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

// Fetch & save fresh public stats for a verified account (instagram | facebook).
export const fetchLatestStats = async (influencerId, platform, username) => {
  const token = await AsyncStorage.getItem("token");
  const response = await axios.post(
    `${API_ENDPOINT}/social-verification/fetch/${influencerId}`,
    { platform, username },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

// ─── Admin helpers (used by the admin approval screen) ─────────────────────────
export const getPendingVerifications = async (adminSecret) => {
  const response = await axios.get(`${API_ENDPOINT}/social-verification/pending`, {
    headers: { "x-admin-secret": adminSecret },
  });
  return response.data;
};

export const approveVerification = async (requestId, adminSecret) => {
  const response = await axios.post(
    `${API_ENDPOINT}/social-verification/${requestId}/approve`,
    {},
    { headers: { "x-admin-secret": adminSecret } }
  );
  return response.data;
};

export const rejectVerification = async (requestId, adminSecret) => {
  const response = await axios.post(
    `${API_ENDPOINT}/social-verification/${requestId}/reject`,
    {},
    { headers: { "x-admin-secret": adminSecret } }
  );
  return response.data;
};
