import * as React from "react";
import {
  Text,
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Pressable,
  useWindowDimensions,
  Platform,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import API_ENDPOINT from "../../config";
import Depth1Frame7 from "../../components/Depth1Frame7";
import Depth1Frame9 from "../../components/Depth1Frame9";

import { transformFB, transformIG, transformYT } from "../../helpers/GraphData";
import { getSocialData } from "../../controller/socialController";
import AiInsightsCard from "./components/AiInsights/AiInsightsCard";
import { FBStats, InstaStats, YTStats } from "./components/stats/AllStats";
import { FBGraph, IgGraph, YTGraph } from "./components/MyGraphs/AllGraphs";
import { InstaDemo, YTDemo, FBDemo } from "./components/Images/AllImages";
import { AnalyticsStyles } from "./Analytics.scss";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAlert } from "../../util/AlertContext";
import { GetInfluencerProfile, UpdateInfluencerDescription, UpdateInfluencerHashtags, UpdateInfluencerPrice, RefreshYoutubeData } from "../../controller/InfluencerController";
import {sendRequest} from "../../controller/connectionsController"
import Loader from '../../shared/Loader';
import VerifySocialModal from "../UserProfile/VerifySocialModal";
import FetchStatsModal from "../UserProfile/FetchStatsModal";

const AnalyticsBadge = ({ symbol, textColor }) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <View style={{ position: "relative" }}>
      <Text
        style={{ fontSize: 13, fontWeight: "700", color: textColor, lineHeight: 21 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {symbol}
      </Text>
      {hovered && (
        <View style={{
          position: "absolute", bottom: 22, left: "50%",
          transform: [{ translateX: -30 }],
          backgroundColor: "rgba(0,0,0,0.85)", borderRadius: 4,
          paddingHorizontal: 6, paddingVertical: 3, zIndex: 999,
          minWidth: 70, alignItems: "center",
        }}>
          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600", whiteSpace: "nowrap" }}>
            {symbol === "✓" ? "Verified" : symbol === "?" ? "Tap to verify" : "Not Verified"}
          </Text>
        </View>
      )}
    </View>
  );
};

const AveragePrice = ({ platform, price }) => (
  <View style={styles.averagePriceContainer}>
    <View style={styles.platformContainer}>
      <Text style={styles.platformText}>{platform}</Text>
      <Text style={styles.priceText}>{price}</Text>
    </View>
    <View style={styles.priceContainer}>
      <Image
        style={styles.insightIcon}
        resizeMode="cover"
        source={require("../../assets/growth.png")}
      />
    </View>
  </View>
);

