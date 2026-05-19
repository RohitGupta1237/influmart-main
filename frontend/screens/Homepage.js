import * as React from "react";
import { ScrollView, Image, StyleSheet, View, Text, TouchableOpacity, Pressable } from "react-native";
import { useNavigation } from '@react-navigation/native';
import Depth1Frame4 from "../components/Depth1Frame4";
import Depth1Frame from "../components/Depth1Frame";
import { Color, Padding, FontSize, Border, FontFamily } from "../GlobalStyles";
import { LinearGradient } from 'expo-linear-gradient'
import ImageWithFallback from '../util/ImageWithFallback'
import { useAlert } from '../util/AlertContext'
import { getTopAccounts } from '../controller/homeController'
import ThemeToggle from '../shared/ThemeToggle'
import { useTheme } from '../util/ThemeContext'

const ACCENT = "#1a5ce6";
const ACCENT2 = "#1246c4";

const Homepage = ({ route, navigation }) => {
  const [searchValue, setSearchValue] = React.useState("")
  const [viewWidth, setViewWidth] = React.useState(0)
  const { showAlert } = useAlert()
  const { theme } = useTheme()
  const [topAccounts, setTopAccounts] = React.useState([])

  React.useEffect(() => {
    async function fetchData() {
      const res = await getTopAccounts(showAlert)
      setTopAccounts(res)
    }
    fetchData()
  }, [])

  const data = {
    features: [
      { title: "Find Influencers", desc: "Filter and sort based on campaign needs", image: require("../assets/home-page-cover.jpg") },
      { title: "Analyze Influencers", desc: "Make data-driven decisions", image: require("../assets/feature2.png") },
      { title: "Influencer Database", desc: "Curate lists and manage relationships", image: require("../assets/feature3.jpg") },
      { title: "Recruit Influencers", desc: "Find influencers interested in your brand", image: require("../assets/feature4.jpg") },
      { title: "Influencer Outreach", desc: "Data-driven communications", image: require("../assets/feature5.jpg") },
      { title: "Manage Campaigns", desc: "Complete oversight from start to finish", image: require("../assets/feature6.jpg") },
      { title: "Set Your Worth, Get Paid", desc: "Own your worth. Price your content your way. Brands find you.", image: require("../assets/feature-set-your-worth.jpg") },
      { title: "Chat. Collaborate. Close.", desc: "Real-time messaging between brands and influencers. No middlemen.", image: require("../assets/feature-chat-collaborate.jpg") }
    ],
    ourPlatform: [
      { title: "Influencer Discover", desc: "Find the influencers that work for you", image: require("../assets/feature7.jpg") },
      { title: "Influencer Relationship Management", desc: "Your processes in one central hub", image: require("../assets/feature8.jpg") },
      { title: "Campaign Manager", desc: "We help your team do more", image: require("../assets/feature9.jpg") }
    ]
  }

  const stats = [
    { value: "10K+", label: "Influencers" },
    { value: "500+", label: "Brands" },
    { value: "₹1Cr+", label: "Campaigns" },
  ]

  return (
    <View style={[styles.homepage, { backgroundColor: theme.bg }]} onLayout={(evt) => {
      setViewWidth(evt.nativeEvent.layout.width)
    }}>
      <View style={[styles.depth0Frame0, { backgroundColor: theme.bg }]}>
        <Depth1Frame4 isSearch={true} onChange={(value) => { setSearchValue(value) }} />
        <ScrollView style={{ marginBottom: 80 }} showsVerticalScrollIndicator={false}>

          {/* ── HERO ── */}
          <View style={styles.heroContainer}>
            <Image
              style={[styles.heroImage, { height: viewWidth <= 375 ? 460 : viewWidth <= 550 ? 560 : viewWidth <= 768 ? 420 : 620 }]}
              source={require("../assets/home-page-cover.jpg")}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.97)']}
              style={styles.heroOverlay}
            >
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>INFLUENCER MARKETPLACE</Text>
              </View>
              <Text style={styles.heroTitle}>Welcome to{"\n"}Influmart</Text>
              <Text style={styles.heroSubtitle}>
                The world's premier marketplace for social media accounts.
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('BrandorInfluencer')} activeOpacity={0.85}>
                <LinearGradient colors={[ACCENT, ACCENT2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.heroCTA}>
                  <Text style={styles.heroCTAText}>Get Started  →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* ── STATS STRIP ── */}
          <View style={[styles.statsStrip, { backgroundColor: theme.isDark ? '#111111' : '#f0f0f0' }]}>
            {stats.map((s, i) => (
              <React.Fragment key={i}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: ACCENT }]}>{s.value}</Text>
                  <Text style={[styles.statLabel, { color: theme.subText }]}>{s.label}</Text>
                </View>
                {i < stats.length - 1 && <View style={[styles.statDivider, { backgroundColor: theme.isDark ? '#333' : '#ccc' }]} />}
              </React.Fragment>
            ))}
          </View>

          {/* ── FEATURES ── */}
          <View style={styles.section}>
            <SectionHeader title="Features" theme={theme} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScrollContent}>
              {data.features.map((feature, index) => (
                <FeatureCard key={index} feature={feature} theme={theme} />
              ))}
            </ScrollView>
          </View>

          {/* ── OUR PLATFORM ── */}
          <View style={styles.section}>
            <SectionHeader title="Our Platform" theme={theme} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScrollContent}>
              {data.ourPlatform.map((feature, index) => (
                <FeatureCard key={index} feature={feature} theme={theme} />
              ))}
            </ScrollView>
          </View>

          {/* ── WHO WE SERVE ── */}
          <View style={styles.section}>
            <SectionHeader title="Who We Serve" theme={theme} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScrollContent}>
              <LinearGradient colors={['#0d3494', '#1a5ce6']} style={styles.serveCard}>
                <Text style={styles.serveBadge}>FOR BRAND</Text>
                <Text style={styles.serveTitle}>Save Time.{"\n"}Get Results.</Text>
                <Text style={styles.serveDesc}>Tools designed to grow with your brand and support your influencer marketing strategy every step of the way.</Text>
              </LinearGradient>
              <LinearGradient colors={['#0a2a7a', '#1246c4']} style={styles.serveCard}>
                <Text style={styles.serveBadge}>FOR INFLUENCER</Text>
                <Text style={styles.serveTitle}>Boost Client{"\n"}Reach.</Text>
                <Text style={styles.serveDesc}>Access powerful tools to explore new influencer profiles, manage campaigns and improve ROI.</Text>
              </LinearGradient>
            </ScrollView>
          </View>

          {/* ── TOP ACCOUNTS ── */}
          <View style={styles.section}>
            <SectionHeader title="Top Accounts" theme={theme} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScrollContent}>
              {topAccounts && topAccounts.map((account, index) => (
                <AccountCard account={account} key={index} />
              ))}
            </ScrollView>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        <ThemeToggle />

        <Depth1Frame
          depth5Frame0={require("../assets/depth-5-frame-01.png")}
          depth5Frame01={require("../assets/depth-5-frame-02.png")}
          search="Influencers"
          depth5Frame02={require("../assets/depth-5-frame-03.png")}
          myBrands="Brands"
          depth5Frame03={require("../assets/depth-5-frame-04.png")}
          style={styles.bottomBar}
        />
      </View>
    </View>
  );
};

