import * as React from "react";
import { Image } from "expo-image";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { FontFamily, FontSize, Padding, Color, Border } from "../GlobalStyles";

const Depth1Frame13 = ({ active }) => {
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = React.useState(active)

  function handleClick(tab) {
    setActiveTab(tab)
    if (tab == "list")
      //navigation for home icon
      navigation.navigate('InfluencersList')
    if (tab == "partnership")
      //navigation for partnership icon
      navigation.navigate('BrandsAssosciated')
    if (tab == "settings")
      navigation.navigate('AdminPanel')
    if (tab == "network")
      //navigation for partnership icon
      navigation.navigate('CollabPost',{navigation})
    if (tab == "profile")
      navigation.navigate('Analytics')
  }

  return (
    <View style={styles.depth1Frame8}>
      <View style={styles.depth2Frame0}>
        <TouchableOpacity style={styles.tabItem} onPress={()=>{handleClick("list")}}>
          <View style={styles.depth3Frame0}>
            <View style={[styles.depth4Frame0, styles.depth4FrameFlexBox]}>
              <Image
                style={styles.depth5Frame0}
                contentFit="cover"
                source={require("../assets/depth-5-frame-02.png")}
              />
            </View>
            <View style={[styles.depth4Frame1, styles.depth4FrameSpaceBlock]}>
              <View style={styles.depth5Frame01}>
                <Text style={[styles.home, styles.homeTypo, { color: `${activeTab == "home" ? "#fff" : "#ccc"}` }]}>Influencers</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={()=>{handleClick("partnership")}}>
        <View style={[styles.depth3Frame1, styles.depth3FrameSpaceBlock]}>
          <View style={[styles.depth4Frame01, styles.depth4FrameFlexBox]}>
            <Image
              style={styles.depth5Frame0}
              contentFit="cover"
              source={require("../assets/depth-5-frame-0281.png")}
            />
          </View>
          <View style={[styles.depth4Frame11, styles.depth4FrameSpaceBlock]}>
            <View style={styles.depth5Frame01}>
              <Text style={[styles.partnerships, styles.homeTypo, { color: `${activeTab == "partnership" ? "#fff" : "#ccc"}` }]}>
                Brands
              </Text>
            </View>
          </View>
        </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => {handleClick("settings")}}>

          <View style={[styles.depth3Frame2, styles.depth3FrameSpaceBlock]}>
            <View style={[styles.depth4Frame0, styles.depth4FrameFlexBox]}>
              <Image
                style={styles.depth5Frame0}
                contentFit="cover"
                source={require("../assets/depth-5-frame-029.png")}
              />
            </View>

            <View style={[styles.depth4Frame12, styles.depth4FrameSpaceBlock]}>
              <View style={styles.depth5Frame01}>
                <Text style={[styles.home, styles.homeTypo, { color: `${activeTab == "settings" ? "#fff" : "#ccc"}` }]}>Settings</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={()=>{handleClick("network")}}>
          <View style={[styles.depth3Frame2, styles.depth3FrameSpaceBlock]}>
            <View style={[styles.depth4Frame0, styles.depth4FrameFlexBox]}>
              <Image
                style={styles.depth5Frame0}
                contentFit="cover"
                source={require("../assets/depth-5-frame-030.png")}
              />
            </View>
            <View style={[styles.depth4Frame13, styles.depth4FrameSpaceBlock]}>
              <View style={styles.depth5Frame01}>
                <Text style={[styles.home, styles.homeTypo, { color: `${activeTab == "network" ? "#fff" : "#ccc"}` }]}>Collabs</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => {handleClick("profile")}}>

          <View style={[styles.depth3Frame2, styles.depth3FrameSpaceBlock]}>
            <View style={[styles.depth4Frame0, styles.depth4FrameFlexBox]}>
              <Image
                style={styles.depth5Frame0}
                contentFit="cover"
                source={require("../assets/depth-5-frame-031.png")}
              />
            </View>
            <View style={[styles.depth4Frame14, styles.depth4FrameSpaceBlock]}>
              <View style={styles.depth5Frame01}>
                <Text style={[styles.home, styles.homeTypo, { color: `${activeTab == "profile" ? "#fff" : "#ccc"}` }]}>Profile</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  depth4FrameFlexBox: {
    height: 24,
    alignItems: "center",
    flexDirection: "row",
    width:"auto"
  },
  depth4FrameSpaceBlock: {
    marginTop: 4,
    alignItems: "center",
  },
  homeTypo: {
    textAlign: "center",
    fontFamily: FontFamily.beVietnamProMedium,
    fontWeight: "500",
    lineHeight: 16,
    letterSpacing: 0,
    // Slightly smaller so labels fit in an equal-width cell.
    fontSize: 10,
  },
  depth3FrameSpaceBlock: {
    alignItems: "center",
  },
  // Each tab is an equal-width cell so the 5 items are evenly spaced
  // (previously variable widths + a stray marginLeft crowded the right side).
  tabItem: {
    flex: 1,
    alignItems: "center",
  },
  depth5Frame0: {
    height: 20,
    width: 20,
  },
  depth4Frame0: {
    paddingHorizontal: 0,
    paddingVertical: Padding.p_9xs,
    width: "auto",
  },
  home: {
    color: Color.colorLightgray,
  },
  depth5Frame01: {
    alignSelf: "stretch",
    alignItems: "center",
  },
  depth4Frame1: {
    width: "auto",
    height: 18,
    marginTop: 4,
  },
  depth3Frame0: {
    alignItems: "center",
    width: "auto",
  },
  depth4Frame01: {
    borderRadius: Border.br_base,
    width: 48,
    justifyContent: "center",
  },
  partnerships: {
    color: Color.colorLightgray,
  },
  depth4Frame11: {
    width: "auto",
    height: 18,
    marginTop: 4,
  },
  depth3Frame1: {
    width: "auto",
  },
  depth4Frame12: {
    width: 'auto',
    height: 18,
    marginTop: 4,
  },
  depth3Frame2: {
    width: "auto",
  },
  depth4Frame13: {
    height: 'auto',
    width: 'auto',
  },
  depth4Frame14: {
    width: 'auto',
    height: 18,
    marginTop: 4,
  },
  // The row is now the floating pill (frosted dark capsule for the dark screens).
  depth2Frame0: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 58,
    backgroundColor: "rgba(30,30,34,0.92)",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 12,
  },
  // Transparent wrapper, absolutely positioned so the pill floats OVER the
  // scrolling content (content shows through/around it) instead of sitting on a
  // solid black footer band. The screen adds bottom padding so nothing hides.
  depth1Frame8: {
    backgroundColor: "transparent",
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 12,
  },
  activeTab: {
    colorolor: Color.colorWhite
  }
});

export default Depth1Frame13;
