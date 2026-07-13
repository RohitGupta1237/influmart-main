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
import { requestSocialVerification } from "../../controller/socialVerificationController";

const label = (p) => (p === "instagram" ? "Instagram" : p === "facebook" ? "Facebook" : p);

// Two-step manual verification popup:
//  1. user enters their social username -> we request an OTP
//  2. we show the OTP + instructions to DM it to the official Influmart account
const VerifySocialModal = ({ visible, platform, influencerId, onClose, showAlert }) => {
  const [step, setStep] = React.useState(1);
  const [username, setUsername] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [otp, setOtp] = React.useState("");
  const [influmartHandle, setInflumartHandle] = React.useState("influmart");

  // Reset whenever the modal is (re)opened for a platform.
  React.useEffect(() => {
    if (visible) {
      setStep(1);
      setUsername("");
      setOtp("");
      setLoading(false);
    }
  }, [visible, platform]);

  const handleGetOtp = async () => {
    const handle = username.trim().replace(/^@/, "");
    if (!handle) {
      showAlert?.("Error", "Please enter your username");
      return;
    }
    setLoading(true);
    try {
      const data = await requestSocialVerification(influencerId, platform, handle);
      setOtp(data.otp);
      setInflumartHandle(data.influmartHandle || "influmart");
      setStep(2);
    } catch (err) {
      const msg = err?.response?.data?.message || "Could not create verification request";
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
            <Text style={styles.title}>Verify {label(platform)}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          {step === 1 ? (
            <>
              <Text style={styles.body}>
                Enter your {label(platform)} username. We'll give you a one-time code to
                prove you own the account.
              </Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder={`Your ${label(platform)} username`}
                placeholderTextColor={Color.colorLightgray}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.btnDisabled]}
                onPress={handleGetOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Color.colorWhite} />
                ) : (
                  <Text style={styles.primaryBtnText}>Get OTP</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.body}>Your verification code:</Text>
              <View style={styles.otpBox}>
                <Text style={styles.otpText}>{otp}</Text>
              </View>
              <Text style={styles.instructions}>
                Send this code as a Direct Message from your {label(platform)} account{" "}
                <Text style={styles.bold}>@{username.trim().replace(/^@/, "")}</Text> to the
                official Influmart {label(platform)} account{" "}
                <Text style={styles.bold}>@{influmartHandle}</Text>.
              </Text>
              <Text style={styles.note}>
                We'll match your DM and verify your account within 24 hours. This code
                expires in 24 hours.
              </Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={onClose}>
                <Text style={styles.primaryBtnText}>Done</Text>
              </TouchableOpacity>
            </>
          )}
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
    marginBottom: 14,
    fontFamily: FontFamily.beVietnamProRegular,
  },
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
  otpBox: {
    backgroundColor: Color.colorBlack,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1A80E5",
  },
  otpText: {
    color: Color.colorWhite,
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: 8,
    fontFamily: FontFamily.beVietnamProBold,
  },
  instructions: {
    color: Color.colorLightgray,
    fontSize: FontSize.size_sm || 14,
    lineHeight: 20,
    marginBottom: 10,
    fontFamily: FontFamily.beVietnamProRegular,
  },
  bold: { color: Color.colorWhite, fontWeight: "700" },
  note: {
    color: Color.colorLightgray,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 16,
    fontStyle: "italic",
  },
});

export default VerifySocialModal;
