import * as React from "react";
import { Image } from "expo-image";
import { StyleSheet, View, Text,TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Color, FontFamily, Border, FontSize, Padding } from "../GlobalStyles";
import ImageWithFallback from "../util/ImageWithFallback";
import { useTheme } from "../util/ThemeContext";

const toTitleCase = (str) =>
  str ? str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : str;

const Depth1Frame9 = ({image,username,location,category,isSelectedImage}) => {
  const { theme } = useTheme();
  return (
    <View style={styles.depth1Frame1}>
      <View style={styles.depth2Frame0}>
        <View style={styles.depth3Frame0}>
          {/* Gradient ring around the avatar (brand accent). */}
          <LinearGradient colors={["#ec4899", "#ec4899"]} style={styles.avatarRing}>
            <View style={[styles.avatarInner, { backgroundColor: theme.bg }]}>
              <ImageWithFallback image={image} imageStyle={styles.depth5Frame0} isSelectedImage={isSelectedImage} />
            </View>
          </LinearGradient>
          <View style={[styles.depth4Frame1, styles.frameFlexBox]}>
            <View style={styles.depth5Frame01}>
              <View style={styles.depth6Frame0}>
                <Text style={[styles.caroline, styles.followTypo, { color: theme.text }]}>
                  {toTitleCase(username)}
                </Text>
              </View>
            </View>
            <View style={[styles.depth5Frame2, styles.depth5FrameLayout]}>
              <View style={styles.depth6Frame0}>
                <Text style={[styles.age27Los, { color: theme.subText }]} numberOfLines={2}>
                  {category}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  frameFlexBox: {
    justifyContent: "center",
    alignItems: "center",
  },
  followTypo: {
    // Colour comes from the theme at the usage site.
    fontFamily: FontFamily.beVietnamProBold,
    fontWeight: "700",
    letterSpacing: 0,
  },
  depth5FrameLayout: {
    minHeight: 24,
    alignItems: "center",
  },
  frameLayout: {
    height: 40,
    width: "100%",
  },
  frameBg: {
    backgroundColor: Color.colorWhitesmoke_300,
    overflow: "hidden",
  },
  depth5Frame0: {
    borderRadius: Border.br_45xl,
    overflow: "hidden",
    height: 122,
    width: 122,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 70,
  },
  avatarInner: {
    padding: 3,
    borderRadius: 67,
  },
  depth4Frame0: {
    height: 128,
    width: 128,
  },
  caroline: {
    fontSize: FontSize.size_3xl,
    lineHeight: 28,
    textAlign: "center",
  },
  depth6Frame0: {
    alignSelf: "stretch",
    alignItems: "center",
  },
  depth5Frame01: {
    width: 'auto',
    height: 'auto',
    alignItems: "center",
  },
  age27Los: {
    fontSize: FontSize.size_base,
    lineHeight: 22,
    fontFamily: FontFamily.beVietnamProRegular,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  depth5Frame1: {
    width: 'auto',
  },
  depth5Frame2: {
    width: 'auto',
  },
  depth4Frame1: {
    height: 76,
    marginTop: 16,
    width: "auto",
  },
  depth3Frame0: {
    height: "auto",
    width: "80%",
    alignItems: "center",
    paddingBottom: 4,
  },
  follow: {
    fontSize: FontSize.size_sm,
    lineHeight: 21,
    textAlign: "left",
  },
  depth7Frame0: {
    alignSelf: "stretch",
  },
  depth6Frame03: {
    width: 'auto',
    height: 21,
  },
  depth5Frame02: {
    borderRadius: Border.br_xs,
    paddingHorizontal: Padding.p_base,
    paddingVertical: 0,
    height: 40,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  depth3Frame1: {
    marginTop: 16,
    flexDirection: "row",
  },
  depth2Frame0: {
    height: "auto",
    alignItems: "center",
    width: "100%",
  },
  depth1Frame1: {
    width: "100%",
    height: "auto",
    padding: Padding.p_base,
    paddingBottom: 4,
    flexDirection: "row",
  },
});

export default Depth1Frame9;
