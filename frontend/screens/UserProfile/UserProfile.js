import * as React from "react";
import { Image } from "expo-image";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import Loader from '../../shared/Loader'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { useTheme } from "../../util/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import ImageWithFallback from "../../util/ImageWithFallback";
import ThemeToggle from "../../shared/ThemeToggle";

// Desktop-only top navigation (mirrors the mobile floating bottom bar routes).
const NAV_ITEMS = [
  { key: "list", label: "Influencers", icon: "search", route: "InfluencersList" },
  { key: "partnership", label: "Brands", icon: "briefcase", route: "BrandsAssosciated" },
  { key: "settings", label: "Settings", icon: "settings-sharp", route: "AdminPanel" },
  { key: "network", label: "Collabs", icon: "people", route: "CollabPost" },
  { key: "profile", label: "Profile", icon: "person-circle", route: "Analytics" },
];

const ProfileTopNav = ({ navigation, theme, isDark, toggleTheme, avatar, isSelectedImage }) => {
  const active = "profile"; // this screen is the Profile tab
  return (
    <View style={[styles.topNav, { backgroundColor: theme.headerBg, borderColor: theme.headerBorder }]}>
      <View style={styles.topNavInner}>
        {/* Left: brand */}
        <View style={styles.navLeft}>
          <Text style={[styles.brandPink, { color: theme.text }]}>Influmart</Text>
        </View>

        {/* Center: nav links */}
        <View style={styles.navCenter}>
          {NAV_ITEMS.map((it) => (
            <TouchableOpacity
              key={it.key}
              style={styles.topNavItem}
              onPress={() => navigation.navigate(it.route, it.key === "network" ? { navigation } : undefined)}
            >
              <Text style={[styles.topNavLabel, { color: theme.subText }]}>{it.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Right: theme toggle + account avatar */}
        <View style={styles.navRight}>
          <TouchableOpacity onPress={() => navigation.navigate("Analytics")}>
            <LinearGradient colors={["#ec4899", "#7c3aed"]} style={styles.navAvatarRing}>
              <View style={[styles.navAvatarInner, { backgroundColor: theme.headerBg }]}>
                {avatar ? (
                  <ImageWithFallback imageStyle={styles.navAvatarImg} image={avatar} isSelectedImage={isSelectedImage} />
                ) : (
                  <Ionicons name="person" size={18} color={theme.subText} />
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
import Depth1Frame7 from "../../components/Depth1Frame7";
import Depth1Frame17 from "../../components/Depth1Frame17";
import Depth1Frame16 from "../../components/Depth1Frame16";
import Depth1Frame15 from "../../components/Depth1Frame15";
import Depth1Frame14 from "../../components/Depth1Frame14";
import Depth1Frame13 from "../../components/Depth1Frame13";
import { Color, Padding, FontSize, FontFamily } from "../../GlobalStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GetInfluencerProfile } from "../../controller/InfluencerController";
import { useAlert } from "../../util/AlertContext";
import NavTab from "./NavTab";
import VerifySocialModal from "./VerifySocialModal";
import ProfileAnalytics from "./ProfileAnalytics";
import { formatNumber } from "../../helpers/GraphData";
import { getAllRequests, updateRequestStatus } from "../../controller/connectionsController";
import { StatusTabs, statusLabel } from "../../shared/CollabStatus";
import ProductCard from "./ProductCard";

// Average across the real months (ignore zero/empty months). Matches the
// "Avg … Over Time" headline logic in the analytics graphs so the profile
// cards and the graphs show the same number.
const avgOf = (arr) => {
  const vals = (arr || []).filter((v) => typeof v === "number" && v > 0);
  return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
};

// Turn API age keys ("30_35", "45_100") into readable labels ("30–35", "45+").
const AGE_LABELS = {
  "0_18": "Under 18",
  "18_21": "18–21",
  "21_24": "21–24",
  "24_27": "24–27",
  "27_30": "27–30",
  "30_35": "30–35",
  "35_45": "35–45",
  "45_100": "45+",
};
const ageLabel = (raw) => AGE_LABELS[raw] || (raw ? String(raw).replace(/_/g, "–") : "");

// Reachability = how many people each follower can themselves reach (how
// influential the audience is). Plain-language labels instead of API codes.
const REACH_LABELS = {
  r0_500: "🔴 Low reach — each reaches under 500 people",
  r500_1000: "🟡 Moderate reach — each reaches 500–1,000",
  r1000_1500: "🟢 Good reach — each reaches 1,000–1,500",
  r1500_plus: "🔥 High reach — each reaches 1,500+ people",
};

// "new-york-city" → "New York City", "moscow" → "Moscow".
const cityLabel = (raw) =>
  raw
    ? String(raw)
        .split(/[-_]/)
        .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
        .join(" ")
    : "";

const UserProfile = ({ navigation }) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { width: winWidth } = useWindowDimensions();
  const isDesktop = winWidth >= 900;
  const [influencer, setInfluencer] = React.useState(null);
  const [influencerId, setInfluencerId] = React.useState("");
  const { showAlert } = useAlert();
  const [tab, setTab] = React.useState("instagram");
  const [fbData, setFbData] = React.useState(null);
  const [instaData, setInstaData] = React.useState(null);
  const [ytData, setYtData] = React.useState(null);
  const [requests, setRequests] = React.useState([]);
  const [statusFilter, setStatusFilter] = React.useState("pending");
  const isFocused = useIsFocused();

  // Counts per pipeline status for the tab badges.
  const statusCounts = React.useMemo(() => {
    const c = {};
    (requests || []).forEach((r) => { const k = r.status || "pending"; c[k] = (c[k] || 0) + 1; });
    return c;
  }, [requests]);
  const visibleRequests = React.useMemo(
    () => (requests || []).filter((r) => (r.status || "pending") === statusFilter),
    [requests, statusFilter]
  );

  // Move a request to a new status, then refresh the board.
  const handleStatusChange = async (requestId, status) => {
    setRequests((prev) => prev.map((r) => (r.requestId === requestId ? { ...r, status } : r)));
    await updateRequestStatus(requestId, status, showAlert);
    if (influencerId) getAllRequests(influencerId, setRequests, showAlert);
  };
  const[loading,setLoading]=React.useState(false)
  const [verifyModal, setVerifyModal] = React.useState({ visible: false, platform: null });
  React.useEffect(() => {
    const getData = async () => {
      const id = await AsyncStorage.getItem("influencerId");
      if (!id) {
        navigation.navigate("Homepage");
      } else {
        if(id == "undefined"){
          navigation.navigate("BrandorInfluencer");
          return;
        }
        setLoading(true)
        setInfluencerId(id);
        GetInfluencerProfile(id, setInfluencer, showAlert);
        await getAllRequests(id, setRequests, showAlert)
        setLoading(false)
      }
    };
    getData();
  }, [isFocused]);
  React.useEffect(() => {
    if (influencer) {
      const fb = influencer.fbData;
      const insta = influencer.instaData;
      const yt = influencer.ytData;
      if (fb) {
        // fbData is now a real 6-month series; the profile card shows current
        // stats, so read the latest snapshot (not the oldest fb[0]).
        const fbLatest = fb[fb.length - 1] || {};
        // "Avg …" cards = 10-month average (matches the graphs). Followers = latest.
        const fbAvg = (k) => avgOf(fb.map((m) => m?.[k]));
        let _fb = [
          {
            heading: "Followers",
            content: fbLatest?.followers ? formatNumber(fbLatest?.followers) : "N/A",
          },
          {
            heading: "Avg Post Reactions",
            content: fbAvg("avgPostReactions") ? formatNumber(fbAvg("avgPostReactions")) : "N/A",
          },
          {
            heading: "Avg Post Comments",
            content: fbAvg("avgPostComments") ? formatNumber(fbAvg("avgPostComments")) : "N/A",
          },
          {
            heading: "Avg Post Shares",
            content: fbAvg("avgPostShares") ? formatNumber(fbAvg("avgPostShares")) : "N/A",
          },
          {
            heading: "Avg Reel Reactions",
            content: fbAvg("avgReelReactions") ? formatNumber(fbAvg("avgReelReactions")) : "N/A",
          },
          {
            heading: "Avg Reel Comments",
            content: fbAvg("avgReelComments") ? formatNumber(fbAvg("avgReelComments")) : "N/A",
          },
          {
            heading: "Avg Reel Shares",
            content: fbAvg("avgReelShares") ? formatNumber(fbAvg("avgReelShares")) : "N/A",
          },
          {
            heading: "Avg Reel Play Count",
            content: fbAvg("avgReelPlayCount") ? formatNumber(fbAvg("avgReelPlayCount")) : "N/A",
          },
          {
            heading: "Avg Engagement Rate",
            content: fbAvg("avgER")
              ? `${(fbAvg("avgER") * 100).toFixed(2)} %`
              : "N/A",
          },
          {
            heading: "Price per Post",
            content: influencer?.price[0]?.fb
              ? `₹ ${formatNumber(influencer?.price[0]?.fb)}`
              : "N/A",
          },
        ];
        setFbData(_fb);
      }
      if (insta) {
        // Read the latest snapshot (last element) so numbers match the header
        // and analytics; instaData is a multi-month series ([0] is the oldest).
        const igLatest = insta[insta.length - 1] || {};
        // "Avg …" cards = 10-month average (matches the graphs). Followers = latest.
        const igAvg = (k) => avgOf(insta.map((m) => m?.[k]));
        let _insta = [
          {
            heading: "Followers",
            content: igLatest?.followers
              ? formatNumber(igLatest?.followers)
              : "N/A",
          },
          {
            heading: "Avg Comments",
            content: igAvg("avgComments")
              ? formatNumber(igAvg("avgComments"))
              : "N/A",
          },
          {
            heading: "Avg Likes",
            content: igAvg("avgLikes")
              ? formatNumber(igAvg("avgLikes"))
              : "N/A",
          },
          {
            heading: "Avg ER",
            content: igAvg("avgER")
              ? `${(igAvg("avgER") * 100).toFixed(2)} %`
              : "N/A",
          },
          {
            heading: "Avg Interactions",
            content: igAvg("avgInteractions")
              ? formatNumber(igAvg("avgInteractions"))
              : "N/A",
          },
          {
            heading: "Audience Reach",
            content: {
              bullet: igLatest?.membersReachability?.map((item) => ({
                content: `${REACH_LABELS[item?.name] || item?.name} — ${(parseFloat(item?.percent) * 100).toFixed(1)}% of audience`,
              })),
            },
          },
          {
            heading: "Top Audience Cities",
            content: {
              // Top 10 only; each % is that city's share of the whole audience
              // (hundreds of cities exist, so these won't sum to 100%).
              bullet: igLatest?.memberCities?.slice(0, 10).map((item) => ({
                content: `${cityLabel(item?.category || item?.city)} — ${parseFloat(item?.percent ?? item?.value * 100).toFixed(1)}% of audience`,
              })),
            },
          },
          {
            heading: "Audience Age Groups",
            content: {
              // Readable label + % of audience. `percent` is a fraction → ×100.
              bullet: igLatest?.ages?.map((item) => ({
                content: `${ageLabel(item?.range || item?.name)} yrs — ${(parseFloat(item?.percent) * 100).toFixed(1)}% of audience`,
              })),
            },
          },
          {
            heading: "Gender",
            // artemlipko returns genders as an array [{name:"m"/"f", percent}]
            // with percent as a fraction. Map it and ×100.
            content: (() => {
              const g = igLatest?.genders;
              if (Array.isArray(g) && g.length) {
                const pct = (n) => ((g.find((x) => x?.name === n)?.percent || 0) * 100).toFixed(1);
                return `Female ${pct("f")}%  |  Male ${pct("m")}%`;
              }
              // fallback for the old {female, male} shape
              if (g && (g.female != null || g.male != null)) {
                return `Female ${parseFloat(g.female || 0).toFixed(1)}%  |  Male ${parseFloat(g.male || 0).toFixed(1)}%`;
              }
              return "N/A";
            })(),
          },
          {
            heading: "Price per Post",
            content: `₹ ${influencer?.price[0]?.ig
              ? formatNumber(influencer?.price[0]?.ig)
              : "N/A"
              }`,
          },
        ];
        setInstaData(_insta);
      }
      {
        let _yt = [
          {
            heading: "Total Views",
            content: yt?.overAll?.totalViews != null
              ? formatNumber(yt.overAll.totalViews)
              : "N/A",
          },
          {
            heading: "Total Watch Time",
            content: yt?.overAll?.totalWatchTime != null
              ? formatNumber(yt.overAll.totalWatchTime)
              : "N/A",
          },
          {
            heading: "Total Likes",
            content: yt?.overAll?.totalLikes != null
              ? formatNumber(yt.overAll.totalLikes)
              : "N/A",
          },
          {
            heading: "Total Comments",
            content: yt?.overAll?.totalComments != null
              ? formatNumber(yt.overAll.totalComments)
              : "N/A",
          },
          {
            heading: "Total Shares",
            content: yt?.overAll?.totalShares != null
              ? formatNumber(yt.overAll.totalShares)
              : "N/A",
          },
          {
            heading: "Subscriber Gain",
            content: yt?.overAll?.totalSubscribersGained != null
              ? formatNumber(yt.overAll.totalSubscribersGained)
              : "N/A",
          },
          {
            heading: "Subscriber Lost",
            content: yt?.overAll?.totalSubscribersLost != null
              ? formatNumber(yt.overAll.totalSubscribersLost)
              : "N/A",
          },
          {
            heading: "Engagement Rate",
            content: yt?.overAll?.engagementRate != null
              ? `${formatNumber(yt.overAll.engagementRate)}`
              : "N/A",
          },
          {
            heading: "Price per Video",
            content: influencer?.price[0]?.yt
              ? formatNumber(influencer?.price[0]?.yt)
              : "N/A",
          },
        ];
        setYtData(_yt);
      }
    }
  }, [influencer]);
  // ── Reusable content blocks (shared by mobile + desktop layouts) ──
  const profileCard = influencer ? (
    <Depth1Frame17
      image={influencer?.profileUrl}
      username={influencer?.influencerName}
      category={influencer?.category}
      isSelectedImage={influencer.isSelectedImage}
      instaFollowers={influencer?.instaData?.[influencer.instaData.length - 1]?.followers}
      ytFollowers={influencer?.ytData?.overAll?.subscriberCount}
      fbFollowers={influencer?.fbData?.[influencer.fbData.length - 1]?.followers}
      isDesktop={isDesktop}
      showDashboard
    />
  ) : null;

  const collabRequests = (
    <View style={styles.blockGap}>
      <View style={[styles.depth1Frame2, styles.depth1FrameSpaceBlock]}>
        <Text style={[styles.collaborationRequests, { color: theme.text }]}>
          Collaboration Requests{requests && requests.length > 0 ? ` (${requests.length > 100 ? "100+" : requests.length})` : ""}
        </Text>
      </View>
      <StatusTabs active={statusFilter} onChange={setStatusFilter} counts={statusCounts} />
      {visibleRequests.length > 0 ? (
        <ScrollView
          style={{ flexGrow: 0, maxHeight: isDesktop ? 460 : 320, paddingHorizontal: Padding.p_base }}
          contentContainerStyle={{ flexGrow: 0 }}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}
        >
          {visibleRequests.map((item, index) => (
            <ProductCard
              key={index}
              imageSource={item?.imageSource}
              postTitle={item?.postTitle}
              postDate={item?.postDate}
              isSelectedImage={item?.isSelectedImage}
              productName={item?.productName}
              id={item?.requestId}
              status={item?.status}
              onStatusChange={handleStatusChange}
              cardWidth="100%"
              postTitleWidth="auto"
              postDateWidth="auto"
              productNameWidth="90%"
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

  const analytics = (
    <View style={styles.blockGap}>
      <NavTab
        setTab={setTab}
        tab={tab}
        influencer={influencer}
        onVerifyPress={(platform) => setVerifyModal({ visible: true, platform })}
      />
      <ProfileAnalytics
        influencer={influencer}
        tab={tab}
        statItems={tab == "instagram" ? instaData : tab == "youtube" ? ytData : fbData}
      />
    </View>
  );

  return (
    <View style={[styles.userprofile, { backgroundColor: theme.bg }]}>
      {loading&&<Loader loading={loading}/>}
      {isDesktop ? (
        <ProfileTopNav navigation={navigation} theme={theme} isDark={isDark} toggleTheme={toggleTheme} avatar={influencer?.profileUrl} isSelectedImage={influencer?.isSelectedImage} />
      ) : (
        <Depth1Frame7
          requestDetails="User Profile"
          depth3Frame0BackgroundColor={theme.headerBg}
          requestDetailsWidth="auto"
          depth4Frame0FontFamily="BeVietnamPro-Bold"
          depth4Frame0Color={theme.text}
          iconTintColor={theme.iconTint}
        />
      )}
      <ScrollView contentContainerStyle={{ paddingBottom: 100, alignItems: "center" }}>
        <View style={[styles.contentCol, { maxWidth: isDesktop ? 1500 : 560 }]}>
          {isDesktop ? (
            // Website view: full-height left sidebar panel + content column.
            <View style={styles.desktopRow}>
              <View style={[styles.desktopLeft, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                {/* Soft pink glow banner at the top of the sidebar. */}
                <LinearGradient
                  colors={["rgba(236,72,153,0.16)", "rgba(124,58,237,0.06)", "rgba(0,0,0,0)"]}
                  style={styles.sidebarGlow}
                  pointerEvents="none"
                />
                {profileCard}
              </View>
              <View style={styles.desktopRight}>
                {collabRequests}
                {analytics}
              </View>
            </View>
          ) : (
            // App view: single stacked column.
            <View style={{ width: "100%" }}>
              {profileCard}
              {collabRequests}
              {analytics}
            </View>
          )}
          <View style={styles.depth1Frame9} />
        </View>
      </ScrollView>
      {!isDesktop && <Depth1Frame13 active={"list"}/>}
      <ThemeToggle />
      <VerifySocialModal
        visible={verifyModal.visible}
        platform={verifyModal.platform}
        influencerId={influencerId}
        showAlert={showAlert}
        onClose={() => setVerifyModal({ visible: false, platform: null })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
  },
  // Desktop top navigation.
  topNav: {
    width: "100%",
    borderBottomWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  topNavInner: {
    width: "100%",
    maxWidth: 1500,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
  },
  // Three equal sections so the center links stay centered regardless of the
  // left/right widths (Influencity layout).
  navLeft: { flex: 1, alignItems: "flex-start" },
  navCenter: { flexDirection: "row", alignItems: "center", gap: 34 },
  navRight: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 12 },
  brandPink: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: FontFamily.lexendBold,
    letterSpacing: -0.4,
  },
  topNavItem: {
    alignItems: "center",
  },
  topNavLabel: {
    fontSize: 14,
    fontFamily: FontFamily.lexendMedium,
  },
  navActiveBar: {
    marginTop: 6,
    height: 3,
    width: "100%",
    borderRadius: 2,
    backgroundColor: "#ec4899",
  },
  themeToggle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerToggle: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  navAvatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  navAvatarInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  navAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  // Centered content column — caps width on desktop so the page reads as a
  // website; full-width on mobile (app view).
  contentCol: {
    width: "100%",
    alignSelf: "center",
  },
  desktopRow: {
    flexDirection: "row",
    // Stretch so the left sidebar panel matches the right column's height.
    alignItems: "stretch",
    width: "100%",
  },
  desktopLeft: {
    width: 340,
    flexShrink: 0,
    borderRightWidth: 1,
    // Feels like a full-height panel even when its own content is short.
    minHeight: 640,
    overflow: "hidden",
  },
  sidebarGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  desktopRight: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 28,
  },
  blockGap: {
    width: "100%",
    marginTop: 8,
  },
  depth1FrameSpaceBlock: {
    paddingHorizontal: Padding.p_base,
    width: "100%",
  },
  frameFlexBox: {
    justifyContent: "space-between",
    height: 48,
    alignItems: "center",
    flexDirection: "row",
  },
  frameLayout: {
    width: 48,
    height: 48,
  },
  depth4Frame0: {
    width: 24,
    height: 24,
  },
  depth3Frame0: {
    alignItems: "center",
    width: 48,
    flexDirection: "row",
  },
  depth5Frame0: {
    justifyContent: "flex-end",
    alignItems: "center",
    width: 48,
  },
  depth4Frame01: {
    flexDirection: "row",
  },
  depth3Frame1: {
    width: 310,
    paddingLeft: Padding.p_243xl,
  },
  depth2Frame0: {
    width: 358,
  },
  depth1Frame0: {
    height: 72,
    paddingTop: Padding.p_base,
    paddingBottom: Padding.p_5xs,
    backgroundColor: Color.colorBlack,
    paddingHorizontal: Padding.p_base,
  },
  collaborationRequests: {
    fontSize: FontSize.size_3xl,
    letterSpacing: 0,
    lineHeight: 28,
    fontWeight: "700",
    fontFamily: FontFamily.beVietnamProBold,
    textAlign: "left",
  },
  depth1Frame2: {
    paddingTop: Padding.p_xl,
    paddingBottom: Padding.p_xs,
    flexDirection: "row",
  },
  depth1Frame9: {
    height: 20,
  },
  userprofile: {
    flex: 1,
    width: "100%",
    height: "100%"
  },
});

export default UserProfile;
