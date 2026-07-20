import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { openPrivacyPolicy } from "../../util/legalLinks";

// The Privacy Policy now lives as a hosted page (influmart.in/privacy.html) so it
// has a public URL for Google OAuth + Play Store verification. This screen just
// opens it, so any old route/link still lands on the current policy.
const PPScreen = ({ navigation }) => {
  React.useEffect(() => {
    openPrivacyPolicy();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.body}>Opening our Privacy Policy…</Text>
      <TouchableOpacity style={styles.btn} onPress={openPrivacyPolicy}>
        <Text style={styles.btnText}>Open Privacy Policy</Text>
      </TouchableOpacity>
      {navigation && (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Go back</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "700", color: "#1c1c1e", marginBottom: 8 },
  body: { fontSize: 14, color: "#637087", marginBottom: 20 },
  btn: { backgroundColor: "#1A80E5", paddingVertical: 12, paddingHorizontal: 22, borderRadius: 10 },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  back: { color: "#9aa3b2", fontSize: 14, marginTop: 16 },
});

export default PPScreen;
