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
import { getAllCollabOpenRequests, getBrandCollabOpenCount } from "../../controller/collabOpenController";
import { Padding, Color } from "../../GlobalStyles";
import BrandProductCard from "./components/BrandProductCard";
import { useIsFocused } from "@react-navigation/core";

const BrandProfile = ({ route, navigation }) => {
  const clickedId = route?.params?.clickedId;
  const { showAlert } = useAlert();
  const [brandId, setBrandId] = useState(null);
  const [token, setToken] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [minimumRequirements, setMinimumRequirements] = useState(null);
  const [collaborationCount, setCollaborationCount] = useState(0);
  const { width } = useWindowDimensions();
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState(null);
  const [premiumModal, setPremiumModal] = useState(false);
  const isFocused = useIsFocused();
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

  return (
    <View style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      {loading && <Loader loading={loading} />}
      <ScrollView style={styles.container}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity>
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Brand Profile</Text>
              </View>
            </TouchableOpacity>
            <View style={[styles.profileContainer]}>
              <View style={styles.profileImageContainer}>
                {brand?.profileUrl==null?(
                  <ImageWithFallback
                    imageStyle={styles.profileImage}
                    image={brand?.profileUrl}
                    isSelectedImage={brand?.isSelectedImage}
                  />
                ):brand?.profileUrl&&(
                  <ImageWithFallback
                    imageStyle={styles.profileImage}
                    image={brand?.profileUrl}
                    isSelectedImage={brand?.isSelectedImage}
                  />
                )}
              </View>
              <View style={styles.profileInfoContainer}>
                <Text style={styles.brandName}>{brand?.brandName ? brand.brandName.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : ""}</Text>
                <Text style={styles.brandDetails}>
                  {brand?.category || "N/A"}
                </Text>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.followButton]}
                  onPress={() => navigation.navigate("BrandAdminPanel")}
                >
                  <Text style={styles.followButtonText}>Settings</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.messageButton]}
                  onPress={() => navigation.navigate("InboxInterface")}
                >
                  <Text style={styles.buttonText}>inbox</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={[styles.depth1Frame2, styles.depth1FrameSpaceBlock]}>
            <View style={styles.depth2Frame01}>
              <View style={styles.depth3Frame01}>
                <Text style={styles.collaborationRequests}>
                  {`Collaboration Requests${requests?.length > 0 ? ` (${requests.length > 100 ? "100+" : requests.length})` : ""}`}
                </Text>
              </View>
            </View>
          </View>
          {requests && requests.length > 0 ? (
            <ScrollView
            style={{ width: "100%", maxHeight: 320 }}
            contentContainerStyle={{ width: "100%" }}
            nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              {requests?.map((item, index) => (
                <BrandProductCard
                  key={index}
                  imageSource={item?.imageSource}
                  isSelectedImage={item?.isSelectedImage}
                  postTitle={item?.postTitle}
                  postDate={item?.postDate}
                  productName={item?.productName}
                  campaignTitle={item?.campaignTitle}
                  id={item?.requestId}
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
              <Text style={{ color: "black" }}>No request found.</Text>
            </View>
          )}

          {/* Premium Modal */}
          <Modal transparent visible={premiumModal} animationType="fade" onRequestClose={() => setPremiumModal(false)}>
            <View style={premiumStyles.overlay}>
              <View style={premiumStyles.card}>
                <Text style={premiumStyles.crown}>♛</Text>
                <Text style={premiumStyles.title}>Premium Feature</Text>
                <Text style={premiumStyles.subtitle}>Campaign Insights are available exclusively for premium members. Upgrade your plan to unlock detailed engagement, post frequency, and growth analytics.</Text>
                <TouchableOpacity style={premiumStyles.closeBtn} onPress={() => setPremiumModal(false)}>
                  <Text style={premiumStyles.closeBtnText}>Got it</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <View style={styles.section}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={styles.sectionTitle}>Campaign Insights</Text>
              <TouchableOpacity onPress={() => setPremiumModal(true)} style={premiumStyles.badge}>
                <Text style={premiumStyles.badgeText}>👑 Premium</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity activeOpacity={1} onPress={() => setPremiumModal(true)}>
              <View style={{ opacity: 0.45 }} pointerEvents="none">
                <View style={premiumStyles.insightCard}>
                  <View style={styles.insightContainer}>
                    <View style={styles.iconBg}>
                      <Image style={styles.insightIcon} resizeMode="cover" source={require("../../assets/growth.png")} />
                    </View>
                    <View style={styles.insightDetails}>
                      <Text style={styles.insightTitle}>Engagement Rate</Text>
                      <Text style={styles.insightText}>Upgrade plan to get insights</Text>
                    </View>
                  </View>
                  <View style={styles.insightContainer}>
                    <View style={styles.iconBg}>
                      <Image style={styles.insightIcon} resizeMode="cover" source={require("../../assets/growth.png")} />
                    </View>
                    <View style={styles.insightDetails}>
                      <Text style={styles.insightTitle}>Post Frequency</Text>
                      <Text style={styles.insightText}>Upgrade plan to get insights</Text>
                    </View>
                  </View>
                  <View style={styles.insightContainer}>
                    <View style={styles.iconBg}>
                      <Image style={styles.insightIcon} resizeMode="cover" source={require("../../assets/growth.png")} />
                    </View>
                    <View style={styles.insightDetails}>
                      <Text style={styles.insightTitle}>Follower Growth</Text>
                      <Text style={styles.insightText}>Upgrade plan to get insights</Text>
                    </View>
                  </View>
                </View>
              </View>
              <Text style={[styles.insightText, { textAlign: "right", fontStyle: "italic" }]}>& many more...</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Collaboration Requirements</Text>
            <View style={styles.requirementContainer}>
              <View style={styles.iconBg}>
                <Image
                  style={styles.requirementIcon}
                  resizeMode="cover"
                  source={require("../../assets/Mini-follower.png")}
                />
              </View>
              <View style={styles.requirementDetails}>
                <Text style={styles.requirementTitle}>Minimum Followers</Text>
                <Text style={styles.requirementText}>
                  {minimumRequirements?.minimumFollowers
                    ? `${formatNumber(minimumRequirements?.minimumFollowers)}`
                    : "N/A"}
                </Text>
              </View>
            </View>
            <View style={styles.requirementContainer}>
              <View style={styles.iconBg}>
                <Image
                  style={styles.requirementIcon}
                  resizeMode="cover"
                  source={require("../../assets/likes.png")}
                />
              </View>
              <View style={styles.requirementDetails}>
                <Text style={styles.requirementTitle}>Average Likes</Text>
                <Text style={styles.requirementText}>
                  {minimumRequirements?.minimumLikes
                    ? `${formatNumber(minimumRequirements?.minimumLikes)}`
                    : "N/A"}
                </Text>
              </View>
            </View>
            <View style={styles.requirementContainer}>
              <View style={styles.iconBg}>
                <Image
                  style={styles.requirementIcon}
                  resizeMode="cover"
                  source={require("../../assets/post-frequency.png")}
                />
              </View>
              <View style={styles.requirementDetails}>
                <Text style={styles.requirementTitle}>Post Frequency</Text>
                <Text style={styles.requirementText}>
                  {minimumRequirements?.minimumPostFrequency
                    ? `At least ${formatNumber(
                        minimumRequirements?.minimumPostFrequency
                      )} posts per week`
                    : "N/A"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Successful Campaigns</Text>
            <View style={styles.collabCountContainer}>
              <View style={styles.iconBg}>
                <Image
                  style={styles.collabIcon}
                  resizeMode="cover"
                  source={require("../../assets/collab_count.png")}
                />
              </View>
              <Text style={styles.collabCount}>
                {`Successful Campaigns : ${collaborationCount > 0
                  ? collaborationCount > 20
                    ? "20+"
                    : `${collaborationCount}`
                  : "N/A"}`}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
