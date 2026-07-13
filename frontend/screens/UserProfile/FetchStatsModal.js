import * as React from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Color, FontFamily, FontSize, Padding, Border } from "../../GlobalStyles";
import { fetchLatestStats } from "../../controller/socialVerificationController";

const label = (p) => (p === "instagram" ? "Instagram" : p === "facebook" ? "Facebook" : p);

// Popup to pull fresh public stats (via RapidAPI) for a verified account.
const FetchStatsModal = ({ visible, platform, username, influencerId, onClose, onSuccess, showAlert }) => {
  const [loading, setLoading] = React.useState(false);
  const storedHandle = (username || "").replace(/^@/, "");
  const [input, setInput] = React.useState("");

  React.useEffect(() => {
    if (visible) setInput(storedHandle);
  }, [visible, storedHandle]);

  const handleFetch = async () => {
    const handle = (input || "").trim().replace(/^@/, "");
    if (!handle) {
      showAlert?.("Error", "Please enter your username");
      return;
    }
    setLoading(true);
    try {
      await fetchLatestStats(influencerId, platform, handle);
      showAlert?.("Success", `${label(platform)} statistics updated.`);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      const msg = err?.response?.data?.message || "Could not fetch statistics right now.";
      showAlert?.("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Latest {label(platform)} stats</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.body}>
            {storedHandle
              ? "Fetch the current public statistics and update your profile. This may take a few seconds."
              : `Enter your ${label(platform)} username to pull the current public statistics.`}
          </Text>

          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={`Your ${label(platform)} username`}
            placeholderTextColor={Color.colorLightgray}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={handleFetch}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Color.colorWhite} />
            ) : (
              <Text style={styles.primaryBtnText}>Fetch latest statistics</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: Padding.p_base,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: Color.colorGray_200 || "#1c1c1e",
    borderRadius: Border.br_base || 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Color.colorDarkslategray_100 || "#333",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    color: Color.colorWhite,
    fontSize: FontSize.size_xl || 18,
    fontWeight: "700",
    fontFamily: FontFamily.beVietnamProBold,
  },
  close: { color: Color.colorLightgray, fontSize: 18, fontWeight: "700" },
  body: {
    color: Color.colorLightgray,
    fontSize: FontSize.size_sm || 14,
    lineHeight: 20,
    marginBottom: 18,
    fontFamily: FontFamily.beVietnamProRegular,
  },
  bold: { color: Color.colorWhite, fontWeight: "700" },
  input: {
    backgroundColor: Color.colorBlack,
    borderWidth: 1,
    borderColor: Color.colorDarkslategray_100 || "#333",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Color.colorWhite,
    fontSize: FontSize.size_sm || 14,
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: "#1A80E5",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: {
    color: Color.colorWhite,
    fontSize: FontSize.size_sm || 14,
    fontWeight: "700",
    fontFamily: FontFamily.beVietnamProBold,
  },
});

export default FetchStatsModal;
