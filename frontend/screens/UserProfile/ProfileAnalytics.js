import * as React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../util/ThemeContext";
import { formatNumber, transformIG, transformFB, transformYT } from "../../helpers/GraphData";
import MyLineChart from "../../shared/MyLineChart";

// A colorful, data-rich analytics dashboard for the influencer profile.
// Reuses the already-computed stat arrays (statItems) for the number tiles and
// reads the raw influencer object for gauges, time-series and audience splits.

// Muted, desaturated data-viz palette (classy SaaS look). BAR is the single
// neutral accent used for one-series charts (columns, ranked bars, gauge).
const PALETTE = ["#4263eb", "#5f6b7a", "#7048e8", "#0ca678", "#f08c00", "#1098ad", "#e64980", "#495057"];
const BAR = "#4263eb";

// Icon per metric heading (best-effort match; falls back to a chart glyph).
const iconFor = (heading = "") => {
  const h = heading.toLowerCase();
  if (h.includes("follow")) return "people";
  if (h.includes("subscriber")) return "person-add";
  if (h.includes("like") || h.includes("reaction")) return "heart";
  if (h.includes("comment")) return "chatbubble-ellipses";
  if (h.includes("share")) return "share-social";
  if (h.includes("view") || h.includes("play") || h.includes("watch")) return "eye";
  if (h.includes("engagement") || h.includes("er")) return "flame";
  if (h.includes("interaction")) return "flash";
  if (h.includes("price")) return "pricetag";
  return "stats-chart";
};

// ── Audience helpers (mirror the parsing used elsewhere in UserProfile) ──
const AGE_LABELS = {
  "0_18": "Under 18", "18_21": "18–21", "21_24": "21–24", "24_27": "24–27",
  "27_30": "27–30", "30_35": "30–35", "35_45": "35–45", "45_100": "45+",
};
const ageLabel = (raw) => AGE_LABELS[raw] || (raw ? String(raw).replace(/_/g, "–") : "");
const REACH_LABELS = {
  r0_500: "Low · under 500", r500_1000: "Moderate · 500–1k",
  r1000_1500: "Good · 1k–1.5k", r1500_plus: "High · 1.5k+",
};
const cityLabel = (raw) =>
  raw ? String(raw).split(/[-_]/).map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : "")).join(" ") : "";

// ── Circular gauge (engagement rate) ──
const Donut = ({ percent, label, color, theme }) => {
  const size = 128, stroke = 9, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, percent || 0));
  const offset = c - (pct / 100) * c;
  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={theme.divider} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={`${c} ${c}`} strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.donutCenter}>
        <Text style={[styles.donutValue, { color: theme.text }]}>{pct.toFixed(2)}%</Text>
        <Text style={[styles.donutLabel, { color: theme.subText }]}>{label}</Text>
      </View>
    </View>
  );
};

// Shared card shell for an audience visualization.
const VizCard = ({ title, icon, theme, children, style }) => (
  <View style={[styles.card, styles.audCard, style, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
    <View style={styles.cardHead}>
      <Ionicons name={icon} size={14} color={theme.subText} />
      <Text style={[styles.cardTitle, { color: theme.subText }]}>{title}</Text>
    </View>
    {children}
  </View>
);

// ── Ring / donut pie (categorical shares) ──
const RingCard = ({ title, icon, rows, theme, centerLabel }) => {
  if (!rows || !rows.length) return null;
  const size = 132, stroke = 13, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const total = rows.reduce((s, x) => s + x.pct, 0) || 1;
  let acc = 0;
  const top = rows.reduce((a, b) => (b.pct > a.pct ? b : a), rows[0]);
  return (
    <VizCard title={title} icon={icon} theme={theme}>
      <View style={styles.ringRow}>
        <View style={{ width: size, height: size }}>
          <Svg width={size} height={size}>
            <Circle cx={size / 2} cy={size / 2} r={r} stroke={theme.divider} strokeWidth={stroke} fill="none" />
            {rows.map((row, i) => {
              const frac = row.pct / total;
              const dash = frac * c;
              const angle = (acc / total) * 360 - 90;
              acc += row.pct;
              return (
                <Circle
                  key={i}
                  cx={size / 2} cy={size / 2} r={r}
                  stroke={PALETTE[i % PALETTE.length]} strokeWidth={stroke} fill="none"
                  strokeDasharray={`${dash} ${c - dash}`}
                  strokeLinecap="butt"
                  transform={`rotate(${angle} ${size / 2} ${size / 2})`}
                />
              );
            })}
          </Svg>
          <View style={styles.ringCenter}>
            <Text style={[styles.ringBig, { color: theme.text }]}>{top.pct.toFixed(0)}%</Text>
            <Text style={[styles.ringSub, { color: theme.subText }]}>{centerLabel || top.label}</Text>
          </View>
        </View>
        <View style={styles.ringLegend}>
          {rows.map((r2, i) => (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: PALETTE[i % PALETTE.length] }]} />
              <Text style={[styles.legendLabel, { color: theme.text }]} numberOfLines={1}>{r2.label}</Text>
              <Text style={[styles.legendPct, { color: theme.subText }]}>{r2.pct.toFixed(1)}%</Text>
            </View>
          ))}
        </View>
      </View>
    </VizCard>
  );
};

