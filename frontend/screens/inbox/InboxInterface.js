import React, { useState, useContext, useEffect } from "react";
import { Text, StyleSheet, View, ScrollView, TouchableOpacity, TextInput, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import { Color } from "../../GlobalStyles";
import { inboxStyles } from './InboxInterface.scss';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAllConversations, searchUsers, findOrCreateConversation } from "../../controller/connectionsController";
import { useAlert } from "../../util/AlertContext";
import ImageWithFallback from "../../util/ImageWithFallback";
import Loader from '../../shared/Loader'

const InboxInterface = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState([]);
  const [userId, setUserId] = useState(null)
  const [userType, setUserType] = useState(null)
  const { showAlert } = useAlert()
  const[loading,setLoading]=useState(false)

  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showFloatButton, setShowFloatButton] = React.useState(true);
  const [scrollOffset, setScrollOffset] = React.useState(0);

  function handleScroll(event) {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const direction = currentOffset > scrollOffset ? 'down' : 'up';
    const shouldShowButton = direction === 'up';
    if (shouldShowButton !== showFloatButton) {
      setShowFloatButton(shouldShowButton);
    }
    setScrollOffset(currentOffset);
  }

  useEffect(() => {
    const getData = async () => {
      let id;
      let data;
      const _influencer = await AsyncStorage.getItem('influencerId')
      const _brand = await AsyncStorage.getItem('brandId')
      if (_influencer) {
        id = _influencer;
        data = await getAllConversations(id, 'influencer', setConversations, showAlert)
        setUserId(id)
        setUserType('influencer')
      } else if (_brand) {
        id = _brand;
        data = await getAllConversations(id, 'brand', setConversations, showAlert)
        setUserId(id)
        setUserType('brand')
      }
      setLoading(false)
    }
    setLoading(true)
    getData();
  }, []);

  const handleSearchChange = async (text) => {
    setSearchQuery(text);
    if (text.trim() === '' || userType === 'brand' || userType === 'influencer') {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const results = await searchUsers(text, userType);
    setSearchResults(results || []);
    setSearching(false);
  };

  const handleSearchResultPress = async (result) => {
    const conversationId = await findOrCreateConversation(userId, result._id, userType);
    setSearchQuery('');
    setSearchResults([]);
    navigation.navigate("ChatInterface", {
      name: result.name,
      image: result.profileUrl,
      isSelectedImage: result.isSelectedImage,
      conversationId,
      userId,
      userType,
      receiverId: result._id,
    });
  };

  const filteredConversations = conversations?.filter((message) =>
    message?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={{ width: "100%", height: "100%" }}>
      {loading&&<Loader loading={loading}/>}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerSide}>
            <Image
              style={styles.newMessageIcon}
              contentFit="cover"
              source={require("../../assets/depth-4-frame-07.png")}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Inbox</Text>
          <View style={styles.headerSide} />
        </View>
      </View>
      <ScrollView onScroll={handleScroll} contentContainerStyle={styles.scrollViewContent}>
        <View style={[styles.inboxContainer, { height: Dimensions.get("window").height }]}>
          <View style={styles.searchContainer}>
            <View style={styles.searchContent}>
              <Image
                style={styles.searchIcon}
                contentFit="cover"
                source={require("../../assets/search_icon.png")}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for a project, brand or Influencer"
                placeholderTextColor={Color.colorSlategray_200}
                value={searchQuery}
                onChangeText={handleSearchChange}
              />
            </View>
          </View>
          {searchResults.length > 0 && (
            <View style={styles.searchResultsContainer}>
              {searchResults.map((result, index) => (
                <TouchableOpacity key={index} onPress={() => handleSearchResultPress(result)}>
                  <View style={styles.messageContainer}>
                    <ImageWithFallback
                      imageStyle={styles.messageImage}
                      image={result.profileUrl}
                      isSelectedImage={result.isSelectedImage}
                    />
                    <View style={styles.messageContent}>
                      <Text style={styles.messageTitle}>{result.name}</Text>
                      <Text style={styles.messageStatus}>Tap to message</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {searchResults.length === 0 && filteredConversations?.map((message, index) => (
            // <View key={index}>
            <TouchableOpacity key={index} onPress={() => navigation.navigate("ChatInterface", { name: message?.name,isSelectedImage:message?.isSelectedImage, image: message?.profileUrl, conversationId: message?.conversationId, userId: userId, userType: userType, receiverId: message?.receiverId })}>
              <View style={styles.messageContainer}>
              {message?.profileUrl == null ? (
                  <ImageWithFallback
                    imageStyle={styles.messageImage}
                    image={message?.profileUrl}
                    key={index}
                    isSelectedImage={message?.isSelectedImage}
                  />
                ) : (
                  message?.profileUrl && (
                    <ImageWithFallback
                      imageStyle={styles.messageImage}
                      image={isNaN(message?.profileUrl)==false?`${message?.profileUrl}`:message?.profileUrl}
                      key={index}
                      isSelectedImage={message?.isSelectedImage}
                    />
                  )
                )}
                <View style={styles.messageContent}>
                  <Text style={styles.messageTitle}>{message?.name}</Text>
                  <Text style={styles.messageStatus}>{message?.lastUpdate}</Text>
                </View>
              </View>
              <View style={styles.messagePreviewContainer}>
                <Text style={styles.messagePreview}>{message?.lastMessage}</Text>
              </View>
            </TouchableOpacity>

          ))}

          <View style={styles.spacer} />
          <View style={styles.spacer} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create(inboxStyles);

export default InboxInterface;
