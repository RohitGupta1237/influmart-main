import * as React from "react";
import { Image } from "expo-image";
import { StyleSheet, Text, View, ScrollView, Pressable, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import Depth1Frame11 from "../../components/Depth1Frame11";
import Filter from "./Filter";
import { Color, Padding, Border, FontFamily, FontSize } from "../../GlobalStyles";
import InfluencerCard from "./IncluencerCard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GetAllInfluencerProfile } from "../../controller/InfluencerController";
import { useAlert } from "../../util/AlertContext";
import Loader from '../../shared/Loader'
import ThemeToggle from '../../shared/ThemeToggle'
import { useTheme } from '../../util/ThemeContext'

const API_ENDPOINT = "http://localhost:3000";

const InfluencersList = ({ route, navigation }) => {
  const newData = route.params?.newData
  const [searchValue, setSearchValue] = React.useState("");
  const [showFloatButton, setShowFloatButton] = React.useState(true);
  const [scrollOffset, setScrollOffset] = React.useState(0);
  const [brandId, setBrandId] = React.useState("");
  const [influencerData, setInfluencerData] = React.useState(null);
  const { showAlert } = useAlert()
  const { theme } = useTheme()
  const [loading, setLoading] = React.useState(false)
  const [selectedFilter, setSeletedFilter] = React.useState("")

  // AI Search state
  const [aiQuery, setAiQuery] = React.useState("")
  const [aiLoading, setAiLoading] = React.useState(false)
  const [aiParsedFilters, setAiParsedFilters] = React.useState(null)
  const [isAiResult, setIsAiResult] = React.useState(false)

  React.useEffect(() => {
    if (selectedFilter == "Reset") {
      setLoading(true)
      GetAllInfluencerProfile(setInfluencerData)
      setLoading(false)
      clearAiSearch()
    }
  }, [selectedFilter])

  React.useEffect(() => {
    const getBrandId = async () => {
      const brandId = await AsyncStorage.getItem("brandId");
      setBrandId(brandId);
    }
    getBrandId(setInfluencerData, showAlert);
  }, [])

  React.useEffect(() => {
    if (!newData) {
      setLoading(true)
      GetAllInfluencerProfile(setInfluencerData)
      setLoading(false)
    } else {
      setInfluencerData(newData)
    }
  }, [brandId, route.params])

  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return
    setAiLoading(true)
    setAiParsedFilters(null)
    setIsAiResult(false)
    try {
      const response = await fetch(`${API_ENDPOINT}/influencers/ai-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: aiQuery.trim() }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "AI search failed")
      setInfluencerData(data.influencers)
      setAiParsedFilters(data.parsedFilters)
      setIsAiResult(true)
    } catch (err) {
      showAlert("AI Search Failed", err.message || "Something went wrong. Try again.")
    } finally {
      setAiLoading(false)
    }
  }

  const clearAiSearch = () => {
    setAiQuery("")
    setAiParsedFilters(null)
    setIsAiResult(false)
  }

  // Build human-readable tag summary from parsed filters
  const fmtNum = (n) => n >= 1000000 ? (n/1000000)+'M' : n >= 1000 ? (n/1000)+'k' : n
  const fmtRange = (r, fmt) => { const p = []; if (r.min != null) p.push(`≥${fmt(r.min)}`); if (r.max != null) p.push(`≤${fmt(r.max)}`); return p.join(" ") }

  const buildFilterTags = (filters) => {
    if (!filters) return []
    const tags = []
    if (filters.platform?.length) tags.push(`Platform: ${filters.platform.join(", ")}`)
    if (filters.category?.length) tags.push(`Category: ${filters.category.join(", ")}`)
    if (filters.gender) tags.push(`Gender: ${filters.gender}`)
    if (filters.cities?.length) tags.push(`Cities: ${filters.cities.join(", ")}`)
    if (filters.audienceCityMinPercent != null) tags.push(`Audience in city ≥${(filters.audienceCityMinPercent*100).toFixed(0)}%`)
    if (filters.location) tags.push(`Location: ${filters.location}`)
    if (filters.followers) Object.entries(filters.followers).forEach(([p, r]) => { const s = fmtRange(r, fmtNum); if (s) tags.push(`${p.toUpperCase()} followers ${s}`) })
    if (filters.price) Object.entries(filters.price).forEach(([p, r]) => { const s = fmtRange(r, v => `₹${v}`); if (s) tags.push(`${p.toUpperCase()} price ${s}`) })
    if (filters.engagementRate) Object.entries(filters.engagementRate).forEach(([p, r]) => { const s = fmtRange(r, v => `${v}%`); if (s) tags.push(`${p.toUpperCase()} ER ${s}`) })
    if (filters.avgInteractions?.ig) { const s = fmtRange(filters.avgInteractions.ig, fmtNum); if (s) tags.push(`IG interactions ${s}`) }
    if (filters.avgViews?.fb) { const s = fmtRange(filters.avgViews.fb, fmtNum); if (s) tags.push(`FB views ${s}`) }
    if (filters.avgViews?.yt) { const s = fmtRange(filters.avgViews.yt, fmtNum); if (s) tags.push(`YT views ${s}`) }
    if (filters.audienceGender?.female) { const s = fmtRange(filters.audienceGender.female, v => `${v}%`); if (s) tags.push(`Female audience ${s}`) }
    if (filters.audienceGender?.male) { const s = fmtRange(filters.audienceGender.male, v => `${v}%`); if (s) tags.push(`Male audience ${s}`) }
    if (filters.audienceAge) tags.push(`Age group ${filters.audienceAge.group} ≥${((filters.audienceAge.minPercent||0)*100).toFixed(0)}%`)
    if (filters.sort) tags.push(`Sorted by ${filters.sort.field} ${filters.sort.order === 'desc' ? '↓' : '↑'}`)
    if (filters.limit) tags.push(`Top ${filters.limit}`)
    return tags
  }

  const filterOptions = [
    "Platform", "Budget", "Engagement Rate", "Gender", "Followers Count", "Post Count", "Avg Views Count", "Location", "Tags", "Category", "Cities"
  ]

  function handleScroll(event) {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const direction = currentOffset > scrollOffset ? 'down' : 'up';
    const shouldShowButton = direction === 'up';
    if (shouldShowButton !== showFloatButton) {
      setShowFloatButton(shouldShowButton);
    }
    setScrollOffset(currentOffset);
  }

  const filteredData = influencerData
    ? influencerData.filter((item) =>
      item.influencerName?.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.userName?.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchValue.toLowerCase())
    )
    : [];

  const filterTags = buildFilterTags(aiParsedFilters)

  return (
    <>
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {selectedFilter !== "" && selectedFilter !== "Reset" && (
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setSeletedFilter("")}
            style={styles.backdrop}
          />
        )}
        {loading && <Loader loading={loading} />}
        <Depth1Frame11 style={styles.menuBar} onChange={setSearchValue} />

        {/* AI Search Bar */}
        <View style={[styles.aiSearchContainer, { backgroundColor: theme.bg, borderColor: theme.filterBorder || "#e0e7ef" }]}>
          <Text style={styles.aiLabel}>AI Search</Text>
          <View style={styles.aiInputRow}>
            <TextInput
              style={[styles.aiInput, { color: theme.filterText || "#111", backgroundColor: theme.filterBg || "#f4f7fb", borderColor: theme.filterBorder || "#d0dbe8" }]}
              placeholder='e.g. "female fitness influencer in Mumbai under ₹10k"'
              placeholderTextColor="#9aabbb"
              value={aiQuery}
              onChangeText={setAiQuery}
              onSubmitEditing={handleAiSearch}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={[styles.aiSearchBtn, aiLoading && { opacity: 0.6 }]}
              onPress={handleAiSearch}
              disabled={aiLoading}
            >
              {aiLoading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.aiSearchBtnText}>Search</Text>
              }
            </TouchableOpacity>
          </View>
          {isAiResult && filterTags.length > 0 && (
            <View style={styles.aiTagsRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {filterTags.map((tag, i) => (
                  <View key={i} style={styles.aiTag}>
                    <Text style={styles.aiTagText}>{tag}</Text>
                  </View>
                ))}
              </ScrollView>
              <TouchableOpacity onPress={() => { clearAiSearch(); GetAllInfluencerProfile(setInfluencerData) }} style={styles.aiClearBtn}>
                <Text style={styles.aiClearText}>✕ Clear</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={[styles.scrollContainer, { backgroundColor: theme.bg }]}>
          <ScrollView onScroll={handleScroll} scrollEventThrottle={16} style={[styles.scrollView, { backgroundColor: theme.bg }]}>
            <View style={{ width: "100%", height: "auto", display: "flex", flexDirection: "row", alignItems: "center", padding: Padding.p_base }}>
              <Image style={styles.filterIcon} contentFit="cover" tintColor={theme.iconTint} source={require("../../assets/filter-icon.png")} />
              <ScrollView showsHorizontalScrollIndicator={false} horizontal contentContainerStyle={{ paddingRight: 10 }} style={{ width: "auto", paddingVertical: 8, height: "auto" }}>
                {
                  filterOptions?.map((filterValue, key) => {
                    return (
                      <TouchableOpacity style={[styles.filterContainer, { backgroundColor: theme.filterBg, borderColor: theme.filterBorder }]} key={key} onPress={() => {
                        setSeletedFilter(filterValue)
                      }}>
                        <Text style={[styles.filterText, { color: theme.filterText }]}>{filterValue}</Text>
                      </TouchableOpacity>
                    )
                  })
                }
                <TouchableOpacity style={[styles.filterContainer, { backgroundColor: "red", borderColor: "red" }]} onPress={() => { setSeletedFilter("Reset") }}>
                  <Text style={[styles.filterText, { color: "#fff" }]}>Reset</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
            <View style={styles.cardContainer}>
              {
                filteredData?.length == 0 ?
                  <View>
                    <Text style={{ color: theme.emptyText }}>No influencers found</Text>
                  </View>
                  :
                  filteredData && filteredData.map((item, index) => {
                    let ytSubscribers = "N/A";
                    try {
                      const yt = item?.ytData?.[0];
                      const parsed = typeof yt === "string" ? JSON.parse(yt) : yt;
                      ytSubscribers = parsed?.overAll?.subscriberCount ?? parsed?.subscriberCount ?? "N/A";
                    } catch (e) {}
                    return <InfluencerCard key={index} userName={item?.userName} influencerId={item?._id} depth5Frame0={item?.profileUrl} isSelectedImage={item?.isSelectedImage} kylieCosmetics={item?.influencerName} beauty={item?.category} statistics={{ ytData: ytSubscribers, instaData: item?.instaData[0]?.followers || "N/A", fbData: item?.fbData[0]?.followers || "N/A" }} />;
                  })
              }
            </View>
          </ScrollView>
        </View>
        <ThemeToggle />
      </View>
      <Filter selectedFilter={selectedFilter} setLoading={setLoading} setSeletedFilter={setSeletedFilter} setInfluencerData={setInfluencerData} />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
  },
  menuBar: {
    position: "static",
    top: 0,
    zIndex: 5,
  },
  aiSearchContainer: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
  },
  aiLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1A5CE5",
    letterSpacing: 0.5,
    marginBottom: 5,
    textTransform: "uppercase",
  },
  aiInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  aiInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  aiSearchBtn: {
    backgroundColor: "#1A5CE5",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 70,
  },
  aiSearchBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  aiTagsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
    gap: 6,
  },
  aiTag: {
    backgroundColor: "#e8f0fe",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
  },
  aiTagText: {
    color: "#1A5CE5",
    fontSize: 11,
    fontWeight: "600",
  },
  aiClearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  aiClearText: {
    color: "#e53935",
    fontSize: 12,
    fontWeight: "700",
  },
  scrollContainer: {
    width: "100%",
    height: "100%",
  },
  scrollView: {
    width: "100%",
    height: "100%",
    flex: 1,
    marginBottom: 90,
  },
  cardContainer: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  filterText: {
    fontFamily: FontFamily.beVietnamProRegular,
    height: "auto",
  },
  filterContainer: {
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 28,
    borderRadius: Border.br_xl,
    marginHorizontal: 4,
  },
  filterIcon: {
    width: 24,
    height: 24,
    marginRight: 4,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
});

export default InfluencersList;
