import React, { useEffect, useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import Depth1Frame7 from "../../components/Depth1Frame7";
import PlanBox from "../../shared/PlansBox";
import {
  getSubscriptionPlans,
  subscribe,
} from "../../controller/subscriptionController";
import { generateSubscriptionDates } from "../../util/subscriptionDate";
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
  const[loading,setLoading]=useState(false)

  const initiatePayment = async () => {
    if (!selectedPlan) {
      showAlert("Select a Plan", "Please select a plan before proceeding to payment.");
      return;
    }
    setLoading(true);
    const _data = generateSubscriptionDates(selectedPlan?.duration);
    const fakeOrderId = "order_" + Math.random().toString(36).substring(2, 18);
    const fakePaymentId = "pay_" + Math.random().toString(36).substring(2, 18);
    const subscription = {
      userName: payload?.userName,
      plan: selectedPlan?.plan || "free",
      startDate: _data.startDate,
      endDate: _data.endDate,
      isFree: _data.isFree,
      amount: selectedPlan?.price,
      paymentMode: JSON.stringify({
        razorpay_order_id: fakeOrderId,
        razorpay_payment_id: fakePaymentId,
      }),
      transactionDate: _data.transactionDate,
    };
    try {
      await subscribe(subscription, payload, navigation);
    } catch (error) {
      console.log("Subscription error:", error);
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
          onPress={() => navigation.navigate("InfluencerRegistrationForm")}
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
        <TouchableOpacity
          style={{ width: "100%" }}
          onPress={() => {
            initiatePayment();
          }}
        >
          <View style={styles.selectPlanButton}>
            <Text style={styles.selectPlanButtonText}>Proceed to payment</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create(PlanChooseInterfaceStyles);

export default PlanChooseInterface;
