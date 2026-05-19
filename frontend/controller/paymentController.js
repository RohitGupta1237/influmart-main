//import { API_ENDPOINT } from "@env";
import { Platform } from "react-native";
import RazorpayCheckout from "react-native-razorpay";
//import { RAZORPAY_KEY_ID } from "@env";
import { subscribe, renewSubscription } from "./subscriptionController";
import { createCollabPost } from "./collabOpenController";
const API_ENDPOINT = "http://localhost:3000";
const RAZORPAY_KEY_ID = "rzp_test_Sh0EeBoIs61uzZ";

// ─── Create order ─────────────────────────────────────────────────────────────
// type: 'subscription' | 'renewal' | 'campaign'
// metadata: all data the backend webhook needs to recreate the DB save if frontend crashes
export const createOrder = async ({ amount, currency, receipt, type, metadata }) => {
  try {
    const response = await fetch(`${API_ENDPOINT}/api/payment/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, currency, receipt, type, metadata }),
    });
    const data = await response.json();
    if (response.status === 200) return data;
    throw new Error(data.message);
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};

// ─── Verify payment ───────────────────────────────────────────────────────────
export const verifyPayment = async (paymentData) => {
  try {
    const response = await fetch(`${API_ENDPOINT}/api/payment/verify-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentData),
    });
    const data = await response.json();
    if (response.status === 200) return data;
    throw new Error(data.message);
  } catch (error) {
    console.error("Error verifying payment:", error);
    throw error;
  }
};

// ─── Mark processed ───────────────────────────────────────────────────────────
// Call this after the DB save (subscribe / createCollabPost / renewSubscription) succeeds.
const markProcessed = async (orderId) => {
  try {
    await fetch(`${API_ENDPOINT}/api/payment/mark-processed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
  } catch (error) {
    // Non-critical — audit log update; don't block the user flow
    console.error("markProcessed error:", error);
  }
};

// ─── Refund ───────────────────────────────────────────────────────────────────
export const initiateRefund = async (paymentId, amount, orderId) => {
  try {
    const response = await fetch(`${API_ENDPOINT}/api/payment/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId, amount, orderId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return true;
  } catch (error) {
    console.error("Refund error:", error);
    return false;
  }
};

// ─── Handle payment (signup + collab post) ────────────────────────────────────
export const handlePayment = async (
  subscription = { amount: 10, userName: "hemanth" },
  payload = { price: { currency: { subunits: 100, currency: "USD" } } },
  navigation,
  showAlert
) => {
  const type     = payload.notSave ? "campaign" : "subscription";
  const metadata = payload.notSave
    ? { brandId: payload.brandId }
    : { userName: subscription.userName, plan: subscription.plan };

  const order = await createOrder({
    amount:   parseInt(subscription?.amount) * payload?.price?.currency?.subunits,
    currency: payload?.price?.currency?.currency,
    receipt:  subscription?.userName || "brand",
    type,
    metadata,
  });

  if (!order || !order.id) {
    showAlert("Error", "Failed to create order");
    throw new Error("Failed to create order");
  }

  try {
    if (Platform.OS === "web") {
      await handlePaymentWeb(order, payload, subscription, navigation, showAlert);
    } else {
      await handlePaymentMobile(order, payload, subscription, navigation, showAlert);
    }
  } catch (error) {
    throw error;
  }
};

// ─── Handle renewal payment ───────────────────────────────────────────────────
export const handleRenewalPayment = async (subscription, payload, navigation, showAlert) => {
  const order = await createOrder({
    amount:   parseInt(subscription?.amount) * 100,
    currency: "INR",
    receipt:  subscription?.userName,
    type:     "renewal",
    metadata: { userName: subscription?.userName, plan: subscription?.plan },
  });

  if (!order || !order.id) {
    showAlert("Error", "Failed to create order");
    return;
  }

  const onSuccess = async (data) => {
    const paymentData = {
      razorpay_order_id:  data.razorpay_order_id,
      razorpay_payment_id: data.razorpay_payment_id,
      razorpay_signature: data.razorpay_signature,
    };
    await verifyPayment(paymentData);

    const _subs = {
      ...subscription,
      paymentMode: JSON.stringify({
        razorpay_order_id:  data.razorpay_order_id,
        razorpay_payment_id: data.razorpay_payment_id,
      }),
    };

    const ok = await renewSubscription(_subs, showAlert);
    if (ok) {
      await markProcessed(order.id);
      showAlert("Success", "Subscription renewed successfully!");
      navigation.navigate("AdminPanel");
    } else {
      // renewSubscription failed after payment was captured — refund
      const refunded = await initiateRefund(data.razorpay_payment_id, order.amount, order.id);
      showAlert(
        "Payment Failed",
        refunded
          ? "Something went wrong. Your payment has been refunded automatically."
          : "Something went wrong. Please contact support for a refund."
      );
    }
  };

  if (Platform.OS === "web") {
    const success = await loadRazorpayScript();
    if (!success) { showAlert("Error", "Failed to load payment gateway"); return; }
    const options = {
      key: RAZORPAY_KEY_ID, amount: order.amount, currency: "INR",
      name: "Influmart", description: "Subscription Renewal",
      order_id: order.id,
      prefill: { email: payload?.email || "", name: subscription?.userName },
      theme: { color: "#1A80E5" },
      handler: async (response) => {
        try {
          await onSuccess(response);
        } catch (e) {
          const refunded = await initiateRefund(response.razorpay_payment_id, order.amount, order.id);
          showAlert("Payment Failed", refunded
            ? "Something went wrong. Your payment has been refunded automatically."
            : "Could not process payment. Please contact support.");
        }
      },
    };
    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (r) => showAlert("Payment Failed", r.error.description));
    rzp.open();
  } else {
    const options = {
      description: "Subscription Renewal", currency: "INR",
      key: RAZORPAY_KEY_ID, amount: order.amount, name: "Influmart",
      order_id: order.id,
      prefill: { email: payload?.email || "", name: subscription?.userName },
      theme: { color: "#1A80E5" },
    };
    RazorpayCheckout.open(options)
      .then(async (data) => {
        try { await onSuccess(data); }
        catch (e) {
          const refunded = await initiateRefund(data.razorpay_payment_id, order.amount, order.id);
          showAlert("Payment Failed", refunded
            ? "Something went wrong. Your payment has been refunded automatically."
            : "Could not process payment. Please contact support.");
        }
      })
      .catch((e) => showAlert("Payment Failed", e));
  }
};