// ── Segmented bar (categorical shares) — one sleek rounded bar + legend ──
const SegmentCard = ({ title, icon, rows, theme }) => {
  if (!rows || !rows.length) return null;
  const total = rows.reduce((s, r) => s + r.pct, 0) || 1;
  return (
    <VizCard title={title} icon={icon} theme={theme}>
      <View style={[styles.segTrack, { backgroundColor: theme.divider }]}>
        {rows.map((r, i) => (
          <View key={i} style={{ flexGrow: r.pct / total, backgroundColor: PALETTE[i % PALETTE.length] }} />
        ))}
      </View>
      <View style={styles.legendWrap}>
        {rows.map((r, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: PALETTE[i % PALETTE.length] }]} />
            <Text style={[styles.legendLabel, { color: theme.text }]} numberOfLines={1}>{r.label}</Text>
            <Text style={[styles.legendPct, { color: theme.subText }]}>{r.pct.toFixed(1)}%</Text>
          </View>
        ))}
      </View>
    </VizCard>
  );
};

// ── Vertical column chart (ordered buckets, e.g. age groups) ──
const ColumnCard = ({ title, icon, rows, theme }) => {
  if (!rows || !rows.length) return null;
  const max = Math.max(...rows.map((r) => r.pct), 1);
  return (
    <VizCard title={title} icon={icon} theme={theme}>
      <View style={styles.colChart}>
        {rows.slice(0, 8).map((r, i) => (
          <View key={i} style={styles.colItem}>
            <Text style={[styles.colPct, { color: theme.subText }]}>{r.pct.toFixed(0)}%</Text>
            <View style={styles.colBarTrack}>
              <View style={[styles.colBar, { height: `${Math.max(6, (r.pct / max) * 100)}%`, backgroundColor: BAR }]} />
            </View>
            <Text style={[styles.colLabel, { color: theme.text }]} numberOfLines={1}>{r.label}</Text>
          </View>
        ))}
      </View>
    </VizCard>
  );
};

// ── Ranked list with gradient bars (e.g. top cities) ──
const RankedCard = ({ title, icon, rows, theme }) => {
  if (!rows || !rows.length) return null;
  const max = Math.max(...rows.map((r) => r.pct), 1);
  return (
    <VizCard title={title} icon={icon} theme={theme}>
      {rows.slice(0, 6).map((r, i) => (
        <View key={i} style={styles.rankRow}>
          <View style={[styles.rankBadge, { backgroundColor: theme.accent + "1A" }]}>
            <Text style={[styles.rankNum, { color: theme.accent }]}>{i + 1}</Text>
          </View>
          <View style={styles.rankBody}>
            <View style={styles.rankHead}>
              <Text style={[styles.rankLabel, { color: theme.text }]} numberOfLines={1}>{r.label}</Text>
              <Text style={[styles.rankPct, { color: theme.subText }]}>{r.pct.toFixed(1)}%</Text>
            </View>
            <View style={[styles.rankTrack, { backgroundColor: theme.divider }]}>
              <View style={[styles.rankFill, { width: `${Math.max(6, (r.pct / max) * 100)}%`, backgroundColor: BAR }]} />
            </View>
          </View>
        </View>
      ))}
    </VizCard>
  );
};