const SectionHeader = ({ title, theme }) => (
  <View style={styles.sectionHeaderRow}>
    <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
    <View style={[styles.sectionAccentLine, { backgroundColor: ACCENT }]} />
  </View>
)

const FeatureCard = ({ feature, theme }) => (
  <Pressable style={[styles.featureCard, { backgroundColor: theme.isDark ? '#111827' : '#ffffff', borderTopColor: ACCENT }]}>
    <Image source={feature.image} style={styles.featureCardImage} resizeMode="cover" />
    <View style={styles.featureCardBody}>
      <Text style={[styles.featureCardTitle, { color: theme.text }]}>{feature.title}</Text>
      <Text style={[styles.featureCardDesc, { color: theme.subText }]}>{feature.desc}</Text>
    </View>
  </Pressable>
)

const AccountCard = ({ account }) => (
  <Pressable style={styles.accountCard}>
    <ImageWithFallback imageStyle={styles.accountCardImage} image={account?.profileUrl} isSelectedImage={account?.isSelectedImage} />
    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.accountCardOverlay}>
      <Text style={styles.accountCardName}>@{account?.name}</Text>
      <Text style={styles.accountCardType}>{account?.accountType}</Text>
    </LinearGradient>
  </Pressable>
)

const styles = StyleSheet.create({
  homepage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  depth0Frame0: {
    height: "100%",
    width: "100%",
    overflow: "hidden",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
  },

  // HERO
  heroContainer: {
    width: "100%",
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
  },
  heroOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 44,
    paddingTop: 80,
    gap: 12,
  },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(26,92,230,0.25)",
    borderWidth: 1,
    borderColor: "rgba(26,92,230,0.5)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  heroBadgeText: {
    color: "#90b4ff",
    fontSize: 10,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontSize: 38,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: FontFamily.lexendRegular,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 22,
  },
  heroCTA: {
    alignSelf: "flex-start",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 4,
  },
  heroCTAText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // STATS
  statsStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingVertical: 20,
    marginTop: 0,
  },
  statItem: {
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontSize: 22,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FontFamily.lexendRegular,
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 32,
  },

  // SECTIONS
  section: {
    paddingTop: 28,
    paddingBottom: 8,
    gap: 14,
  },
  sectionHeaderRow: {
    paddingHorizontal: 20,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  sectionAccentLine: {
    width: 32,
    height: 3,
    borderRadius: 2,
  },
  hScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 12,
  },

  // FEATURE CARDS
  featureCard: {
    width: 240,
    borderRadius: 14,
    overflow: "hidden",
    borderTopWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  featureCardImage: {
    width: "100%",
    height: 140,
  },
  featureCardBody: {
    padding: 14,
    gap: 6,
  },
  featureCardTitle: {
    fontSize: 15,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
  },
  featureCardDesc: {
    fontSize: 12,
    fontFamily: FontFamily.lexendRegular,
    lineHeight: 18,
  },

  // WHO WE SERVE
  serveCard: {
    width: 280,
    borderRadius: 20,
    padding: 24,
    paddingVertical: 36,
    gap: 12,
  },
  serveBadge: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
    letterSpacing: 2,
  },
  serveTitle: {
    color: "#fff",
    fontSize: 26,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
    lineHeight: 32,
  },
  serveDesc: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontFamily: FontFamily.lexendRegular,
    lineHeight: 20,
  },

  // TOP ACCOUNTS
  accountCard: {
    width: 180,
    height: 240,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1a1a2e",
  },
  accountCardImage: {
    width: 180,
    height: 240,
    position: "absolute",
    top: 0,
    left: 0,
  },
  accountCardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 14,
    paddingTop: 40,
    gap: 2,
  },
  accountCardName: {
    color: "#fff",
    fontSize: 13,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
  },
  accountCardType: {
    color: "#90b4ff",
    fontSize: 10,
    fontFamily: FontFamily.lexendRegular,
    letterSpacing: 1,
  },
});

export default Homepage;