// ─── Mobile payment handler ───────────────────────────────────────────────────
const handlePaymentMobile = async (order, payload, subscription, navigation, showAlert) => {
  const options = {
    description: "Connects influencer with brands",
    image:       "https://imgur.com/g63XWcL.jpg",
    currency:    payload?.price?.currency?.currency,
    key:         RAZORPAY_KEY_ID,
    amount:      order.amount,
    name:        "Influmart",
    order_id:    order.id,
    prefill: { email: payload?.email, name: order.receipt },
    theme: { color: "#1A80E5" },
  };

  RazorpayCheckout.open(options)
    .then(async (data) => {
      const paymentData = {
        razorpay_order_id:   data.razorpay_order_id,
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_signature:  data.razorpay_signature,
      };
      try {
        await verifyPayment(paymentData);

        if (subscription?.notSave === true) {
          await createCollabPost(payload, showAlert, navigation);
          await markProcessed(order.id);
        } else {
          const _subs = {
            ...subscription,
            paymentMode: JSON.stringify({
              razorpay_order_id:   data.razorpay_order_id,
              razorpay_payment_id: data.razorpay_payment_id,
            }),
          };
          await subscribe(_subs, payload, navigation);
          await markProcessed(order.id);
        }
        showAlert("Payment Successful", "Your payment has been processed successfully.");
      } catch (error) {
        console.error(error);
        const refunded = await initiateRefund(data.razorpay_payment_id, order.amount, order.id);
        showAlert("Payment Failed", refunded
          ? "Something went wrong. Your payment has been refunded automatically."
          : "Something went wrong. Please contact support for a refund.");
      }
    })
    .catch((error) => {
      console.log(error);
      showAlert("Payment Failed", error);
    });
};

// ─── Load Razorpay script (web) ───────────────────────────────────────────────
const loadRazorpayScript = async () => {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src     = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// ─── Web payment handler ──────────────────────────────────────────────────────
const handlePaymentWeb = async (order, payload, subscription, navigation, showAlert) => {
  const options = {
    key:         RAZORPAY_KEY_ID,
    amount:      order.amount,
    currency:    payload?.price?.currency?.currency,
    name:        "Influmart",
    description: "Connects influencer with brands",
    image:       "https://imgur.com/g63XWcL.jpg",
    order_id:    order.id,
    prefill: { email: payload?.email || "N/A", name: order.receipt },
    theme: { color: "#1A80E5" },
    handler: async function (response) {
      const paymentData = {
        razorpay_order_id:   response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature:  response.razorpay_signature,
      };
      try {
        await verifyPayment(paymentData);

        if (subscription?.notSave === true) {
          await createCollabPost(payload, showAlert, navigation);
          await markProcessed(order.id);
        } else {
          const _subs = {
            ...subscription,
            paymentMode: JSON.stringify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
            }),
          };
          await subscribe(_subs, payload, navigation);
          await markProcessed(order.id);
        }
        showAlert("Payment Successful", "Your payment has been processed successfully.");
      } catch (error) {
        console.log(error);
        const refunded = await initiateRefund(response.razorpay_payment_id, order.amount, order.id);
        showAlert("Payment Failed", refunded
          ? "Something went wrong. Your payment has been refunded automatically."
          : "Something went wrong. Please contact support for a refund.");
      }
    },
  };

  const success = await loadRazorpayScript();
  if (!success) {
    showAlert("Payment Failed", "Failed to load payment gateway. Please try again.");
    return;
  }

  const rzp = new window.Razorpay(options);
  rzp.on("payment.failed", function (response) {
    console.log("Payment failed", response);
    showAlert("Payment Failed", response.error.description);
  });
  rzp.open();
};
