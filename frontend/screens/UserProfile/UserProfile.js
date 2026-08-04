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
} from "react-native";
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
import DropdownComponent from "./DropDownComponent";
import { formatNumber } from "../../helpers/GraphData";
import { getAllRequests } from "../../controller/connectionsController";
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
  const [influencer, setInfluencer] = React.useState(null);
  const [influencerId, setInfluencerId] = React.useState("");
  const { showAlert } = useAlert();
  const [tab, setTab] = React.useState("instagram");
  const [fbData, setFbData] = React.useState(null);
  const [instaData, setInstaData] = React.useState(null);
  const [ytData, setYtData] = React.useState(null);
  const [requests, setRequests] = React.useState([]);
  const isFocused = useIsFocused();
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
  return (
    <View style={styles.userprofile}>
      {loading&&<Loader loading={loading}/>}
      <Depth1Frame7
        depth4Frame0={require("../../assets/depth-4-frame-010.png")}
        requestDetails="User Profile"
        depth3Frame0BackgroundColor="#000"
        requestDetailsWidth="auto"
        depth4Frame0FontFamily="BeVietnamPro-Bold"
        depth4Frame0Color="#fff"
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={[styles.depth0Frame0, styles.frameLayout1]}>
          {influencer &&<Depth1Frame17
            image={influencer?.profileUrl}
            username={influencer?.influencerName}
            category={influencer?.category}
            isSelectedImage={influencer.isSelectedImage}
            instaFollowers={influencer?.instaData?.[influencer.instaData.length - 1]?.followers}
            ytFollowers={influencer?.ytData?.overAll?.subscriberCount}
            fbFollowers={influencer?.fbData?.[influencer.fbData.length - 1]?.followers}
          />}
          <View style={[styles.depth1Frame2, styles.depth1FrameSpaceBlock]}>
            <View style={styles.depth2Frame01}>
              <View style={styles.depth3Frame01}>
                <Text style={styles.collaborationRequests}>
                  Collaboration Requests{requests && requests.length > 0 ? ` (${requests.length > 100 ? "100+" : requests.length})` : ""}
                </Text>
              </View>
            </View>
          </View>
          {
            requests && requests.length > 0 ?
              <ScrollView
                style={{ flexGrow: 0, maxHeight: 320 }}
                contentContainerStyle={{ flexGrow: 0 }}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={false}
              >
                {requests?.map((item, index) => (
                  <ProductCard
                    key={index}
                    imageSource={item?.imageSource}
                    postTitle={item?.postTitle}
                    postDate={item?.postDate}
                    isSelectedImage={item?.isSelectedImage}
                    productName={item?.productName}
                    id={item?.requestId}
                    cardWidth="100%"
                    postTitleWidth="auto"
                    postDateWidth="auto"
                    productNameWidth="90%"
                    buttonWidth="auto"
                  />
                ))}
              </ScrollView> :
              <View style={{width:"100%",padding:Padding.p_base}}>
                  <Text style={{color:Color.colorAliceblue}}>No request found.</Text>
              </View>
          }

          <NavTab
            setTab={setTab}
            tab={tab}
            influencer={influencer}
            onVerifyPress={(platform) => setVerifyModal({ visible: true, platform })}
          />
          <ScrollView style={{ flex: 1, paddingHorizontal: Padding.p_base }} showsVerticalScrollIndicator={false}>
            {tab == "instagram"
              ? instaData &&
              instaData.map((item, index) => (
                <DropdownComponent
                  title={item.heading}
                  content={item.content}
                  key={index}
                />
              ))
              : tab == "youtube"
                ? ytData &&
                ytData.map((item, index) => (
                  <DropdownComponent
                    title={item.heading}
                    content={item.content}
                    key={index}
                  />
                ))
                : fbData &&
                fbData.map((item, index) => (
                  <DropdownComponent
                    title={item.heading}
                    content={item.content}
                    key={index}
                  />
                ))}
          </ScrollView>
          <View style={[styles.depth1Frame9, styles.frameLayout1]} />
        </View>
      </ScrollView>
      <Depth1Frame13 active={"list"}/>
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
  frameLayout1: {
    width: "100%",
    backgroundColor: Color.colorBlack,
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
    color: Color.colorWhite,
    textAlign: "left",
  },
  depth3Frame01: {
    alignSelf: "stretch",
  },
  depth2Frame01: {
    width: "auto",
    height: 28,
  },
  depth1Frame2: {
    height: 60,
    paddingTop: Padding.p_xl,
    paddingBottom: Padding.p_xs,
    flexDirection: "row",
  },
  depth1Frame9: {
    height: 20,
  },
  depth0Frame0: {
    minHeight: 900,
    height: "100%",
    overflow: "hidden",
  },
  userprofile: {
    backgroundColor: Color.colorBlack,
    flex: 1,
    width: "100%",
    height: "100%"
  },
});

export default UserProfile;
