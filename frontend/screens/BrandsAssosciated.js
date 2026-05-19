import * as React from "react";
import { Image } from "expo-image";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { Color, Padding, FontSize, FontFamily, Border } from "../GlobalStyles";
import { useNavigation } from "@react-navigation/native";
import { getAllBrandProfiles } from '../controller/brandController'
import { useAlert } from '../util/AlertContext'
import AsyncStorage from "@react-native-async-storage/async-storage";
import ImageWithFallback from "../util/ImageWithFallback";
import { formatNumber } from "../helpers/GraphData";
import Loader from '../shared/Loader'
import { LinearGradient } from 'expo-linear-gradient'
import ThemeToggle from '../shared/ThemeToggle'
import { useTheme } from '../util/ThemeContext'


const BrandAssosciated = ({ active }) => {
  const navigation = useNavigation();
  const { showAlert } = useAlert()
  const [isSearchBarOpen, setIsSearchBarOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const [brands, setBrands] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const { theme } = useTheme()
  React.useEffect(() => {
    async function fetchData() {
      const res = await getAllBrandProfiles(showAlert)
      setBrands(res)
      setLoading(false)
    }
    setLoading(true)
    fetchData()
  }, [])

  const handleBack = async () => {
    const brand = await AsyncStorage.getItem("brandId")
    const influencer = await AsyncStorage.getItem("influencerId")
    if (brand) {
      navigation.navigate('BrandProfile')
    } else if (influencer) {
      navigation.navigate('UserProfile')
    } else {
      navigation.navigate('Homepage')
    }
  }
  const handleSearch = () => {
    setIsSearchBarOpen(!isSearchBarOpen)
  }

  const filteredBrands = brands.filter((brand) => {
    const searchTerm = searchValue?.toLowerCase();
    return (
      (brand?.brandName?.toLowerCase()?.includes(searchTerm) || '') ||
      (brand?.name?.toLowerCase()?.includes(searchTerm) || '') ||
      (brand?.category?.toLowerCase()?.includes(searchTerm) || '')
    );
  });

  return (
    <View style={[styles.galileoDesign, { backgroundColor: theme.bg }]}>
      {loading && <Loader loading={loading} />}
      <View style={styles.depth0Frame0}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.headerBorder }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => handleBack()}>
            <Image
              style={{ height: 24, width: 24 }}
              contentFit="cover"
              tintColor={theme.iconTint}
              source={require("../assets/depth-4-frame-010.png")}
            />
          </TouchableOpacity>
          {isSearchBarOpen ? (
            <TextInput
              onChangeText={(text) => setSearchValue(text)}
              style={[styles.SearchBar, { color: theme.searchText, backgroundColor: theme.searchBg, borderColor: theme.searchBorder }]}
              placeholder="Search brands..."
              placeholderTextColor={theme.placeholder}
              autoFocus
            />
          ) : (
            <Text style={[styles.headerTitle, { color: theme.text }]}>Brands</Text>
          )}
          <TouchableOpacity style={styles.headerBtn} onPress={handleSearch}>
            <Image style={{ width: 24, height: 24 }} tintColor={theme.iconTint} source={require('../assets/depth-5-frame-0.png')} />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ width: '100%', backgroundColor: theme.bg }} contentContainerStyle={styles.scrollContent}>
          {filteredBrands.length > 0 ?
            filteredBrands.map((brand, index) => (
              <BrandCard key={index} brand={brand} />
            ))
            :
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.emptyText }]}>No Brands found</Text>
            </View>
          }
        </ScrollView>
        <ThemeToggle />
      </View>
    </View>
  );
};

const BrandCard = ({ brand }) => {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.card}>
      <ImageWithFallback imageStyle={styles.cardImage} image={brand?.profileUrl} isSelectedImage={brand?.isSelectedImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.92)']}
        style={styles.gradient}
      >
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText} numberOfLines={1}>{brand?.category}</Text>
        </View>
        <Text style={styles.brandName} numberOfLines={1}>{brand?.brandName}</Text>
        <Text style={styles.userNameText} numberOfLines={1}>@{brand?.name}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statLabel}>Collaborations</Text>
            <Text style={styles.statValue}>
              {brand?.collaborationCount != null ? formatNumber(brand?.collaborationCount) : "0"}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  galileoDesign: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  depth0Frame0: {
    height: "100%",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FontFamily.interBold,
    fontWeight: "700",
  },
  SearchBar: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    fontSize: FontSize.size_base,
    borderRadius: Border.br_xs,
    borderWidth: 1,
    outlineStyle: "none",
  },
  scrollContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 80,
  },
  card: {
    width: 260,
    height: 360,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1a1a2e",
  },
  cardImage: {
    width: 260,
    height: 360,
    position: "absolute",
    top: 0,
    left: 0,
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingBottom: 16,
    paddingTop: 60,
    flexDirection: "column",
    gap: 4,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 4,
  },
  categoryBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: FontFamily.plusJakartaSansBold,
    letterSpacing: 0.5,
  },
  brandName: {
    fontSize: 17,
    fontFamily: FontFamily.interBold,
    fontWeight: "700",
    color: "#fff",
  },
  userNameText: {
    fontSize: 12,
    fontFamily: FontFamily.plusJakartaSansBold,
    color: "rgba(255,255,255,0.65)",
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    gap: 6,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontFamily: FontFamily.plusJakartaSansBold,
  },
  statValue: {
    color: "#fff",
    fontSize: 11,
    fontFamily: FontFamily.plusJakartaSansBold,
    fontWeight: "700",
  },
  emptyState: {
    width: "100%",
    paddingTop: 60,
    alignItems: "center",
  },
  emptyText: {
    fontSize: FontSize.size_base,
    fontFamily: FontFamily.interBold,
  },
});

export default BrandAssosciated;
