import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { getBrandOwnCampaigns, updateCampaignStatus } from "../../controller/collabOpenController";
import { useAlert } from "../../util/AlertContext";
import ImageWithFallback from "../../util/ImageWithFallback";
import BrandProfileBottomBar from "../../components/BrandProfileBottomBar";

const isCampaignClosed = (campaignTimelines) => {
  if (!campaignTimelines) return false;
  const parts = campaignTimelines.split(" - ");
  const endDate = new Date(parts[parts.length - 1]);
  if (isNaN(endDate)) return false;
  endDate.setHours(23, 59, 59, 999);
  return endDate < new Date();
};

const FILTERS = ["All", "Successfully Closed", "Cancelled"];

const BrandCampaigns = ({ navigation }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const { showAlert } = useAlert();

  const load = useCallback(() => {
    AsyncStorage.getItem("brandId").then((brandId) => {
      if (brandId) getBrandOwnCampaigns(brandId, setCampaigns, showAlert);
    });
  }, []);

  useFocusEffect(load);

  const handleTick = async (item) => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(`Mark "${item.campaignType}" as successfully closed?`);
      if (confirmed) {
        const ok = await updateCampaignStatus(item.collabOpeningId, "successfully_closed", showAlert);
        if (ok) load();
      }
      return;
    }
    Alert.alert(
      "Mark as Successfully Closed",
      `Mark "${item.campaignType}" as successfully closed?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            const ok = await updateCampaignStatus(item.collabOpeningId, "successfully_closed", showAlert);
            if (ok) load();
          },
        },
      ]
    );
  };

  const handleCross = async (item) => {
    const isTimelineClosed = isCampaignClosed(item.campaignTimelines);
    const msg = isTimelineClosed
      ? `This campaign's deadline has passed. Mark it as cancelled?`
      : `This will remove the campaign from influencer openings and mark it as cancelled.`;
    if (Platform.OS === "web") {
      const confirmed = window.confirm(msg);
      if (confirmed) {
        const ok = await updateCampaignStatus(item.collabOpeningId, "cancelled", showAlert);
        if (ok) load();
      }
      return;
    }
    Alert.alert("Cancel Campaign", msg, [
      { text: "Back", style: "cancel" },
      {
        text: "Cancel Campaign",
        style: "destructive",
        onPress: async () => {
          const ok = await updateCampaignStatus(item.collabOpeningId, "cancelled", showAlert);
          if (ok) load();
        },
      },
    ]);
  };

  const filtered = campaigns.filter((c) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Successfully Closed") return c.status === "successfully_closed";
    if (activeFilter === "Cancelled") return c.status === "cancelled";
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Image style={styles.icon} contentFit="cover" source={require("../../assets/adminPanelBack.png")} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Campaigns</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            style={[styles.filterTab, activeFilter === f && styles.filterTabActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterTabText, activeFilter === f && styles.filterTabTextActive]}>{f}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No campaigns here.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map((item, index) => {
              const timelineClosed = isCampaignClosed(item.campaignTimelines);
              const isActioned = item.status === "successfully_closed" || item.status === "cancelled";

              return (
                <View key={index} style={[styles.card, isActioned && styles.cardActioned]}>
                  {/* Tappable content area → navigates to detail */}
                  <TouchableOpacity
                    style={styles.cardContent}
                    activeOpacity={0.7}
                    onPress={() =>
                      navigation.navigate("CampaignDetail", {
                        data: item,
                        isApplied: false,
                        isBrandView: true,
                      })
                    }
                  >
                    <View style={styles.cardTitleRow}>
                      <Text style={[styles.cardTitle, isActioned && styles.cardTitleActioned]}>
                        {item.campaignType}
                      </Text>
                      {item.status === "successfully_closed" && (
                        <View style={[styles.statusBadge, styles.successBadge]}>
                          <Text style={styles.successBadgeText}>✓ Closed</Text>
                        </View>
                      )}
                      {item.status === "cancelled" && (
                        <View style={[styles.statusBadge, styles.cancelledBadge]}>
                          <Text style={styles.cancelledBadgeText}>Cancelled</Text>
                        </View>
                      )}
                      {item.status === "active" && timelineClosed && (
                        <View style={[styles.statusBadge, styles.closedBadge]}>
                          <Text style={styles.closedBadgeText}>Closed</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.cardSub}>{item.numberOfInfluencers} influencers needed</Text>
                    <Text style={styles.cardDate}>{item.campaignTimelines}</Text>
                    <View style={styles.earningBadge}>
                      <Text style={styles.earningText}>₹ {item.earningCapacity}</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Right side — image + action buttons, NOT inside nav pressable */}
                  <View style={styles.cardRight}>
                    <ImageWithFallback
                      imageStyle={[styles.cardImage, isActioned && { opacity: 0.5 }]}
                      image={item.imageSource || null}
                      isSelectedImage={false}
                    />
                    {activeFilter === "All" && !isActioned && (
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.tickBtn]}
                          onPress={() => handleTick(item)}
                        >
                          <Text style={styles.tickBtnText}>✓</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.crossBtn]}
                          onPress={() => handleCross(item)}
                        >
                          <Text style={styles.crossBtnText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <BrandProfileBottomBar
        depth5Frame0={require("../../assets/depth-5-frame-01.png")}
        depth5Frame01={require("../../assets/depth-5-frame-02.png")}
        search="Influencer"
        myNetwork={require("../../assets/depth-5-frame-030.png")}
        postImage={require("../../assets/depth-5-frame-029.png")}
        depth5Frame02={require("../../assets/depth-5-frame-03.png")}
        myBrands="Brands"
        depth5Frame03={require("../../assets/depth-5-frame-04.png")}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  iconButton: { padding: 4 },
  icon: { width: 24, height: 24 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111" },
  // Filter tabs
  filterRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    flexGrow: 0,
    flexShrink: 0,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    alignItems: "center",
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    height: 36,
    justifyContent: "center",
  },
  filterTabActive: { backgroundColor: "#111" },
  filterTabText: { fontSize: 13, fontWeight: "500", color: "#555" },
  filterTabTextActive: { color: "#fff" },
  // Empty
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 80 },
  emptyText: { fontSize: 15, color: "#999" },
  // List
  list: { padding: 16 },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardActioned: { backgroundColor: "#f9f9f9", opacity: 0.8 },
  cardContent: { flex: 1, paddingRight: 10 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#111" },
  cardTitleActioned: { color: "#999" },
  // Status badges
  statusBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  successBadge: { backgroundColor: "#d1fae5" },
  successBadgeText: { fontSize: 11, fontWeight: "600", color: "#065f46" },
  cancelledBadge: { backgroundColor: "#fef2f2" },
  cancelledBadgeText: { fontSize: 11, fontWeight: "600", color: "#b91c1c" },
  closedBadge: { backgroundColor: "#fee2e2" },
  closedBadgeText: { fontSize: 11, fontWeight: "600", color: "#c0392b" },
  cardSub: { fontSize: 13, color: "#4F7396", marginBottom: 2 },
  cardDate: { fontSize: 12, color: "#999", marginBottom: 8 },
  earningBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#f0f4ff",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  earningText: { fontSize: 12, fontWeight: "600", color: "#333" },
  // Right side: image + action buttons
  cardRight: { alignItems: "center", gap: 8 },
  cardImage: { width: 75, height: 75, borderRadius: 10 },
  actionButtons: { flexDirection: "row", gap: 6 },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  tickBtn: { backgroundColor: "#d1fae5" },
  tickBtnText: { fontSize: 14, color: "#065f46", fontWeight: "700" },
  crossBtn: { backgroundColor: "#fee2e2" },
  crossBtnText: { fontSize: 13, color: "#b91c1c", fontWeight: "700" },
});

export default BrandCampaigns;
