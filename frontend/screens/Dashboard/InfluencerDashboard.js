import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { FontFamily } from "../../GlobalStyles";
import { useTheme } from "../../util/ThemeContext";
import ThemeToggle from "../../shared/ThemeToggle";
import Depth1Frame13 from "../../components/Depth1Frame13";
import { getInfluencerDeals } from "../../controller/dealController";

const toTitleCase = (str) =>
  str ? str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : str;

const formatMoney = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

const formatDate = (d) => {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date)) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const InfluencerDashboard = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const [data, setData] = useState({ deals: [], totalEarnings: 0, count: 0 });

  useEffect(() => {
    const load = async () => {
      const id = await AsyncStorage.getItem("influencerId");
      if (!id || id === "undefined") return;
      const res = await getInfluencerDeals(id);
      setData(res);
    };
    load();
  }, [isFocused]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          isDesktop && styles.scrollDesktop,
          { paddingBottom: isDesktop ? 40 : 120 },
        ]}
      >
        <View style={[styles.inner, isDesktop && styles.innerDesktop]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="chevron-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>Dashboard</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Earnings hero */}
          <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.heroLabel, { color: theme.subText }]}>TOTAL EARNINGS</Text>
            <Text style={[styles.heroValue, { color: theme.text }]}>{formatMoney(data.totalEarnings)}</Text>
            <Text style={[styles.heroSub, { color: theme.subText }]}>
              {data.count} {data.count === 1 ? "sealed deal" : "sealed deals"}
            </Text>
          </View>

          {/* Deals list */}
          <Text style={[styles.sectionTitle, { color: theme.subText }]}>SEALED DEALS</Text>

          {data.deals.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Ionicons name="ribbon-outline" size={28} color={theme.subText} />
              <Text style={[styles.emptyText, { color: theme.subText }]}>
                No sealed deals yet. Lock a price with a brand in chat and once they accept,
                it'll show up here.
              </Text>
            </View>
          ) : (
            data.deals.map((d) => (
              <View
                key={d._id}
                style={[styles.dealCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              >
                <View style={styles.dealLeft}>
                  <View style={[styles.brandAvatar, { backgroundColor: theme.pill }]}>
                    <Ionicons name="briefcase-outline" size={18} color={theme.text} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.brandName, { color: theme.text }]} numberOfLines={1}>
                      {toTitleCase(d.brandName) || "Brand"}
                    </Text>
                    <Text style={[styles.dealDate, { color: theme.subText }]} numberOfLines={1}>
                      Sealed {formatDate(d.sealedAt || d.updatedAt)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.dealPrice, { color: theme.text }]}>{formatMoney(d.price)}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {!isDesktop && <Depth1Frame13 active={"profile"} />}
      <ThemeToggle />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, width: "100%" },
  scroll: { paddingHorizontal: 16, paddingTop: 16 },
  scrollDesktop: { alignItems: "center", paddingTop: 32 },
  inner: { width: "100%" },
  innerDesktop: { maxWidth: 720 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: FontFamily.beVietnamProBold,
  },
  heroCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 24,
  },
  heroLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontFamily: FontFamily.beVietnamProMedium,
    marginBottom: 8,
  },
  heroValue: {
    fontSize: 40,
    fontWeight: "700",
    fontFamily: FontFamily.beVietnamProBold,
  },
  heroSub: {
    fontSize: 13,
    marginTop: 6,
    fontFamily: FontFamily.beVietnamProRegular,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontFamily: FontFamily.beVietnamProMedium,
    marginBottom: 12,
  },
  emptyCard: {
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    fontFamily: FontFamily.beVietnamProRegular,
  },
  dealCard: {
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  dealLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  brandName: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: FontFamily.beVietnamProMedium,
  },
  dealDate: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: FontFamily.beVietnamProRegular,
  },
  dealPrice: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: FontFamily.beVietnamProBold,
    flexShrink: 0,
  },
});

export default InfluencerDashboard;
