import * as React from "react";
import { ScrollView, Image, StyleSheet, View, Text, TouchableOpacity, Pressable, Linking, Platform, Animated, Easing, useWindowDimensions } from "react-native";
import { useNavigation } from '@react-navigation/native';
import Depth1Frame4 from "../components/Depth1Frame4";
import Depth1Frame from "../components/Depth1Frame";
import { Color, Padding, FontSize, Border, FontFamily } from "../GlobalStyles";
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import ImageWithFallback from '../util/ImageWithFallback'
import { useAlert } from '../util/AlertContext'
import { getTopAccounts } from '../controller/homeController'
import ThemeToggle from '../shared/ThemeToggle'
import { useTheme } from '../util/ThemeContext'

// Brand accents — blue primary + a pink/purple "creator-economy" accent.
const ACCENT = "#1a5ce6";
const ACCENT2 = "#1246c4";
const PINK = "#ec4899";
const PURPLE = "#7c3aed";

// Creator avatars for the marquee (assets that ship with the app).
const AVATARS = [
  require("../assets/influencer1.jpg"),
  require("../assets/influencer2.jpg"),
  require("../assets/influencer3.jpg"),
  require("../assets/influencer4.jpg"),
  require("../assets/influencer5.jpg"),
  require("../assets/influencer6.jpg"),
  require("../assets/influencer7.jpg"),
  require("../assets/influencer8.jpg"),
  require("../assets/influencer9.jpg"),
  require("../assets/influencer10.jpg"),
];

