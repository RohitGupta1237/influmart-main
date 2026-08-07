import React, { useMemo } from "react";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import { StyleSheet, View, Text, ImageSourcePropType, TouchableOpacity } from "react-native";
import { FontFamily, FontSize, Border, Color, Padding } from "../GlobalStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../util/ThemeContext";

const getStyleValue = (key, value) => {
  if (value === undefined) return;
  return { [key]: value === "unset" ? undefined : value };
};

const BrandProfileBottomBar = ({
  depth5Frame0,
  depth5Frame01,
  postImage,
  myNetwork,
  search,
  depth5Frame02,
  myBrands,
  depth5Frame03,
  propBorderColor,
  propWidth,
  propWidth1,
  propFontFamily,
  propColor,
  propWidth2,
  propWidth3,
  propFontFamily1,
  propColor1,
  propWidth4,
  propWidth5,
  propFontFamily2,
  propColor2,
  propWidth6,
  propWidth7,
  propFontFamily3,
  propColor3,
  style
}) => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const uiColor = theme.isDark ? "#D0D5DD" : "#475467";
  const pillStyle = {
    backgroundColor: theme.isDark ? "rgba(30,30,34,0.92)" : "rgba(255,255,255,0.90)",
    borderColor: theme.isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
  };

  const depth1Frame13Style = useMemo(() => {
    return {
      ...getStyleValue("borderColor", propBorderColor),
    };
  }, [propBorderColor]);

  const depth3Frame01Style = useMemo(() => {
    return {
      ...getStyleValue("width", propWidth),
    };
  }, [propWidth]);

  const depth4Frame1Style = useMemo(() => {
    return {
      ...getStyleValue("width", propWidth1),
    };
  }, [propWidth1]);

  const homeStyle = useMemo(() => {
    return {
      ...getStyleValue("fontFamily", propFontFamily),
      ...getStyleValue("color", propColor),
    };
  }, [propFontFamily, propColor]);

  const depth3Frame1Style = useMemo(() => {
    return {
      ...getStyleValue("width", propWidth2),
    };
  }, [propWidth2]);

  const depth4Frame11Style = useMemo(() => {
    return {
      ...getStyleValue("width", propWidth3),
    };
  }, [propWidth3]);

  const searchStyle = useMemo(() => {
    return {
      ...getStyleValue("fontFamily", propFontFamily1),
      ...getStyleValue("color", propColor1),
    };
  }, [propFontFamily1, propColor1]);

  const depth3Frame2Style = useMemo(() => {
    return {
      ...getStyleValue("width", propWidth4),
    };
  }, [propWidth4]);

  const depth4Frame12Style = useMemo(() => {
    return {
      ...getStyleValue("width", propWidth5),
    };
  }, [propWidth5]);

  const myBrandsStyle = useMemo(() => {
    return {
      ...getStyleValue("fontFamily", propFontFamily2),
      ...getStyleValue("color", propColor2),
    };
  }, [propFontFamily2, propColor2]);

  const depth3Frame3Style = useMemo(() => {
    return {
      ...getStyleValue("width", propWidth6),
    };
  }, [propWidth6]);

  const depth4Frame13Style = useMemo(() => {
    return {
      ...getStyleValue("width", propWidth7),
    };
  }, [propWidth7]);

  const profileStyle = useMemo(() => {
    return {
      ...getStyleValue("fontFamily", propFontFamily3),
      ...getStyleValue("color", propColor3),
    };
  }, [propFontFamily3, propColor3]);
  const handleProfileClick = async () => {
    const brand = await AsyncStorage.getItem("brandId")
    const influencer = await AsyncStorage.getItem("influencerId")
    if (brand) {
      navigation.navigate('BrandProfile')
    } else if (influencer) {
      navigation.navigate('UserProfile')
    } else {
      navigation.navigate('BrandorInfluencer')
    }
  }
  return (
    <View style={[styles.depth1Frame13, pillStyle, depth1Frame13Style, style]}>
      <View style={styles.depth2Frame0}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('CollabForm',{navigation})}>

          <View
            style={[
              styles.depth3Frame1,
              styles.depth3FrameLayout,
              depth3Frame1Style,
            ]}
          >
            <View style={[styles.depth4Frame01, styles.depth4FrameFlexBox]}>
              <Image
                style={styles.depth5Frame0}
                contentFit="cover"
                tintColor={uiColor}
                source={require('../assets/post_icon.png')}
              />
            </View>
            <View
              style={[
                styles.depth4Frame11,
                styles.depth4FrameSpaceBlock,
                depth4Frame11Style
              ]}
            >
              <View style={styles.depth5Frame01}>
                <Text style={[styles.search, styles.homeTypo, searchStyle, {color: uiColor}]}>
                  Post
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('InfluencersList')}>

          <View
            style={[
              styles.depth3Frame1,
              styles.depth3FrameLayout,
              depth3Frame1Style,
            ]}
          >
            <View style={[styles.depth4Frame01, styles.depth4FrameFlexBox]}>
              <Image
                style={styles.depth5Frame0}
                contentFit="cover"
                tintColor={uiColor}
                source={depth5Frame01}
              />
            </View>
            <View
              style={[
                styles.depth4Frame11,
                styles.depth4FrameSpaceBlock,
                depth4Frame11Style,
              ]}
            >
              <View style={styles.depth5Frame01}>
                <Text style={[styles.search, styles.homeTypo, searchStyle, {color: uiColor}]}>
                  {search}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('BrandsAssosciated')}>

          <View
            style={[
              styles.depth3Frame1,
              styles.depth3FrameLayout,
              depth3Frame2Style,
            ]}
          >
            <View style={[styles.depth4Frame01, styles.depth4FrameFlexBox]}>
              <Image
                style={styles.depth5Frame0}
                contentFit="cover"
                tintColor={uiColor}
                source={depth5Frame02}
              />
            </View>
            <View
              style={[
                styles.depth4Frame12,
                styles.depth4FrameSpaceBlock,
                depth4Frame12Style,
              ]}
            >
              <View style={styles.depth5Frame01}>
                <Text style={[styles.search, styles.homeTypo, myBrandsStyle, {color: uiColor}]}>
                  {myBrands}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity >
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('BrandCampaigns')}>
          <View style={[styles.depth3Frame1, styles.depth3FrameLayout]}>
            <View style={[styles.depth4Frame01, styles.depth4FrameFlexBox]}>
              <Image
                style={styles.depth5Frame0}
                contentFit="cover"
                tintColor={uiColor}
                source={require('../assets/collab_count.png')}
              />
            </View>
            <View style={[styles.depth4Frame11, styles.depth4FrameSpaceBlock]}>
              <View style={styles.depth5Frame01}>
                <Text style={[styles.search, styles.homeTypo, {color: uiColor}]}>
                  Campaigns
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => handleProfileClick()}>
          <View
            style={[
              styles.depth3Frame1,
              styles.depth3FrameLayout,
              depth3Frame3Style,
            ]}
          >
            <View style={[styles.depth4Frame01, styles.depth4FrameFlexBox]}>
              <Image
                style={styles.depth5Frame0}
                contentFit="cover"
                tintColor={uiColor}
                source={depth5Frame03}
              />
            </View>
            <View
              style={[
                styles.depth4Frame13,
                styles.depth4FrameSpaceBlock,
                depth4Frame13Style,
              ]}
            >
              <View style={styles.depth5Frame01}>
                <Text style={[styles.search, styles.homeTypo, profileStyle, {color: uiColor}]}>
                  Profile
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  depth3FrameLayout: {
    width: "auto",
    alignItems: "center",
    height: 44,
  },
  // Equal-width cell so the 5 tabs are evenly spaced.
  tabItem: {
    flex: 1,
    alignItems: "center",
  },
  depth4FrameFlexBox: {
    height: 26,
    justifyContent:"center",
    alignItems: "center",
    flexDirection: "row",
  },
  depth4FrameSpaceBlock: {
    marginTop: 2,
    height: 16,
    alignItems: "center",
  },
  homeTypo: {
    textAlign: "center",
    fontFamily: FontFamily.lexendMedium,
    fontWeight: "500",
    lineHeight: 16,
    letterSpacing: 0,
    // Smaller so longer labels ("Campaigns", "Influencer") fit in equal cells.
    fontSize: 10,
    width: "auto"
  },
  depth5Frame0: {
    height: 22,
    width: 22,
    tintColor: Color.colorSlategray_300,
  },
  depth4Frame0: {
    borderRadius: Border.br_base,
    width: "auto",
    justifyContent: "center",
  },
  home: {
    color: Color.colorGray_500,
  },
  depth5Frame01: {
    alignSelf: "stretch",
    alignItems: "center",
  },
  depth4Frame1: {
    width: "auto",
  },
  depth3Frame0: {
    alignItems: "center",
  },
  depth4Frame01: {
    paddingHorizontal: 0,
    paddingVertical: Padding.p_9xs,
    width: 30,
  },
  search: {
    color: Color.colorSlategray_300,
  },
  depth4Frame11: {
    width: "auto",
  },
  depth3Frame1: {
    alignItems: "center",
  },
  depth4Frame12: {
    width: "auto",
  },
  depth4Frame13: {
    width: "auto",
  },
  depth2Frame0: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    height: 46,
    justifyContent: "space-around",
    alignItems: "center",
  },
  // Floating translucent pill (light brand screens) — matches the homepage bar.
  depth1Frame13: {
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    height: 58,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: "absolute",
    bottom: 16,
    left: 12,
    right: 12,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 14,
  },
});

export default BrandProfileBottomBar;
