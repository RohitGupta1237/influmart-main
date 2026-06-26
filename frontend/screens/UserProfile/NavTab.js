import * as React from "react";
import { Text, StyleSheet, View, TouchableOpacity } from "react-native";
import { FontFamily, FontSize, Padding, Color } from "../../GlobalStyles";

const getBadgeType = (platform, influencer) => {
  if (!influencer) return null;
  const unverified = influencer.unverifiedAccounts || [];
  if (unverified.includes(platform)) return "unverified";
  const hasData =
    platform === "instagram"
      ? influencer.instaData?.length > 0
      : platform === "youtube"
      ? influencer.ytData != null
      : platform === "facebook"
      ? influencer.fbData?.length > 0
      : false;
  return hasData ? "verified" : null;
};

// Inline badge: ✓ or ! in the same colour as the sibling tab label.
// textColor is passed down so the symbol blends with the heading.
const Badge = ({ type, textColor }) => {
  const [hovered, setHovered] = React.useState(false);
  if (!type) return null;
  const isVerified = type === "verified";
  return (
    <View style={styles.badgeWrapper}>
      <Text
        style={[styles.badgeText, { color: textColor }]}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {isVerified ? "✓" : "!"}
      </Text>
      {hovered && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>{isVerified ? "Verified" : "Not Verified"}</Text>
        </View>
      )}
    </View>
  );
};

const NavTab = ({ setTab, tab, influencer }) => {
  const igBadge = getBadgeType("instagram", influencer);
  const ytBadge = getBadgeType("youtube", influencer);
  const fbBadge = getBadgeType("facebook", influencer);

  const activeColor = Color.colorWhite;
  const inactiveColor = Color.colorLightgray;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.cell, tab === "instagram" && styles.selectedCell]}
          onPress={() => setTab("instagram")}
        >
          <View style={styles.textContainer}>
            <Text style={[styles.text, tab === "instagram" && styles.selectedText]}>Instagram</Text>
            <Badge type={igBadge} textColor={tab === "instagram" ? activeColor : inactiveColor} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cell, styles.cellWithMargin, tab === "youtube" && styles.selectedCell]}
          onPress={() => setTab("youtube")}
        >
          <View style={styles.textContainer}>
            <Text style={[styles.text, tab === "youtube" && styles.selectedText]}>YouTube</Text>
            <Badge type={ytBadge} textColor={tab === "youtube" ? activeColor : inactiveColor} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cell, styles.cellWithMargin, tab === "facebook" && styles.selectedCell]}
          onPress={() => setTab("facebook")}
        >
          <View style={styles.textContainer}>
            <Text style={[styles.text, tab === "facebook" && styles.selectedText]}>Facebook</Text>
            <Badge type={fbBadge} textColor={tab === "facebook" ? activeColor : inactiveColor} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  text: {
    color: Color.colorLightgray,
    textAlign: "center",
    fontFamily: FontFamily.beVietnamProBold,
    fontWeight: "700",
    lineHeight: 21,
    fontSize: FontSize.size_sm,
  },
  selectedText: {
    color: Color.colorWhite,
  },
  cellWithMargin: {
    marginLeft: 32,
  },
  cell: {
    paddingBottom: Padding.p_smi,
    paddingTop: Padding.p_base,
    justifyContent: "center",
    height: 53,
    borderBottomWidth: 0,
    borderColor: Color.colorGainsboro_100,
    alignItems: "center",
    borderStyle: "solid",
  },
  selectedCell: {
    borderBottomWidth: 3,
  },
  textContainer: {
    height: 21,
    alignItems: "center",
    flexDirection: "row",
    gap: 3,
  },
  row: {
    width: "100%",
    borderColor: Color.colorDarkslategray_100,
    borderBottomWidth: 1,
    height: 56,
    flexDirection: "row",
    paddingHorizontal: Padding.p_base,
    overflow: "visible",
    borderStyle: "solid",
    justifyContent: "space-evenly",
  },
  container: {
    height: 66,
    paddingBottom: Padding.p_xs,
    overflow: "visible",
  },
  badgeWrapper: {
    position: "relative",
  },
  badgeText: {
    fontSize: FontSize.size_sm,
    fontWeight: "700",
    fontFamily: FontFamily.beVietnamProBold,
    lineHeight: 21,
  },
  tooltip: {
    position: "absolute",
    bottom: 22,
    left: "50%",
    transform: [{ translateX: -30 }],
    backgroundColor: "rgba(0,0,0,0.85)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    zIndex: 999,
    minWidth: 70,
    alignItems: "center",
  },
  tooltipText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    whiteSpace: "nowrap",
  },
});

export default NavTab;