const Homepage = ({ route, navigation }) => {
  const [searchValue, setSearchValue] = React.useState("")
  const [viewWidth, setViewWidth] = React.useState(0)
  const { showAlert } = useAlert()
  const { theme } = useTheme()
  const [topAccounts, setTopAccounts] = React.useState([])

  // Responsive: below 900px = mobile "app" view; at/above = desktop "website" view.
  const { width: winWidth } = useWindowDimensions();
  const isDesktop = winWidth >= 900;
  const MAX_W = isDesktop ? 1120 : 560;
  const colWidth = viewWidth ? Math.min(viewWidth, MAX_W) : viewWidth;

  React.useEffect(() => {
    async function fetchData() {
      const res = await getTopAccounts(showAlert)
      setTopAccounts(res)
    }
    fetchData()
  }, [])

  const data = {
    ourPlatform: [
      { title: "Influencer Discover", desc: "Find the influencers that work for you", image: require("../assets/feature7.jpg") },
      { title: "Influencer Relationship Management", desc: "Your processes in one central hub", image: require("../assets/feature8.jpg") },
      { title: "Campaign Manager", desc: "We help your team do more", image: require("../assets/feature9.jpg") }
    ]
  }

  // Bento feature grid — extensible: add an item and it slots in.
  // span:2 = full-width hero card; others are half-width.
  const bentoFeatures = [
    { icon: "search-outline", title: "Find Your People", desc: "Filter creators by niche, reach & vibe — match in seconds.", span: 2, tint: "#8b5cf6", tags: ["Fashion", "Tech", "Fitness", "Food", "Gaming"] },
    { icon: "stats-chart-outline", title: "Real Analytics", desc: "Verified stats. No fluff.", tint: "#0ea5e9" },
    { icon: "wallet-outline", title: "Set Your Worth", desc: "Price your content. Get paid.", tint: "#10b981" },
    { icon: "chatbubble-ellipses-outline", title: "Chat & Close", desc: "DM brands directly. Zero middlemen.", tint: "#6366f1" },
    { icon: "rocket-outline", title: "Run Campaigns", desc: "Start to finish, all in one place.", tint: "#f59e0b" },
  ]

  const stats = [
    { prefix: "", value: 10, suffix: "K", label: "Creator spots" },
    { prefix: "", value: 500, suffix: "", label: "Founding brands" },
    { prefix: "₹", value: 0, suffix: "", label: "Commission, ever" },
  ]

  // Alternating feature showcase (Influencity-style, mobile = stacked cards).
  const showcase = [
    {
      grad: ["#8b5cf6", "#6d28d9"], icon: "stats-chart-outline", type: "discover",
      title: "Discover creators that convert",
      desc: "Search 10K+ verified creators by niche, audience & real engagement — powered by AI.",
      bullets: ["Verified analytics", "AI natural-language search", "Filter by niche & reach"],
    },
    {
      grad: ["#0ea5e9", "#2563eb"], icon: "megaphone-outline", type: "campaign",
      title: "Run campaigns end-to-end",
      desc: "Post openings, review applicants and manage every collab from one dashboard.",
      bullets: ["Post collab openings", "Track applicants", "Campaign insights"],
    },
    {
      grad: ["#10b981", "#059669"], icon: "chatbubbles-outline", type: "chat",
      title: "Chat, collaborate, close",
      desc: "Message brands and creators directly — no agencies, no commission cuts.",
      bullets: ["Direct messaging", "No middlemen", "0% commission"],
    },
  ]

  // Testimonials — PLACEHOLDER copy; swap in real creator/brand quotes later.
  const testimonials = [
    { avatar: require("../assets/influencer2.jpg"), quote: "Landed 3 brand deals in my first month. The analytics sold brands on me instantly.", name: "Aisha K.", role: "Lifestyle Creator" },
    { avatar: require("../assets/influencer5.jpg"), quote: "Finally a platform with zero commission. What I quote is what I keep.", name: "Rohan M.", role: "Tech Creator" },
    { avatar: require("../assets/influencer8.jpg"), quote: "We found niche micro-creators in minutes. Our ROI doubled.", name: "Priya S.", role: "Brand Manager" },
  ]

  const faqs = [
    { q: "Is Influmart free to start?", a: "Yes — create your profile and explore for free. Paid plans unlock verified analytics, AI search and campaign tools." },
    { q: "Do you take a commission on deals?", a: "Never. Influmart is subscription-based — brands and creators connect directly and keep 100% of what they agree." },
    { q: "How do I get verified?", a: "Connect your Instagram, YouTube or Facebook in a tap. We pull verified stats so brands trust your numbers." },
    { q: "Who is Influmart for?", a: "Creators of every size and brands of every size — from micro-creators to mega-influencers, startups to agencies." },
  ]

  const openPrivacy = () => {
    const url =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.location.origin + "/privacy.html"
        : "https://www.influmart.in/privacy.html";
    Linking.openURL(url);
  };

  return (
    <View style={[styles.homepage, { backgroundColor: theme.bg }]} onLayout={(evt) => {
      setViewWidth(evt.nativeEvent.layout.width)
    }}>
      <View style={[styles.depth0Frame0, { backgroundColor: theme.bg }]}>
        {isDesktop
          ? <TopNav navigation={navigation} theme={theme} />
          : <Depth1Frame4 isSearch={true} onChange={(value) => { setSearchValue(value) }} />}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.contentCol, { maxWidth: isDesktop ? "100%" : 560 }]}>

          {/* ── HERO ── */}
          {isDesktop ? (
            <View style={styles.heroDesktop}>
              <View style={styles.heroDesktopLeft}>
                <View style={[styles.heroBadge, { backgroundColor: PINK + "1f", borderColor: PINK + "66" }]}>
                  <Text style={[styles.heroBadgeText, { color: PINK }]}>✦ THE CREATOR MARKETPLACE</Text>
                </View>
                <Text style={[styles.heroTitleDesktop, { color: theme.text }]}>Get paid to be you.</Text>
                <Text style={[styles.heroSubtitleDesktop, { color: theme.subText }]}>
                  Where creators & brands link up, collab, and cash in — no middlemen, no commission.
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('BrandorInfluencer')} activeOpacity={0.85}>
                  <LinearGradient colors={[PINK, PURPLE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.heroCTA}>
                    <Text style={styles.heroCTAText}>Get Started  →</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              <View style={styles.heroDesktopRight}>
                <Image source={require("../assets/home-page-cover.jpg")} style={styles.heroDesktopImage} resizeMode="cover" />
              </View>
            </View>
          ) : (
          <View style={styles.heroContainer}>
            <Image
              style={[styles.heroImage, { height: colWidth <= 375 ? 440 : colWidth <= 500 ? 520 : 480 }]}
              source={require("../assets/home-page-cover.jpg")}
              resizeMode="cover"
            />
            {/* colorful wash for the Gen-Z vibe */}
            <LinearGradient
              colors={['rgba(124,58,237,0.35)', 'rgba(236,72,153,0.15)', 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.heroWash}
              pointerEvents="none"
            />
            <LinearGradient
              colors={['transparent', 'rgba(10,6,25,0.6)', 'rgba(10,6,25,0.97)']}
              style={styles.heroOverlay}
            >
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>✦ THE CREATOR MARKETPLACE</Text>
              </View>
              <Text style={styles.heroTitle}>Get paid{"\n"}to be you.</Text>
              <Text style={styles.heroSubtitle}>
                Where creators & brands link up, collab, and cash in — no middlemen, no commission.
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('BrandorInfluencer')} activeOpacity={0.85}>
                <LinearGradient colors={[PINK, PURPLE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.heroCTA}>
                  <Text style={styles.heroCTAText}>Get Started  →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
          )}

          {/* ── STATS STRIP (animated count-up) ── */}
          <Text style={styles.statsEyebrow}>✦ EARLY ACCESS — BE AMONG THE FIRST</Text>
          <View style={[styles.statsStrip, { backgroundColor: theme.isDark ? '#12121c' : '#f4f5fb' }]}>
            {stats.map((s, i) => (
              <React.Fragment key={i}>
                <View style={styles.statItem}>
                  <View style={styles.statValueRow}>
                    {!!s.prefix && <Text style={[styles.statValue, { color: ACCENT }]}>{s.prefix}</Text>}
                    <CountUp to={s.value} style={[styles.statValue, { color: ACCENT }]} />
                    <Text style={[styles.statValue, { color: ACCENT }]}>{s.suffix}</Text>
                  </View>
                  <Text style={[styles.statLabel, { color: theme.subText }]}>{s.label}</Text>
                </View>
                {i < stats.length - 1 && <View style={[styles.statDivider, { backgroundColor: theme.isDark ? '#333' : '#d8dbe6' }]} />}
              </React.Fragment>
            ))}
          </View>

          {/* ── BENTO FEATURES ── */}
          <View style={styles.section}>
            <SectionHeader title="Everything you need" theme={theme} />
            <View style={styles.bentoGrid}>
              {bentoFeatures.map((f, i) => (
                <BentoCard key={i} feature={f} theme={theme} isDesktop={isDesktop} />
              ))}
            </View>
          </View>

          {/* ── FEATURE SHOWCASE ── */}
          <View style={styles.section}>
            <SectionHeader title="How Influmart works" theme={theme} />
            <View style={styles.showcaseWrap}>
              {showcase.map((s, i) => (
                <ShowcaseRow key={i} item={s} theme={theme} isDesktop={isDesktop} index={i} />
              ))}
            </View>
          </View>

          {/* ── WHO WE SERVE ── */}
          <View style={styles.section}>
            <SectionHeader title="Who We Serve" theme={theme} />
            <View style={styles.serveGrid}>
              <LinearGradient colors={[PURPLE, PINK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.serveCard, styles.serveCardG]}>
                <Text style={styles.serveBadge}>FOR BRANDS</Text>
                <Text style={styles.serveTitle}>Save Time. Get Results.</Text>
                <Text style={styles.serveDesc}>Tools built to grow with your brand and power your influencer strategy end to end.</Text>
              </LinearGradient>
              <LinearGradient colors={['#0ea5e9', ACCENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.serveCard, styles.serveCardG]}>
                <Text style={styles.serveBadge}>FOR CREATORS</Text>
                <Text style={styles.serveTitle}>Own Your Worth.</Text>
                <Text style={styles.serveDesc}>Get discovered, set your rates, land collabs and grow your ROI — on your terms.</Text>
              </LinearGradient>
            </View>
          </View>

          {/* ── TOP ACCOUNTS ── */}
          <View style={styles.section}>
            <SectionHeader title="Top Accounts" theme={theme} />
            {isDesktop ? (
              <View style={styles.accountGrid}>
                {topAccounts && topAccounts.map((account, index) => (
                  <AccountCard account={account} key={index} />
                ))}
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accountRow}>
                {topAccounts && topAccounts.map((account, index) => (
                  <AccountCard account={account} key={index} />
                ))}
              </ScrollView>
            )}
          </View>

          {/* ── TESTIMONIALS ── */}
          <View style={styles.section}>
            <SectionHeader title="Loved by creators & brands" theme={theme} />
            {isDesktop ? (
              <View style={styles.testimonialGrid}>
                {testimonials.map((t, i) => (
                  <TestimonialCard key={i} t={t} theme={theme} isDesktop />
                ))}
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScrollContent}>
                {testimonials.map((t, i) => (
                  <TestimonialCard key={i} t={t} theme={theme} />
                ))}
              </ScrollView>
            )}
          </View>

          {/* ── FAQ ── */}
          <View style={styles.section}>
            <SectionHeader title="Questions? Answered." theme={theme} />
            <View style={styles.faqWrap}>
              {faqs.map((f, i) => (
                <FaqItem key={i} faq={f} theme={theme} />
              ))}
            </View>
          </View>

          {/* ── FINAL CTA ── */}
          <View style={styles.finalCtaWrap}>
            <LinearGradient colors={[PURPLE, PINK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.finalCta}>
              <Text style={styles.finalCtaTitle}>Ready to get paid to be you?</Text>
              <Text style={styles.finalCtaDesc}>Join 10,000+ creators and 500+ brands on Influmart.</Text>
              <TouchableOpacity onPress={() => navigation.navigate('BrandorInfluencer')} activeOpacity={0.85} style={styles.finalCtaBtn}>
                <Text style={styles.finalCtaBtnText}>Get Started  →</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* ── FOOTER ── */}
          <View style={[styles.footer, { borderTopColor: theme.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)", backgroundColor: theme.isDark ? "rgba(255,255,255,0.02)" : "#f0f2f8" }]}>
            <View style={[styles.footerInner, isDesktop && styles.footerInnerDesktop]}>
              <View style={styles.footerBrandCol}>
                <Text style={[styles.footerLogo, { color: theme.text }]}>Influmart</Text>
                <Text style={[styles.footerTagline, { color: theme.subText }]}>The creator marketplace — get paid to be you.</Text>
              </View>
              <View style={styles.footerCol}>
                <Text style={[styles.footerHead, { color: theme.text }]}>Product</Text>
                <TouchableOpacity onPress={() => navigation.navigate('InfluencersList')}><Text style={[styles.footerLink, { color: theme.subText }]}>For Creators</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('BrandsAssosciated')}><Text style={[styles.footerLink, { color: theme.subText }]}>For Brands</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('BrandorInfluencer')}><Text style={[styles.footerLink, { color: theme.subText }]}>Get Started</Text></TouchableOpacity>
              </View>
              <View style={styles.footerCol}>
                <Text style={[styles.footerHead, { color: theme.text }]}>Account</Text>
                <TouchableOpacity onPress={() => navigation.navigate('BrandorInfluencer')}><Text style={[styles.footerLink, { color: theme.subText }]}>Log In</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('BrandorInfluencer')}><Text style={[styles.footerLink, { color: theme.subText }]}>Sign Up</Text></TouchableOpacity>
              </View>
              <View style={styles.footerCol}>
                <Text style={[styles.footerHead, { color: theme.text }]}>Legal</Text>
                <TouchableOpacity onPress={openPrivacy}><Text style={[styles.footerLink, { color: theme.subText }]}>Privacy Policy</Text></TouchableOpacity>
              </View>
            </View>
            <Text style={[styles.footerCopy, { color: theme.isDark ? "#6b7280" : "#b5bcc9" }]}>© 2026 Influmart. All rights reserved.</Text>
          </View>

          <View style={{ height: 110 }} />
          </View>
        </ScrollView>

        <ThemeToggle />

        {!isDesktop && (
          <Depth1Frame
            depth5Frame0={require("../assets/depth-5-frame-01.png")}
            depth5Frame01={require("../assets/depth-5-frame-02.png")}
            search="Influencers"
            depth5Frame02={require("../assets/depth-5-frame-03.png")}
            myBrands="Brands"
            depth5Frame03={require("../assets/depth-5-frame-04.png")}
            style={styles.bottomBar}
          />
        )}
      </View>
    </View>
  );
};

