import React, { useState } from "react";
import {
  Text, StyleSheet, View, ScrollView, TouchableOpacity, TextInput,
} from "react-native";
import Depth1Frame7 from "../../components/Depth1Frame7";
import { CollabOpenPaymentStyles } from "./CollabOpenPayment.scss";
import { useAlert } from "../../util/AlertContext";
import Loader from "../../shared/Loader";
import CountryCurrencyPicker from "../../shared/CountryCurrencyPicker";
import { handlePayment } from "../../controller/paymentController";
import { applyCoupon, getDiscountedPrice } from "../../util/couponUtil";

const BASE_PRICE = 499;

const CollabOpenPayment = ({ route, navigation }) => {
  const payload = route.params?.payload;
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [openCountryCode, setOpenCountryCode] = useState(false);
  const [currency, setCurrency] = useState({
    code: "IN", name: { en: "India" }, dial_code: "+91", currency: "INR", subunits: 100,
  });
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");

  const finalPrice = appliedCoupon
    ? getDiscountedPrice(BASE_PRICE, appliedCoupon.discount)
    : BASE_PRICE;

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    const result = applyCoupon(couponInput);
    if (result.valid) {
      setAppliedCoupon(result);
      setCouponMessage(result.message);
    } else {
      setAppliedCoupon(null);
      setCouponMessage(result.message);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponMessage("");
  };

  const initiatePayment = async () => {
    setLoading(true);
    try {
      const subscription = { amount: finalPrice, notSave: true };
      const augmentedPayload = {
        ...payload,
        price: {
          currency: {
            subunits: currency?.subunits || 100,
            currency: currency?.currency || "INR",
          },
        },
      };
      await handlePayment(subscription, augmentedPayload, navigation, showAlert);
    } catch (error) {
      console.log("Campaign post error:", error);
      showAlert("Error", error?.message || "Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      {loading && <Loader loading={loading} />}
      <View style={styles.innerContainer}>
        <TouchableOpacity style={{ width: "100%" }} onPress={() => navigation.goBack()}>
          <Depth1Frame7
            depth4Frame0={require("../../assets/depth-4-frame-019.png")}
            requestDetails="Choose Your Plan"
            depth3Frame0BackgroundColor="#fff"
            requestDetailsWidth="100%"
            depth4Frame0FontFamily="WorkSans-Bold"
            depth4Frame0Color="#121417"
          />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.headerText}>Influmart Subscriptions</Text>
        </View>

        <View style={styles.subHeader}>
          <Text style={styles.subHeaderText}>
            Share the Opportunity with Influencers. Get Worlds Best Influencers.
            Get Started Now with Influmart!
          </Text>
        </View>

        <View style={styles.planContainer}>
          <View style={styles.planDetailsContainer}>
            <View style={styles.priceContainer}>
              {appliedCoupon ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Text style={[styles.planPrice, { textDecorationLine: "line-through", color: "#aaa", fontSize: 18 }]}>
                    ₹ {BASE_PRICE}
                  </Text>
                  <Text style={styles.planPrice}>₹ {finalPrice}</Text>
                </View>
              ) : (
                <Text style={styles.planPrice}>₹ {BASE_PRICE}</Text>
              )}
              <Text style={styles.planDuration}>/post</Text>
            </View>
            {appliedCoupon && (
              <Text style={{ color: "#16a34a", fontSize: 13, fontWeight: "600", marginBottom: 6 }}>
                You save ₹{BASE_PRICE - finalPrice}!
              </Text>
            )}
            <View style={styles.validityContainer}>
              <Text style={styles.validityHeader}>Validity: </Text>
              <Text style={styles.validityText}>1 Post</Text>
            </View>
            <TouchableOpacity onPress={() => setOpenCountryCode(true)}>
              <View style={styles.validityContainer}>
                <Text style={styles.validityHeader}>Currency: </Text>
                <Text style={styles.validityText}>{currency?.currency || "INR"}</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.validityContainer}>
              <Text style={styles.star}>*</Text>
              <Text style={styles.require}>Please checkout to post Opportunity</Text>
            </View>
          </View>
        </View>

        {/* Coupon Section */}
        <View style={couponStyles.container}>
          <Text style={couponStyles.label}>Have a coupon code?</Text>
          <View style={couponStyles.row}>
            <TextInput
              style={[couponStyles.input, appliedCoupon && couponStyles.inputApplied]}
              placeholder="Enter coupon code"
              placeholderTextColor="#aaa"
              value={couponInput}
              onChangeText={setCouponInput}
              autoCapitalize="characters"
              editable={!appliedCoupon}
            />
            {appliedCoupon ? (
              <TouchableOpacity style={couponStyles.removeBtn} onPress={handleRemoveCoupon}>
                <Text style={couponStyles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={couponStyles.applyBtn} onPress={handleApplyCoupon}>
                <Text style={couponStyles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            )}
          </View>
          {couponMessage !== "" && (
            <Text style={[couponStyles.message, appliedCoupon ? couponStyles.success : couponStyles.error]}>
              {couponMessage}
            </Text>
          )}
        </View>

        <TouchableOpacity style={{ width: "100%" }} onPress={initiatePayment}>
          <View style={styles.selectPlanButton}>
            <Text style={styles.selectPlanButtonText}>
              Proceed to payment · ₹{finalPrice}
            </Text>
          </View>
        </TouchableOpacity>

        <CountryCurrencyPicker
          show={openCountryCode}
          pickerButtonOnPress={(item) => { setCurrency(item); setOpenCountryCode(false); }}
          onBackdropPress={() => setOpenCountryCode(false)}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create(CollabOpenPaymentStyles);

const couponStyles = StyleSheet.create({
  container: {
    backgroundColor: "#f8f8f8", borderRadius: 12, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: "#eee",
  },
  label: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 10 },
  row: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#ddd",
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: "#111", letterSpacing: 1,
  },
  inputApplied: { borderColor: "#22c55e", backgroundColor: "#f0fdf4" },
  applyBtn: { backgroundColor: "#111", borderRadius: 8, paddingHorizontal: 18, justifyContent: "center" },
  applyBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  removeBtn: { backgroundColor: "#fee2e2", borderRadius: 8, paddingHorizontal: 14, justifyContent: "center" },
  removeBtnText: { color: "#dc2626", fontWeight: "700", fontSize: 13 },
  message: { marginTop: 8, fontSize: 13, fontWeight: "500" },
  success: { color: "#16a34a" },
  error: { color: "#dc2626" },
});

export default CollabOpenPayment;
