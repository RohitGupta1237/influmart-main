import * as React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Color, FontFamily, FontSize, Padding } from "../GlobalStyles";
import { useAlert } from "../util/AlertContext";
import {
  getPendingVerifications,
  approveVerification,
  rejectVerification,
} from "../controller/socialVerificationController";
import { getAllCoupons, setCoupon } from "../controller/couponController";

// Admin-only screen to moderate manual social-verification requests.
// Gated by an admin secret (matches ADMIN_SECRET on the backend).
const SocialVerificationAdmin = () => {
  const navigation = useNavigation();
  const { showAlert } = useAlert();
  const [secret, setSecret] = React.useState("");
  const [authed, setAuthed] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [requests, setRequests] = React.useState([]);
  const [coupons, setCoupons] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("adminSecret");
      if (saved) {
        setSecret(saved);
        load(saved);
      }
    })();
  }, []);

  const load = async (sec) => {
    setLoading(true);
    try {
      const data = await getPendingVerifications(sec);
      setRequests(data);
      setAuthed(true);
      await AsyncStorage.setItem("adminSecret", sec);
      try { setCoupons(await getAllCoupons(sec)); } catch (e) {}
    } catch (err) {
      const msg = err?.response?.status === 401 ? "Wrong admin secret" : "Failed to load";
      showAlert("Error", msg);
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  };

  // Toggle a coupon: activating deactivates the others; tapping an active one closes it.
  const toggleCoupon = async (coupon) => {
    try {
      const updated = await setCoupon(coupon.code, !coupon.active, secret);
      setCoupons(updated);
    } catch (err) {
      showAlert("Error", err?.response?.data?.message || "Failed to update coupon");
    }
  };

  const act = async (id, kind) => {
    try {
      if (kind === "approve") await approveVerification(id, secret);
      else await rejectVerification(id, secret);
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      showAlert("Error", err?.response?.data?.message || "Action failed");
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>Social Verifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {!authed ? (
        <View style={styles.authBox}>
          <Text style={styles.label}>Enter admin secret</Text>
          <TextInput
            style={styles.input}
            value={secret}
            onChangeText={setSecret}
            placeholder="Admin secret"
            placeholderTextColor={Color.colorLightgray}
            secureTextEntry
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={() => load(secret)} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={Color.colorWhite} />
            ) : (
              <Text style={styles.primaryBtnText}>Unlock</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: Padding.p_base }}>
          <TouchableOpacity onPress={() => load(secret)} style={styles.refresh}>
            <Text style={styles.refreshText}>{loading ? "Refreshing..." : "↻ Refresh"}</Text>
          </TouchableOpacity>

          {/* Coupons */}
          <Text style={styles.sectionTitle}>Discount Coupons</Text>
          <Text style={styles.sectionHint}>
            Activate one coupon — users see it in the subscription screen. Tap the active one to close it.
          </Text>
          <View style={styles.couponRow}>
            {coupons.map((c) => (
              <TouchableOpacity
                key={c.code}
                style={[styles.couponBtn, c.active && styles.couponBtnActive]}
                onPress={() => toggleCoupon(c)}
              >
                <Text style={[styles.couponBtnText, c.active && styles.couponBtnTextActive]}>
                  {c.label}
                </Text>
                <Text style={[styles.couponState, c.active && styles.couponStateActive]}>
                  {c.active ? "ACTIVE — tap to close" : "tap to activate"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Verification Requests</Text>
          {requests.length === 0 && (
            <Text style={styles.empty}>No pending requests.</Text>
          )}

          {requests.map((r) => (
            <View key={r._id} style={styles.card}>
              <Text style={styles.platform}>{r.platform.toUpperCase()}</Text>
              <Text style={styles.rowText}>
                Influencer: <Text style={styles.bold}>{r.influencerName}</Text> (@{r.influencerUserName})
              </Text>
              <Text style={styles.rowText}>
                Claimed handle: <Text style={styles.bold}>@{r.socialUsername}</Text>
              </Text>
              <Text style={styles.rowText}>
                Expected OTP in DM: <Text style={styles.otp}>{r.otp}</Text>
              </Text>
              <Text style={styles.hint}>
                Approve only if you received a DM from @{r.socialUsername} containing {r.otp}.
              </Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approve]}
                  onPress={() => act(r._id, "approve")}
                >
                  <Text style={styles.actionText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.reject]}
                  onPress={() => act(r._id, "reject")}
                >
                  <Text style={styles.actionText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Color.colorBlack },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Padding.p_base,
    borderBottomWidth: 1,
    borderColor: Color.colorDarkslategray_100 || "#333",
  },
  back: { color: "#1A80E5", fontSize: 16 },
  headerText: {
    color: Color.colorWhite,
    fontSize: FontSize.size_xl || 18,
    fontWeight: "700",
    fontFamily: FontFamily.beVietnamProBold,
  },
  authBox: { padding: Padding.p_base },
  label: { color: Color.colorWhite, marginBottom: 8, fontSize: 14 },
  input: {
    backgroundColor: "#1c1c1e",
    borderWidth: 1,
    borderColor: Color.colorDarkslategray_100 || "#333",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Color.colorWhite,
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: "#1A80E5",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: Color.colorWhite, fontWeight: "700" },
  refresh: { alignSelf: "flex-end", marginBottom: 12 },
  refreshText: { color: "#1A80E5", fontSize: 14 },
  sectionTitle: {
    color: Color.colorWhite, fontSize: 16, fontWeight: "700",
    marginTop: 8, marginBottom: 4,
  },
  sectionHint: { color: "#888", fontSize: 12, marginBottom: 12 },
  couponRow: { flexDirection: "row", gap: 8, marginBottom: 24, flexWrap: "wrap" },
  couponBtn: {
    flex: 1, minWidth: 90, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 8,
    alignItems: "center", backgroundColor: "#1c1c1e",
    borderWidth: 1, borderColor: Color.colorDarkslategray_100 || "#333",
  },
  couponBtnActive: { backgroundColor: "#1e9e5a", borderColor: "#1e9e5a" },
  couponBtnText: { color: Color.colorWhite, fontWeight: "700", fontSize: 15 },
  couponBtnTextActive: { color: Color.colorWhite },
  couponState: { color: "#888", fontSize: 10, marginTop: 4, textAlign: "center" },
  couponStateActive: { color: "#eaffea" },
  empty: { color: Color.colorLightgray, textAlign: "center", marginTop: 40 },
  card: {
    backgroundColor: "#1c1c1e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Color.colorDarkslategray_100 || "#333",
  },
  platform: {
    color: "#1A80E5",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 8,
  },
  rowText: { color: Color.colorLightgray, fontSize: 14, marginBottom: 4 },
  bold: { color: Color.colorWhite, fontWeight: "700" },
  otp: { color: Color.colorWhite, fontWeight: "700", letterSpacing: 2 },
  hint: { color: "#888", fontSize: 12, fontStyle: "italic", marginTop: 6, marginBottom: 12 },
  actions: { flexDirection: "row", gap: 10 },
  actionBtn: { flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  approve: { backgroundColor: "#1e9e5a" },
  reject: { backgroundColor: "#c0392b" },
  actionText: { color: Color.colorWhite, fontWeight: "700" },
});

export default SocialVerificationAdmin;