// Animated count-up number (web + native safe — no native driver needed).
const CountUp = ({ to, duration = 1400, style }) => {
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    const anim = new Animated.Value(0);
    const id = anim.addListener(({ value }) => setVal(value));
    Animated.timing(anim, { toValue: to, duration, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => anim.removeListener(id);
  }, [to]);
  return <Text style={style}>{Math.round(val)}</Text>;
};

// Auto-scrolling row of creator avatars.
const AV_SIZE = 54;
const AV_GAP = 12;
const CreatorMarquee = () => {
  const tx = React.useRef(new Animated.Value(0)).current;
  const setWidth = AVATARS.length * (AV_SIZE + AV_GAP);
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(tx, { toValue: -setWidth, duration: 22000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [setWidth]);
  return (
    <View style={styles.marqueeRow} pointerEvents="none">
      <Animated.View style={{ flexDirection: "row", transform: [{ translateX: tx }] }}>
        {[...AVATARS, ...AVATARS].map((a, i) => (
          <Image key={i} source={a} style={styles.marqueeAvatar} resizeMode="cover" />
        ))}
      </Animated.View>
    </View>
  );
};

// Premium bento card — neutral surface + a soft tinted icon chip with a clean
// line icon. Theme-aware (dark glassy surface / light card with subtle shadow).
const BentoCard = ({ feature, theme, isDesktop }) => {
  const cardBg = theme.isDark ? "#16161f" : "#ffffff";
  const chipBg = theme.isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)";
  const sizeStyle = feature.span === 2 ? styles.bentoFull : (isDesktop ? styles.bentoThird : styles.bentoHalf);
  return (
    <View
      style={[
        styles.bentoCard,
        sizeStyle,
        { backgroundColor: cardBg, borderColor: theme.isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" },
      ]}
    >
      <View style={[styles.bentoIconChip, { backgroundColor: feature.tint + "1f" }]}>
        <Ionicons name={feature.icon} size={22} color={feature.tint} />
      </View>
      <Text style={[styles.bentoTitle, { color: theme.text }]}>{feature.title}</Text>
      <Text style={[styles.bentoDesc, { color: theme.subText }]}>{feature.desc}</Text>

      {/* Hero card fills its space with social proof + niche pills. */}
      {feature.span === 2 && (
        <View style={styles.bentoHeroExtras}>
          <View style={styles.avatarStack}>
            {AVATARS.slice(0, 5).map((a, i) => (
              <Image
                key={i}
                source={a}
                style={[styles.stackAvatar, { borderColor: cardBg, marginLeft: i === 0 ? 0 : -12 }]}
                resizeMode="cover"
              />
            ))}
            <View style={[styles.stackMore, { borderColor: cardBg, backgroundColor: feature.tint }]}>
              <Text style={styles.stackMoreText}>+10K</Text>
            </View>
          </View>
          <View style={styles.tagRow}>
            {feature.tags.map((t, i) => (
              <View key={i} style={[styles.tagPill, { backgroundColor: chipBg }]}>
                <Text style={[styles.tagText, { color: theme.subText }]}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// Desktop top navigation bar (replaces the mobile floating bottom bar).
const TopNav = ({ navigation, theme }) => (
  <View style={[styles.topNavOuter, { backgroundColor: theme.bg, borderBottomColor: theme.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)" }]}>
    <View style={styles.topNavInner}>
      <Text style={[styles.topNavLogo, { color: theme.text }]}>Influmart</Text>
      <View style={styles.topNavLinks}>
        <TouchableOpacity onPress={() => navigation.navigate("InfluencersList")}><Text style={[styles.topNavLink, { color: theme.subText }]}>Influencers</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("BrandsAssosciated")}><Text style={[styles.topNavLink, { color: theme.subText }]}>Brands</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("BrandorInfluencer")}><Text style={[styles.topNavLink, { color: theme.subText }]}>Login</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("BrandorInfluencer")} activeOpacity={0.85}>
          <LinearGradient colors={[PINK, PURPLE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.topNavCta}>
            <Text style={styles.topNavCtaText}>Get Started</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  </View>
)

// Faux in-app "product preview" rendered in code (no image assets) — a mini
// dashboard that sits in the showcase panel, Influencity-style.
const ShowcasePreview = ({ type }) => {
  const card = "rgba(255,255,255,0.96)";
  const txt = "#14141c";
  const sub = "#6b7280";
  if (type === "discover") {
    const rows = [
      { a: AVATARS[1], n: "@aisha.styles", m: "48.2K followers · 6.1% ER" },
      { a: AVATARS[5], n: "@rohan.tech", m: "120K followers · 4.8% ER" },
      { a: AVATARS[7], n: "@meera.fit", m: "86K followers · 5.3% ER" },
    ];
    return (
      <View style={styles.pvWrap}>
        <View style={styles.pvRowBetween}>
          <Text style={[styles.pvName, { color: "#fff" }]}>10,234 creators</Text>
          <View style={styles.pvAiChip}><Text style={styles.pvAiChipText}>✨ AI</Text></View>
        </View>
        <View style={[styles.pvSearch, { backgroundColor: card }]}>
          <Ionicons name="search" size={13} color={sub} />
          <Text style={[styles.pvSearchText, { color: sub }]}>fashion creators in Mumbai</Text>
        </View>
        <View style={styles.pvPillRow}>
          {["Fashion", "Tech", "Fitness", "10K–100K"].map((t, i) => (
            <View key={i} style={styles.pvPill}><Text style={styles.pvPillText}>{t}</Text></View>
          ))}
        </View>
        {rows.map((r, i) => (
          <View key={i} style={[styles.pvRow, { backgroundColor: card }]}>
            <Image source={r.a} style={styles.pvAvatar} resizeMode="cover" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.pvName, { color: txt }]}>{r.n}</Text>
              <Text style={[styles.pvMeta, { color: sub }]}>{r.m}</Text>
            </View>
            <View style={styles.pvVerified}><Ionicons name="checkmark" size={11} color="#fff" /></View>
          </View>
        ))}
        <Text style={[styles.pvViewAll, { color: "#fff" }]}>View all 10,234 creators →</Text>
      </View>
    );
  }
  if (type === "campaign") {
    return (
      <View style={styles.pvWrap}>
        <View style={[styles.pvCard, { backgroundColor: card }]}>
          <View style={styles.pvRowBetween}>
            <Text style={[styles.pvName, { color: txt }]}>Summer Collab '26</Text>
            <View style={styles.pvOpen}><Text style={styles.pvOpenText}>OPEN</Text></View>
          </View>
          <View style={styles.pvStack}>
            {AVATARS.slice(0, 4).map((a, i) => (
              <Image key={i} source={a} style={[styles.pvAvatarSm, { marginLeft: i ? -8 : 0 }]} resizeMode="cover" />
            ))}
            <Text style={[styles.pvMeta, { color: sub, marginLeft: 8 }]}>12 applied</Text>
          </View>
          <View style={styles.pvProgress}><View style={styles.pvProgressFill} /></View>
          <Text style={[styles.pvMeta, { color: sub }]}>6 of 12 slots filled</Text>
        </View>
        <View style={styles.pvStatRow}>
          <View style={[styles.pvStat, { backgroundColor: card }]}><Text style={[styles.pvStatV, { color: txt }]}>2.4M</Text><Text style={[styles.pvStatL, { color: sub }]}>Reach</Text></View>
          <View style={[styles.pvStat, { backgroundColor: card }]}><Text style={[styles.pvStatV, { color: txt }]}>₹80K</Text><Text style={[styles.pvStatL, { color: sub }]}>Budget</Text></View>
          <View style={[styles.pvStat, { backgroundColor: card }]}><Text style={[styles.pvStatV, { color: txt }]}>5.4%</Text><Text style={[styles.pvStatL, { color: sub }]}>Avg ER</Text></View>
        </View>
        <View style={[styles.pvCard, { backgroundColor: card }]}>
          <Text style={[styles.pvMeta, { color: sub, fontFamily: FontFamily.lexendBold, fontWeight: "700" }]}>Recent applicants</Text>
          {[{ a: AVATARS[2], n: "@nisha.co" }, { a: AVATARS[6], n: "@arjun.plays" }].map((r, i) => (
            <View key={i} style={styles.pvRowBetween}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Image source={r.a} style={styles.pvAvatarSm2} resizeMode="cover" />
                <Text style={[styles.pvMeta, { color: txt }]}>{r.n}</Text>
              </View>
              <View style={styles.pvShortlist}><Text style={styles.pvShortlistText}>Shortlist</Text></View>
            </View>
          ))}
        </View>
      </View>
    );
  }
  // chat
  return (
    <View style={styles.pvWrap}>
      <View style={[styles.pvChatHeader, { backgroundColor: card }]}>
        <Image source={AVATARS[1]} style={styles.pvAvatarSm2} resizeMode="cover" />
        <View style={{ flex: 1 }}>
          <Text style={[styles.pvName, { color: txt, fontSize: 12 }]}>@aisha.styles</Text>
          <Text style={[styles.pvMeta, { color: "#22c55e", fontSize: 10 }]}>● online</Text>
        </View>
        <Ionicons name="videocam-outline" size={16} color={sub} />
      </View>
      <View style={[styles.pvBubbleL, { backgroundColor: card }]}><Text style={[styles.pvMeta, { color: txt }]}>Hey! Love your reels 🔥 Collab?</Text></View>
      <View style={styles.pvBubbleR}><Text style={[styles.pvMeta, { color: "#fff" }]}>Thanks! Here's my rate card 👇</Text></View>
      <View style={styles.pvReaction}><Text style={styles.pvReactionText}>❤️ 24   👍 8</Text></View>
      <View style={[styles.pvBubbleL, { backgroundColor: card }]}><Text style={[styles.pvMeta, { color: txt }]}>Perfect — sending the contract ✍️</Text></View>
      <View style={[styles.pvInput, { backgroundColor: card }]}>
        <Text style={[styles.pvMeta, { color: sub, flex: 1 }]}>Message…</Text>
        <Ionicons name="send" size={13} color={sub} />
      </View>
    </View>
  );
};

// Full-width feature block: screenshot banner + icon chip + title + desc + bullets.
const ShowcaseRow = ({ item, theme, isDesktop, index }) => (
  <View
    style={[
      styles.showcaseCard,
      !isDesktop && [styles.showcaseCardMobile, { backgroundColor: theme.isDark ? "#16161f" : "#ffffff", borderColor: theme.isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }],
      isDesktop && { flexDirection: index % 2 === 1 ? "row-reverse" : "row", alignItems: "center", gap: 56 },
    ]}
  >
    <LinearGradient
      colors={item.grad}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={[styles.showcaseImage, isDesktop && styles.showcaseImageDesktop, styles.showcasePanel]}
    >
      <ShowcasePreview type={item.type} />
    </LinearGradient>
    <View style={[styles.showcaseBody, isDesktop && styles.showcaseBodyDesktop]}>
      <View style={[styles.bentoIconChip, { backgroundColor: item.grad[0] + "1f" }]}>
        <Ionicons name={item.icon} size={20} color={item.grad[0]} />
      </View>
      <Text style={[styles.showcaseTitle, { color: theme.text }]}>{item.title}</Text>
      <Text style={[styles.showcaseDesc, { color: theme.subText }]}>{item.desc}</Text>
      <View style={{ gap: 8, marginTop: 4 }}>
        {item.bullets.map((b, i) => (
          <View key={i} style={styles.bulletRow}>
            <Ionicons name="checkmark-circle" size={16} color={item.grad[0]} />
            <Text style={[styles.bulletText, { color: theme.subText }]}>{b}</Text>
          </View>
        ))}
      </View>
    </View>
  </View>
)

const TestimonialCard = ({ t, theme, isDesktop }) => (
  <View style={[styles.testimonialCard, isDesktop && styles.testimonialCardDesktop, { backgroundColor: theme.isDark ? "#16161f" : "#ffffff", borderColor: theme.isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }]}>
    <Text style={[styles.testimonialQuoteMark, { color: PINK }]}>"</Text>
    <Text style={[styles.testimonialQuote, { color: theme.text }]}>{t.quote}</Text>
    <View style={styles.testimonialAuthor}>
      <Image source={t.avatar} style={styles.testimonialAvatar} resizeMode="cover" />
      <View>
        <Text style={[styles.testimonialName, { color: theme.text }]}>{t.name}</Text>
        <Text style={[styles.testimonialRole, { color: theme.subText }]}>{t.role}</Text>
      </View>
    </View>
  </View>
)

const FaqItem = ({ faq, theme }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => setOpen((o) => !o)}
      style={[styles.faqItem, { backgroundColor: theme.isDark ? "#16161f" : "#ffffff", borderColor: theme.isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }]}
    >
      <View style={styles.faqQRow}>
        <Text style={[styles.faqQ, { color: theme.text }]}>{faq.q}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={theme.subText} />
      </View>
      {open && <Text style={[styles.faqA, { color: theme.subText }]}>{faq.a}</Text>}
    </TouchableOpacity>
  );
}

const SectionHeader = ({ title, theme }) => (
  <View style={styles.sectionHeaderRow}>
    <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
    <View style={[styles.sectionAccentLine, { backgroundColor: PINK }]} />
  </View>
)

const FeatureCard = ({ feature, theme }) => (
  <Pressable style={[styles.featureCard, { backgroundColor: theme.isDark ? '#151521' : '#ffffff', borderTopColor: PINK }]}>
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
  },
  // Center + cap the content column on wide screens (mobile-first → clean on desktop).
  scrollContent: {
    alignItems: "center",
  },
  contentCol: {
    width: "100%",
    maxWidth: 560,
  },

  // TOP NAV (desktop)
  topNavOuter: {
    width: "100%",
    borderBottomWidth: 1,
    alignItems: "center",
  },
  topNavInner: {
    width: "100%",
    maxWidth: 1120,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingVertical: 16,
  },
  topNavLogo: {
    fontSize: 22,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  topNavLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 26,
  },
  topNavLink: {
    fontSize: 14,
    fontFamily: FontFamily.lexendMedium,
  },
  topNavCta: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  topNavCtaText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
  },

  // HERO (desktop, side-by-side)
  heroDesktop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 40,
    paddingHorizontal: 24,
    paddingVertical: 48,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  heroDesktopLeft: {
    flex: 1,
    gap: 16,
    alignItems: "flex-start",
  },
  heroDesktopRight: {
    flex: 1,
  },
  heroDesktopImage: {
    width: "100%",
    height: 400,
    borderRadius: 24,
  },
  heroTitleDesktop: {
    fontSize: 52,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
    lineHeight: 56,
    letterSpacing: -1.2,
  },
  heroSubtitleDesktop: {
    fontSize: 17,
    fontFamily: FontFamily.lexendRegular,
    lineHeight: 26,
    maxWidth: 460,
  },

  // HERO
  heroContainer: {
    width: "100%",
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
  },
  heroWash: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
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
    backgroundColor: "rgba(236,72,153,0.22)",
    borderWidth: 1,
    borderColor: "rgba(236,72,153,0.55)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  heroBadgeText: {
    color: "#ffd1ec",
    fontSize: 10,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontSize: 44,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 48,
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: FontFamily.lexendRegular,
    color: "rgba(255,255,255,0.78)",
    lineHeight: 22,
  },
  heroCTA: {
    alignSelf: "flex-start",
    paddingHorizontal: 26,
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 6,
    shadowColor: PINK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  heroCTAText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // STATS
  statsEyebrow: {
    color: PINK,
    fontSize: 11,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
    letterSpacing: 1.5,
    textAlign: "center",
    alignSelf: "center",
    marginBottom: 10,
  },
  statsStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingVertical: 22,
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
  },
  statItem: {
    alignItems: "center",
    gap: 2,
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
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

  // MARQUEE
  marqueeWrap: {
    paddingTop: 22,
    gap: 12,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  marqueeCaption: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: FontFamily.lexendMedium,
    letterSpacing: 0.3,
  },
  marqueeRow: {
    height: AV_SIZE,
    overflow: "hidden",
  },
  marqueeAvatar: {
    width: AV_SIZE,
    height: AV_SIZE,
    borderRadius: AV_SIZE / 2,
    marginRight: AV_GAP,
    borderWidth: 2,
    borderColor: "rgba(236,72,153,0.6)",
  },

  // SECTIONS
  section: {
    paddingTop: 30,
    paddingBottom: 8,
    gap: 14,
  },
  sectionHeaderRow: {
    paddingHorizontal: 20,
    gap: 6,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  sectionAccentLine: {
    width: 36,
    height: 3,
    borderRadius: 2,
  },
  hScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 12,
  },

  // BENTO GRID
  bentoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  bentoCard: {
    borderRadius: 18,
    padding: 18,
    minHeight: 130,
    borderWidth: 1,
    justifyContent: "flex-start",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  bentoFull: {
    width: "100%",
    minHeight: 128,
  },
  bentoHalf: {
    flexGrow: 1,
    flexBasis: "46%",
  },
  bentoThird: {
    flexGrow: 1,
    flexBasis: "30%",
  },
  bentoIconChip: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  bentoTitle: {
    fontSize: 16,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  bentoDesc: {
    fontSize: 12.5,
    fontFamily: FontFamily.lexendRegular,
    lineHeight: 18,
  },
  bentoHeroExtras: {
    marginTop: 14,
    gap: 12,
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  stackAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
  },
  stackMore: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    marginLeft: -12,
    alignItems: "center",
    justifyContent: "center",
  },
  stackMoreText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  tagText: {
    fontSize: 11,
    fontFamily: FontFamily.lexendMedium,
  },

  // SHOWCASE
  showcaseWrap: {
    paddingHorizontal: 16,
    gap: 44,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  showcaseCard: {
    gap: 18,
  },
  // Mobile only — boxed card look.
  showcaseCardMobile: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    gap: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  showcaseImage: {
    width: "100%",
    minHeight: 240,
  },
  // Desktop only — floats freely with a soft shadow (no card wrapper).
  showcaseImageDesktop: {
    width: "48%",
    minHeight: 360,
    borderRadius: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.2,
    shadowRadius: 26,
    elevation: 10,
  },
  showcasePanel: {
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },

  // FAUX PRODUCT PREVIEW
  pvWrap: {
    width: "100%",
    maxWidth: 400,
    gap: 9,
  },
  pvAiChip: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  pvAiChipText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
  },
  pvPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  pvPill: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pvPillText: {
    color: "#fff",
    fontSize: 10.5,
    fontFamily: FontFamily.lexendMedium,
  },
  pvProgress: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  pvProgressFill: {
    width: "50%",
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#22c55e",
  },
  pvReaction: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  pvReactionText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: FontFamily.lexendMedium,
  },
  pvViewAll: {
    fontSize: 12,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 2,
  },
  pvAvatarSm2: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  pvShortlist: {
    backgroundColor: "rgba(0,0,0,0.06)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pvShortlistText: {
    fontSize: 10.5,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
    color: "#4b5563",
  },
  pvChatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderRadius: 12,
    marginBottom: 2,
  },
  pvSearch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  pvSearchText: {
    fontSize: 12,
    fontFamily: FontFamily.lexendRegular,
  },
  pvRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 12,
  },
  pvRowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  pvCard: {
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  pvStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  pvAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  pvAvatarSm: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  pvName: {
    fontSize: 13,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
  },
  pvMeta: {
    fontSize: 11.5,
    fontFamily: FontFamily.lexendRegular,
  },
  pvVerified: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
  },
  pvOpen: {
    backgroundColor: "#22c55e",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pvOpenText: {
    color: "#fff",
    fontSize: 9,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  pvStatRow: {
    flexDirection: "row",
    gap: 8,
  },
  pvStat: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  pvStatV: {
    fontSize: 15,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
  },
  pvStatL: {
    fontSize: 10,
    fontFamily: FontFamily.lexendRegular,
  },
  pvBubbleL: {
    alignSelf: "flex-start",
    maxWidth: "85%",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderBottomLeftRadius: 4,
  },
  pvBubbleR: {
    alignSelf: "flex-end",
    maxWidth: "85%",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderBottomRightRadius: 4,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  pvInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    marginTop: 2,
  },
  showcaseBody: {
    padding: 16,
    gap: 10,
  },
  showcaseBodyDesktop: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 0,
  },
  showcaseTitle: {
    fontSize: 18,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  showcaseDesc: {
    fontSize: 13,
    fontFamily: FontFamily.lexendRegular,
    lineHeight: 20,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bulletText: {
    fontSize: 12.5,
    fontFamily: FontFamily.lexendMedium,
  },

  // TESTIMONIALS
  testimonialCard: {
    width: 280,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    gap: 8,
  },
  testimonialGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 16,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  testimonialCardDesktop: {
    width: 340,
  },
  testimonialQuoteMark: {
    fontSize: 40,
    lineHeight: 40,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
    height: 30,
  },
  testimonialQuote: {
    fontSize: 14,
    fontFamily: FontFamily.lexendMedium,
    lineHeight: 21,
  },
  testimonialAuthor: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
  },
  testimonialAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  testimonialName: {
    fontSize: 13,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
  },
  testimonialRole: {
    fontSize: 11,
    fontFamily: FontFamily.lexendRegular,
  },

  // FAQ
  faqWrap: {
    paddingHorizontal: 16,
    gap: 10,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  faqItem: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  faqQRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  faqQ: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
  },
  faqA: {
    fontSize: 12.5,
    fontFamily: FontFamily.lexendRegular,
    lineHeight: 19,
  },

  // FINAL CTA
  finalCtaWrap: {
    paddingHorizontal: 16,
    paddingTop: 34,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  finalCta: {
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    gap: 10,
  },
  finalCtaTitle: {
    color: "#fff",
    fontSize: 22,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  finalCtaDesc: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontFamily: FontFamily.lexendRegular,
    textAlign: "center",
  },
  finalCtaBtn: {
    marginTop: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 26,
    paddingVertical: 14,
    borderRadius: 30,
  },
  finalCtaBtnText: {
    color: "#1a1a2e",
    fontSize: 15,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
  },

  // FOOTER
  footer: {
    width: "100%",
    borderTopWidth: 1,
    marginTop: 40,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: "center",
    gap: 24,
  },
  footerInner: {
    width: "100%",
    maxWidth: 1180,
    paddingHorizontal: 24,
    gap: 28,
    alignItems: "center",
  },
  footerInnerDesktop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 40,
  },
  footerBrandCol: {
    gap: 8,
    alignItems: "center",
    maxWidth: 320,
  },
  footerLogo: {
    fontSize: 20,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  footerTagline: {
    fontSize: 12.5,
    fontFamily: FontFamily.lexendRegular,
    lineHeight: 18,
    textAlign: "center",
  },
  footerCol: {
    gap: 10,
    alignItems: "center",
  },
  footerHead: {
    fontSize: 13,
    fontFamily: FontFamily.lexendBold,
    fontWeight: "700",
    marginBottom: 2,
  },
  footerLink: {
    fontSize: 13,
    fontFamily: FontFamily.lexendRegular,
  },
  footerCopy: {
    fontSize: 11,
    fontFamily: FontFamily.lexendRegular,
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
  serveGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    paddingHorizontal: 16,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  serveCard: {
    borderRadius: 20,
    padding: 24,
    paddingVertical: 36,
    gap: 12,
  },
  serveCardG: {
    flexGrow: 1,
    flexBasis: 320,
    minWidth: 260,
  },
  accountGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    paddingHorizontal: 16,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  // Mobile: single neat horizontal scroll row (no orphaned card / empty gaps).
  accountRow: {
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 16,
    paddingRight: 24,
  },
  serveBadge: {
    color: "rgba(255,255,255,0.7)",
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
    color: "rgba(255,255,255,0.8)",
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
