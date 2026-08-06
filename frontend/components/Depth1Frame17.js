import * as React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { FontFamily, FontSize, Padding } from "../GlobalStyles";
import ImageWithFallback from "../util/ImageWithFallback";
import { formatNumber } from "../helpers/GraphData";
import { useTheme } from "../util/ThemeContext";

const PINK = "#ec4899";
const PURPLE = "#7c3aed";

const toTitleCase = (str) =>
  str ? str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : str;

const Depth1Frame17 = ({ image, username, category, isSelectedImage, instaFollowers, ytFollowers, fbFollowers, isDesktop }) => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const categories = category
    ? category.split(",").map(c => c.trim()).filter(Boolean)
    : [];

  const socials = [
    { label: "Instagram", count: instaFollowers },
    { label: "YouTube",   count: ytFollowers   },
    { label: "Facebook",  count: fbFollowers   },
  ];

  return (
    <View style={[styles.wrapper, isDesktop && styles.wrapperDesktop]}>

      {/* ROW 1: avatar + profile info */}
      <View style={[styles.row1, isDesktop && styles.row1Desktop]}>
        {/* Gradient ring around the avatar — the homepage pink→purple accent. */}
        <LinearGradient
          colors={[PINK, PINK]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.avatarRing, isDesktop && styles.avatarRingDesktop]}
        >
          <View style={[styles.avatarInner, isDesktop && styles.avatarInnerDesktop, { backgroundColor: theme.card }]}>
            <ImageWithFallback imageStyle={[styles.avatar, isDesktop && styles.avatarDesktop]} image={image} isSelectedImage={isSelectedImage} />
          </View>
        </LinearGradient>
        <View style={[styles.profileInfo, isDesktop && styles.profileInfoDesktop]}>
          <View style={[styles.nameRow, isDesktop && styles.nameRowDesktop]}>
            <Text style={[styles.username, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">{toTitleCase(username)}</Text>
            <Text style={[styles.separator, { color: theme.subText }]}> | </Text>
            <Text style={[styles.role, { color: theme.subText }]}>Influencer</Text>
          </View>
          <View style={[styles.categoryRow, isDesktop && styles.categoryRowDesktop]}>
            {categories.map((cat, i) => (
              <View key={i} style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{cat}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ROW 2: social stats full width */}
      <View style={[styles.statsRow, { borderColor: theme.divider }]}>
        {socials.map((s, i) => (
          <React.Fragment key={i}>
            <View style={styles.statItem}>
              <Text style={[styles.statCount, { color: theme.text }]}>{s.count ? formatNumber(s.count) : "N/A"}</Text>
              <Text style={[styles.statLabel, { color: theme.subText }]}>{s.label}</Text>
            </View>
            {i < socials.length - 1 && <View style={[styles.statDivider, { backgroundColor: theme.divider }]} />}
          </React.Fragment>
        ))}
      </View>

      {/* Message button — pink→purple gradient CTA (matches homepage). */}
      <TouchableOpacity onPress={() => navigation.navigate('InboxInterface')} activeOpacity={0.85} style={styles.messageBtnWrap}>
        <LinearGradient colors={[PINK, PURPLE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.messageBtn}>
          <Text style={styles.messageText}>Message</Text>
        </LinearGradient>
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
  // Desktop: sits inside the full-height left sidebar panel — no card chrome.
  wrapperDesktop: {
    paddingTop: 32,
    paddingHorizontal: 24,
  },
  row1: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  // Desktop: stack avatar over info, centered — reads as a profile card.
  row1Desktop: {
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
  },
  // Gradient ring wrapper (mobile: rounded-rect, desktop: circle).
  avatarRing: {
    padding: 3,
    borderRadius: 19,
    flexShrink: 0,
  },
  avatarRingDesktop: {
    borderRadius: 70,
  },
  avatarInner: {
    padding: 3,
    borderRadius: 17,
  },
  avatarInnerDesktop: {
    borderRadius: 67,
  },
  avatar: {
    width: 90,
    height: 110,
    borderRadius: 14,
    overflow: "hidden",
    flexShrink: 0,
  },
  avatarDesktop: {
    width: 128,
    height: 128,
    borderRadius: 64,
  },
  profileInfo: {
    flex: 1,
    gap: 5,
  },
  profileInfoDesktop: {
    flex: 0,
    alignItems: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  nameRowDesktop: {
    justifyContent: "center",
    flexWrap: "wrap",
  },
  separator: {
    fontSize: FontSize.size_sm,
    fontFamily: FontFamily.beVietnamProRegular,
    flexShrink: 0,
  },
  username: {
    fontSize: FontSize.size_3xl,
    lineHeight: 28,
    fontFamily: FontFamily.beVietnamProBold,
    fontWeight: "700",
    flexShrink: 1,
  },
  role: {
    fontSize: FontSize.size_sm,
    fontFamily: FontFamily.beVietnamProRegular,
    lineHeight: 28,
    flexShrink: 0,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  categoryRowDesktop: {
    justifyContent: "center",
  },
  categoryPill: {
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderWidth: 1,
    // Neutral pill — restrained, lets the Message CTA be the only pink moment.
    backgroundColor: "rgba(127,127,127,0.10)",
    borderColor: "rgba(127,127,127,0.22)",
  },
  categoryPillText: {
    fontSize: 11,
    fontFamily: FontFamily.beVietnamProMedium,
    color: "#8a8f98",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderBottomWidth: 1,
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
  },
  statCount: {
    fontSize: 15,
    fontFamily: FontFamily.beVietnamProBold,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 10,
    fontFamily: FontFamily.beVietnamProRegular,
  },
  messageBtnWrap: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: PINK,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 5,
  },
  messageBtn: {
    width: "100%",
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  messageText: {
    color: "#ffffff",
    fontFamily: FontFamily.beVietnamProBold,
    fontWeight: "700",
    fontSize: FontSize.size_sm,
  },
});

export default Depth1Frame17;
