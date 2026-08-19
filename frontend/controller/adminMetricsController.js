import axios from "axios";
import API_ENDPOINT from "../config";

// Admin-only business metrics (gated by x-admin-secret on the backend).
export const getAdminMetrics = async (adminSecret, period = "all") => {
  const response = await axios.get(`${API_ENDPOINT}/admin/metrics`, {
    headers: { "x-admin-secret": adminSecret },
    params: { period },
  });
  return response.data;
};
