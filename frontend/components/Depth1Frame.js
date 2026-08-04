import React, { useMemo } from "react";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import { jwtDecode } from "jwt-decode";
import {
  StyleSheet,
  View,
  Text,
  ImageSourcePropType,
  TouchableOpacity,
} from "react-native";
import { FontFamily, FontSize, Border, Color, Padding } from "../GlobalStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../util/ThemeContext";

const getStyleValue = (key, value) => {
  if (value === undefined) return;
  return { [key]: value === "unset" ? undefined : value };
};

const Depth1Frame = ({
  depth5Frame0,
  depth5Frame01,
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
  style,
}) => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  // Theme-aware floating pill: dark translucent on dark mode, light on light mode,
  // so it aligns with the screen background instead of a white pill on black.
  const pillStyle = theme?.isDark
    ? { backgroundColor: "rgba(30,30,34,0.85)", borderColor: "rgba(255,255,255,0.12)" }
    : { backgroundColor: "rgba(255,255,255,0.72)", borderColor: "rgba(0,0,0,0.08)" };

  // Icon/label color adapts to the theme so they're never invisible
  // (slate on the light pill, light gray on the dark pill).
  const uiColor = theme?.isDark ? "#D0D5DD" : Color.colorSlategray_300;

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
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        if (decodedToken.exp && decodedToken.exp > currentTime) {
          if (decodedToken?.brandId) {
            navigation.navigate("BrandProfile");
          } else {
            navigation.navigate("UserProfile");
          }
        } else {
          await AsyncStorage.removeItem("token");
          navigation.navigate("BrandorInfluencer");
        }
      } else {
        navigation.navigate("BrandorInfluencer");
      }
    } catch (error) {
      await AsyncStorage.removeItem("token");
      navigation.navigate("BrandorInfluencer");
    }
  };
  return (
    <View style={[styles.depth1Frame13, depth1Frame13Style, pillStyle, style]}>
      <View style={styles.depth2Frame0}>
        <View
          style={[
            styles.depth3Frame0,
            styles.depth3FrameLayout,
            depth3Frame01Style,
          ]}
        >
          <View style={[styles.depth4Frame0, styles.depth4FrameFlexBox]}>
            <Image
              style={styles.homeIcon}
              tintColor={uiColor}
              contentFit="cover"
              source={depth5Frame0}
            />
          </View>
          <View
            style={[
              styles.depth4Frame1,
              styles.depth4FrameSpaceBlock,
              depth4Frame1Style,
            ]}
          >
            <View style={styles.depth5Frame01}>
              <Text style={[styles.home, styles.homeTypo, homeStyle, { color: uiColor }]}>
                Home
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate("InfluencersList")}
        >
          <View
            style={[
              styles.depth3Frame1,
              styles.depth3FrameLayout,
              depth3Frame1Style,
            ]}
          >
            <View style={[styles.depth4Frame01, styles.depth4FrameFlexBox]}>
              <Image
                style={styles.depth5Frame0} tintColor={uiColor}
                contentFit="cover"
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
                <Text style={[styles.search, styles.homeTypo, searchStyle, { color: uiColor }]}>
                  {search}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("BrandsAssosciated")}
        >
          <View
            style={[
              styles.depth3Frame1,
              styles.depth3FrameLayout,
              depth3Frame2Style,
            ]}
          >
            <View style={[styles.depth4Frame01, styles.depth4FrameFlexBox]}>
              <Image
                style={styles.depth5Frame0} tintColor={uiColor}
                contentFit="cover"
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
                <Text style={[styles.search, styles.homeTypo, myBrandsStyle, { color: uiColor }]}>
                  {myBrands}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleProfileClick()}>
          <View
            style={[
              styles.depth3Frame1,
              styles.depth3FrameLayout,
              depth3Frame3Style,
            ]}
          >
            <View style={[styles.depth4Frame01, styles.depth4FrameFlexBox]}>
              <Image
                style={styles.depth5Frame0} tintColor={uiColor}
                contentFit="cover"
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
                <Text style={[styles.search, styles.homeTypo, profileStyle, { color: uiColor }]}>
                  Login
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
  depth4FrameFlexBox: {
    height: 26,
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
    lineHeight: 18,
    letterSpacing: 0,
    fontSize: FontSize.size_xs,
    width: "auto",
  },
  depth5Frame0: {
    height: 22,
    width: 22,
  },
  // Home icon tinted to the same muted gray as the other tabs, so Home doesn't
  // look permanently "selected/black" (this bar only shows on the homepage).
  homeIcon: {
    height: 22,
    width: 22,
  },
  depth4Frame0: {
    borderRadius: Border.br_base,
    width: "auto",
    justifyContent: "center",
  },
  home: {
    color: Color.colorSlategray_300,
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
    marginLeft: 8,
    alignItems: "center",
  },
  depth4Frame12: {
    width: 70,
  },
  depth4Frame13: {
    width: 45,
  },
  depth2Frame0: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    height: 46,
    justifyContent: "space-around",
    alignItems: "center",
  },
  // Instagram-style floating pill: detached from the edges, fully rounded,
  // translucent white with a soft shadow so it floats over the content.
  depth1Frame13: {
    // Translucent so content shows through; a visible border + stronger shadow
    // make it read as a distinct floating pill on the light page (instead of
    // blending into the white background and looking like a flat bar).
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    height: 58,
    paddingHorizontal: 14,
    paddingVertical: 6,
    position: "absolute",
    bottom: 16,
    left: 12,
    right: 12,
    justifyContent: "center",
    // Floating shadow (iOS/web) + elevation (Android)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 14,
  },
});

export default Depth1Frame;
