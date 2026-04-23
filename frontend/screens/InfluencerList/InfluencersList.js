import * as React from "react";
import { Image } from "expo-image";
import { StyleSheet, Text, View, ScrollView, Pressable, TouchableOpacity } from "react-native";
import Depth1Frame11 from "../../components/Depth1Frame11";
import Filter from "./Filter";
import { Color, Padding, Border, FontFamily, FontSize } from "../../GlobalStyles";
import InfluencerCard from "./IncluencerCard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GetAllInfluencerProfile } from "../../controller/InfluencerController";
import { useAlert } from "../../util/AlertContext";
import Loader from '../../shared/Loader'

const InfluencerIcon = require("../../assets/depth-3-frame-0.png");
const BrandIcon = require("../../assets/depth-3-frame-01.png");
const BothIcon = require("../../assets/depth-3-frame-02.png");
const AllIcon = require("../../assets/depth-3-frame-03.png");

const InfluencersList = ({ route, navigation }) => {
  const newData = route.params?.newData
  const [searchValue, setSearchValue] = React.useState("");
  const [showFloatButton, setShowFloatButton] = React.useState(true);
  const [scrollOffset, setScrollOffset] = React.useState(0);
  const [brandId, setBrandId] = React.useState("");
  const [influencerData, setInfluencerData] = React.useState(null);
  const { showAlert } = useAlert()
  const [loading, setLoading] = React.useState(false)
  const [selectedFilter, setSeletedFilter] = React.useState("")
  React.useEffect(() => {
    if (selectedFilter == "Reset") {
      setLoading(true)
      GetAllInfluencerProfile(setInfluencerData)
      setLoading(false)
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
  const filterOptions = [
    "Platform", "Price", "Engagement Rate", "Age", "Followers Count", "Post Count", "Views Count", "Location", "Gender", "Tags", "Category", "Cities"
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
      item.influencerName.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.userName.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.category.toLowerCase().includes(searchValue.toLowerCase())
    )
    : [];
  return (
    <>
      <View style={styles.container}>
        {loading && <Loader loading={loading} />}
        <Depth1Frame11 style={styles.menuBar} onChange={setSearchValue} />
        <View style={styles.scrollContainer}>
          <ScrollView onScroll={handleScroll} scrollEventThrottle={16} style={styles.scrollView}>
            <View style={{ width: "100%", height: "auto", display: "flex", flexDirection: "row", alignItems: "center", padding: Padding.p_base }}>
              <Image style={styles.filterIcon} contentFit="cover" source={require("../../assets/filter-icon.png")} />
              <ScrollView showsHorizontalScrollIndicator={false} horizontal contentContainerStyle={{ paddingRight: 10 }} style={{ width: "auto", paddingVertical: 8, height: "auto" }}>
                {
                  filterOptions?.map((filterValue, key) => {
                    return (
                      <TouchableOpacity style={styles.filterContainer} key={key} onPress={() => {
                        setSeletedFilter(filterValue)
                      }}>
                        <Text style={styles.filterText}>{filterValue}</Text>
                      </TouchableOpacity>
                    )
                  })
                }
                <TouchableOpacity style={[styles.filterContainer, { backgroundColor: "red" }]} onPress={() => { setSeletedFilter("Reset") }}>
                  <Text style={[styles.filterText, { color: "#fff" }]}>Reset</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
            <View style={styles.cardContainer}>
              {
                filteredData?.length == 0 ?
                  <View>
                    <Text>No influencers found</Text>
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
        {/* <View style={[styles.floatButtonContainer, { opacity: showFloatButton ? 1 : 0.4 }]}>
          <Pressable onPress={() => navigation.navigate("FilterUI")} style={styles.floatButton}>
            <View style={styles.floatButtonContent}>
              <Image style={styles.floatButtonImage} contentFit="cover" source={require("../../assets/depth-4-frame-015.png")} />
              <View style={styles.floatButtonTextContainer}>
                <Text style={styles.floatButtonText}>Filters</Text>
              </View>
            </View>
          </Pressable>
        </View> */}
      </View>
      <Filter selectedFilter={selectedFilter} setLoading={setLoading} setSeletedFilter={setSeletedFilter} />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: Color.colorWhite,
  },
  menuBar: {
    position: "static",
    top: 0,
    zIndex: 5,
  },
  scrollContainer: {
    width: "100%",
    height: "100%",
  },
  scrollView: {
    width: "100%",
    height: "100%",
    flex: 1,
    marginBottom: 90
  },
  horizontalScroll: {
    height: "auto",
    padding: Padding.p_xs,
    zIndex: 4,
    overflow: "visible",
  },
  dropdownContainer: {
    height: "auto",
    flexDirection: "row",
    gap: 12,
    paddingEnd: 40,
    zIndex: 4,
  },
  cardContainer: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 48
  },
  trendingContainer: {
    paddingHorizontal: Padding.p_base,
    paddingTop: Padding.p_xl,
    paddingBottom: Padding.p_xs,
  },
  trendingWrapper: {
    width: "auto",
    height: 30,
  },
  trendingText: {
    fontSize: FontSize.size_3xl,
    lineHeight: 28,
    color: Color.colorGray_500,
    fontWeight: "700",
    letterSpacing: 0,
  },
  floatButtonContainer: {
    width: "auto",
    justifyContent: "flex-end",
    overflow: "hidden",
    position: "absolute",
    bottom: 50,
    right: 40,
    zIndex: 10,
  },
  floatButton: {
    justifyContent: "center",
    height: 40,
    width: "auto",
    flexDirection: "row",
    overflow: "hidden",
  },
  floatButtonContent: {
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: {
      width: 103,
      height: 40,
    },
    shadowRadius: 4,
    elevation: 4,
    shadowOpacity: 1,
    backgroundColor: Color.colorRoyalblue,
    paddingLeft: Padding.p_base,
    paddingRight: Padding.p_base,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Border.br_xs,
    height: 40,
    width: "auto",
    display: "flex",
    flexDirection: "row"
  },
  floatButtonImage: {
    width: 24,
    height: 24,
  },
  floatButtonTextContainer: {
    width: "auto",
    marginLeft: 8,
    overflow: "hidden",
  },
  floatButtonText: {
    color: Color.colorWhite,
    fontFamily: FontFamily.beVietnamProSemibold,
    fontWeight: "600",
    fontSize: FontSize.size_base,
    width: "auto",
  },
  filterText: {
    fontFamily: FontFamily.beVietnamProRegular,
    height: "auto",
  },
  filterContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 8,
    paddingHorizontal: 28,
    borderRadius: Border.br_xl,
    marginHorizontal: 4
  },
  filterIcon: {
    width: 24,
    height: 24,
    marginRight: 4
  },
});

export default InfluencersList;
