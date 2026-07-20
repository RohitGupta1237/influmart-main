import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { openTerms } from "../../util/legalLinks";

// The Terms of Service now lives as a hosted page (influmart.in/terms.html) with a
// public URL. This screen just opens it, so any old route/link lands on the
// current terms.
const TosScreen = ({ navigation }) => {
  React.useEffect(() => {
    openTerms();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Terms of Service</Text>
      <Text style={styles.body}>Opening our Terms of Service…</Text>
      <TouchableOpacity style={styles.btn} onPress={openTerms}>
        <Text style={styles.btnText}>Open Terms of Service</Text>
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

export default TosScreen;
