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
import DropdownComponent from "./DropDownComponent";
import { formatNumber } from "../../helpers/GraphData";
import { getAllRequests } from "../../controller/connectionsController";
import ProductCard from "./ProductCard";

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
        let _fb = [
          {
            heading: "Followers",
            content: fb[0]?.followers ? formatNumber(fb[0]?.followers) : "N/A",
          },
          {
            heading: "Avg Post Reactions",
            content: fb[0]?.avgPostReactions ? formatNumber(fb[0]?.avgPostReactions) : "N/A",
          },
          {
            heading: "Avg Post Comments",
            content: fb[0]?.avgPostComments ? formatNumber(fb[0]?.avgPostComments) : "N/A",
          },
          {
            heading: "Avg Post Shares",
            content: fb[0]?.avgPostShares ? formatNumber(fb[0]?.avgPostShares) : "N/A",
          },
          {
            heading: "Avg Reel Reactions",
            content: fb[0]?.avgReelReactions ? formatNumber(fb[0]?.avgReelReactions) : "N/A",
          },
          {
            heading: "Avg Reel Comments",
            content: fb[0]?.avgReelComments ? formatNumber(fb[0]?.avgReelComments) : "N/A",
          },
          {
            heading: "Avg Reel Shares",
            content: fb[0]?.avgReelShares ? formatNumber(fb[0]?.avgReelShares) : "N/A",
          },
          {
            heading: "Avg Reel Play Count",
            content: fb[0]?.avgReelPlayCount ? formatNumber(fb[0]?.avgReelPlayCount) : "N/A",
          },
          {
            heading: "Avg Engagement Rate",
            content: fb[0]?.avgER ? `${fb[0]?.avgER} %` : "N/A",
          },
          {
            heading: "Price per Post",
            content: influencer?.price[0]?.fb
              ? `$ ${formatNumber(influencer?.price[0]?.fb)}`
              : "N/A",
          },
        ];
        setFbData(_fb);
      }
      if (insta) {
        let _insta = [
          {
            heading: "Followers",
            content: insta[0]?.followers
              ? formatNumber(insta[0]?.followers)
              : "N/A",
          },
          {
            heading: "Avg Comments",
            content: insta[0]?.avgComments
              ? formatNumber(insta[0]?.avgComments)
              : "N/A",
          },
          {
            heading: "Avg Likes",
            content: insta[0]?.avgLikes
              ? formatNumber(insta[0]?.avgLikes)
              : "N/A",
          },
          {
            heading: "Avg ER",
            content: insta[0]?.avgER != null && !isNaN(insta[0]?.avgER)
              ? `${(insta[0].avgER * 1000).toPrecision(3)} %`
              : "N/A",
          },
          {
            heading: "Avg Interactions",
            content: insta[0]?.avgInteractions
              ? formatNumber(insta[0]?.avgInteractions)
              : "N/A",
          },
          {
            heading: "Member Reachability",
            content: {
              bullet: insta[0]?.membersReachability?.map((item) => {
                const reachLabels = {
                  r0_500: "🔴 Low Reach Audience",
                  r500_1000: "🟡 Moderate Reach",
                  r1000_1500: "🟢 Good Reach",
                  r1500_plus: "🔥 High Reach Audience",
                };
                const label = reachLabels[item?.name]
                  ? `${item.name} (${reachLabels[item.name]})`
                  : item?.name;
                return {
                  content: `${label} - ${(item?.percent * 100).toPrecision(3)} %`,
                };
              }),
            },
          },
          {
            heading: "Member Cites",
            content: {
              bullet: insta[0]?.memberCities?.map((item) => {
                return {
                  content: `${item?.category} - ${(item?.value * 100).toPrecision(
                    3
                  )}%`,
                };
              }),
            },
          },
          {
            heading: "Ages",
            content: {
              bullet: insta[0]?.ages?.map((item) => {
                return {
                  content: `${item?.name} - ${(item?.percent * 100).toPrecision(
                    3
                  )}%`,
                };
              }),
            },
          },
          {
            heading: "Price per Post",
            content: `$ ${influencer?.price[0]?.ig
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
      <ScrollView>
        <View style={[styles.depth0Frame0, styles.frameLayout1]}>
          {influencer &&<Depth1Frame17
            image={influencer?.profileUrl}
            username={influencer?.influencerName}
            category={influencer?.category}
            isSelectedImage={influencer.isSelectedImage}
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

          <NavTab setTab={setTab} tab={tab} />
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
    width: 390,
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
    paddingTop: 40,
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
