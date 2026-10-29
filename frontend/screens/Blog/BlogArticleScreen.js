import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../util/ThemeContext";
import { getPublishedArticle } from "../../controller/blogController";
import { FontFamily } from "../../GlobalStyles";

const BlogArticleScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const [article, setArticle] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const id = route?.params?.articleId;

  React.useEffect(() => {
    let active = true;
    getPublishedArticle(id).then((item) => { if (active) setArticle(item); })
      .catch((err) => { if (active) setError(err?.response?.status === 404 ? "This article is not available." : "Could not load this article."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const textColor = theme.text || "#171722";
  const subText = theme.subText || "#747b8c";
  return (
    <View style={[styles.screen, { backgroundColor: theme.bg || "#f7f8fc" }]}>
      <View style={[styles.header, { borderBottomColor: theme.headerBorder || "#e7e9ef" }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={textColor} /><Text style={[styles.backText, { color: textColor }]}>Blog</Text>
        </TouchableOpacity>
        <Text style={[styles.brand, { color: textColor }]}>Influmart</Text>
        <View style={{ width: 90 }} />
      </View>
      {loading ? <View style={styles.center}><ActivityIndicator size="large" color="#7c3aed" /></View> : error || !article ? (
        <View style={styles.center}><Text style={[styles.errorText, { color: subText }]}>{error || "Article not found"}</Text></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.article}>
            {article.coverImageUrl ? <Image source={{ uri: article.coverImageUrl }} contentFit="cover" style={styles.cover} /> : (
              <LinearGradient colors={["#7c3aed", "#ec4899"]} style={styles.coverPlaceholder}>
                <Ionicons name="newspaper-outline" size={42} color="#fff" />
              </LinearGradient>
            )}
            <Text style={styles.kicker}>{article.authorRole === "brand" ? "BRAND STORY" : "CREATOR STORY"}</Text>
            <Text style={[styles.title, { color: textColor }]}>{article.title}</Text>
            <Text style={[styles.summary, { color: subText }]}>{article.summary}</Text>
            <View style={[styles.byline, { borderBottomColor: theme.cardBorder || "#e7e9ef" }]}>
              <Text style={[styles.author, { color: textColor }]}>{article.authorName}</Text>
              <Text style={[styles.date, { color: subText }]}>{article.reviewedAt ? new Date(article.reviewedAt).toLocaleDateString() : ""}</Text>
            </View>
            {article.content.split(/\n\s*\n/).map((paragraph, index) => (
              <Text key={index} selectable style={[styles.content, { color: textColor }]}>{paragraph}</Text>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 66, paddingHorizontal: 22, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1 },
  back: { width: 90, flexDirection: "row", gap: 8, alignItems: "center" },
  backText: { fontSize: 14, fontFamily: FontFamily.lexendMedium },
  brand: { fontSize: 22, fontFamily: FontFamily.lexendBold, fontWeight: "700", letterSpacing: -0.4 },
  scroll: { padding: 20, flexGrow: 1 },
  article: { width: "100%", maxWidth: 850, alignSelf: "center", paddingBottom: 50 },
  cover: { width: "100%", height: 360, borderRadius: 20, backgroundColor: "#e7e9ef", marginBottom: 30 },
  coverPlaceholder: { width: "100%", height: 300, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 30 },
  kicker: { color: "#7c3aed", fontSize: 11, fontFamily: FontFamily.lexendBold, fontWeight: "700", letterSpacing: 1.5, marginBottom: 12 },
  title: { fontSize: 38, lineHeight: 46, fontFamily: FontFamily.lexendBold, fontWeight: "700", letterSpacing: -1.1 },
  summary: { fontSize: 18, lineHeight: 28, fontFamily: FontFamily.lexendRegular, marginTop: 14 },
  byline: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 18, borderBottomWidth: 1, marginBottom: 26 },
  author: { fontSize: 14, fontFamily: FontFamily.lexendBold, fontWeight: "700" },
  date: { fontSize: 12, fontFamily: FontFamily.lexendRegular },
  content: { fontSize: 16, lineHeight: 29, fontFamily: FontFamily.lexendRegular, marginBottom: 18 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30 },
  errorText: { fontSize: 15, fontFamily: FontFamily.lexendRegular },
});

export default BlogArticleScreen;
