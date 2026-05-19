import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { Image } from "expo-image";
import { useFocusEffect } from "@react-navigation/native";
import { getAllCollabPosts, getAppliedCollabPosts } from "../../controller/collabOpenController";
import { useAlert } from "../../util/AlertContext";
import { Padding } from "../../GlobalStyles";
import ImageWithFallback from "../../util/ImageWithFallback";

const isCampaignClosed = (campaignTimelines) => {
  if (!campaignTimelines) return false;
  const parts = campaignTimelines.split(" - ");
  const endDate = new Date(parts[parts.length - 1]);
  if (isNaN(endDate)) return false;
  endDate.setHours(23, 59, 59, 999);
  return endDate < new Date();
};

const CollabPost = ({ navigation }) => {
  const [selectedFooterItem, setSelectedFooterItem] = useState("My Network");
  const [data, setData] = useState([]);
  const [appliedData, setAppliedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { showAlert } = useAlert();

  const isAppliedTab = selectedCategory === "Applied";
  const isAllTab = selectedCategory === "All";

  // Re-fetch every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      getAllCollabPosts(setData, showAlert);
      getAppliedCollabPosts(setAppliedData, () => {});
    }, [])
  );

  useEffect(() => {
    if (isAppliedTab) {
      setFilteredData(
        searchText
          ? appliedData.filter(post =>
              post.brandName?.toLowerCase().includes(searchText.toLowerCase()) ||
              post.campaignType?.toLowerCase().includes(searchText.toLowerCase()) ||
              post.postInfo?.toLowerCase().includes(searchText.toLowerCase())
            )
          : appliedData
      );
      return;
    }

    let filtered = data;
    if (!isAllTab) {
      filtered = filtered.filter(post =>
        post.campaignType?.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }
    if (searchText) {
      filtered = filtered.filter(post =>
        post.brandName?.toLowerCase().includes(searchText.toLowerCase()) ||
        post.campaignType?.toLowerCase().includes(searchText.toLowerCase()) ||
        post.postInfo?.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    setFilteredData(filtered);
  }, [searchText, selectedCategory, data, appliedData]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Image
            style={styles.icon}
            contentFit="cover"
            source={require("../../assets/adminPanelBack.png")}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Openings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Icon
              name="search"
              size={20}
              color="#888"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Find"
              value={searchText}
              onChangeText={setSearchText} // Update search text on input change
            />
          </View>
        </View>

        {/* Categories */}
        <View style={styles.categories}>
          <Text style={styles.categoryTitle}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {["All", "Lifestyle & Personal Branding", "Fashion & Beauty", "Food & Cooking", "Fitness & Health", "Travel & Exploration", "Tech & Gaming", "Education & Knowledge", "Entertainment & Comedy", "Business & Entrepreneurship", "Art & Creativity", "Parenting & Family", "Regional/Local Culture Creators", "Home Decor / Interior Creators", "Others", "Applied"].map(
              (category, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.categoryTag,
                    selectedCategory === category && styles.categoryTagSelected,
                    category === "Applied" && styles.categoryTagApplied,
                    selectedCategory === "Applied" && category === "Applied" && styles.categoryTagAppliedSelected,
                  ]}
                  onPress={() => {
                    if (category === "All") {
                      setSelectedCategory("All");
                      setSearchText("");
                      getAllCollabPosts(setData, showAlert);
                      getAppliedCollabPosts(setAppliedData, () => {});
                    } else {
                      setSelectedCategory(prev => prev === category ? "All" : category);
                    }
                  }}
                >
                  <Text style={[
                    category === "Applied" && styles.categoryTagAppliedText,
                    selectedCategory === "Applied" && category === "Applied" && { color: "#fff" },
                  ]}>
                    {category === "All"
                      ? `All (${data.length > 100 ? "100+" : data.length})`
                      : category}
                  </Text>
                </Pressable>
              )
            )}
          </ScrollView>
        </View>

        {/* Posts */}
        <View style={styles.posts}>
          {filteredData?.map((post, index) => {
            const closed = isCampaignClosed(post.campaignTimelines);
            return (
              <Pressable
                key={index}
                onPress={() => {
                  navigation.navigate("CampaignDetail", { data: post, isApplied: isAppliedTab, isClosed: closed });
                }}
              >
                <View style={[styles.postCard, closed && !isAppliedTab && styles.postCardClosed]}>
                  <View style={styles.postContent}>
                    <View style={styles.postTitleRow}>
                      <Text style={[styles.postTitle, closed && !isAppliedTab && styles.postTitleClosed]}>{post.brandName}</Text>
                      {closed && !isAppliedTab && (
                        <View style={styles.closedBadge}>
                          <Text style={styles.closedBadgeText}>Closed</Text>
                        </View>
                      )}
                      {isAppliedTab && (
                        <View style={styles.underReviewBadge}>
                          <Text style={styles.underReviewBadgeText}>Under Review</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.postName}>{post.campaignType}</Text>
                    <Text style={styles.postDegree}>{`${post.numberOfInfluencers} Influencers needed`}</Text>
                  </View>
                  <ImageWithFallback
                    imageStyle={[styles.postImage, closed && !isAppliedTab && { opacity: 0.5 }]}
                    image={post?.imageSource || null}
                    isSelectedImage={post?.isSelectedImage}
                    fallback={require("../../assets/brandDp.png")}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
  },
  iconButton: {
    marginRight: 16,
  },
  icon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  searchContainer: {
    padding: 16,
    backgroundColor: "#f8f8f8",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8EDF2",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
  },
  categories: {
    padding: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  categoryTag: {
    backgroundColor: "#E8EDF2",
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  categoryTagSelected: {
    backgroundColor: "#ddd",
  },
  categoryTagApplied: {
    backgroundColor: "#1a5ce6",
    borderRadius: 8,
  },
  categoryTagAppliedSelected: {
    backgroundColor: "#0d3fa3",
  },
  categoryTagAppliedText: {
    color: "#fff",
    fontWeight: "600",
  },
  posts: {
    padding: 16,
  },
  postCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    height: "auto",
    paddingHorizontal: Padding.p_base,
  },
  postContent: {
    flex: 1,
    paddingVertical: 16,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    overflow: "hidden",
  },
  postName: {
    fontSize: 14,
    color: "#4F7396",
  },
  postDegree: {
    fontSize: 12,
    color: "#4F7396",
  },
  postImage: {
    width: 75,
    height: 75,
    borderRadius: 10,
  },
  postCardClosed: {
    backgroundColor: "#f9f9f9",
    opacity: 0.75,
  },
  postTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  postTitleClosed: {
    color: "#999",
  },
  closedBadge: {
    backgroundColor: "#fee2e2",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  closedBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#c0392b",
  },
  underReviewBadge: {
    backgroundColor: "#fef9e7",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  underReviewBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#d4a017",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  footerItem: {
    alignItems: "center",
  },
  footerItemText: {
    fontSize: 12,
    color: "#555",
    marginTop: 6,
  },
  footerItemTextSelected: {
    color: "#000",
  },
});

export default CollabPost;
