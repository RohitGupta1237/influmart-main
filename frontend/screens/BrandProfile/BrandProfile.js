import React, { useEffect, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import {
  getBrandCollaborationAnalytics,
  getBrandCollaborations,
  getBrandMinimumRequirements,
} from "../../controller/collabrationController";
import { useAlert } from "../../util/AlertContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatNumber } from "../../helpers/GraphData";
import { BrandProfileStyles } from "./BrandProfile.scss";
import { getBrandProfile } from "../../controller/brandController";
import BrandProfileBottomBar from "../../components/BrandProfileBottomBar";
import ImageWithFallback from "../../util/ImageWithFallback";
import Loader from "../../shared/Loader";
import { getAllCollabOpenRequests, getBrandCollabOpenCount, updateCollabOpenStatus } from "../../controller/collabOpenController";
import { StatusTabs, statusLabel } from "../../shared/CollabStatus";
import { Padding, Color } from "../../GlobalStyles";
import BrandProductCard from "./components/BrandProductCard";
import { useIsFocused } from "@react-navigation/core";
import { useTheme } from "../../util/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import ThemeToggle from "../../shared/ThemeToggle";

// Desktop top nav (mirrors the brand bottom bar routes).
const BRAND_NAV = [
  { key: "post", label: "Post", icon: "add-circle", route: "CollabForm" },
  { key: "influencer", label: "Influencers", icon: "search", route: "InfluencersList" },
  { key: "brands", label: "Brands", icon: "briefcase", route: "BrandsAssosciated" },
  { key: "campaigns", label: "Campaigns", icon: "megaphone", route: "BrandCampaigns" },
  { key: "profile", label: "Profile", icon: "person-circle", route: "BrandProfile" },
];

const BrandTopNav = ({ navigation, theme, isDark, toggleTheme, avatar, isSelectedImage }) => (
  <View style={[styles.topNav, { backgroundColor: theme.headerBg, borderColor: theme.headerBorder }]}>
    <View style={styles.topNavInner}>
      <Text style={[styles.brandPink, { color: theme.text }]}>Influmart</Text>
      <View style={styles.navCenter}>
        {BRAND_NAV.map((it) => (
          <TouchableOpacity key={it.key} style={styles.topNavItem} onPress={() => navigation.navigate(it.route, it.key === "post" ? { navigation } : undefined)}>
            <Text style={[styles.topNavLabel, { color: theme.subText }]}>{it.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.navRight}>
        <LinearGradient colors={["#ec4899", "#7c3aed"]} style={styles.navAvatarRing}>
          <View style={[styles.navAvatarInner, { backgroundColor: theme.headerBg }]}>
            <ImageWithFallback imageStyle={styles.navAvatarImg} image={avatar} isSelectedImage={isSelectedImage} />
          </View>
        </LinearGradient>
      </View>
    </View>
  </View>
);

const BrandProfile = ({ route, navigation }) => {
  const clickedId = route?.params?.clickedId;
  const { showAlert } = useAlert();
  const [brandId, setBrandId] = useState(null);
  const [token, setToken] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [minimumRequirements, setMinimumRequirements] = useState(null);
  const [collaborationCount, setCollaborationCount] = useState(0);
  const { width } = useWindowDimensions();
  const { theme, isDark, toggleTheme } = useTheme();
  const isDesktop = width >= 900;
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState(null);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [premiumModal, setPremiumModal] = useState(false);
  const isFocused = useIsFocused();

  const statusCounts = React.useMemo(() => {
    const c = {};
    (requests || []).forEach((r) => { const k = r.status || "pending"; c[k] = (c[k] || 0) + 1; });
    return c;
  }, [requests]);
  const visibleRequests = React.useMemo(
    () => (requests || []).filter((r) => (r.status || "pending") === statusFilter),
    [requests, statusFilter]
  );
  const handleStatusChange = async (requestId, status) => {
    setRequests((prev) => (prev || []).map((r) => (r.requestId === requestId ? { ...r, status } : r)));
    await updateCollabOpenStatus(requestId, status, showAlert);
    if (brandId) getAllCollabOpenRequests(brandId, setRequests, showAlert);
  };
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedBrandId = await AsyncStorage.getItem("brandId");
        const storedToken = await AsyncStorage.getItem("token");

        if (storedBrandId && storedToken) {
          setBrandId(storedBrandId);
          setToken(storedToken);
        } else {
          console.log("BrandId or token not found in AsyncStorage");
        }
      } catch (error) {
        console.error("Error fetching user data from AsyncStorage:", error);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    if (brandId && token) {
      setLoading(true);

      getAllCollabOpenRequests(brandId, setRequests, showAlert);

      getBrandCollaborationAnalytics(brandId, showAlert)
        .then((data) => setAnalytics(data))
        .catch((error) =>
          console.error("Error fetching collaboration analytics:", error)
        );

      getBrandCollabOpenCount(brandId)
        .then((count) => setCollaborationCount(count))
        .catch((error) =>
          console.error("Error fetching collab open count:", error)
        );
      getBrandMinimumRequirements(brandId, showAlert)
        .then((data) => setMinimumRequirements(data))
        .catch((error) =>
          console.error("Error fetching minimum requirements:", error)
        );
      if (clickedId)
        getBrandProfile(clickedId, showAlert).then((data) => setBrand(data));
      else getBrandProfile(brandId, showAlert).then((data) => setBrand(data));
      setLoading(false);
    }
  }, [brandId, token, clickedId,isFocused]);

  // ── Reusable blocks (shared by app + web layouts) ──
  const profileBlock = (
    <View style={[styles.profileContainer, isDesktop && { paddingTop: 28 }]}>
      <View style={styles.profileImageContainer}>
        <LinearGradient colors={["#ec4899", "#ec4899"]} style={styles.avatarRing}>
          <View style={[styles.avatarInner, { backgroundColor: theme.bg }]}>
            <ImageWithFallback
              imageStyle={styles.profileImage}
              image={brand?.profileUrl}
              isSelectedImage={brand?.isSelectedImage}
            />
          </View>
        </LinearGradient>
      </View>
      <View style={styles.profileInfoContainer}>
        <Text style={[styles.brandName, { color: theme.text }]}>{brand?.brandName ? brand.brandName.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : ""}</Text>
        <Text style={[styles.brandDetails, { color: theme.subText }]}>{brand?.category || "N/A"}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.pill, borderColor: theme.pillBorder, borderWidth: 1 }]}
          onPress={() => navigation.navigate("BrandAdminPanel")}
        >
          <Text style={[styles.followButtonText, { color: theme.text }]}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("InboxInterface")} activeOpacity={0.85}>
          <LinearGradient colors={["#ec4899", "#7c3aed"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradBtn}>
            <Text style={styles.buttonText}>Inbox</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const requestsBlock = (
    <View style={{ width: "100%" }}>
      <View style={[styles.depth1Frame2, styles.depth1FrameSpaceBlock]}>
        <Text style={[styles.collaborationRequests, { color: theme.text }]}>
          {`Collaboration Requests${requests?.length > 0 ? ` (${requests.length > 100 ? "100+" : requests.length})` : ""}`}
        </Text>
      </View>
      <StatusTabs active={statusFilter} onChange={setStatusFilter} counts={statusCounts} />
      {visibleRequests.length > 0 ? (
        <ScrollView style={{ width: "100%", maxHeight: 320 }} contentContainerStyle={{ width: "100%", paddingHorizontal: 16 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          {visibleRequests.map((item, index) => (
            <BrandProductCard
              key={index}
              imageSource={item?.imageSource}
              isSelectedImage={item?.isSelectedImage}
              postTitle={item?.postTitle}
              postDate={item?.postDate}
              productName={item?.productName}
              campaignTitle={item?.campaignTitle}
              id={item?.requestId}
              status={item?.status}
              onStatusChange={handleStatusChange}
              cardWidth="100%"
              postTitleWidth="auto"
              postDateWidth="auto"
              productNameWidth="auto"
              buttonWidth="auto"
            />
          ))}
        </ScrollView>
      ) : (
        <View style={{ width: "100%", padding: Padding.p_base }}>
          <Text style={{ color: theme.subText }}>No {statusLabel(statusFilter).toLowerCase()} requests.</Text>
        </View>
      )}
    </View>
  );

  const insightsBlock = (
    <View style={styles.section}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Campaign Insights</Text>
        <TouchableOpacity onPress={() => setPremiumModal(true)} style={premiumStyles.badge}>
          <Text style={premiumStyles.badgeText}>👑 Premium</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity activeOpacity={1} onPress={() => setPremiumModal(true)}>
        <View style={{ opacity: 0.45 }} pointerEvents="none">
          <View style={[premiumStyles.insightCard, { backgroundColor: theme.card }]}>
            {[
              { t: "Engagement Rate", icon: "trending-up-outline" },
              { t: "Post Frequency", icon: "calendar-outline" },
              { t: "Follower Growth", icon: "people-outline" },
            ].map(({ t, icon }, i) => (
              <View key={i} style={styles.insightContainer}>
                <View style={[styles.iconBg, { backgroundColor: theme.pill }]}>
                  <Ionicons name={icon} size={20} color={theme.text} />
                </View>
                <View style={styles.insightDetails}>
                  <Text style={[styles.insightTitle, { color: theme.text }]}>{t}</Text>
                  <Text style={[styles.insightText, { color: theme.subText }]}>Upgrade plan to get insights</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
        <Text style={[styles.insightText, { color: theme.subText, textAlign: "right", fontStyle: "italic" }]}>& many more...</Text>
      </TouchableOpacity>
    </View>
  );

  const requirementsBlock = (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Collaboration Requirements</Text>
      {[
        { icon: "people-outline", title: "Minimum Followers", value: minimumRequirements?.minimumFollowers ? `${formatNumber(minimumRequirements?.minimumFollowers)}` : "N/A" },
        { icon: "heart-outline", title: "Average Likes", value: minimumRequirements?.minimumLikes ? `${formatNumber(minimumRequirements?.minimumLikes)}` : "N/A" },
        { icon: "calendar-outline", title: "Post Frequency", value: minimumRequirements?.minimumPostFrequency ? `At least ${formatNumber(minimumRequirements?.minimumPostFrequency)} posts per week` : "N/A" },
      ].map((r, i) => (
        <View key={i} style={styles.requirementContainer}>
          <View style={[styles.iconBg, { backgroundColor: theme.pill }]}>
            <Ionicons name={r.icon} size={20} color={theme.text} />
          </View>
          <View style={styles.requirementDetails}>
            <Text style={[styles.requirementTitle, { color: theme.text }]}>{r.title}</Text>
            <Text style={[styles.requirementText, { color: theme.subText }]}>{r.value}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const campaignsBlock = (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Successful Campaigns</Text>
      <View style={styles.collabCountContainer}>
        <View style={[styles.iconBg, { backgroundColor: theme.pill }]}>
          <Ionicons name="ribbon-outline" size={22} color={theme.text} />
        </View>
        <Text style={[styles.collabCount, { color: theme.text }]}>
          {`Successful Campaigns : ${collaborationCount > 0 ? (collaborationCount > 20 ? "20+" : `${collaborationCount}`) : "N/A"}`}
        </Text>
      </View>
    </View>
  );

  const premiumModalEl = (
    <Modal transparent visible={premiumModal} animationType="fade" onRequestClose={() => setPremiumModal(false)}>
      <View style={premiumStyles.overlay}>
        <View style={[premiumStyles.card, { backgroundColor: theme.card }]}>
          <Text style={premiumStyles.crown}>♛</Text>
          <Text style={[premiumStyles.title, { color: theme.text }]}>Premium Feature</Text>
          <Text style={[premiumStyles.subtitle, { color: theme.subText }]}>Campaign Insights are available exclusively for premium members. Upgrade your plan to unlock detailed engagement, post frequency, and growth analytics.</Text>
          <TouchableOpacity style={premiumStyles.closeBtn} onPress={() => setPremiumModal(false)}>
            <Text style={premiumStyles.closeBtnText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={{ flex: 1, width: "100%", backgroundColor: theme.bg }}>
      {loading && <Loader loading={loading} />}
      {isDesktop ? (
        <BrandTopNav navigation={navigation} theme={theme} isDark={isDark} toggleTheme={toggleTheme} avatar={brand?.profileUrl} isSelectedImage={brand?.isSelectedImage} />
      ) : (
        <View style={[styles.mobileHeader, { backgroundColor: theme.headerBg, borderColor: theme.headerBorder }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Brand Profile</Text>
        </View>
      )}
      <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={{ alignItems: "center" }}>
        <View style={[styles.contentWrapper, { backgroundColor: theme.bg, maxWidth: isDesktop ? 1400 : 560, alignSelf: "center" }]}>
          {isDesktop ? (
            <View style={styles.desktopRow}>
              <View style={[styles.desktopLeft, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>{profileBlock}</View>
              <View style={styles.desktopRight}>
                {requestsBlock}
                {insightsBlock}
                {requirementsBlock}
                {campaignsBlock}
              </View>
            </View>
          ) : (
            <View style={{ width: "100%" }}>
              {profileBlock}
              {requestsBlock}
              {insightsBlock}
              {requirementsBlock}
              {campaignsBlock}
            </View>
          )}
          {premiumModalEl}
        </View>
      </ScrollView>
      {!isDesktop && (
        <BrandProfileBottomBar
          depth5Frame0={require("../../assets/depth-5-frame-01.png")}
          depth5Frame01={require("../../assets/depth-5-frame-02.png")}
          search="Influencer"
          myNetwork={require("../../assets/depth-5-frame-030.png")}
          postImage={require("../../assets/depth-5-frame-029.png")}
          depth5Frame02={require("../../assets/depth-5-frame-03.png")}
          myBrands="Brands"
          depth5Frame03={require("../../assets/depth-5-frame-04.png")}
          style={styles.bottomBar}
        />
      )}
      <ThemeToggle />
    </View>
  );
};

const styles = StyleSheet.create(BrandProfileStyles);

const premiumStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center", alignItems: "center",
  },
  card: {
    backgroundColor: "#fff", borderRadius: 16,
    padding: 28, marginHorizontal: 32, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  crown: { fontSize: 40, marginBottom: 10 },
  title: { fontSize: 20, fontWeight: "800", color: "#111", marginBottom: 8 },
  subtitle: {
    fontSize: 14, color: "#555", textAlign: "center",
    lineHeight: 20, marginBottom: 20,
  },
  closeBtn: {
    backgroundColor: "#111", borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 32,
  },
  closeBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  badge: {
    backgroundColor: "#FFF8E1", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: "#FFD700",
  },
  badgeText: { fontSize: 12, fontWeight: "700", color: "#B8860B" },
  manyMore: { fontSize: 12, fontWeight: "600", color: "#888", alignSelf: "flex-end", marginTop: 4 },
  insightCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
});

export default BrandProfile;
