import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_ENDPOINT from "../config";

const authHeader = async () => {
  const token = await AsyncStorage.getItem("token");
  return { headers: { Authorization: `Bearer ${token}` } };
};

// Lock a price in a chat (status "proposed"). The other party must seal it.
export const proposeDeal = async (payload, showAlert) => {
  try {
    const cfg = await authHeader();
    const res = await axios.post(`${API_ENDPOINT}/deals/propose`, payload, cfg);
    return res.data?.deal || null;
  } catch (error) {
    showAlert?.("Error", error?.response?.data?.message || "Could not lock price");
    return null;
  }
};

// Accept a proposed deal (the other party seals it).
// payload: { userType, senderId, receiverId }
export const sealDeal = async (dealId, payload, showAlert) => {
  try {
    const cfg = await authHeader();
    const res = await axios.patch(
      `${API_ENDPOINT}/deals/${dealId}/seal`,
      payload,
      cfg
    );
    return res.data?.deal || null;
  } catch (error) {
    showAlert?.("Error", error?.response?.data?.message || "Could not seal deal");
    return null;
  }
};

// payload: { senderId, receiverId }
export const declineDeal = async (dealId, payload, showAlert) => {
  try {
    const cfg = await authHeader();
    const res = await axios.patch(`${API_ENDPOINT}/deals/${dealId}/decline`, payload || {}, cfg);
    return res.data?.deal || null;
  } catch (error) {
    showAlert?.("Error", error?.response?.data?.message || "Could not decline deal");
    return null;
  }
};

// Current live deal for a conversation (proposed or sealed), or null.
export const getConversationDeal = async (conversationId) => {
  try {
    const cfg = await authHeader();
    const res = await axios.get(
      `${API_ENDPOINT}/deals/conversation/${conversationId}`,
      cfg
    );
    return res.data?.deal || null;
  } catch (error) {
    return null;
  }
};

// ── Chat close flow + payment nudge ────────────────────────────────────────
export const getChatState = async (conversationId) => {
  try {
    const cfg = await authHeader();
    const res = await axios.get(
      `${API_ENDPOINT}/deals/chat/${conversationId}/state`,
      cfg
    );
    return res.data || { closed: false, closeRequestBy: null };
  } catch (error) {
    return { closed: false, closeRequestBy: null };
  }
};

export const sendPaymentPending = async (conversationId, payload, showAlert) => {
  try {
    const cfg = await authHeader();
    await axios.post(
      `${API_ENDPOINT}/deals/chat/${conversationId}/payment-pending`,
      payload,
      cfg
    );
    return true;
  } catch (error) {
    showAlert?.("Error", error?.response?.data?.message || "Could not send reminder");
    return false;
  }
};

export const requestCloseChat = async (conversationId, payload, showAlert) => {
  try {
    const cfg = await authHeader();
    const res = await axios.post(
      `${API_ENDPOINT}/deals/chat/${conversationId}/request-close`,
      payload,
      cfg
    );
    return res.data || null;
  } catch (error) {
    showAlert?.("Error", error?.response?.data?.message || "Could not request close");
    return null;
  }
};

export const acceptCloseChat = async (conversationId, payload, showAlert) => {
  try {
    const cfg = await authHeader();
    const res = await axios.patch(
      `${API_ENDPOINT}/deals/chat/${conversationId}/accept-close`,
      payload,
      cfg
    );
    return res.data || null;
  } catch (error) {
    showAlert?.("Error", error?.response?.data?.message || "Could not close chat");
    return null;
  }
};

export const declineCloseChat = async (conversationId, payload, showAlert) => {
  try {
    const cfg = await authHeader();
    const res = await axios.patch(
      `${API_ENDPOINT}/deals/chat/${conversationId}/decline-close`,
      payload,
      cfg
    );
    return res.data || null;
  } catch (error) {
    showAlert?.("Error", error?.response?.data?.message || "Could not decline close");
    return null;
  }
};

export const reopenChat = async (conversationId, payload, showAlert) => {
  try {
    const cfg = await authHeader();
    const res = await axios.patch(
      `${API_ENDPOINT}/deals/chat/${conversationId}/reopen`,
      payload,
      cfg
    );
    return res.data || null;
  } catch (error) {
    showAlert?.("Error", error?.response?.data?.message || "Could not reopen chat");
    return null;
  }
};

// All sealed deals for an influencer + total earnings (dashboard).
export const getInfluencerDeals = async (influencerId) => {
  try {
    const cfg = await authHeader();
    const res = await axios.get(
      `${API_ENDPOINT}/deals/influencer/${influencerId}`,
      cfg
    );
    return res.data || { deals: [], totalEarnings: 0, count: 0 };
  } catch (error) {
    return { deals: [], totalEarnings: 0, count: 0 };
  }
};
