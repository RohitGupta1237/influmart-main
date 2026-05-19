import React, { useEffect, useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import Depth1Frame7 from "../../components/Depth1Frame7";
import PlanBox from "../../shared/PlansBox";
import {
  getSubscriptionPlans,
} from "../../controller/subscriptionController";
import { handlePayment } from "../../controller/paymentController";
import { applyCoupon, getDiscountedPrice } from "../../util/couponUtil";
import { PlanChooseInterfaceStyles } from "./PlanChooseInterface.scss";
import { useAlert } from "../../util/AlertContext";
import Loader from '../../shared/Loader';

const PlanChooseInterface = ({ route, navigation }) => {
  const [plans, setPlans] = useState(false);
  const payload = route.params?.payload;
  const [planData, setPlanData] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const { showAlert } = useAlert();
  const [orderId, setOrderId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");

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

  const initiatePayment = async () => {
    if (!selectedPlan) {
      showAlert("Select a Plan", "Please select a plan before proceeding to payment.");
      return;
    }
    setLoading(true);
    try {
      // Dates are calculated on the backend — only send plan + amount
      const subscription = {
        userName: payload?.userName,
        plan:     selectedPlan?.plan || "free",
        isFree:   false,
        amount:   finalPrice,
      };
      const augmentedPayload = {
        ...payload,
        price: {
          ...payload?.price,
          currency: {
            subunits: 100,
            currency: "INR",
          },
        },
      };
      await handlePayment(subscription, augmentedPayload, navigation, showAlert);
    } catch (error) {
      console.log("Payment error:", error);
      showAlert("Error", error?.message || "Something went wrong. Please try again.");
    }
    setLoading(false);
  };
  useEffect(() => {
    const getPlans = async () => {
      // const data = await getSubscriptionPlans(
      //   {
      //     platform: payload.follower.platform,
      //     followers: payload.follower.value,
      //   },
      //   showAlert
      // );
      let data = {
        halfYearly: 499,
        quarterly: 299,
        annually: 899,
      };
      setPlanData(data);
    };

    getPlans();
  }, []);
  return (
    <ScrollView style={styles.container}>
      {loading&&<Loader loading={loading}/>}
      <View style={styles.innerContainer}>
        <TouchableOpacity
          style={{ width: "100%" }}
          onPress={() => {
            const params = payload ? {
              savedName: payload.name,
              savedEmail: payload.email,
              savedUsername: payload.userName,
              savedGender: payload.gender,
              savedMobileNumber: payload.number,
              savedSelected: payload.selected?.[0] || "",
              savedLocation: payload.location,
              savedCountryCode: payload.country,
              savedAgreedToTerms: payload.agreedToTerms,
              savedEmailVerified: true,
              social: payload.social,
              follower: payload.follower,
              price: payload.price,
              photo: payload.profileUrl,
              isCompleted: {
                addSocialProfile: !!(payload.social?.ig || payload.social?.yt || payload.social?.fb),
                addProfilePhoto: !!payload.profileUrl,
                pricePerPost: !!(payload.price?.ig || payload.price?.yt),
              },
            } : {};
            navigation.navigate("InfluencerRegistrationForm", params);
          }}
        >
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
          <Text style={styles.headerText}>{`Influmart Subscriptions`}</Text>
        </View>

        <View style={styles.subHeader}>
          <Text style={styles.subHeaderText}>
            Join now to unlock exclusive brand collaborations and elevate your
            marketing game!
          </Text>
        </View>

        <View style={styles.planToggle}>
          <TouchableOpacity
            style={[styles.planButton, !plans && styles.planActive]}
            onPress={() => setPlans(false)}
          >
            <Text style={[plans && styles.planText]}>Monthly</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setPlans(true)}
            style={[styles.planButton, plans && styles.planActive]}
          >
            <Text style={[!plans && styles.planText]}>Yearly</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.planContainer}>
          {!plans && planData && (
            <PlanBox
              setSelect={setSelectedPlan}
              select={selectedPlan}
              plan={"halfYearly"}
              duration={"6 months"}
              price={`${planData?.halfYearly}`}
              suggested={true}
            />
          )}
          {!plans && planData && (
            <PlanBox
              setSelect={setSelectedPlan}
              select={selectedPlan}
              plan={"quarterly"}
              duration={"3 months"}
              price={`${planData?.quarterly}`}
            />
          )}
          {plans && planData && (
            <PlanBox
              setSelect={setSelectedPlan}
              select={selectedPlan}
              plan={"annually"}
              duration={"1 year"}
              price={`${planData?.annually}`}
            />
          )}
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

        {/* Price Summary */}
        {selectedPlan && (
          <View style={couponStyles.priceSummary}>
            {appliedCoupon ? (
              <View style={couponStyles.priceRow}>
                <Text style={couponStyles.originalPrice}>₹{originalPrice}</Text>
                <Text style={couponStyles.discountedPrice}>₹{finalPrice}</Text>
                <Text style={couponStyles.savings}>You save ₹{originalPrice - finalPrice}!</Text>
              </View>
            ) : (
              <Text style={couponStyles.totalPrice}>Total: ₹{originalPrice}</Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={{ width: "100%" }}
          onPress={() => {
            initiatePayment();
          }}
        >
          <View style={styles.selectPlanButton}>
            <Text style={styles.selectPlanButtonText}>
              {finalPrice ? `Proceed to payment · ₹${finalPrice}` : "Proceed to payment"}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create(PlanChooseInterfaceStyles);

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
  priceSummary: {
    backgroundColor: "#f8f8f8", borderRadius: 12, padding: 16,
    marginBottom: 16, alignItems: "center",
  },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "center" },
  originalPrice: { fontSize: 18, color: "#aaa", textDecorationLine: "line-through", fontWeight: "600" },
  discountedPrice: { fontSize: 24, fontWeight: "800", color: "#111" },
  savings: { fontSize: 13, color: "#16a34a", fontWeight: "600", width: "100%", textAlign: "center", marginTop: 4 },
  totalPrice: { fontSize: 20, fontWeight: "700", color: "#111" },
});

export default PlanChooseInterface;