const Analytics = ({ route, navigation }) => {
  // Highlight cards: responsive to the current viewport but capped so they stay
  // a sensible thumbnail size on desktop (previously computed once from the full
  // browser width → ~900px giant portrait iframe).
  const { width: winWidth } = useWindowDimensions();
  const CARD_WIDTH = Math.min(Math.round(winWidth * 0.8), 320);
  const YT_CARD_HEIGHT = Math.round(CARD_WIDTH * (9 / 16));
  const IG_CARD_HEIGHT = Math.round(CARD_WIDTH * 1.77);
  const [fbData, setFbData] = React.useState({});
  const [instaData, setInstaData] = React.useState({});
  const [ytData, setYtData] = React.useState({});
  const [socialData, setSocialData] = React.useState(false);
  const [tab, setTab] = React.useState("instagram");
  const { showAlert } = useAlert();
  const [popularPosts, setPopularPosts] = React.useState(null);
  const [influencerId, setInfluencerId] = React.useState("");
  const [influencer, setInfluencer] = React.useState(null);
  const clickedId = route.params?.influencerId
  const [idType,setIdType] = React.useState("")
  const [myOwnId, setMyOwnId] = React.useState("")

  // Description state
  const [description, setDescription] = React.useState("")
  const [editingDesc, setEditingDesc] = React.useState(false)
  const [descInput, setDescInput] = React.useState("")
  const [savingDesc, setSavingDesc] = React.useState(false)

  // Hashtag state
  const [hashtags, setHashtags] = React.useState([])
  const [editingTags, setEditingTags] = React.useState(false)
  const [tagInput, setTagInput] = React.useState("")
  const [savingTags, setSavingTags] = React.useState(false)

  // Price state
  const [editingPrice, setEditingPrice] = React.useState(false)
  const [priceInput, setPriceInput] = React.useState({ ig: "", yt: "", fb: "", tr: "" })
  const [savingPrice, setSavingPrice] = React.useState(false)

  const [loading,setLoading]=React.useState(false)

  // ROI Predictor state
  const [roiModalVisible, setRoiModalVisible] = React.useState(false)
  const [roiBudget, setRoiBudget] = React.useState("")
  const [roiProductType, setRoiProductType] = React.useState("Fashion/Beauty")
  const [roiPlatform, setRoiPlatform] = React.useState("instagram")
  const [roiResult, setRoiResult] = React.useState(null)
  const [showProductDropdown, setShowProductDropdown] = React.useState(false)
  const [verifyModal, setVerifyModal] = React.useState({ visible: false, platform: null })
  const [fetchModal, setFetchModal] = React.useState({ visible: false, platform: null, username: "" })

  const productTypes = [
    { label: "Fashion / Beauty", value: "Fashion/Beauty", convRate: 0.015 },
    { label: "Fitness / Health", value: "Fitness/Health", convRate: 0.012 },
    { label: "Food / Travel", value: "Food/Travel", convRate: 0.008 },
    { label: "Tech / Education", value: "Tech/Education", convRate: 0.006 },
    { label: "Others", value: "Others", convRate: 0.010 },
  ]

  const formatROINum = (num) => {
    if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`
    if (num >= 100000) return `${(num / 100000).toFixed(1)}L`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return Math.round(num).toString()
  }

  const calculateROI = () => {
    const budget = parseFloat(roiBudget)
    if (!budget || budget <= 0) return

    const productType = productTypes.find(p => p.value === roiProductType)
    const convRate = productType?.convRate || 0.01

    let followers = 0, avgER = 0, avgViews = 0, pricePerPost = 0

    if (roiPlatform === "instagram") {
      const raw = socialData?.instaData?.[socialData.instaData.length - 1]
      followers = raw?.followers || 0
      avgER = parseFloat(raw?.avgER) || 0        // stored as decimal e.g. 0.032
      avgViews = parseFloat(raw?.avgViews) || 0
      pricePerPost = parseFloat(influencer?.price?.[0]?.ig) || 0

    } else if (roiPlatform === "youtube") {
      try {
        const raw = socialData?.ytData
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw
        followers = parseInt(parsed?.overAll?.subscriberCount ?? parsed?.subscriberCount) || 0
        const videos = parsed?.lastPost?.data || []
        if (videos.length > 0) {
          avgViews = videos.reduce((s, v) => s + (parseInt(v.viewCount) || 0), 0) / videos.length
        }
        avgER = followers > 0 ? (avgViews / followers) : 0
      } catch (e) {}
      pricePerPost = parseFloat(influencer?.price?.[0]?.yt) || 0

    } else if (roiPlatform === "facebook") {
      const raw = socialData?.fbData?.[socialData.fbData.length - 1]
      followers = raw?.followers || 0
      avgViews = raw?.avgReelPlayCount || 0
      avgER = parseFloat(raw?.avgER) || 0
      pricePerPost = parseFloat(influencer?.price?.[0]?.fb) || 0
    }

    const postsAffordable = pricePerPost > 0 ? Math.floor(budget / pricePerPost) : 1

    // ER-based reach (fallback to 3% if ER not available)
    const erDecimal = avgER > 1 ? avgER / 100 : avgER
    const effectiveER = erDecimal > 0 ? erDecimal : 0.03
    const reachPerPost = Math.round(followers * effectiveER)

    // Use max of ER-based reach or avg views
    const impressionsPerPost = Math.round(Math.max(reachPerPost * 1.3, avgViews))

    const totalReach = reachPerPost * postsAffordable
    const totalImpressions = impressionsPerPost * postsAffordable
    const conversions = Math.round(totalImpressions * convRate)
    const costPerReach = totalReach > 0 ? (budget / totalReach).toFixed(2) : "N/A"
    const costPerConversion = conversions > 0 ? Math.round(budget / conversions) : "N/A"

    // ROI Score out of 10
    // ER benchmark: 3% = score 5, each 1% above = +1, below = -1, max 10
    const erPercent = effectiveER * 100
    const erScore = Math.min(10, Math.max(1, 5 + (erPercent - 3)))
    // Cost efficiency: ₹1-3 per reach = good (score 8+), ₹5+ = poor (score 4-)
    const cpr = parseFloat(costPerReach)
    const costScore = isNaN(cpr) ? 5 : cpr <= 2 ? 9 : cpr <= 4 ? 7 : cpr <= 6 ? 5 : 3
    const roiScore = Math.min(10, ((erScore + costScore) / 2)).toFixed(1)

    // Justification
    const erLabel = erPercent >= 4 ? "above average" : erPercent >= 2 ? "average" : "below average"
    const costLabel = !isNaN(cpr) && cpr <= 3 ? "cost-efficient" : "moderate cost"
    const justification = `Engagement rate is ${erLabel} at ${erPercent.toFixed(1)}%. ${postsAffordable} post(s) affordable within budget — ${costLabel}.`

    setRoiResult({
      postsAffordable,
      totalReach,
      totalImpressions,
      conversions,
      costPerReach,
      costPerConversion,
      roiScore,
      justification,
      followers,
      avgER: erPercent.toFixed(1),
      avgViews: Math.round(avgViews),
      pricePerPost,
    })
  }

  const resetROIModal = () => {
    setRoiBudget("")
    setRoiProductType("Fashion/Beauty")
    setRoiPlatform("instagram")
    setRoiResult(null)
    setShowProductDropdown(false)
    setRoiModalVisible(false)
  }

  React.useEffect(() => {
    const getData = async () => {
      const id = await AsyncStorage.getItem("influencerId");
      const _id = await AsyncStorage.getItem("brandId");
      if(_id){
        setIdType("brand")
      } else if(id){
        setIdType("influencer")
      }
      if (id) setMyOwnId(id);

      if (!id && !clickedId) {
        navigation.navigate("Homepage");
      } else {
        setLoading(true)
        let getId = clickedId || id
        setInfluencerId(getId);
        GetInfluencerProfile(getId, (profileData) => {
          setInfluencer(profileData);
          setDescription(profileData?.description || "");
          setHashtags(profileData?.hashtags || []);
        }, showAlert);
        getSocialData(getId, showAlert)
          .then((data) => {
            const transformedFb = transformFB(data);
            const transformedIg = transformIG(data);
            setFbData(transformedFb.fbdata);
            setInstaData(transformedIg.instadata);
            setSocialData(data);
            let popular = [];
            const sortedPosts = data?.instaData?.[data?.instaData.length - 1]?.lastPosts?.sort((a, b) => b.likes - a.likes);
            sortedPosts?.slice(0, 3).forEach((post) => {
              const url = post.link || post.url;
              if (url) popular.push({ url, platform: "Instagram" });
            });
            const fbReels = data?.fbData?.[data?.fbData.length - 1]?.lastReels || [];
            fbReels.slice(0, 3).forEach((reel) => {
              popular.push({ ...reel, platform: "Facebook" });
            });
            try {
              const parsedYt = data.ytData ? JSON.parse(data.ytData) : {};
              const transformedYt = transformYT(parsedYt.analytics || []);
              setYtData(transformedYt);
              parsedYt.highlights?.forEach((item) => {
                popular.push({ title: item.title, url: `${item.videoId}`, platform: "YouTube" });
              });
            } catch (e) {
              console.log("Error parsing ytData:", e);
              setYtData(transformYT([]));
            }
            setPopularPosts(popular);
          })
          .catch((error) => console.log(error));
          setLoading(false)
      }
    };
    getData();
  }, [influencerId, clickedId]);

  // Re-pull social data + profile after a fresh fetch so the columns update.
  // Verify YouTube from the profile (for users who skipped it at signup).
  // Uses the backend OAuth code flow (gets a refresh token for the cron), with a
  // web-friendly redirect back to the app.
  const [ytVerifying, setYtVerifying] = React.useState(false);
  const [ytVerify, setYtVerify] = React.useState({ visible: false, handle: "" });
  const handleYtVerify = async () => {
    const influencerId = myOwnId;
    const entered = (ytVerify.handle || "").trim().replace(/^@/, "");
    if (!entered) {
      showAlert?.("Error", "Please enter your YouTube channel handle");
      return;
    }
    if (!influencerId || ytVerifying) return;
    setYtVerifying(true);
    try {
      const state = Math.random().toString(36).substring(2, 18);
      const redirectUri =
        Platform.OS === "web"
          ? (typeof window !== "undefined" ? window.location.origin + "/" : "https://www.influmart.in/")
          : AuthSession.makeRedirectUri({ scheme: "influmart", path: "auth" });
      const url =
        `${API_ENDPOINT}/auth/youtube?state=${state}&influencerId=${influencerId}` +
        `&redirectUri=${encodeURIComponent(redirectUri)}&channel=${encodeURIComponent(entered)}`;
      const result = await WebBrowser.openAuthSessionAsync(url, redirectUri);
      if (result.type !== "success") {
        showAlert?.("Info", "YouTube sign-in was cancelled");
        return;
      }
      const params = new URLSearchParams((result.url || "").split("?")[1] || "");
      if (params.get("error") || !params.get("ytSuccess")) {
        const err = params.get("error");
        const msgs = {
          youtube_no_channel: "No YouTube channel found on this Google account.",
          youtube_state_mismatch: "Security check failed. Please try again.",
          youtube_channel_mismatch: `Channel does not match. Your YouTube channel is ${params.get("ytChannel") || "different"}.`,
        };
        showAlert?.("Error", msgs[err] || "YouTube verification failed. Please try again.");
        return;
      }
      setYtVerify({ visible: false, handle: "" });
      showAlert?.("Success", "YouTube verified!");
      await reloadSocial(); // refreshes influencer (ytChannelId) → ✓ + ↻ appear
    } catch (e) {
      console.log("handleYtVerify error:", e);
      showAlert?.("Error", "YouTube verification failed. Please try again.");
    } finally {
      setYtVerifying(false);
    }
  };

  const [ytRefreshing, setYtRefreshing] = React.useState(false);
  const handleYtRefresh = async () => {
    const getId = clickedId || myOwnId;
    if (!getId || ytRefreshing) return;
    setYtRefreshing(true);
    try {
      const ok = await RefreshYoutubeData(getId, showAlert);
      if (ok) {
        await reloadSocial();
        showAlert?.("Success", "YouTube statistics updated.");
      }
    } finally {
      setYtRefreshing(false);
    }
  };

  const reloadSocial = async () => {
    const getId = clickedId || myOwnId;
    if (!getId) return;
    GetInfluencerProfile(getId, (profileData) => setInfluencer(profileData), showAlert);
    try {
      const data = await getSocialData(getId, showAlert);
      setFbData(transformFB(data).fbdata);
      setInstaData(transformIG(data).instadata);
      setSocialData(data);
    } catch (e) {
      console.log("reloadSocial error:", e);
    }
  };

  const processTag = (tag) => {
    const splitTag = tag.split(/[-\s]/);
    return splitTag.length > 1 ? splitTag[0] : tag;
  };

  const handleConnect = async ()=>{
    const brandId = await AsyncStorage.getItem("brandId")
    if(brandId){
      setLoading(true)
      await sendRequest(brandId,clickedId,showAlert)
      setLoading(false)
    }
  }
  const isOwnProfile = idType === "influencer" && (!clickedId || clickedId === myOwnId);

  const handleSaveDescription = async () => {
    if (descInput.length > 100) {
      showAlert("Error", "Description cannot exceed 100 characters");
      return;
    }
    setSavingDesc(true);
    const ok = await UpdateInfluencerDescription(influencerId, descInput, showAlert);
    if (ok) {
      setDescription(descInput);
      setEditingDesc(false);
    }
    setSavingDesc(false);
  };

  const handleAddTag = () => {
    const raw = tagInput.trim().replace(/^#+/, "");
    if (!raw) return;
    if (hashtags.includes(raw)) { setTagInput(""); return; }
    setHashtags(prev => [...prev, raw]);
    setTagInput("");
  };

  const handleRemoveTag = (tag) => {
    setHashtags(prev => prev.filter(t => t !== tag));
  };

  const handleSaveHashtags = async () => {
    setSavingTags(true);
    const ok = await UpdateInfluencerHashtags(influencerId, hashtags, showAlert);
    if (ok) setEditingTags(false);
    setSavingTags(false);
  };

  const handleSavePrice = async () => {
    setSavingPrice(true);
    const priceObj = {
      ig: priceInput.ig,
      yt: priceInput.yt,
      fb: priceInput.fb,
      tr: priceInput.tr,
      currency: influencer?.price?.[0]?.currency || { code: "IN", currency: "INR" },
    };
    const ok = await UpdateInfluencerPrice(influencerId, priceObj, showAlert);
    if (ok) {
      setInfluencer(prev => ({ ...prev, price: [priceObj] }));
      setEditingPrice(false);
    }
    setSavingPrice(false);
  };

  const handleBack = async () => {
    const brand = await AsyncStorage.getItem("brandId")
    const influencer = await AsyncStorage.getItem("influencerId")
    if (brand) {
      navigation.navigate('InfluencersList')
    } else if (influencer) {
      navigation.navigate('UserProfile')
    }
  }

  return (
    <View style={styles.container}>
      {loading&&<Loader loading={loading}/>}
      <TouchableOpacity style={styles.menuBar} onPress={() => handleBack()}>
        <Depth1Frame7
          depth4Frame0={require("../../assets/depth-4-frame-010.png")}
          requestDetails={`Influencer`}
          depth3Frame0BackgroundColor="#fff"
          requestDetailsWidth={"auto"}
          depth4Frame0FontFamily="BeVietnamPro-Bold"
          depth4Frame0Color="#121217"
        />
      </TouchableOpacity>
      <ScrollView style={styles.scrollViewContent} keyboardShouldPersistTaps="handled">
        <View style={styles.analytics}>
          <View style={styles.depth0Frame0}>
            {influencer?.profileUrl && <Depth1Frame9
              image={influencer?.profileUrl}
              username={influencer?.influencerName}
              location={influencer?.location}
              category={influencer?.category}
              isSelectedImage={influencer.isSelectedImage}
            />}
            {/* Description Section — above hashtags */}
            <View style={styles.averagePriceSection}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <Text style={styles.averagePriceHeaderText}>About</Text>
                {isOwnProfile && !editingDesc && (
                  <TouchableOpacity
                    onPress={() => { setDescInput(description); setEditingDesc(true); }}
                    style={descStyles.editLinkWrap}
                  >
                    <Text style={descStyles.editLink}>{description ? "Edit" : "Add"}</Text>
                  </TouchableOpacity>
                )}
              </View>
              {editingDesc ? (
                <View style={descStyles.editCard}>
                  <TextInput
                    style={descStyles.input}
                    value={descInput}
                    onChangeText={(text) => { if (text.length <= descInput.length || text.length <= 100) setDescInput(text); }}
                    placeholder="Write something about yourself..."
                    placeholderTextColor="#aaa"
                    multiline
                    autoFocus
                    maxLength={100}
                  />
                  <Text style={[descStyles.charCount, descInput.length > 100 && { color: "#e53e3e" }]}>{descInput.length}/100</Text>
                  <View style={descStyles.btnRow}>
                    <TouchableOpacity style={descStyles.cancelBtn} onPress={() => setEditingDesc(false)}>
                      <Text style={descStyles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[descStyles.saveBtn, savingDesc && { opacity: 0.6 }]}
                      onPress={handleSaveDescription}
                      disabled={savingDesc}
                    >
                      <Text style={descStyles.saveText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={descStyles.descCard}>
                  <Text style={descStyles.descText}>
                    {description || `Hi, I am ${influencer?.influencerName || ""}${influencer?.category ? ` and I am a ${influencer.category} influencer` : ""}.`}
                  </Text>
                </View>
              )}
            </View>

            {(() => {
              const igTags = socialData?.instaData?.[0]?.tags?.map(t => processTag(t)).filter(Boolean) || [];
              const displayTags = hashtags.length > 0 ? hashtags : igTags;
              const hasAny = displayTags.length > 0;
              if (!hasAny && !isOwnProfile) return null;
              return (
                <View style={styles.averagePriceSection}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <Text style={styles.averagePriceHeaderText}>Frequently used hashtags</Text>
                    {isOwnProfile && !editingTags && (
                      <TouchableOpacity onPress={() => { setHashtags(displayTags); setEditingTags(true); }} style={descStyles.editLinkWrap}>
                        <Text style={descStyles.editLink}>{hasAny ? "Edit" : "Add"}</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {editingTags ? (
                    <View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.tagContainer, { paddingHorizontal: 0 }]}>
                        {hashtags.map((tag, index) => (
                          <View key={index} style={[styles.tagItem, { flexDirection: "row", alignItems: "center", gap: 4 }]}>
                            <Text style={styles.tagText}>#{tag}</Text>
                            <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                              <Text style={{ color: "#888", fontSize: 12, fontWeight: "700" }}>×</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </ScrollView>
                      <View style={{ marginTop: 10, marginBottom: 10 }}>
                        <View style={descStyles.addTagRow}>
                          <TextInput
                            style={descStyles.tagInput}
                            value={tagInput}
                            onChangeText={setTagInput}
                            placeholder="Add a hashtag..."
                            placeholderTextColor="#aaa"
                            onSubmitEditing={handleAddTag}
                            returnKeyType="done"
                          />
                          <TouchableOpacity style={descStyles.addTagBtn} onPress={handleAddTag}>
                            <Text style={descStyles.addTagBtnText}>Add</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={descStyles.btnRow}>
                          <TouchableOpacity style={descStyles.cancelBtn} onPress={() => setEditingTags(false)}>
                            <Text style={descStyles.cancelText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[descStyles.saveBtn, savingTags && { opacity: 0.6 }]}
                            onPress={handleSaveHashtags}
                            disabled={savingTags}
                          >
                            <Text style={descStyles.saveText}>{savingTags ? "Saving..." : "Save"}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ) : hasAny ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.tagContainer, { paddingHorizontal: 0 }]}>
                      {displayTags.map((tag, index) => (
                        <View key={index} style={styles.tagItem}>
                          <Text style={styles.tagText}>#{tag}</Text>
                        </View>
                      ))}
                    </ScrollView>
                  ) : (
                    <Text style={descStyles.descText}>No hashtags added yet.</Text>
                  )}
                </View>
              );
            })()}
            <View style={styles.nav}>
              {[
                { key: "instagram", label: "Instagram" },
                { key: "youtube",   label: "YouTube"   },
                { key: "facebook",  label: "Facebook"  },
              ].map(({ key, label }) => {
                const isSelected = tab === key;
                const textColor = isSelected ? "black" : "#637087";
                const otpVerified = influencer?.otpVerifiedAccounts || [];
                const unverified = influencer?.unverifiedAccounts || [];
                const otpVerifiable = key === "instagram" || key === "facebook";
                const hasData =
                  key === "instagram"
                    ? influencer?.instaData?.length > 0
                    : key === "youtube"
                    ? !!influencer?.ytChannelId // YT is only "verified" via OAuth (signup) → ytChannelId is set
                    : influencer?.fbData?.length > 0;

                let badgeType;
                if (key === "youtube") {
                  // YouTube is OAuth-only: verified → ✓ (ytChannelId set);
                  // otherwise a tappable "?" on the owner's profile to verify now.
                  badgeType = hasData ? "✓" : (isOwnProfile ? "?" : null);
                } else if (otpVerified.includes(key)) badgeType = "✓";
                else if (unverified.includes(key)) badgeType = otpVerifiable ? "?" : "!";
                else if (hasData) badgeType = "✓";
                else badgeType = otpVerifiable ? "?" : null;

                // "?" is tappable only on the owner's own profile.
                // IG/FB "?" opens the OTP modal; YouTube "?" launches OAuth.
                const canVerifyOtp = badgeType === "?" && isOwnProfile && otpVerifiable;
                const canVerifyYt = badgeType === "?" && isOwnProfile && key === "youtube";
                return (
                  <TouchableOpacity key={key} onPress={() => setTab(key)}>
                    <View style={[styles.navItems, { flexDirection: "row", alignItems: "center", gap: 3 }]}>
                      <Text style={[styles.navText, isSelected && styles.navSelectText]}>{label}</Text>
                      {badgeType && (
                        canVerifyOtp ? (
                          <TouchableOpacity
                            onPress={() => setVerifyModal({ visible: true, platform: key })}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <AnalyticsBadge symbol={badgeType} textColor={textColor} />
                          </TouchableOpacity>
                        ) : canVerifyYt ? (
                          <TouchableOpacity
                            onPress={() => setYtVerify({ visible: true, handle: "" })}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <AnalyticsBadge symbol={badgeType} textColor={textColor} />
                          </TouchableOpacity>
                        ) : (
                          <AnalyticsBadge symbol={badgeType} textColor={textColor} />
                        )
                      )}
                      {badgeType === "✓" && otpVerifiable && isOwnProfile && (
                        <TouchableOpacity
                          onPress={() =>
                            setFetchModal({
                              visible: true,
                              platform: key,
                              username:
                                key === "instagram"
                                  ? influencer?.instaProfile
                                  : influencer?.facebookProfile,
                            })
                          }
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: "700", color: textColor }}>↻</Text>
                        </TouchableOpacity>
                      )}
                      {key === "youtube" && isOwnProfile && !!influencer?.ytChannelId && (
                        <TouchableOpacity
                          onPress={handleYtRefresh}
                          disabled={ytRefreshing}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: "700", color: textColor }}>
                            {ytRefreshing ? "…" : "↻"}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            {tab === "instagram" ? (
              <>{instaData && <InstaStats instaData={instaData} />}</>
            ) : tab === "youtube" ? (
              <>{ytData && <YTStats ytData={ytData} />}</>
            ) : tab === "facebook" ? (
              <>{fbData && <FBStats fbData={fbData} />}</>
            ) : null}
            <View style={styles.depth1Frame4}>
              <View style={styles.depth2Frame02}>
                <View style={[styles.depth3Frame09, styles.depth3FramePosition]}>
                  <View style={styles.depth4Frame09}>
                    <View style={styles.depth5Frame0}>
                      <Text
                        style={[
                          styles.pastCollaborations,
                          styles.contactInfoTypo,
                        ]}
                      >
                        Collaborations
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
            {socialData &&
              (tab === "instagram" ? (
                <>{instaData && <IgGraph instaData={instaData} />}</>
              ) : tab === "youtube" ? (
                <>{ytData && <YTGraph ytData={ytData} />}</>
              ) : tab === "facebook" ? (
                <>{fbData && <FBGraph fbData={fbData} />}</>
              ) : null)}
            {/* AI Content Insights — influencer-only, per platform */}
            {isOwnProfile && socialData?.aiInsights?.[tab] && (
              <AiInsightsCard insights={socialData.aiInsights[tab]} platform={tab} />
            )}
            <View style={styles.recentContainer}>
              <Text style={styles.recentText}>Recent Highlights</Text>
            </View>
            <ScrollView
              style={styles.ScrollCards}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {popularPosts &&
                popularPosts.map((item, index) =>
                  item.platform == "Instagram" && tab == "instagram" ? (
                    <View key={index} style={[styles.frame, { width: CARD_WIDTH, height: IG_CARD_HEIGHT }]}>
                      <InstaDemo url={item.url} width={CARD_WIDTH} height={IG_CARD_HEIGHT} />
                    </View>
                  ) : item.platform == "YouTube" && tab == "youtube" ? (
                    <View key={index} style={[styles.frame, { width: CARD_WIDTH, height: YT_CARD_HEIGHT }]}>
                      <YTDemo videoId={item.url} width={CARD_WIDTH} height={YT_CARD_HEIGHT} />
                    </View>
                  ) : item.platform == "Facebook" && tab == "facebook" ? (
                    <View key={index} style={[styles.frame, { width: CARD_WIDTH }]}>
                      <FBDemo item={item} width={CARD_WIDTH} />
                    </View>
                  ) : null
                )}
            </ScrollView>
            <View style={styles.averagePriceSection}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <Text style={styles.averagePriceHeaderText}>Average Price Per Post</Text>
                {isOwnProfile && !editingPrice && (
                  <TouchableOpacity
                    onPress={() => {
                      setPriceInput({
                        ig: (influencer?.price?.[0]?.ig || "").toString(),
                        yt: (influencer?.price?.[0]?.yt || "").toString(),
                        fb: (influencer?.price?.[0]?.fb || "").toString(),
                        tr: (influencer?.price?.[0]?.tr || "").toString(),
                      });
                      setEditingPrice(true);
                    }}
                    style={descStyles.editLinkWrap}
                  >
                    <Text style={descStyles.editLink}>{influencer?.price?.[0]?.ig || influencer?.price?.[0]?.yt || influencer?.price?.[0]?.fb ? "Edit" : "Add"}</Text>
                  </TouchableOpacity>
                )}
              </View>
              {editingPrice ? (
                <View style={descStyles.editCard}>
                  {[
                    { label: "Instagram (₹)", key: "ig" },
                    { label: "YouTube (₹)", key: "yt" },
                    { label: "Facebook (₹)", key: "fb" },
                  ].map(({ label, key }) => (
                    <View key={key} style={{ marginBottom: 10 }}>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 4 }}>{label}</Text>
                      <TextInput
                        style={[descStyles.input, { minHeight: 44, paddingVertical: 10 }]}
                        value={priceInput[key]}
                        onChangeText={(text) => setPriceInput(prev => ({ ...prev, [key]: text }))}
                        keyboardType="numeric"
                        placeholder="Enter amount"
                        placeholderTextColor="#aaa"
                      />
                    </View>
                  ))}
                  <View style={descStyles.btnRow}>
                    <TouchableOpacity style={descStyles.cancelBtn} onPress={() => setEditingPrice(false)}>
                      <Text style={descStyles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[descStyles.saveBtn, savingPrice && { opacity: 0.6 }]}
                      onPress={handleSavePrice}
                      disabled={savingPrice}
                    >
                      <Text style={descStyles.saveText}>{savingPrice ? "Saving..." : "Save"}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <AveragePrice platform="Instagram" price={influencer?.price?.[0]?.ig ? `₹ ${influencer.price[0].ig}` : "Add your price"} />
                  <AveragePrice platform="YouTube" price={influencer?.price?.[0]?.yt ? `₹ ${influencer.price[0].yt}` : "Add your price"} />
                  <AveragePrice platform="Facebook" price={influencer?.price?.[0]?.fb ? `₹ ${influencer.price[0].fb}` : "Add your price"} />
                </>
              )}
            </View>
            {idType=="brand"?<View style={styles.connectContainer}>
              <TouchableOpacity onPress={()=> handleConnect()}>
                <View style={styles.connectButton}>
                  <Text style={styles.connectText}>{`Connect with ${influencer?.userName}`}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setRoiModalVisible(true)} style={roiStyles.roiButton}>
                <Text style={roiStyles.roiButtonText}>🎯 Predict ROI</Text>
              </TouchableOpacity>
            </View>:null}

            {/* ROI Predictor Modal */}
            <Modal visible={roiModalVisible} transparent animationType="slide" onRequestClose={resetROIModal}>
              <Pressable style={roiStyles.overlay} onPress={resetROIModal}>
                <Pressable style={roiStyles.sheet} onPress={() => setShowProductDropdown(false)}>
                  <View style={roiStyles.handle} />
                  <Text style={roiStyles.title}>🎯 Predict ROI</Text>

                  {!roiResult ? (
                    <>
                      {/* Budget */}
                      <Text style={roiStyles.label}>Your Budget (₹)</Text>
                      <TextInput
                        style={roiStyles.input}
                        value={roiBudget}
                        onChangeText={setRoiBudget}
                        keyboardType="numeric"
                        placeholder="e.g. 50000"
                        placeholderTextColor="#aaa"
                      />

                      {/* Product Type */}
                      <Text style={roiStyles.label}>Your Product Type</Text>
                      <Pressable style={roiStyles.input} onPress={(e) => { e.stopPropagation(); setShowProductDropdown(!showProductDropdown) }}>
                        <Text style={{ color: "#000" }}>{productTypes.find(p => p.value === roiProductType)?.label}</Text>
                        <Text style={{ color: "#aaa" }}>▼</Text>
                      </Pressable>
                      {showProductDropdown && (
                        <View style={roiStyles.dropdown}>
                          {productTypes.map(p => (
                            <Pressable key={p.value} style={roiStyles.dropdownItem} onPress={() => { setRoiProductType(p.value); setShowProductDropdown(false) }}>
                              <Text style={[roiStyles.dropdownText, roiProductType === p.value && { color: "#1A5CE5", fontWeight: "700" }]}>{p.label}</Text>
                            </Pressable>
                          ))}
                        </View>
                      )}

                      {/* Platform */}
                      <Text style={roiStyles.label}>Platform</Text>
                      <View style={roiStyles.platformRow}>
                        {["instagram", "youtube", "facebook"].map(p => (
                          <Pressable key={p} style={[roiStyles.platformChip, roiPlatform === p && roiStyles.platformChipActive]} onPress={() => setRoiPlatform(p)}>
                            <Text style={[roiStyles.platformChipText, roiPlatform === p && roiStyles.platformChipTextActive]}>
                              {p.charAt(0).toUpperCase() + p.slice(1)}
                            </Text>
                          </Pressable>
                        ))}
                      </View>

                      <TouchableOpacity style={roiStyles.calcButton} onPress={calculateROI}>
                        <Text style={roiStyles.calcButtonText}>Calculate ROI</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <View style={roiStyles.resultCard}>
                        <View style={roiStyles.scoreRow}>
                          <Text style={roiStyles.scoreLabel}>ROI Score</Text>
                          <Text style={roiStyles.scoreValue}>⭐ {roiResult.roiScore} / 10</Text>
                        </View>
                        <View style={roiStyles.divider} />
                        {[
                          { label: "Posts Affordable", value: roiResult.postsAffordable },
                          { label: "Est. Reach", value: formatROINum(roiResult.totalReach) },
                          { label: "Est. Impressions", value: formatROINum(roiResult.totalImpressions) },
                          { label: "Est. Conversions", value: formatROINum(roiResult.conversions) },
                          { label: "Cost per Reach", value: roiResult.costPerReach !== "N/A" ? `₹${roiResult.costPerReach}` : "N/A" },
                          { label: "Cost per Conversion", value: roiResult.costPerConversion !== "N/A" ? `₹${roiResult.costPerConversion}` : "N/A" },
                        ].map(({ label, value }) => (
                          <View key={label} style={roiStyles.resultRow}>
                            <Text style={roiStyles.resultLabel}>{label}</Text>
                            <Text style={roiStyles.resultValue}>{value}</Text>
                          </View>
                        ))}
                        <View style={roiStyles.divider} />
                        <Text style={roiStyles.justification}>{roiResult.justification}</Text>
                      </View>
                      <View style={roiStyles.resultActions}>
                        <TouchableOpacity style={roiStyles.recalcButton} onPress={() => setRoiResult(null)}>
                          <Text style={roiStyles.recalcText}>Recalculate</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={roiStyles.closeButton} onPress={resetROIModal}>
                          <Text style={roiStyles.calcButtonText}>Close</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </Pressable>
              </Pressable>
            </Modal>
          </View>
        </View>
      </ScrollView>
      <VerifySocialModal
        visible={verifyModal.visible}
        platform={verifyModal.platform}
        influencerId={myOwnId}
        showAlert={showAlert}
        onClose={() => setVerifyModal({ visible: false, platform: null })}
      />
      <FetchStatsModal
        visible={fetchModal.visible}
        platform={fetchModal.platform}
        username={fetchModal.username}
        influencerId={myOwnId}
        showAlert={showAlert}
        onSuccess={reloadSocial}
        onClose={() => setFetchModal({ visible: false, platform: null, username: "" })}
      />
      {/* YouTube verify — enter channel handle, then Google OAuth (like signup) */}
      <Modal visible={ytVerify.visible} transparent animationType="fade" onRequestClose={() => setYtVerify({ visible: false, handle: "" })}>
        <View style={ytModalStyles.overlay}>
          <View style={ytModalStyles.card}>
            <Text style={ytModalStyles.title}>Verify YouTube</Text>
            <Text style={ytModalStyles.body}>
              Enter your YouTube channel handle, then sign in with the Google account that owns it.
            </Text>
            <TextInput
              style={ytModalStyles.input}
              value={ytVerify.handle}
              onChangeText={(t) => setYtVerify((s) => ({ ...s, handle: t }))}
              placeholder="@yourchannel"
              placeholderTextColor="#9aa3b2"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!ytVerifying}
            />
            <TouchableOpacity
              style={[ytModalStyles.primaryBtn, ytVerifying && { opacity: 0.6 }]}
              onPress={handleYtVerify}
              disabled={ytVerifying}
            >
              <Text style={ytModalStyles.primaryBtnText}>{ytVerifying ? "Verifying…" : "Verify with Google"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setYtVerify({ visible: false, handle: "" })} disabled={ytVerifying}>
              <Text style={ytModalStyles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const ytModalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  card: { width: "100%", maxWidth: 360, backgroundColor: "#fff", borderRadius: 16, padding: 22 },
  title: { fontSize: 18, fontWeight: "700", color: "#1c1c1e", marginBottom: 8 },
  body: { fontSize: 14, lineHeight: 20, color: "#637087", marginBottom: 16 },
  input: { borderWidth: 1, borderColor: "#E1E4EA", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#1c1c1e", marginBottom: 16 },
  primaryBtn: { backgroundColor: "#1A80E5", borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  cancel: { textAlign: "center", color: "#9aa3b2", fontSize: 14, marginTop: 14 },
});

const styles = StyleSheet.create(AnalyticsStyles);

const descStyles = StyleSheet.create({
  descCard: {
    backgroundColor: "#F0F2F5",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  descText: {
    fontSize: 14,
    color: "#4A739C",
    lineHeight: 20,
    flex: 1,
  },
  editLinkWrap: {
    marginLeft: 10,
    paddingTop: 2,
  },
  editLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A5CE5",
  },
  addPrompt: {
    backgroundColor: "#F0F2F5",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  addPromptText: {
    fontSize: 14,
    color: "#1A5CE5",
    fontWeight: "600",
  },
  editCard: {
    backgroundColor: "#F0F2F5",
    borderRadius: 8,
    padding: 12,
  },
  input: {
    fontSize: 14,
    color: "#111",
    minHeight: 80,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  charCount: {
    fontSize: 11,
    color: "#aaa",
    textAlign: "right",
    marginBottom: 8,
  },
  btnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
  },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#111",
  },
  saveText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  addTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#fff",
    color: "#111",
  },
  addTagBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#111",
  },
  addTagBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
});

const roiStyles = StyleSheet.create({
  roiButton: {
    marginTop: 10,
    borderWidth: 2,
    borderColor: "#1A5CE5",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  roiButtonText: {
    color: "#1A5CE5",
    fontWeight: "700",
    fontSize: 15,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#000",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#fff",
    marginTop: 4,
    zIndex: 999,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownText: {
    fontSize: 14,
    color: "#333",
  },
  platformRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
  platformChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#ddd",
    alignItems: "center",
  },
  platformChipActive: {
    backgroundColor: "#1A5CE5",
    borderColor: "#1A5CE5",
  },
  platformChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
  },
  platformChipTextActive: {
    color: "#fff",
  },
  calcButton: {
    marginTop: 20,
    backgroundColor: "#1A5CE5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  calcButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  resultCard: {
    backgroundColor: "#f7f9ff",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e0e8ff",
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A5CE5",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e8ff",
    marginVertical: 10,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  resultLabel: {
    fontSize: 13,
    color: "#555",
  },
  resultValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111",
  },
  justification: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
    marginTop: 4,
    fontStyle: "italic",
  },
  resultActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  recalcButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#1A5CE5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  closeButton: {
    flex: 1,
    backgroundColor: "#1A5CE5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  recalcText: {
    color: "#1A5CE5",
    fontWeight: "700",
    fontSize: 15,
  },
})

export default Analytics;
