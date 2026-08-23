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
import { getAdminMetrics, getBusinessCollabs } from "../controller/adminMetricsController";

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
  const [metrics, setMetrics] = React.useState(null);
  const [period, setPeriod] = React.useState("all");
  const [bizCollabs, setBizCollabs] = React.useState([]);

  // Refetch just the metrics when the period changes (once unlocked).
  React.useEffect(() => {
    if (!authed || !secret) return;
    (async () => {
      try { setMetrics(await getAdminMetrics(secret, period)); } catch (e) {}
    })();
  }, [period, authed]);

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
      try { setMetrics(await getAdminMetrics(sec, period)); } catch (e) {}
      try { setBizCollabs(await getBusinessCollabs(sec)); } catch (e) {}
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

          {/* Business metrics */}
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.sectionHint}>
            Live business numbers from the database. Web traffic (visitors, pageviews) lives on the
            Vercel Analytics dashboard.
          </Text>

          {/* Period selector */}
          <View style={styles.periodRow}>
            {[
              { key: "today", label: "Today" },
              { key: "7d", label: "7 days" },
              { key: "30d", label: "30 days" },
              { key: "all", label: "All time" },
            ].map((p) => (
              <TouchableOpacity
                key={p.key}
                style={[styles.periodBtn, period === p.key && styles.periodBtnActive]}
                onPress={() => setPeriod(p.key)}
              >
                <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {metrics ? (
            <>
              {/* Website / app traffic (first-party) */}
              <Text style={styles.subLabel}>Traffic</Text>
              <View style={styles.statGrid}>
                {[
                  { label: "Unique visitors", value: metrics.traffic?.uniqueVisitors },
                  { label: "Page/screen views", value: metrics.traffic?.pageViews },
                  { label: "Web views", value: metrics.traffic?.webViews },
                  { label: "App views", value: metrics.traffic?.appViews },
                ].map((s) => (
                  <View key={s.label} style={styles.statCard}>
                    <Text style={styles.statValue}>{s.value ?? "—"}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>

              {/* Scoped to the selected period */}
              <Text style={styles.subLabel}>
                {period === "all" ? "All time" : `New in ${period === "today" ? "today" : `last ${period}`}`}
              </Text>
              <View style={styles.statGrid}>
                {[
                  { label: period === "all" ? "Influencers" : "New influencers", value: metrics.window?.newInfluencers },
                  { label: period === "all" ? "Brands" : "New brands", value: metrics.window?.newBrands },
                  { label: period === "all" ? "Paid subscriptions" : "New paid subs", value: metrics.window?.newPaidSubscriptions },
                  { label: "Deals sealed", value: metrics.window?.dealsSealed },
                  { label: "GMV (₹ sealed)", value: `₹${Number(metrics.window?.gmv || 0).toLocaleString("en-IN")}` },
                ].map((s) => (
                  <View key={s.label} style={styles.statCard}>
                    <Text style={styles.statValue}>{s.value ?? "—"}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>

              {/* Always absolute (current totals) */}
              <Text style={styles.subLabel}>Current totals</Text>
              <View style={styles.statGrid}>
                {[
                  { label: "Total users", value: metrics.lifetime?.totalUsers },
                  { label: "Active subscriptions", value: metrics.lifetime?.activeSubscriptions },
                  { label: "Open applications", value: metrics.lifetime?.openApplications },
                  { label: "Pending verifications", value: metrics.lifetime?.pendingVerifications },
                ].map((s) => (
                  <View key={s.label} style={styles.statCard}>
                    <Text style={styles.statValue}>{s.value ?? "—"}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.sectionHint}>Loading metrics…</Text>
          )}

          {/* Business Collaboration Requests (premium openings) */}
          <Text style={styles.sectionTitle}>Business Collaboration Requests</Text>
          <Text style={styles.sectionHint}>
            Campaigns where the brand asked Influmart to manage the collaboration (premium). These
            are not shown to influencers.
          </Text>
          {bizCollabs.length === 0 ? (
            <Text style={styles.sectionHint}>No premium requests yet.</Text>
          ) : (
            bizCollabs.map((c) => (
              <View key={c._id} style={styles.bizCard}>
                <Text style={styles.bizTitle}>{c.campaignTitle || "Untitled campaign"}</Text>
                <Text style={styles.bizBrand}>
                  {c.brand?.brandName || "Brand"}
                  {c.brand?.email ? ` · ${c.brand.email}` : ""}
                  {c.brand?.phoneNumber ? ` · ${c.brand.phoneNumber}` : ""}
                </Text>
                <Text style={styles.bizMeta}>
                  {c.campaignType ? `Type: ${c.campaignType}   ` : ""}
                  {c.earningCapacity ? `₹${c.earningCapacity.min || 0}–₹${c.earningCapacity.max || 0}   ` : ""}
                  {c.numberOfInfluencers ? `${c.numberOfInfluencers} influencers` : ""}
                </Text>
                {c.campaignTimelines ? <Text style={styles.bizMeta}>{c.campaignTimelines}</Text> : null}
              </View>
            ))
          )}

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
  periodRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  periodBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2a2a2e",
    backgroundColor: "#1c1c1e",
  },
  periodBtnActive: { backgroundColor: "#1A80E5", borderColor: "#1A80E5" },
  periodText: { color: "#9aa1ad", fontSize: 13, fontWeight: "600" },
  periodTextActive: { color: "#fff" },
  subLabel: {
    color: "#9aa1ad",
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
    fontFamily: FontFamily.beVietnamProMedium,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  bizCard: {
    backgroundColor: "#1c1c1e",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a2e",
    padding: 14,
    marginBottom: 10,
  },
  bizTitle: { color: "#fff", fontSize: 15, fontWeight: "700", fontFamily: FontFamily.beVietnamProBold },
  bizBrand: { color: "#8ab4f8", fontSize: 13, marginTop: 4 },
  bizMeta: { color: "#9aa1ad", fontSize: 12, marginTop: 4 },
  statCard: {
    flexGrow: 1,
    flexBasis: 150,
    minWidth: 130,
    backgroundColor: "#1c1c1e",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a2e",
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  statValue: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    fontFamily: FontFamily.beVietnamProBold,
  },
  statLabel: {
    color: "#9aa1ad",
    fontSize: 12,
    marginTop: 4,
    fontFamily: FontFamily.beVietnamProRegular,
  },
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
