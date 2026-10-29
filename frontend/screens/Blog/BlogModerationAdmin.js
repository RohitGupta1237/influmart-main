import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../util/ThemeContext";
import { deleteBlogArticleAsAdmin, getAllBlogArticlesForAdmin, getPendingBlogArticles, reviewBlogArticle } from "../../controller/blogController";
import { useAlert } from "../../util/AlertContext";

const BlogModerationAdmin = ({ navigation }) => {
  const { theme } = useTheme();
  const { showAlert } = useAlert();
  const [secret, setSecret] = React.useState("");
  const [unlocked, setUnlocked] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [busyId, setBusyId] = React.useState("");
  const [confirmDeleteId, setConfirmDeleteId] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("pending");
  const [articles, setArticles] = React.useState([]);
  const [notes, setNotes] = React.useState({});
  const [error, setError] = React.useState("");
  const textColor = theme.text || "#171722";
  const subText = theme.subText || "#747b8c";
  const cardColor = theme.card || "#fff";
  const borderColor = theme.cardBorder || "#e7e9ef";

  const load = React.useCallback(async (value = secret, tab = activeTab) => {
    if (!value) return;
    setLoading(true); setError("");
    try {
      const list = tab === "all" ? await getAllBlogArticlesForAdmin(value) : await getPendingBlogArticles(value);
      await AsyncStorage.setItem("adminSecret", value);
      setSecret(value); setArticles(list); setUnlocked(true);
    } catch (err) {
      const message = err?.response?.status === 401 ? "Admin secret is incorrect." : "Could not load pending articles.";
      setError(message); setUnlocked(false);
    } finally { setLoading(false); }
  }, [secret, activeTab]);

  React.useEffect(() => {
    AsyncStorage.getItem("adminSecret").then((saved) => { if (saved) load(saved); });
  }, []);

  const review = async (article, action) => {
    setBusyId(article._id);
    try {
      await reviewBlogArticle(article._id, action, notes[article._id] || "", secret);
      setArticles((items) => items.filter((item) => item._id !== article._id));
      showAlert(action === "approve" ? "Article published" : "Article rejected", action === "approve" ? "It is now visible on the public blog." : "The author can see your note in their submissions.");
    } catch (err) {
      showAlert("Review failed", err?.response?.data?.message || "Please try again.");
    } finally { setBusyId(""); }
  };

  const deleteArticle = async (article) => {
    setBusyId(article._id);
    try {
      await deleteBlogArticleAsAdmin(article._id, secret);
      setArticles((items) => items.filter((item) => item._id !== article._id));
      setConfirmDeleteId("");
      showAlert("Article deleted", article.status === "approved" ? "The published article has been removed from the public blog." : "The article has been permanently deleted.");
    } catch (err) {
      showAlert("Delete failed", err?.response?.data?.message || "Please try again.");
    } finally { setBusyId(""); }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg || "#f7f8fc" }]}>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}><Ionicons name="arrow-back" size={22} color={textColor} /><Text style={{ color: textColor, fontWeight: "700" }}>Admin</Text></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Blog review</Text>
        <TouchableOpacity onPress={() => load()} style={styles.refresh}><Ionicons name="refresh" size={18} color="#7c3aed" /><Text style={styles.refreshText}>Refresh</Text></TouchableOpacity>
      </View>
      {!unlocked ? (
        <View style={[styles.authCard, { backgroundColor: cardColor, borderColor }]}>
          <View style={styles.authIcon}><Ionicons name="shield-checkmark-outline" size={26} color="#7c3aed" /></View>
          <Text style={[styles.authTitle, { color: textColor }]}>Admin access</Text>
          <Text style={[styles.authHelp, { color: subText }]}>Enter the admin secret to review article submissions.</Text>
          <TextInput value={secret} onChangeText={setSecret} secureTextEntry autoCapitalize="none" placeholder="Admin secret" placeholderTextColor={subText} style={[styles.input, { color: textColor, backgroundColor: theme.inputBg || cardColor, borderColor }]} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity style={styles.primary} onPress={() => load()} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Unlock queue</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.tabs, { backgroundColor: cardColor, borderColor }]}>
            <TouchableOpacity onPress={() => { setActiveTab("pending"); load(secret, "pending"); }} style={[styles.tab, activeTab === "pending" && styles.activeTab]}><Text style={[styles.tabText, activeTab === "pending" && styles.activeTabText]}>Pending</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => { setActiveTab("all"); load(secret, "all"); }} style={[styles.tab, activeTab === "all" && styles.activeTab]}><Text style={[styles.tabText, activeTab === "all" && styles.activeTabText]}>All articles</Text></TouchableOpacity>
          </View>
          <Text style={[styles.count, { color: subText }]}>{articles.length} {articles.length === 1 ? "article" : "articles"}{activeTab === "pending" ? " waiting for review" : ""}</Text>
          {loading ? <ActivityIndicator color="#7c3aed" style={{ margin: 25 }} /> : null}
          {!loading && articles.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: cardColor, borderColor }]}><Ionicons name="checkmark-circle-outline" size={34} color="#16824b" /><Text style={[styles.emptyTitle, { color: textColor }]}>{activeTab === "pending" ? "You’re all caught up" : "No articles yet"}</Text><Text style={[styles.authHelp, { color: subText }]}>{activeTab === "pending" ? "New submissions will appear here." : "Submitted articles will appear here."}</Text></View>
          ) : articles.map((article) => (
            <View key={article._id} style={[styles.articleCard, { backgroundColor: cardColor, borderColor }]}>
              <View style={styles.meta}><Text style={styles.role}>{article.authorRole === "brand" ? "BRAND" : "CREATOR"}</Text><Text style={[styles.metaText, { color: subText }]}>{article.authorName} · {new Date(article.submittedAt || article.createdAt).toLocaleDateString()}</Text></View>
              <Text style={[styles.title, { color: textColor }]}>{article.title}</Text>
              <Text style={[styles.summary, { color: subText }]}>{article.summary}</Text>
              {article.coverImageUrl ? <Text style={styles.imageUrl} numberOfLines={1}>Cover: {article.coverImageUrl}</Text> : null}
              <Text selectable style={[styles.body, { color: textColor }]} numberOfLines={12}>{article.content}</Text>
              <TextInput value={notes[article._id] || ""} onChangeText={(value) => setNotes((prev) => ({ ...prev, [article._id]: value }))} placeholder="Optional note for the author if rejecting" placeholderTextColor={subText} multiline style={[styles.note, { color: textColor, backgroundColor: theme.inputBg || cardColor, borderColor }]} />
              {article.status === "pending" ? <View style={styles.actions}>
                <TouchableOpacity disabled={busyId === article._id} onPress={() => review(article, "reject")} style={styles.rejectButton}><Ionicons name="close" size={18} color="#b42318" /><Text style={styles.rejectText}>Reject</Text></TouchableOpacity>
                <TouchableOpacity disabled={busyId === article._id} onPress={() => review(article, "approve")} style={styles.approveButton}>
                  {busyId === article._id ? <ActivityIndicator color="#fff" /> : <><Ionicons name="checkmark" size={18} color="#fff" /><Text style={styles.primaryText}>Approve & publish</Text></>}
                </TouchableOpacity>
              </View> : null}
              {confirmDeleteId === article._id ? (
                <View style={styles.deleteConfirm}>
                  <Text style={[styles.deleteConfirmText, { color: subText }]}>{article.status === "approved" ? "This published article will be removed from the blog. Delete it?" : "Delete this article permanently?"}</Text>
                  <TouchableOpacity disabled={busyId === article._id} onPress={() => setConfirmDeleteId("")} style={styles.cancelDelete}><Text style={styles.cancelDeleteText}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity disabled={busyId === article._id} onPress={() => deleteArticle(article)} style={styles.confirmDelete}>
                    {busyId === article._id ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.confirmDeleteText}>Delete</Text>}
                  </TouchableOpacity>
                </View>
              ) : <TouchableOpacity disabled={!!busyId} onPress={() => setConfirmDeleteId(article._id)} style={styles.deleteButton}><Ionicons name="trash-outline" size={16} color="#b42318" /><Text style={styles.deleteButtonText}>Delete article</Text></TouchableOpacity>}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 66, paddingHorizontal: 20, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { width: 80, flexDirection: "row", alignItems: "center", gap: 6 },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  refresh: { width: 80, flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 4 },
  refreshText: { color: "#7c3aed", fontSize: 12, fontWeight: "700" },
  content: { width: "100%", maxWidth: 900, alignSelf: "center", padding: 20, paddingBottom: 50 },
  count: { fontSize: 13, marginBottom: 14 },
  tabs: { flexDirection: "row", alignSelf: "flex-start", borderWidth: 1, borderRadius: 12, padding: 4, marginBottom: 14 },
  tab: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 9 },
  activeTab: { backgroundColor: "#7c3aed" },
  tabText: { color: "#747b8c", fontSize: 13, fontWeight: "700" },
  activeTabText: { color: "#fff" },
  articleCard: { borderWidth: 1, borderRadius: 16, padding: 20, marginBottom: 14 },
  meta: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  role: { color: "#7c3aed", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  metaText: { fontSize: 12 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 8 },
  summary: { fontSize: 14, lineHeight: 21, marginBottom: 14 },
  imageUrl: { color: "#7c3aed", fontSize: 12, marginBottom: 12 },
  body: { fontSize: 14, lineHeight: 22, marginBottom: 14 },
  note: { minHeight: 70, borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 13, textAlignVertical: "top" },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 14 },
  rejectButton: { minHeight: 43, borderRadius: 10, borderWidth: 1, borderColor: "#f1b5b5", paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 5 },
  rejectText: { color: "#b42318", fontSize: 13, fontWeight: "800" },
  approveButton: { minHeight: 43, borderRadius: 10, backgroundColor: "#16824b", paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  primaryText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  authCard: { width: "92%", maxWidth: 460, alignSelf: "center", marginTop: 60, borderWidth: 1, borderRadius: 18, padding: 24, alignItems: "center" },
  authIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: "#f1e9ff", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  authTitle: { fontSize: 22, fontWeight: "800" },
  authHelp: { fontSize: 13, lineHeight: 20, textAlign: "center", marginVertical: 8 },
  input: { width: "100%", minHeight: 48, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, marginVertical: 10 },
  primary: { minHeight: 46, width: "100%", backgroundColor: "#7c3aed", borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 8 },
  error: { color: "#b42318", fontSize: 13, marginTop: 6 },
  deleteButton: { alignSelf: "flex-end", flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 9, marginTop: 6 },
  deleteButtonText: { color: "#b42318", fontSize: 13, fontWeight: "800" },
  deleteConfirm: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end", gap: 8, marginTop: 12, padding: 12, backgroundColor: "#fff5f5", borderRadius: 10 },
  deleteConfirmText: { flexBasis: "100%", fontSize: 12, lineHeight: 18 },
  cancelDelete: { minHeight: 36, borderWidth: 1, borderColor: "#e7e9ef", borderRadius: 9, paddingHorizontal: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  cancelDeleteText: { color: "#343442", fontSize: 12, fontWeight: "700" },
  confirmDelete: { minHeight: 36, minWidth: 75, borderRadius: 9, backgroundColor: "#b42318", paddingHorizontal: 13, alignItems: "center", justifyContent: "center" },
  confirmDeleteText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  empty: { padding: 34, borderWidth: 1, borderRadius: 16, alignItems: "center", gap: 10 },
  emptyTitle: { fontSize: 19, fontWeight: "800" },
});

export default BlogModerationAdmin;
