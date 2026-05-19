import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
} from "react-native";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PlanBox from "../../../shared/PlansBox";
import { handleRenewalPayment } from "../../../controller/paymentController";
import { GetInfluencerProfile } from "../../../controller/InfluencerController";
import { useAlert } from "../../../util/AlertContext";
import Loader from "../../../shared/Loader";
import { Color, FontSize, FontFamily, Padding } from "../../../GlobalStyles";
import { applyCoupon, getDiscountedPrice } from "../../../util/couponUtil";

const PLAN_DATA = { halfYearly: 499, quarterly: 299, annually: 899 };

const RenewSubscription = ({ navigation }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [plans, setPlans] = useState(false);
  const [loading, setLoading] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");
  const { showAlert } = useAlert();

  const originalPrice = selectedPlan ? parseInt(selectedPlan.price) : null;
  const finalPrice = appliedCoupon && originalPrice
    ? getDiscountedPrice(originalPrice, appliedCoupon.discount)
    : originalPrice;

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

  const handleRenew = async () => {
    if (!selectedPlan) {
      showAlert("Select a Plan", "Please select a plan before proceeding.");
      return;
    }
    setLoading(true);
    try {
      const influencerId = await AsyncStorage.getItem("influencerId");
      const profile = await GetInfluencerProfile(influencerId, () => {}, showAlert);
      const userName = profile?.userName;
      const email = profile?.email;

      const subscription = {
        userName,
        plan: selectedPlan.plan,
        amount: finalPrice,
      };
      const payload = {
        email,
        price: { currency: { subunits: 100, currency: "INR" } },
      };
      await handleRenewalPayment(subscription, payload, navigation, showAlert);
    } catch (error) {
      showAlert("Error", error?.message || "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      {loading && <Loader loading={loading} />}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Image style={styles.icon} contentFit="cover" source={require("../../../assets/adminPanelBack.png")} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Renew Subscription</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.inner}>
        <Text style={styles.title}>Influmart Subscriptions</Text>
        <Text style={styles.subtitle}>Renew your plan to keep accessing brand collaborations.</Text>

        <View style={styles.planToggle}>
          <TouchableOpacity style={[styles.planBtn, !plans && styles.planActive]} onPress={() => setPlans(false)}>
            <Text style={[styles.planBtnText, !plans && styles.planActiveText]}>Monthly</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.planBtn, plans && styles.planActive]} onPress={() => setPlans(true)}>
            <Text style={[styles.planBtnText, plans && styles.planActiveText]}>Yearly</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.planContainer}>
          {!plans && (
            <PlanBox setSelect={setSelectedPlan} select={selectedPlan}
              plan="halfYearly" duration="6 months" price={`${PLAN_DATA.halfYearly}`} suggested={true} />
          )}
          {!plans && (
            <PlanBox setSelect={setSelectedPlan} select={selectedPlan}
              plan="quarterly" duration="3 months" price={`${PLAN_DATA.quarterly}`} />
          )}
          {plans && (
            <PlanBox setSelect={setSelectedPlan} select={selectedPlan}
              plan="annually" duration="1 year" price={`${PLAN_DATA.annually}`} />
          )}
        </View>

        {/* Coupon Section */}
        <View style={styles.couponContainer}>
          <Text style={styles.couponLabel}>Have a coupon code?</Text>
          <View style={styles.couponRow}>
            <TextInput
              style={[styles.couponInput, appliedCoupon && styles.couponInputApplied]}
              placeholder="Enter coupon code"
              placeholderTextColor="#aaa"
              value={couponInput}
              onChangeText={setCouponInput}
              autoCapitalize="characters"
              editable={!appliedCoupon}
            />
            {appliedCoupon ? (
              <TouchableOpacity style={styles.removeBtn} onPress={handleRemoveCoupon}>
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.applyBtn} onPress={handleApplyCoupon}>
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            )}
          </View>
          {couponMessage !== "" && (
            <Text style={[styles.couponMessage, appliedCoupon ? styles.couponSuccess : styles.couponError]}>
              {couponMessage}
            </Text>
          )}
        </View>

        {/* Price Summary */}
        {selectedPlan && (
          <View style={styles.priceSummary}>
            {appliedCoupon ? (
              <View style={styles.priceRow}>
                <Text style={styles.originalPrice}>₹{originalPrice}</Text>
                <Text style={styles.discountedPrice}>₹{finalPrice}</Text>
                <Text style={styles.savingsText}>You save ₹{originalPrice - finalPrice}!</Text>
              </View>
            ) : (
              <Text style={styles.totalPrice}>Total: ₹{originalPrice}</Text>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.proceedBtn} onPress={handleRenew}>
          <Text style={styles.proceedText}>
            Proceed to Payment{finalPrice ? ` · ₹${finalPrice}` : ""}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Color.colorWhite },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: Padding.p_base, backgroundColor: Color.colorWhite,
    borderBottomWidth: 1, borderBottomColor: "#f0f0f0",
  },
  iconButton: { padding: 4 },
  icon: { width: 24, height: 24 },
  headerText: { fontSize: FontSize.size_lg, fontWeight: "700", fontFamily: FontFamily.interBold, color: "#111" },
  inner: { padding: 20 },
  title: { fontSize: 22, fontWeight: "800", color: "#111", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 24, lineHeight: 20 },
  planToggle: { flexDirection: "row", backgroundColor: "#f0f0f0", borderRadius: 10, padding: 4, marginBottom: 20 },
  planBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  planActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  planBtnText: { fontSize: 14, fontWeight: "600", color: "#888" },
  planActiveText: { color: "#111" },
  planContainer: { gap: 12, marginBottom: 24 },
  // Coupon
  couponContainer: {
    backgroundColor: "#f8f8f8", borderRadius: 12, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: "#eee",
  },
  couponLabel: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 10 },
  couponRow: { flexDirection: "row", gap: 8 },
  couponInput: {
    flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#ddd",
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: "#111", letterSpacing: 1,
  },
  couponInputApplied: { borderColor: "#22c55e", backgroundColor: "#f0fdf4" },
  applyBtn: {
    backgroundColor: "#111", borderRadius: 8,
    paddingHorizontal: 18, justifyContent: "center",
  },
  applyBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  removeBtn: {
    backgroundColor: "#fee2e2", borderRadius: 8,
    paddingHorizontal: 14, justifyContent: "center",
  },
  removeBtnText: { color: "#dc2626", fontWeight: "700", fontSize: 13 },
  couponMessage: { marginTop: 8, fontSize: 13, fontWeight: "500" },
  couponSuccess: { color: "#16a34a" },
  couponError: { color: "#dc2626" },
  // Price summary
  priceSummary: {
    backgroundColor: "#f8f8f8", borderRadius: 12, padding: 16,
    marginBottom: 20, alignItems: "center",
  },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "center" },
  originalPrice: { fontSize: 18, color: "#aaa", textDecorationLine: "line-through", fontWeight: "600" },
  discountedPrice: { fontSize: 24, fontWeight: "800", color: "#111" },
  savingsText: { fontSize: 13, color: "#16a34a", fontWeight: "600", width: "100%", textAlign: "center", marginTop: 4 },
  totalPrice: { fontSize: 20, fontWeight: "700", color: "#111" },
  // Proceed
  proceedBtn: { backgroundColor: "#111", borderRadius: 12, paddingVertical: 16, alignItems: "center" },
  proceedText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

export default RenewSubscription;
