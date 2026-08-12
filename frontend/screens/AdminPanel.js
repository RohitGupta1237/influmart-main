import React, { useState, useEffect } from "react";
import { Image } from "expo-image";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Button,
} from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { Color, Padding, FontSize, FontFamily, Border } from "../GlobalStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GetInfluencerProfile } from "../controller/InfluencerController";
import { getSubscription } from "../controller/subscriptionController";

// "quarterly" -> "Quarterly", "halfYearly" -> "Half Yearly"
const prettyPlan = (p) =>
  p ? String(p).replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim() : "";
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

const AdminPanel = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const influencerId = await AsyncStorage.getItem("influencerId");
        if (!influencerId || influencerId === "undefined") return;
        const profile = await GetInfluencerProfile(influencerId, () => {}, () => {});
        const userName = profile?.userName;
        if (userName) setSubscription(await getSubscription(userName));
      } catch (e) { /* no-op */ }
    })();
  }, [isFocused]);

  // Derive display values for the plan card.
  const sub = subscription;
  const isActive = sub ? (sub.endDate ? new Date(sub.endDate) >= new Date() : !!sub.isFree) : false;

  const handleOptionPress = (option) => {
    setSelectedOption(option);
    setModalVisible(true);
  };

  const handleSave = () => {
    // Handle the save action here (e.g., update state or call an API)
    setModalVisible(false);
  };

  const menuOptions = [
     {
      label: "Help center",
      image: require("../assets/depth-3-frame-1.png"),
      navigate: "InfluencerHelpCenterPage",
    },
    {
      label: "Contact us",
      image: require("../assets/depth-3-frame-1.png"),
      navigate: "InfluencerContactUsPage",
    },
    {
      label: "Delete account",
      image: require("../assets/depth-3-frame-1.png"),
      navigate: "InfluencerAccountDeletePage",
    },
  ];

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.adminPanel}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.navigate("UserProfile")}
            style={styles.iconButton}
          >
            <Image
              style={styles.icon}
              contentFit="cover"
              source={require("../assets/adminPanelBack.png")}
            />
          </TouchableOpacity>
          <Text style={styles.headerText}>Account settings</Text>
          <View style={{width:20,height:20}}></View>
        </View>
        <View style={styles.optionContainer}>
          <Text style={styles.optionLabel}>Logout</Text>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => navigation.navigate("InfluencerLogoutPage")}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.optionContainer}>
          <Text style={styles.optionLabel}>Manage Profile</Text>
          <TouchableOpacity onPress={() => navigation.navigate("InfluencerManageAccountPage")}>
            <Image
              style={styles.optionImage}
              contentFit="cover"
              source={require("../assets/depth-3-frame-1.png")}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.optionContainer}>
          <Text style={styles.optionLabel}>Change Password</Text>
          <TouchableOpacity onPress={() => navigation.navigate("InfluencerChangePasswordPage")}>
            <Image
              style={styles.optionImage}
              contentFit="cover"
              source={require("../assets/depth-3-frame-1.png")}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.optionContainer}>
          <Text style={styles.optionLabel}>Renew Subscription</Text>
          <TouchableOpacity onPress={() => navigation.navigate("RenewSubscription")}>
            <Image
              style={styles.optionImage}
              contentFit="cover"
              source={require("../assets/depth-3-frame-1.png")}
            />
          </TouchableOpacity>
        </View>

        {/* Current subscription card */}
        <View style={styles.planCard}>
          <View style={styles.planHeaderRow}>
            <Text style={styles.planCardTitle}>Current Plan</Text>
            {sub && (
              <View style={[styles.planBadge, { backgroundColor: isActive ? "#E7F6EC" : "#FDECEC" }]}>
                <Text style={[styles.planBadgeText, { color: isActive ? "#1E8E4E" : "#C0392B" }]}>
                  {isActive ? "Active" : "Expired"}
                </Text>
              </View>
            )}
          </View>
          {sub ? (
            <>
              <Text style={styles.planName}>
                {sub.isFree && !sub.plan ? "Free Plan" : prettyPlan(sub.plan) || "Free Plan"}
                {sub.isFree ? "  ·  Free" : ""}
              </Text>
              <Text style={styles.planMeta}>
                {sub.endDate
                  ? `${isActive ? "Valid until" : "Expired on"} ${formatDate(sub.endDate)}`
                  : "No expiry"}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.planName}>No active plan</Text>
              <Text style={styles.planMeta}>Choose a plan to unlock verified analytics & more.</Text>
              <TouchableOpacity onPress={() => navigation.navigate("RenewSubscription")}>
                <Text style={styles.planCta}>View plans →</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.supportContainer}>
          <Text style={styles.supportText}>Support</Text>
        </View>
        {menuOptions.map((option, index) => (
          <View key={index} style={styles.optionContainer}>
            <Text style={styles.optionLabel}>{option.label}</Text>
            <TouchableOpacity onPress={() => navigation.navigate(option.navigate,{navigate:"AdminPanel"})}>
              {option.image && (
                <Image
                  style={styles.optionImage}
                  contentFit="cover"
                  source={option.image}
                />
              )}
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 1,
    backgroundColor: Color.colorWhite,
  },
  adminPanel: {
    flex: 1,
    backgroundColor: Color.colorWhite,
  },
  header: {
    width:"100%",
    flexDirection: "row",
    justifyContent:"space-between",
    alignItems: "center",
    padding: Padding.p_base,
    backgroundColor: Color.colorWhite,
  },
  iconButton: {
    marginRight: 16,
  },
  icon: {
    width: 24,
    height: 24,
  },
  headerText: {
    fontSize: FontSize.size_lg,
    fontWeight: "700",
    fontFamily: FontFamily.interBold,
    color: Color.colorGray,
  },
  supportContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Padding.p_base,
    backgroundColor: Color.colorWhite,
  },
  supportText: {
    fontSize: FontSize.size_lg,
    fontFamily: FontFamily.interBold,
    lineHeight: 22,
  },
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Padding.p_base,
    backgroundColor: Color.colorWhite,
  },
  optionLabel: {
    fontSize: FontSize.size_base,
    fontFamily: FontFamily.interRegular,
    color: Color.colorGray,
  },
  planCard: {
    marginHorizontal: Padding.p_base,
    marginTop: 8,
    marginBottom: 8,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#F5F7FB",
    borderWidth: 1,
    borderColor: "#E6E9F0",
  },
  planHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  planCardTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#8a8f98",
    fontFamily: FontFamily.interRegular,
  },
  planBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  planBadgeText: { fontSize: 11, fontWeight: "700" },
  planName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1c1c1e",
    marginBottom: 4,
  },
  planMeta: { fontSize: 13, color: "#555" },
  planSub: { fontSize: 12, color: "#9aa3b2", marginTop: 2 },
  planCta: { fontSize: 13, fontWeight: "700", color: "#1A5CE5", marginTop: 8 },
  logoutButton: {
    paddingHorizontal: Padding.p_xl,
    paddingVertical: Padding.p_5xs,
    backgroundColor: Color.colorWhitesmoke_300,
    borderRadius: Border.br_base,
  },
  logoutButtonText: {
    fontSize: FontSize.size_sm,
    fontWeight: "500",
    fontFamily: FontFamily.interMedium,
  },
  optionImage: {
    width: 28,
    height: 28,
    marginLeft: 16,
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: FontSize.size_lg,
    fontFamily: FontFamily.interBold,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    width: "100%",
    marginBottom: 20,
    paddingLeft: 10,
    borderRadius: 5,
  },
});

export default AdminPanel;
