import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../util/ThemeContext";
import { getMyArticles, submitBlogArticle } from "../../controller/blogController";
import { useAlert } from "../../util/AlertContext";

const statusText = { pending: "In review", approved: "Published", rejected: "Not approved" };
const statusColor = { pending: "#b7791f", approved: "#16824b", rejected: "#c2414b" };

const BlogSubmitScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { showAlert } = useAlert();
  const [title, setTitle] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [content, setContent] = React.useState("");
  const [coverImageUrl, setCoverImageUrl] = React.useState("");
  const [confirmed, setConfirmed] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [articles, setArticles] = React.useState([]);
  const [loggedIn, setLoggedIn] = React.useState(true);
  const colors = {
    bg: theme.bg || "#f7f8fc",
    card: theme.card || "#fff",
    text: theme.text || "#171722",
    sub: theme.subText || "#747b8c",
    border: theme.cardBorder || "#e7e9ef",
    input: theme.inputBg || (theme.isDark ? "#1d1d25" : "#fff"),
  };

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      setLoggedIn(!!token);
      if (token) setArticles(await getMyArticles());
      else setArticles([]);
    } catch (_error) {
      showAlert("Could not load submissions", "Please try again.");
    } finally { setLoading(false); }
  }, [showAlert]);

  React.useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!title.trim() || !summary.trim() || !content.trim()) {
      showAlert("Complete the article", "Add a heading, short summary, and article content.");
      return;
    }
    if (!confirmed) {
      showAlert("Confirm submission", "Check the box to send your article to the admin for review.");
      return;
    }
    setSaving(true);
    try {
      await submitBlogArticle({ title, summary, content, coverImageUrl, submitForReview: true });
      setTitle(""); setSummary(""); setContent(""); setCoverImageUrl(""); setConfirmed(false);
      await load();
      showAlert("Submitted for review", "Your article will appear on the blog after admin approval.");
    } catch (error) {
      showAlert("Submission failed", error?.response?.data?.message || "Please try again.");
    } finally { setSaving(false); }
  };

  const renderField = ({ label, value, onChangeText, placeholder, multiline, maxLength, minHeight = 52 }) => (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.sub}
        multiline={multiline}
        maxLength={maxLength}
        textAlignVertical={multiline ? "top" : "center"}
        style={[styles.input, { color: colors.text, backgroundColor: colors.input, borderColor: colors.border, minHeight }]}
      />
      <Text style={[styles.counter, { color: colors.sub }]}>{value.length}/{maxLength}</Text>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}><Ionicons name="arrow-back" size={22} color={colors.text} /><Text style={[styles.headerBackText, { color: colors.text }]}>Settings</Text></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Post an article</Text>
        <View style={{ width: 80 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.formIntro}>
            <View style={styles.formIcon}><Ionicons name="create-outline" size={24} color="#7c3aed" /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>Share your story</Text>
              <Text style={[styles.help, { color: colors.sub }]}>Your article stays private until the Influmart team approves it.</Text>
            </View>
          </View>

          {!loggedIn ? (
            <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate("BrandorInfluencer")}><Text style={styles.primaryText}>Sign in to submit</Text></TouchableOpacity>
          ) : (
            <>
              {renderField({ label: "Article heading", value: title, onChangeText: setTitle, placeholder: "Give your story a clear title", maxLength: 140 })}
              {renderField({ label: "Short summary", value: summary, onChangeText: setSummary, placeholder: "A short introduction shown on blog cards", multiline: true, maxLength: 280, minHeight: 86 })}
              {renderField({ label: "Cover image URL (optional)", value: coverImageUrl, onChangeText: setCoverImageUrl, placeholder: "https://…", maxLength: 2048 })}
              {renderField({ label: "Article content", value: content, onChangeText: setContent, placeholder: "Write your article here…", multiline: true, maxLength: 30000, minHeight: 260 })}

              <TouchableOpacity style={styles.checkRow} onPress={() => setConfirmed((value) => !value)} accessibilityRole="checkbox" accessibilityState={{ checked: confirmed }}>
                <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>{confirmed && <Ionicons name="checkmark" size={15} color="#fff" />}</View>
                <Text style={[styles.checkText, { color: colors.text }]}>I confirm this is appropriate content and send it to the admin for review.</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, saving && { opacity: 0.65 }]} disabled={saving} onPress={submit}>
                {saving ? <ActivityIndicator color="#fff" /> : <><Ionicons name="paper-plane-outline" size={17} color="#fff" /><Text style={styles.primaryText}>Submit for review</Text></>}
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.submissionsHeader}><Text style={[styles.sectionTitle, { color: colors.text }]}>My submissions</Text><TouchableOpacity onPress={load}><Text style={styles.refresh}>Refresh</Text></TouchableOpacity></View>
        {loading ? <ActivityIndicator color="#7c3aed" style={{ marginVertical: 24 }} /> : articles.length === 0 ? (
          <Text style={[styles.empty, { color: colors.sub }]}>Your submitted articles and review status will appear here.</Text>
        ) : articles.map((article) => (
          <View key={article._id} style={[styles.submissionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.submissionTop}><Text style={[styles.submissionTitle, { color: colors.text }]}>{article.title}</Text><Text style={[styles.status, { color: statusColor[article.status] || colors.sub }]}>{statusText[article.status] || article.status}</Text></View>
            <Text style={[styles.summaryText, { color: colors.sub }]} numberOfLines={2}>{article.summary}</Text>
            {article.rejectionNote ? <Text style={styles.rejection}>Admin note: {article.rejectionNote}</Text> : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 66, paddingHorizontal: 20, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { width: 80, flexDirection: "row", alignItems: "center", gap: 6 },
  headerBackText: { fontSize: 13, fontWeight: "700" },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  scroll: { padding: 20, paddingBottom: 50, width: "100%", maxWidth: 900, alignSelf: "center" },
  formCard: { borderWidth: 1, borderRadius: 18, padding: 22, marginBottom: 28 },
  formIntro: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 22 },
  formIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: "#f1e9ff", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "800" },
  help: { fontSize: 13, lineHeight: 19, marginTop: 4 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "700", marginBottom: 7 },
  input: { width: "100%", borderWidth: 1, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 12, fontSize: 14 },
  counter: { textAlign: "right", fontSize: 10, marginTop: 4 },
  checkRow: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginTop: 5, marginBottom: 18 },
  checkbox: { width: 21, height: 21, borderRadius: 6, borderWidth: 1.5, borderColor: "#a5a5b5", alignItems: "center", justifyContent: "center" },
  checkboxChecked: { borderColor: "#7c3aed", backgroundColor: "#7c3aed" },
  checkText: { flex: 1, fontSize: 13, lineHeight: 20 },
  primaryButton: { minHeight: 48, backgroundColor: "#7c3aed", borderRadius: 12, paddingHorizontal: 18, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" },
  primaryText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  submissionsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: "800" },
  refresh: { color: "#7c3aed", fontWeight: "700" },
  empty: { paddingVertical: 18, fontSize: 14 },
  submissionCard: { padding: 16, borderWidth: 1, borderRadius: 14, marginBottom: 10 },
  submissionTop: { flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "flex-start" },
  submissionTitle: { flex: 1, fontSize: 15, fontWeight: "800" },
  status: { fontSize: 12, fontWeight: "800" },
  summaryText: { fontSize: 13, lineHeight: 19, marginTop: 8 },
  rejection: { marginTop: 9, color: "#b42318", fontSize: 12, lineHeight: 18 },
});

export default BlogSubmitScreen;