const StatTile = ({ heading, value, theme }) => (
  <View style={[styles.tile, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
    <View style={[styles.tileIcon, { backgroundColor: theme.accent + "16" }]}>
      <Ionicons name={iconFor(heading)} size={16} color={theme.accent} />
    </View>
    <Text style={[styles.tileValue, { color: theme.text }]} numberOfLines={1}>{value}</Text>
    <Text style={[styles.tileLabel, { color: theme.subText }]} numberOfLines={2}>{heading}</Text>
  </View>
);

// A metric is worth a tile only if it actually has a value.
const hasValue = (v) => {
  if (v == null) return false;
  const s = String(v).trim();
  return s !== "" && !/^(N\/A|₹?\s*N\/A|0|0\s*%|₹\s*0)$/i.test(s);
};

// Audience heading set is rendered as bars, not tiles.
const AUDIENCE_HEADINGS = new Set(["Audience Reach", "Top Audience Cities", "Audience Age Groups", "Gender"]);

const ProfileAnalytics = ({ influencer, tab, statItems, showEmpty = false, hideTrend = false }) => {
  const { theme } = useTheme();
  if (!influencer || !statItems) return null;

  // Scalar metrics → tiles. By default skip empty/N-A values (clean grid);
  // when showEmpty is set (analytics dashboard) show every metric.
  const tiles = statItems.filter(
    (it) =>
      !AUDIENCE_HEADINGS.has(it.heading) &&
      (typeof it.content === "string" || typeof it.content === "number") &&
      (showEmpty || hasValue(it.content))
  );

  // Engagement rate for the gauge (parse from the ER tile).
  const erItem = statItems.find((it) => /engagement rate|avg er|^er$/i.test(it.heading));
  const erValue = erItem ? parseFloat(String(erItem.content).replace(/[^\d.]/g, "")) : 0;

  // Time-series (followers / views) for the line chart.
  let series = null, seriesTitle = "", seriesTracking = null;
  try {
    if (tab === "instagram") {
      const ig = transformIG(influencer)?.instadata;
      if (ig?.followers?.some((v) => v > 0)) { series = ig.followers; seriesTracking = ig.trackingData; seriesTitle = "Followers Over Time"; }
    } else if (tab === "facebook") {
      const fb = transformFB(influencer)?.fbdata;
      if (fb?.followers?.some((v) => v > 0)) { series = fb.followers; seriesTracking = fb.trackingData; seriesTitle = "Followers Over Time"; }
    } else if (tab === "youtube") {
      // ytData may arrive as a JSON string; the monthly series lives under `.analytics`.
      let yraw = influencer?.ytData;
      if (typeof yraw === "string") { try { yraw = JSON.parse(yraw); } catch (_) { yraw = null; } }
      const yt = transformYT(yraw?.analytics || []);
      const total = yraw?.overAll?.subscriberCount ?? yraw?.subscriberCount;
      const net = yt?.subscribersNetGained || [];
      // Prefer a subscriber-growth line: reconstruct cumulative subscribers by
      // walking backwards from the current total using monthly net gains.
      if (total != null && net.length && net.some((v) => v !== 0)) {
        const cum = new Array(net.length);
        let running = Number(total) || 0;
        for (let i = net.length - 1; i >= 0; i--) { cum[i] = Math.max(0, running); running -= net[i]; }
        series = cum; seriesTracking = yt.trackingData; seriesTitle = "Subscribers Over Time";
      } else if (yt?.views?.some((v) => v > 0)) {
        series = yt.views; seriesTracking = yt.trackingData; seriesTitle = "Views Over Time";
      }
    }
  } catch (e) { series = null; }

  // Audience splits (Instagram only — that's where the demographic data lives).
  let genderRows = null, ageRows = null, cityRows = null, reachRows = null;
  if (tab === "instagram") {
    const igLatest = influencer?.instaData?.[influencer.instaData.length - 1] || {};
    const g = igLatest?.genders;
    if (Array.isArray(g) && g.length) {
      const pct = (n) => (g.find((x) => x?.name === n)?.percent || 0) * 100;
      genderRows = [
        { label: "Female", pct: pct("f") },
        { label: "Male", pct: pct("m") },
      ].filter((r) => r.pct > 0);
    }
    if (Array.isArray(igLatest?.ages)) {
      ageRows = igLatest.ages
        .map((a) => ({ label: ageLabel(a?.range || a?.name), pct: parseFloat(a?.percent) * 100 }))
        .filter((r) => r.pct > 0);
    }
    if (Array.isArray(igLatest?.memberCities)) {
      cityRows = igLatest.memberCities.slice(0, 6)
        .map((c2) => ({ label: cityLabel(c2?.category || c2?.city), pct: parseFloat(c2?.percent ?? c2?.value * 100) }))
        .filter((r) => r.pct > 0);
    }
    if (Array.isArray(igLatest?.membersReachability)) {
      reachRows = igLatest.membersReachability
        .map((it) => ({ label: REACH_LABELS[it?.name] || it?.name, pct: parseFloat(it?.percent) * 100 }))
        .filter((r) => r.pct > 0);
    }
  }

  if (hideTrend) series = null; // detailed graphs are shown separately (analytics)

  const hasAudience = [genderRows, ageRows, cityRows, reachRows].some((r) => r && r.length);

  return (
    <View style={styles.wrap}>
      {/* Stat tiles */}
      <View style={styles.tileGrid}>
        {tiles.map((it, i) => (
          <StatTile key={i} heading={it.heading} value={it.content} theme={theme} />
        ))}
      </View>

      {/* Gauge + line chart */}
      {(erValue > 0 || series) && (
        <View style={styles.chartsRow}>
          {erValue > 0 && (
            <View style={[styles.card, styles.gaugeCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.cardHead}>
                <Ionicons name="flame" size={14} color={theme.subText} />
                <Text style={[styles.cardTitle, { color: theme.subText }]}>Engagement Rate</Text>
              </View>
              <Donut percent={erValue} label="Engagement" color={BAR} theme={theme} />
            </View>
          )}
          {series && (
            <View style={[styles.card, styles.lineCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.cardHead}>
                <Ionicons name="trending-up" size={14} color={theme.subText} />
                <Text style={[styles.cardTitle, { color: theme.subText }]}>{seriesTitle}</Text>
              </View>
              <MyLineChart data={series} tracking={seriesTracking} title={seriesTitle} />
            </View>
          )}
        </View>
      )}

      {/* Audience breakdowns */}
      {hasAudience && (
        <View style={styles.audienceGrid}>
          <RingCard title="Gender Split" icon="male-female" rows={genderRows} theme={theme} />
          <ColumnCard title="Age Groups" icon="calendar" rows={ageRows} theme={theme} />
          <RankedCard title="Top Cities" icon="location" rows={cityRows} theme={theme} />
          <SegmentCard title="Audience Reachability" icon="megaphone" rows={reachRows} theme={theme} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { width: "100%", paddingHorizontal: 16, gap: 20 },

  tileGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: {
    flexGrow: 1, flexBasis: 150, minWidth: 140, maxWidth: 240,
    borderRadius: 16, borderWidth: 1, padding: 18, gap: 12,
  },
  tileIcon: {
    width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center",
  },
  tileValue: { fontSize: 19, fontWeight: "800", letterSpacing: -0.3 },
  tileLabel: { fontSize: 11, lineHeight: 14, fontWeight: "500" },

  chartsRow: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  card: { borderRadius: 18, borderWidth: 1, padding: 20, gap: 16 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 7 },
  // Small uppercase gray label (SaaS-dashboard style).
  cardTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 0.7, textTransform: "uppercase" },
  gaugeCard: { flexGrow: 1, flexBasis: 220, minWidth: 200, alignItems: "center" },
  lineCard: { flexGrow: 3, flexBasis: 320, minWidth: 280 },

  donutCenter: { position: "absolute", top: 44, alignItems: "center", width: 128 },
  donutValue: { fontSize: 20, fontWeight: "800" },
  donutLabel: { fontSize: 10 },

  audienceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  // Each audience card grows to fill; two-up on desktop, one-up on mobile.
  audCard: { flexGrow: 1, flexBasis: 320, minWidth: 260 },

  // Ring / donut pie
  ringRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20, flexWrap: "wrap" },
  ringCenter: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  ringBig: { fontSize: 24, fontWeight: "800" },
  ringSub: { fontSize: 11 },
  ringLegend: { gap: 10, minWidth: 150 },

  // Segmented bar + legend
  segTrack: { flexDirection: "row", height: 10, borderRadius: 5, overflow: "hidden" },
  legendWrap: { gap: 8 },
  legendItem: { flexDirection: "row", alignItems: "center" },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendLabel: { fontSize: 12, fontWeight: "600", flex: 1 },
  legendPct: { fontSize: 12, fontWeight: "700" },

  // Vertical column chart
  colChart: { flexDirection: "row", alignItems: "flex-end", height: 150, gap: 8 },
  colItem: { flex: 1, alignItems: "center", height: "100%", justifyContent: "flex-end", gap: 4 },
  colPct: { fontSize: 10, fontWeight: "700" },
  colBarTrack: { flex: 1, width: 18, justifyContent: "flex-end", maxHeight: 100 },
  colBar: { width: "100%", borderRadius: 9, minHeight: 6 },
  colLabel: { fontSize: 10, fontWeight: "600" },

  // Ranked list
  rankRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  rankBadge: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rankNum: { fontSize: 12, fontWeight: "800" },
  rankBody: { flex: 1, gap: 5 },
  rankHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rankLabel: { fontSize: 12, fontWeight: "600", flexShrink: 1, marginRight: 8 },
  rankPct: { fontSize: 11, fontWeight: "700" },
  rankTrack: { height: 6, borderRadius: 4, overflow: "hidden" },
  rankFill: { height: 6, borderRadius: 4 },
});

export default ProfileAnalytics;
