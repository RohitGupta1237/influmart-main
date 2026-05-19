import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { sendCollabOpenRequest, addCollaboratedInfluencer } from "../../controller/collabOpenController";
import { useAlert } from "../../util/AlertContext";
import ImageWithFallback from "../../util/ImageWithFallback";

const CampaignDetail = ({ route, navigation }) => {
  const { data, isApplied, isBrandView, isClosed } = route.params;
  const { showAlert } = useAlert();
  const [username, setUsername] = useState("");
  const [influencers, setInfluencers] = useState(data.collaboratedInfluencers || []);
  const [adding, setAdding] = useState(false);

  const handleAddInfluencer = async () => {
    const trimmed = username.trim();
    if (!trimmed) return;
    if (influencers.includes(trimmed)) {
      showAlert('Info', 'Username already added');
      return;
    }
    setAdding(true);
    const ok = await addCollaboratedInfluencer(data.collabOpeningId, trimmed, showAlert);
    if (ok) {
      setInfluencers((prev) => [...prev, trimmed]);
      setUsername("");
    }
    setAdding(false);
  };

  const handleApply = async () => {
    const influencerId = await AsyncStorage.getItem("influencerId");
    await sendCollabOpenRequest(
      influencerId,
      data.brandId,
      showAlert,
      navigation,
      data.collabOpeningId
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Image
            style={styles.backIcon}
            contentFit="cover"
            source={require("../../assets/adminPanelBack.png")}
          />
        </TouchableOpacity>
        <Text style={styles.campaignDetails}>Campaign Details</Text>
        <View style={styles.shareIcon} />
      </View>

      {/* Hero Image — full bleed */}
      {data?.imageSource == null ? (
        <ImageWithFallback
          imageStyle={styles.mainImage}
          image={data?.imageSource}
          isSelectedImage={data?.isSelectedImage}
        />
      ) : (
        data?.imageSource && (
          <ImageWithFallback
            imageStyle={styles.mainImage}
            image={data?.imageSource}
            isSelectedImage={data?.isSelectedImage}
          />
        )
      )}

      {/* Brand Info Card */}
      <View style={styles.brandCard}>
        <View style={styles.brandRow}>
          <Text style={styles.brandLabel}>Brand</Text>
          <Text style={styles.brandValue}>{data?.brandName}</Text>
        </View>
        <View style={styles.dividerLine} />
        <View style={styles.brandRow}>
          <Text style={styles.brandLabel}>Positioning</Text>
          <Text style={styles.brandValue}>{data.brandDescription}</Text>
        </View>
        <View style={styles.dividerLine} />
        <View style={styles.brandRow}>
          <Text style={styles.brandLabel}>Category</Text>
          <Text style={styles.brandValue}>
            {data?.category != [] ? JSON.parse(data.category[0]).join(", ") : ""}
          </Text>
        </View>
      </View>

      {/* Requirements Section */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionHeader}>Requirements</Text>
      </View>

      <View style={styles.requirementCard}>
        <Image style={styles.icon} source={require("../../assets/collab/depth-5-frame-01.png")} />
        <View style={styles.textContainer}>
          <Text style={styles.requirementTitle}>Campaign Type</Text>
          <Text style={styles.requirementDetail}>{data?.campaignType}</Text>
        </View>
      </View>

      <View style={styles.requirementCard}>
        <Image style={styles.icon} source={require("../../assets/collab/depth-5-frame-01.png")} />
        <View style={styles.textContainer}>
          <Text style={styles.requirementTitle}>Campaign Steps</Text>
          <Text style={styles.requirementDetail}>{data?.campaignSteps}</Text>
        </View>
      </View>

      <View style={styles.requirementCard}>
        <Image style={styles.icon} source={require("../../assets/collab/depth-5-frame-01.png")} />
        <View style={styles.textContainer}>
          <Text style={styles.requirementTitle}>Campaign Timeline</Text>
          <Text style={styles.requirementDetail}>{data?.campaignTimelines}</Text>
        </View>
      </View>

      <View style={styles.requirementCard}>
        <Image style={styles.icon} source={require("../../assets/collab/depth-5-frame-01.png")} />
        <View style={styles.textContainer}>
          <Text style={styles.requirementTitle}>Minimum Eligibility</Text>
          <Text style={styles.requirementDetail}>{data?.minEligibilityCriteria}</Text>
        </View>
      </View>

      <View style={styles.requirementCard}>
        <Image style={styles.icon} source={require("../../assets/collab/depth-5-frame-01.png")} />
        <View style={styles.textContainer}>
          <Text style={styles.requirementTitle}>Review Instructions</Text>
          <Text style={styles.requirementDetail}>{data.productReviewInstructions}</Text>
        </View>
      </View>

      <View style={styles.requirementCard}>
        <Image style={styles.icon} source={require("../../assets/collab/depth-5-frame-01.png")} />
        <View style={styles.textContainer}>
          <Text style={styles.requirementTitle}>Open Positions</Text>
          <Text style={styles.requirementDetail}>{data?.numberOfInfluencers}</Text>
        </View>
      </View>

      {/* Compensation Section */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionHeader}>Compensation</Text>
      </View>

      <View style={styles.requirementCard}>
        <Image style={styles.icon} source={require("../../assets/collab/depth-4-frame-01.png")} />
        <View style={styles.textContainer}>
          <Text style={styles.requirementTitle}>Base Fee</Text>
          <Text style={styles.feeValue}>{`₹ ${data.earningCapacity}`}</Text>
        </View>
      </View>

      <View style={styles.requirementCard}>
        <Image style={styles.icon} source={require("../../assets/collab/depth-5-frame-01.png")} />
        <View style={styles.textContainer}>
          <Text style={styles.requirementTitle}>Compensation Type</Text>
          <Text style={styles.requirementDetail}>
            {data?.compensationType ? data?.compensationType : "N/A"}
          </Text>
        </View>
      </View>

      {/* Collaborated Influencers — only for brand on successfully closed campaigns */}
      {isBrandView && data.status === 'successfully_closed' && (
        <View style={styles.collabSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionHeader}>Collaborated Influencers</Text>
          </View>

          {influencers.length > 0 && (
            <View style={styles.influencerChips}>
              {influencers.map((name, i) => (
                <View key={i} style={styles.chip}>
                  <Text style={styles.chipText}>@{name}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.addRow}>
            <TextInput
              style={styles.usernameInput}
              placeholder="Enter influencer username"
              placeholderTextColor="#aaa"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.addBtn, adding && { opacity: 0.6 }]}
              onPress={handleAddInfluencer}
              disabled={adding}
            >
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Apply Button */}
      {!isBrandView && (
        isClosed ? (
          <View style={[styles.footer, { backgroundColor: "#aaa" }]}>
            <Text style={styles.applyNow}>Applications Closed</Text>
          </View>
        ) : isApplied ? (
          <View style={[styles.footer, { backgroundColor: "#aaa" }]}>
            <Text style={styles.applyNow}>Already Applied</Text>
          </View>
        ) : (
          <TouchableOpacity onPress={() => handleApply()} activeOpacity={0.85}>
            <View style={styles.footer}>
              <Text style={styles.applyNow}>Apply Now</Text>
            </View>
          </TouchableOpacity>
        )
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  iconButton: {
    padding: 4,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  campaignDetails: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
  },
  shareIcon: {
    width: 24,
    height: 24,
  },
  // Hero image — full bleed, rounded bottom corners
  mainImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
    marginBottom: 20,
  },
  // Brand info card
  brandCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  brandLabel: {
    fontSize: 14,
    color: "#888",
    fontWeight: "600",
    flex: 1,
  },
  brandValue: {
    fontSize: 14,
    color: "#111",
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
  },
  dividerLine: {
    height: 1,
    backgroundColor: "#ebebeb",
  },
  // Section header with left accent bar
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionAccent: {
    width: 4,
    height: 20,
    backgroundColor: "#222",
    borderRadius: 2,
    marginRight: 10,
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
  },
  // Requirement card rows
  requirementCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 12,
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  requirementTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
    marginBottom: 2,
  },
  requirementDetail: {
    fontSize: 13,
    color: "#666",
  },
  // Highlighted fee value
  feeValue: {
    fontSize: 13,
    color: "#666",
  },
  // Collaborated influencers section
  collabSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  influencerChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: "#e8f0fe",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 13,
    color: "#1a56db",
    fontWeight: "600",
  },
  addRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    gap: 10,
    alignItems: "center",
  },
  usernameInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    backgroundColor: "#f8f9fa",
    color: "#111",
  },
  addBtn: {
    backgroundColor: "#111",
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  // Apply button
  footer: {
    marginTop: 24,
    marginHorizontal: 20,
    alignItems: "center",
    backgroundColor: "#0d7df2",
    paddingVertical: 16,
    borderRadius: 14,
  },
  applyNow: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
});

export default CampaignDetail;
