import React from "react";
import { ActivityIndicator, Animated, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { getPublishedArticles } from "../../controller/blogController";
import { useTheme } from "../../util/ThemeContext";
import { FontFamily } from "../../GlobalStyles";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

const BlogScreen = ({ route, navigation }) => {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const [articles, setArticles] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const desktop = width >= 900;
  const returnToProfile = ["BrandProfile", "UserProfile"].includes(route?.params?.returnTo) ? route.params.returnTo : null;
  const openedFromProfile = Boolean(returnToProfile);
  const goBackToProfile = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else if (returnToProfile) navigation.navigate(returnToProfile);
  };

  useFocusEffect(React.useCallback(() => {
    let active = true;
    setLoading(true);
    getPublishedArticles().then((items) => {
      if (!active) return;
      setArticles(items);
      setError("");
    }).catch(() => {
      if (active) setError("We couldn’t load articles. Please try again.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []));

  const contentWidth = Math.min(width - 32, 1260);
  const columns = desktop ? 3 : width >= 600 ? 2 : 1;
  const gap = 20;
  const cardWidth = (contentWidth - gap * (columns - 1)) / columns;
  const heroArtDiameter = width < 700 ? 150 : 190;
  const heroInnerOrbitDiameter = width < 700 ? 112 : 146;
  const heroArtHeight = width < 700 ? 184 : 230;
  const bg = theme.bg || "#f7f8fc";
  const card = theme.card || "#ffffff";
  const text = theme.text || "#171722";
  const subText = theme.subText || "#747b8c";
  const footerBg = theme.isDark ? "#19151f" : "#edf1ed";
  const footerText = theme.isDark ? "#ffffff" : "#202b26";
  const footerSubText = theme.isDark ? "#c3bdc9" : "#5f6b64";
  const footerBorder = theme.isDark ? "rgba(255,255,255,0.14)" : "rgba(32,43,38,0.14)";
  const waveProgress = React.useRef(new Animated.Value(0)).current;
  const heartScale = React.useRef(new Animated.Value(1)).current;
  const floatProgress = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const useNativeDriver = Platform.OS !== "web";
    const wave = Animated.loop(Animated.timing(waveProgress, { toValue: 1, duration: 14000, useNativeDriver }));
    const heartbeat = Animated.loop(Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.26, duration: 420, useNativeDriver }),
      Animated.timing(heartScale, { toValue: 1, duration: 420, useNativeDriver }),
      Animated.delay(1100),
    ]));
    const float = Animated.loop(Animated.sequence([
      Animated.timing(floatProgress, { toValue: 1, duration: 1700, useNativeDriver }),
      Animated.timing(floatProgress, { toValue: 0, duration: 1700, useNativeDriver }),
    ]));
    wave.start();
    heartbeat.start();
    float.start();
    return () => { wave.stop(); heartbeat.stop(); float.stop(); };
  }, [floatProgress, heartScale, waveProgress]);

  const waveTranslateX = waveProgress.interpolate({ inputRange: [0, 1], outputRange: [0, -width] });
  const heroWaveTranslateX = waveProgress.interpolate({ inputRange: [0, 1], outputRange: [0, -contentWidth] });
  const floatUp = floatProgress.interpolate({ inputRange: [0, 1], outputRange: [0, -9] });
  const floatDown = floatProgress.interpolate({ inputRange: [0, 1], outputRange: [0, 8] });

  return (
    <View style={[styles.screen, { backgroundColor: bg }]}>
      <View style={[styles.header, { backgroundColor: theme.headerBg || bg, borderBottomColor: theme.headerBorder || "#e7e9ef" }]}>
        {desktop ? (
          openedFromProfile ? (
            <>
              <TouchableOpacity onPress={goBackToProfile} style={styles.brandBackButton} accessibilityLabel="Go back">
                <Ionicons name="arrow-back" size={20} color={text} />
              </TouchableOpacity>
              <Text style={[styles.logo, { color: text }]}>Influmart</Text>
              <View style={styles.brandHeaderSpacer} />
            </>
          ) : (
            <>
              <TouchableOpacity onPress={() => navigation.navigate("Homepage")}><Text style={[styles.logo, { color: text }]}>Influmart</Text></TouchableOpacity>
              <View style={styles.desktopNav}>
                <TouchableOpacity onPress={() => navigation.navigate("Homepage")}><Text style={[styles.navLink, { color: subText }]}>Home</Text></TouchableOpacity>
                <Text style={styles.navActive}>Blog</Text>
                <TouchableOpacity onPress={() => navigation.navigate("BrandorInfluencer")}><Text style={[styles.navLink, { color: subText }]}>Log in</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate("BrandorInfluencer")} activeOpacity={0.86}>
                  <LinearGradient colors={["#7c3aed", "#d946a6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.navCta}>
                    <Text style={styles.navCtaText}>Get started</Text><Ionicons name="arrow-forward" size={15} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )
        ) : (
          <>
            <TouchableOpacity onPress={() => openedFromProfile ? goBackToProfile() : navigation.canGoBack() ? navigation.goBack() : navigation.navigate("Homepage")} style={styles.backButton} accessibilityLabel="Go back">
              <Ionicons name="arrow-back" size={22} color={text} />
            </TouchableOpacity>
            <Text style={[styles.logo, { color: text }]}>Influmart</Text>
            <View style={styles.headerSpacer} />
          </>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={{ width: contentWidth, alignSelf: "center" }}>
          <View style={[styles.hero, { padding: width < 600 ? 24 : 34, backgroundColor: theme.isDark ? "#201d25" : "#f1eee7", borderColor: theme.isDark ? "#37313f" : "#e5dfd4", flexDirection: width < 700 ? "column" : "row", alignItems: width < 700 ? "stretch" : "center" }]}>
            <View pointerEvents="none" style={styles.heroWaveClip}>
              <Animated.View style={[styles.heroWaveTrack, { width: contentWidth * 2, transform: [{ translateX: heroWaveTranslateX }] }]}>
                <Svg width={contentWidth * 2} height={100} viewBox="0 0 2000 100" preserveAspectRatio="none">
                  <Path d="M0 48 C125 48 125 12 250 12 S375 48 500 48 S625 84 750 84 S875 48 1000 48 C1125 48 1125 12 1250 12 S1375 48 1500 48 S1625 84 1750 84 S1875 48 2000 48 L2000 100 L0 100 Z" fill={theme.isDark ? "#393345" : "#dce9e0"} />
                  <Path d="M0 48 C125 48 125 12 250 12 S375 48 500 48 S625 84 750 84 S875 48 1000 48 C1125 48 1125 12 1250 12 S1375 48 1500 48 S1625 84 1750 84 S1875 48 2000 48" fill="none" stroke={theme.isDark ? "#655977" : "#a8c5b3"} strokeWidth="3" />
                </Svg>
              </Animated.View>
            </View>
            <View style={styles.heroCopy}>
              <View style={[styles.heroEyebrow, { backgroundColor: theme.isDark ? "#332b3c" : "#e3ece7" }]}>
                <Ionicons name="sparkles-outline" size={14} color="#35675b" />
                <Text style={styles.heroEyebrowText}>THE INFLUMART JOURNAL</Text>
              </View>
              <Text style={[styles.heroTitle, { color: text, fontSize: width < 600 ? 30 : 40, lineHeight: width < 600 ? 37 : 48 }]}>Stories worth passing on.</Text>
              <Text style={[styles.heroSubtitle, { color: subText }]}>Ideas, lessons, and moments from the people shaping the creator economy.</Text>
            </View>
            <View style={[styles.heroArtFrame, { width: width < 700 ? "100%" : "42%", minHeight: heroArtHeight, marginTop: width < 700 ? 22 : 0, backgroundColor: theme.isDark ? "#292633" : "#e7eee9" }]}>
              <View style={[styles.heroArtOrbit, { width: heroArtDiameter, height: heroArtDiameter, borderColor: theme.isDark ? "rgba(190,165,226,0.22)" : "rgba(69,116,98,0.18)" }]} />
              <View style={[styles.heroArtOrbit, styles.heroArtOrbitInner, { width: heroInnerOrbitDiameter, height: heroInnerOrbitDiameter, borderColor: theme.isDark ? "rgba(190,165,226,0.22)" : "rgba(69,116,98,0.18)" }]} />
              <Animated.View style={[styles.heroArtNode, styles.heroArtNodeTopLeft, { transform: [{ translateY: floatDown }], backgroundColor: theme.isDark ? "#393345" : "#fff" }]}><Ionicons name="sparkles" size={18} color="#7c3aed" /></Animated.View>
              <Animated.View style={[styles.heroArtNode, styles.heroArtNodeLeft, { transform: [{ translateY: floatUp }], backgroundColor: theme.isDark ? "#393345" : "#fff" }]}><Ionicons name="chatbubble-ellipses" size={18} color="#e35e9c" /></Animated.View>
              <Animated.View style={[styles.heroArtNode, styles.heroArtNodeRight, { transform: [{ translateY: floatDown }], backgroundColor: theme.isDark ? "#393345" : "#fff" }]}><Ionicons name="play" size={17} color="#3f8f77" /></Animated.View>
              <Animated.View style={[styles.heroHeartBadge, { transform: [{ scale: heartScale }] }]}><Ionicons name="heart" size={19} color="#d85e6a" /></Animated.View>
              <Animated.View style={[styles.heroArtCore, { transform: [{ translateY: floatUp }] }]}>
                <LinearGradient colors={["#7c3aed", "#d946a6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroArtCoreGradient}>
                  <Ionicons name="people-outline" size={width < 600 ? 35 : 43} color="#fff" />
                </LinearGradient>
              </Animated.View>
              <View style={styles.heroImageCaption}><Ionicons name="book-outline" size={14} color="#fff" /><Text style={styles.heroImageCaptionText}>CREATOR STORIES</Text></View>
            </View>
          </View>

          {!loading && !error && articles.length > 0 ? (
            <View style={styles.sectionIntro}>
              <View>
                <Text style={styles.sectionEyebrow}>FRESH FROM THE COMMUNITY</Text>
                <Text style={[styles.sectionTitle, { color: text }]}>{articles.length === 1 ? "Latest story" : "Latest stories"}</Text>
              </View>
              <View style={[styles.countPill, { backgroundColor: theme.isDark ? "#30283a" : "#f0e9ff" }]}>
                <Ionicons name="newspaper-outline" size={15} color="#7c3aed" />
                <Text style={styles.countText}>{articles.length} {articles.length === 1 ? "article" : "articles"}</Text>
              </View>
            </View>
          ) : null}

          {loading ? (
            <View style={styles.stateBox}><ActivityIndicator size="large" color="#8b45e8" /><Text style={[styles.stateText, { color: subText }]}>Loading articles…</Text></View>
          ) : error ? (
            <View style={styles.stateBox}><Text style={[styles.stateText, { color: subText }]}>{error}</Text></View>
          ) : articles.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: card, borderColor: theme.cardBorder || "#e7e9ef" }]}>
              <View style={styles.emptyIcon}><Ionicons name="newspaper-outline" size={26} color="#8b45e8" /></View>
              <Text style={[styles.emptyTitle, { color: text }]}>No published articles yet</Text>
              <Text style={[styles.emptyCopy, { color: subText }]}>Approved stories from Influmart creators and brands will appear here.</Text>
            </View>
          ) : (
            <View style={[styles.grid, articles.length === 1 && styles.featuredGrid]}>
              {articles.map((article) => {
                const featured = articles.length === 1 && width >= 700;
                return (
                <TouchableOpacity
                  key={article._id}
                  activeOpacity={0.88}
                  onPress={() => navigation.navigate("BlogArticle", { articleId: article._id })}
                  style={[styles.articleCard, featured && styles.featuredCard, { width: articles.length === 1 ? contentWidth : cardWidth, backgroundColor: card, borderColor: theme.cardBorder || "#e7e9ef" }]}
                >
                  {article.coverImageUrl ? (
                    <Image source={{ uri: article.coverImageUrl }} contentFit="cover" style={[styles.cover, featured && styles.featuredCover]} />
                  ) : (
                    <View style={[styles.coverPlaceholder, featured && styles.featuredCover]}>
                      <View style={styles.coverMark}><Ionicons name="newspaper-outline" size={36} color="#42675c" /></View>
                      <Text style={styles.coverBrand}>INFLUMART JOURNAL</Text>
                    </View>
                  )}
                  <View style={[styles.cardBody, featured && styles.featuredCardBody]}>
                    <View style={styles.metaRow}>
                      <Text style={styles.authorType} numberOfLines={1} ellipsizeMode="tail">POSTED BY {article.authorName}</Text>
                      <Text style={[styles.date, { color: subText }]}>{formatDate(article.reviewedAt || article.createdAt)}</Text>
                    </View>
                    <Text style={[styles.articleTitle, featured && styles.featuredArticleTitle, { color: text }]} numberOfLines={featured ? 3 : 2}>{article.title}</Text>
                    <Text style={[styles.summary, featured && styles.featuredSummary, { color: subText }]} numberOfLines={featured ? 5 : 3}>{article.summary}</Text>
                    <Text style={styles.readMore}>Read article <Ionicons name="arrow-forward" size={14} color="#7c3aed" /></Text>
                  </View>
                </TouchableOpacity>
                );
              })}
            </View>
          )}
          <View style={{ height: 36 }} />
        </View>
        <View style={[styles.footer, { width, marginLeft: -16, marginRight: -16, backgroundColor: footerBg }]}>
          <View pointerEvents="none" style={styles.footerWaveClip}>
            <Animated.View style={[styles.footerWaveTrack, { width: width * 2, transform: [{ translateX: waveTranslateX }] }]}>
              <Svg width={width * 2} height={70} viewBox="0 0 2000 70" preserveAspectRatio="none">
                <Path d="M0 36 C125 36 125 8 250 8 S375 36 500 36 S625 64 750 64 S875 36 1000 36 C1125 36 1125 8 1250 8 S1375 36 1500 36 S1625 64 1750 64 S1875 36 2000 36 L2000 70 L0 70 Z" fill={theme.isDark ? "#292334" : "#dfe8e1"} />
              </Svg>
            </Animated.View>
          </View>
          <View style={[styles.footerInner, { flexDirection: desktop ? "row" : "column", maxWidth: 1260 }]}>
            <View style={styles.footerBrand}>
              <Text style={[styles.footerLogo, { color: footerText }]}>Influmart</Text>
              <Text style={[styles.footerStatement, { color: footerText }]}>Great stories bring creators and brands closer.</Text>
              <Text style={[styles.footerTagline, { color: footerSubText }]}>A community built around creativity, collaboration, and meaningful work.</Text>
            </View>
            <View style={[styles.footerLinks, { gap: desktop ? 64 : 36 }]}>
              <View style={styles.footerLinkColumn}>
                <Text style={[styles.footerHeading, { color: footerText }]}>Explore</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Homepage")}><Text style={[styles.footerLink, { color: footerSubText }]}>Home</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate("BrandorInfluencer")}><Text style={[styles.footerLink, { color: footerSubText }]}>Get started</Text></TouchableOpacity>
              </View>
              <View style={styles.footerLinkColumn}>
                <Text style={[styles.footerHeading, { color: footerText }]}>Legal</Text>
                <TouchableOpacity onPress={() => navigation.navigate("TosScreen")}><Text style={[styles.footerLink, { color: footerSubText }]}>Terms of service</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate("PPScreen")}><Text style={[styles.footerLink, { color: footerSubText }]}>Privacy policy</Text></TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={[styles.footerBottom, { maxWidth: 1260, flexDirection: desktop ? "row" : "column", borderTopColor: footerBorder }]}>
            <Text style={[styles.footerCopyright, { color: footerSubText }]}>© 2026 Influmart. All rights reserved.</Text>
            <View style={styles.footerNoteRow}>
              <Animated.View style={{ transform: [{ scale: heartScale }] }}><Ionicons name="heart" size={14} color="#df6672" /></Animated.View>
              <Text style={[styles.footerNote, { color: footerSubText }]}>Made for the creator community</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: "100%" },
  header: { minHeight: 76, paddingHorizontal: 28, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1 },
  backButton: { width: 90, minHeight: 40, justifyContent: "center" },
  brandBackButton: { width: 90, minHeight: 40, justifyContent: "center" },
  brandHeaderSpacer: { width: 90, minHeight: 40 },
  headerSpacer: { width: 90, minHeight: 40 },
  logo: { fontSize: 22, fontFamily: FontFamily.lexendBold, fontWeight: "700", letterSpacing: -0.4 },
  desktopNav: { flexDirection: "row", alignItems: "center", gap: 30 },
  navLink: { fontSize: 14, fontFamily: FontFamily.lexendMedium },
  navActive: { color: "#7c3aed", fontSize: 14, fontFamily: FontFamily.lexendMedium },
  navCta: { minHeight: 40, paddingHorizontal: 16, borderRadius: 22, flexDirection: "row", alignItems: "center", gap: 8 },
  navCtaText: { color: "#fff", fontSize: 14, fontFamily: FontFamily.lexendBold, fontWeight: "700" },
  scrollContent: { paddingTop: 34, paddingHorizontal: 16, flexGrow: 1 },
  hero: { minHeight: 300, borderRadius: 24, borderWidth: 1, marginBottom: 34, flexDirection: "row", justifyContent: "space-between", overflow: "hidden", position: "relative" },
  heroWaveClip: { position: "absolute", left: 0, right: 0, bottom: 0, height: 86, overflow: "hidden" },
  heroWaveTrack: { position: "absolute", left: 0, top: 0, height: 100 },
  heroCopy: { flex: 1, maxWidth: 650, justifyContent: "center", zIndex: 1 },
  heroEyebrow: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 18, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  heroEyebrowText: { color: "#35675b", fontSize: 10, fontFamily: FontFamily.lexendBold, fontWeight: "700", letterSpacing: 1.5 },
  heroTitle: { fontSize: 40, lineHeight: 48, fontFamily: FontFamily.lexendBold, fontWeight: "700", letterSpacing: -1.2, maxWidth: 600 },
  heroSubtitle: { fontSize: 16, lineHeight: 25, fontFamily: FontFamily.lexendRegular, marginTop: 13, maxWidth: 530 },
  heroArtFrame: { width: "42%", minHeight: 230, borderRadius: 18, overflow: "hidden", position: "relative", alignItems: "center", justifyContent: "center" },
  heroArtOrbit: { position: "absolute", borderWidth: 1.5, borderRadius: 999 },
  heroArtOrbitInner: { borderStyle: "dashed" },
  heroArtNode: { position: "absolute", width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", shadowColor: "#26342d", shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  heroArtNodeTopLeft: { top: "16%", left: "23%" },
  heroArtNodeLeft: { bottom: "22%", left: "12%" },
  heroArtNodeRight: { top: "32%", right: "12%" },
  heroArtCore: { width: 92, height: 92, borderRadius: 46, padding: 6, backgroundColor: "rgba(255,255,255,0.62)", shadowColor: "#5b3aa8", shadowOpacity: 0.23, shadowRadius: 18, shadowOffset: { width: 0, height: 7 }, elevation: 5 },
  heroArtCoreGradient: { flex: 1, borderRadius: 42, alignItems: "center", justifyContent: "center" },
  heroImageCaption: { position: "absolute", right: 12, bottom: 12, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 18, backgroundColor: "rgba(25,35,32,0.86)" },
  heroImageCaptionText: { color: "#fff", fontSize: 9, fontFamily: FontFamily.lexendBold, fontWeight: "700", letterSpacing: 1.1 },
  heroHeartBadge: { position: "absolute", top: 14, right: 14, width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,245,247,0.96)", borderWidth: 1, borderColor: "rgba(216,94,106,0.24)", shadowColor: "#d85e6a", shadowOpacity: 0.24, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  sectionIntro: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18, gap: 16 },
  sectionEyebrow: { color: "#7c3aed", fontSize: 10, fontFamily: FontFamily.lexendBold, fontWeight: "700", letterSpacing: 1.5, marginBottom: 5 },
  sectionTitle: { fontSize: 25, fontFamily: FontFamily.lexendBold, fontWeight: "700", letterSpacing: -0.5 },
  countPill: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  countText: { color: "#6932c9", fontSize: 12, fontFamily: FontFamily.lexendBold, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 20, alignItems: "stretch" },
  featuredGrid: { justifyContent: "center" },
  articleCard: { overflow: "hidden", borderRadius: 18, borderWidth: 1, marginBottom: 2, shadowColor: "#161425", shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  cover: { width: "100%", height: 210, backgroundColor: "#e7e9ef" },
  coverPlaceholder: { width: "100%", height: 210, alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#e8eee9" },
  featuredCard: { flexDirection: "row", alignItems: "stretch", minHeight: 340 },
  featuredCover: { width: "42%", height: 400, minHeight: 340 },
  coverMark: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.75)" },
  coverBrand: { color: "#526b60", fontSize: 10, fontFamily: FontFamily.lexendBold, fontWeight: "700", letterSpacing: 1.5 },
  cardBody: { padding: 20 },
  featuredCardBody: { flex: 1, justifyContent: "center", paddingHorizontal: 34, paddingVertical: 30 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 11 },
  authorType: { color: "#7c3aed", fontSize: 10, fontFamily: FontFamily.lexendBold, fontWeight: "700", letterSpacing: 0.7, flexShrink: 1, marginRight: 8 },
  date: { fontSize: 11, fontFamily: FontFamily.lexendRegular },
  articleTitle: { fontSize: 21, lineHeight: 28, fontFamily: FontFamily.lexendBold, fontWeight: "700", marginBottom: 10 },
  featuredArticleTitle: { fontSize: 30, lineHeight: 38, marginTop: 6 },
  summary: { fontSize: 14, lineHeight: 22, fontFamily: FontFamily.lexendRegular, minHeight: 66 },
  featuredSummary: { fontSize: 16, lineHeight: 26, minHeight: 0, marginTop: 4 },
  readMore: { marginTop: 17, color: "#7c3aed", fontSize: 13, fontFamily: FontFamily.lexendBold, fontWeight: "700" },
  stateBox: { minHeight: 220, alignItems: "center", justifyContent: "center", gap: 12 },
  stateText: { fontSize: 14, fontFamily: FontFamily.lexendRegular },
  emptyCard: { padding: 36, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center", minHeight: 300, gap: 12 },
  emptyIcon: { height: 54, width: 54, borderRadius: 17, backgroundColor: "#f1e9ff", alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 22, fontFamily: FontFamily.lexendBold, fontWeight: "700", textAlign: "center" },
  emptyCopy: { fontSize: 14, lineHeight: 22, fontFamily: FontFamily.lexendRegular, textAlign: "center", maxWidth: 420 },
  footer: { width: "100%", marginTop: 24, paddingHorizontal: 24, paddingTop: 76, paddingBottom: 20, position: "relative", overflow: "hidden" },
  footerWaveClip: { position: "absolute", top: 0, left: 0, right: 0, height: 58, overflow: "hidden" },
  footerWaveTrack: { position: "absolute", top: 0, left: 0, height: 58 },
  footerInner: { width: "100%", alignSelf: "center", justifyContent: "space-between", alignItems: "flex-start", gap: 40, paddingBottom: 34 },
  footerBrand: { flex: 1, maxWidth: 560 },
  footerLogo: { color: "#fff", fontSize: 23, fontFamily: FontFamily.lexendBold, fontWeight: "700", letterSpacing: -0.4 },
  footerStatement: { color: "#fff", fontSize: 26, lineHeight: 35, fontFamily: FontFamily.lexendBold, fontWeight: "700", marginTop: 18, maxWidth: 490 },
  footerTagline: { color: "#c3bdc9", fontSize: 14, lineHeight: 22, fontFamily: FontFamily.lexendRegular, marginTop: 10, maxWidth: 460 },
  footerLinks: { flexDirection: "row", gap: 64, paddingTop: 5 },
  footerLinkColumn: { gap: 13, minWidth: 110 },
  footerHeading: { color: "#fff", fontSize: 14, fontFamily: FontFamily.lexendBold, fontWeight: "700", marginBottom: 4 },
  footerLink: { color: "#c3bdc9", fontSize: 13, fontFamily: FontFamily.lexendMedium },
  footerBottom: { width: "100%", alignSelf: "center", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.14)", paddingTop: 18, flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  footerCopyright: { color: "#aaa2b1", fontSize: 12, fontFamily: FontFamily.lexendRegular },
  footerNote: { color: "#aaa2b1", fontSize: 12, fontFamily: FontFamily.lexendRegular },
  footerNoteRow: { flexDirection: "row", alignItems: "center", gap: 7 },
});

export default BlogScreen;
