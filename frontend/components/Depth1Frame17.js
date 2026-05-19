import * as React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Color, FontFamily, Border, FontSize, Padding } from "../GlobalStyles";
import ImageWithFallback from "../util/ImageWithFallback";
import { formatNumber } from "../helpers/GraphData";

const toTitleCase = (str) =>
  str ? str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : str;

const Depth1Frame17 = ({ image, username, category, isSelectedImage, instaFollowers, ytFollowers, fbFollowers }) => {
  const navigation = useNavigation();

  const categories = category
    ? category.split(",").map(c => c.trim()).filter(Boolean)
    : [];

  const socials = [
    { label: "Instagram", count: instaFollowers },
    { label: "YouTube",   count: ytFollowers   },
    { label: "Facebook",  count: fbFollowers   },
  ];

  return (
    <View style={styles.wrapper}>

      {/* ROW 1: avatar + profile info */}
      <View style={styles.row1}>
        <ImageWithFallback imageStyle={styles.avatar} image={image} isSelectedImage={isSelectedImage} />
        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.username}>{toTitleCase(username)}</Text>
            <Text style={styles.separator}> | </Text>
            <Text style={styles.role}>Influencer</Text>
          </View>
          <View style={styles.categoryRow}>
            {categories.map((cat, i) => (
              <View key={i} style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{cat}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ROW 2: social stats full width */}
      <View style={styles.statsRow}>
        {socials.map((s, i) => (
          <React.Fragment key={i}>
            <View style={styles.statItem}>
              <Text style={styles.statCount}>{s.count ? formatNumber(s.count) : "N/A"}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
            {i < socials.length - 1 && <View style={styles.statDivider} />}
          </React.Fragment>
        ))}
      </View>

      {/* Message button */}
      <TouchableOpacity onPress={() => navigation.navigate('InboxInterface')} style={styles.messageBtn}>
        <Text style={styles.messageText}>Message</Text>
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    paddingHorizontal: Padding.p_base,
    paddingVertical: Padding.p_xl,
    gap: 16,
  },
  row1: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  avatar: {
    width: 90,
    height: 110,
    borderRadius: 16,
    overflow: "hidden",
    flexShrink: 0,
  },
  profileInfo: {
    flex: 1,
    gap: 5,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  separator: {
    color: "#444",
    fontSize: FontSize.size_sm,
    fontFamily: FontFamily.beVietnamProRegular,
  },
  username: {
    fontSize: FontSize.size_3xl,
    lineHeight: 28,
    fontFamily: FontFamily.beVietnamProBold,
    fontWeight: "700",
    color: Color.colorWhite,
  },
  role: {
    fontSize: FontSize.size_sm,
    fontFamily: FontFamily.beVietnamProRegular,
    color: Color.colorLightgray,
    lineHeight: 28,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  categoryPill: {
    backgroundColor: "#1e1e1e",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#333",
  },
  categoryPillText: {
    color: "#ccc",
    fontSize: 11,
    fontFamily: FontFamily.beVietnamProRegular,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#1e1e1e",
    paddingVertical: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#2a2a2a",
  },
  statCount: {
    color: Color.colorWhite,
    fontSize: 15,
    fontFamily: FontFamily.beVietnamProBold,
    fontWeight: "700",
  },
  statLabel: {
    color: "#666",
    fontSize: 10,
    fontFamily: FontFamily.beVietnamProRegular,
  },
  messageBtn: {
    width: "100%",
    height: 40,
    backgroundColor: Color.colorDarkslategray_200,
    borderRadius: Border.br_xl,
    alignItems: "center",
    justifyContent: "center",
  },
  messageText: {
    color: Color.colorWhite,
    fontFamily: FontFamily.beVietnamProBold,
    fontWeight: "700",
    fontSize: FontSize.size_sm,
  },
});

export default Depth1Frame17;
