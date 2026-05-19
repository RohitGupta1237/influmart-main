import React, { useState, useEffect, useRef } from "react";
import { Text, StyleSheet, View, ScrollView, TouchableOpacity, TextInput, Modal } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import { Color } from "../../GlobalStyles";
import { inboxStyles } from './InboxInterface.scss';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAllConversations, searchUsers, findOrCreateConversation, closeChat } from "../../controller/connectionsController";
import { useAlert } from "../../util/AlertContext";
import ImageWithFallback from "../../util/ImageWithFallback";
import Loader from '../../shared/Loader'
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const toTitleCase = (str) =>
  str ? str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : "";

const formatInboxTime = (dateStr) => {
  if (!dateStr) return "";
  // Parse "DD/MM/YYYY, HH:MM:SS" format
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4}),?\s*(\d{2}):(\d{2})/);
  const date = match
    ? new Date(+match[3], +match[2] - 1, +match[1], +match[4], +match[5])
    : new Date(dateStr);
  if (isNaN(date)) return dateStr;
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  const yy = String(date.getFullYear()).slice(-2);
  return `${String(date.getDate()).padStart(2,"0")}/${String(date.getMonth()+1).padStart(2,"0")}/${yy}`;
};

const InboxInterface = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState([]);
  const [userId, setUserId] = useState(null)
  const [userType, setUserType] = useState(null)
  const { showAlert } = useAlert()
  const [loading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showFloatButton, setShowFloatButton] = React.useState(true);
  const [scrollOffset, setScrollOffset] = React.useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null); // conversation to delete
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Keep refs to close open swipeables when another is opened
  const swipeableRefs = useRef({});
  const openSwipeableIndex = useRef(null);

  function handleScroll(event) {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const direction = currentOffset > scrollOffset ? 'down' : 'up';
    const shouldShowButton = direction === 'up';
    if (shouldShowButton !== showFloatButton) setShowFloatButton(shouldShowButton);
    setScrollOffset(currentOffset);
  }

  useEffect(() => {
    const getData = async () => {
      const _influencer = await AsyncStorage.getItem('influencerId')
      const _brand = await AsyncStorage.getItem('brandId')
      if (_influencer) {
        await getAllConversations(_influencer, 'influencer', setConversations, showAlert)
        setUserId(_influencer)
        setUserType('influencer')
      } else if (_brand) {
        await getAllConversations(_brand, 'brand', setConversations, showAlert)
        setUserId(_brand)
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

  const confirmDeleteChat = (message) => {
    const ref = swipeableRefs.current[message?.conversationId];
    if (ref) ref.close();
    setDeleteTarget(message);
  }

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await closeChat(userId, deleteTarget?.receiverId, deleteTarget?.conversationId);
      setConversations(prev => prev.filter(c => c.conversationId !== deleteTarget?.conversationId));
    } catch (err) {
      // silent fail — item stays in list
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  }

  const renderDeleteAction = (message) => (
    <TouchableOpacity
      style={swipeStyles.deleteAction}
      onPress={() => confirmDeleteChat(message)}
      activeOpacity={0.8}
    >
      <Text style={swipeStyles.deleteActionText}>Delete</Text>
    </TouchableOpacity>
  )

  const parseLastUpdate = (dateStr) => {
    if (!dateStr) return 0;
    const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4}),?\s*(\d{2}):(\d{2}):(\d{2})/);
    if (!match) return 0;
    return new Date(+match[3], +match[2]-1, +match[1], +match[4], +match[5], +match[6]).getTime();
  };

  const filteredConversations = conversations
    ?.filter((message) => message?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    ?.slice()
    ?.sort((a, b) => parseLastUpdate(b?.lastUpdate) - parseLastUpdate(a?.lastUpdate));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ width: "100%", height: "100%" }}>
        {loading && <Loader loading={loading} />}
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
          <View style={styles.inboxContainer}>
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
                        <Text style={styles.messageTitle}>{toTitleCase(result.name)}</Text>
                        <Text style={styles.messageStatus}>Tap to message</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {searchResults.length === 0 && filteredConversations?.map((message, index) => (
              <Swipeable
                key={message?.conversationId || index}
                ref={ref => { swipeableRefs.current[message?.conversationId] = ref }}
                renderRightActions={() => renderDeleteAction(message)}
                onSwipeableOpen={() => {
                  // Close previously open swipeable
                  if (openSwipeableIndex.current && openSwipeableIndex.current !== message?.conversationId) {
                    swipeableRefs.current[openSwipeableIndex.current]?.close()
                  }
                  openSwipeableIndex.current = message?.conversationId
                }}
                friction={2}
                rightThreshold={40}
              >
                <TouchableOpacity
                  onPress={() => navigation.navigate("ChatInterface", {
                    name: message?.name,
                    isSelectedImage: message?.isSelectedImage,
                    image: message?.profileUrl,
                    conversationId: message?.conversationId,
                    userId,
                    userType,
                    receiverId: message?.receiverId,
                  })}
                  activeOpacity={0.7}
                  style={styles.conversationRow}
                >
                  <ImageWithFallback
                    imageStyle={styles.messageImage}
                    image={isNaN(message?.profileUrl) == false ? `${message?.profileUrl}` : message?.profileUrl}
                    isSelectedImage={message?.isSelectedImage}
                  />
                  <View style={styles.messageContent}>
                    <View style={styles.messageTitleRow}>
                      <Text style={styles.messageTitle} numberOfLines={1}>{toTitleCase(message?.name)}</Text>
                      <Text style={styles.messageTime}>{formatInboxTime(message?.lastUpdate)}</Text>
                    </View>
                    <Text style={styles.messagePreview} numberOfLines={1}>{message?.lastMessage}</Text>
                  </View>
                </TouchableOpacity>
              </Swipeable>
            ))}

          </View>
        </ScrollView>
      </View>
      {/* Delete Confirmation Modal */}
      <Modal visible={!!deleteTarget} transparent animationType="fade" onRequestClose={() => setDeleteTarget(null)}>
        <View style={swipeStyles.modalOverlay}>
          <View style={swipeStyles.modalBox}>
            <Text style={swipeStyles.modalTitle}>Delete Chat</Text>
            <Text style={swipeStyles.modalBody}>
              Delete your conversation with{" "}
              <Text style={{ fontWeight: "700" }}>{deleteTarget?.name}</Text>?{"\n"}
              All messages will be permanently removed.
            </Text>
            <View style={swipeStyles.modalActions}>
              <TouchableOpacity
                style={swipeStyles.cancelBtn}
                onPress={() => setDeleteTarget(null)}
              >
                <Text style={swipeStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={swipeStyles.confirmBtn}
                onPress={executeDelete}
                disabled={deleteLoading}
              >
                <Text style={swipeStyles.confirmText}>
                  {deleteLoading ? "Deleting..." : "Delete"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create(inboxStyles);

const swipeStyles = StyleSheet.create({
  deleteAction: {
    backgroundColor: '#e53935',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  deleteActionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    marginBottom: 10,
  },
  modalBody: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cancelText: {
    color: '#555',
    fontWeight: '600',
    fontSize: 14,
  },
  confirmBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#e53935',
  },
  confirmText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default InboxInterface;
