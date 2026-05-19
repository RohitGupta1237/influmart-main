//import { API_ENDPOINT } from "@env";
import axios from "axios";
const API_ENDPOINT = "http://localhost:3000";
const getSubscriptionPlans = async (payload,showAlert) => {
  try {
    const response = await axios.post(
      `${API_ENDPOINT}/subscriptions/subscription-plans`,
      { platform:payload.platform, followers:payload.followers }
    );
    const data = await response.data;
    if (response.status == 200) {
      return data.charges;
    } else {
      showAlert("Influencer SignUp Error", data.message);
    }
  } catch (error) {
    showAlert("Influencer SignUp Error", "Something went wrong. Please try again.");
  }
};

const subscribe = async (subscribeData, payload, navigation) => {
  // Only send fields the backend needs — dates are calculated server-side
  const { userName, plan, isFree, amount, paymentMode } = subscribeData;
  try {
    const response = await axios.post(`${API_ENDPOINT}/subscriptions/subscription`, {
      userName, plan, isFree, amount, paymentMode,
    });
    if (response.status === 201) {
      const data = await response.data?.newSubscription;
      const forRefund = {paymentId:JSON.parse(data.paymentMode).razorpay_payment_id,subscriptionId:data._id, amount:data.amount};
      navigation.navigate("InfluencerConfirmAccount", { payload:{...payload,...forRefund} });
    } else {
      const data = await response.data;
      throw new Error(data.message);
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const payment = async (payload, navigation,showAlert) => {
  const { planId, paymentMethod } = payload;
  try {
    const response = await axios.post(`${API_ENDPOINT}/subscriptions/payment`, {
      planId,
      paymentMethod,
    });
    if (response.status === 200) {
      navigation.navigate("PaymentSuccess");
    } else {
      const data = await response.data;
      showAlert("Payment Error", data.message);
    }
  } catch (error) {
    showAlert("Payment Error", "Something went wrong. Please try again.");
  }
}

const getSubscription = async (userName) => {
  try {
    const response = await axios.get(`${API_ENDPOINT}/subscriptions/subscription/${userName}`);
    if (response.status === 200) {
      const subs = response.data;
      return Array.isArray(subs) && subs.length > 0 ? subs[subs.length - 1] : null;
    }
    return null;
  } catch (error) {
    return null;
  }
};

const renewSubscription = async (subscribeData, showAlert) => {
  try {
    const response = await axios.patch(`${API_ENDPOINT}/subscriptions/renew`, subscribeData);
    if (response.status === 200) {
      return true;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.log(error);
    showAlert("Renewal Error", error?.response?.data?.message || "Failed to renew subscription");
    return false;
  }
};

export { getSubscriptionPlans, subscribe, renewSubscription, getSubscription };
