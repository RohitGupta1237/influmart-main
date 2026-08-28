import React, { useRef, useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from "react-native";
import Depth1Frame7 from "../../components/Depth1Frame7";
import MessageInput from "./components/MessageInput";
import {
  getMessages,
  sendMessage,
} from "../../controller/connectionsController";
import {
  proposeDeal,
  sealDeal,
  declineDeal,
  getConversationDeal,
  getChatState,
  sendPaymentPending,
  requestCloseChat,
  acceptCloseChat,
  declineCloseChat,
  reopenChat,
} from "../../controller/dealController";
import { track } from "../../util/analytics";
import { chatStyles } from "./ChatStyles.scss";
import { useSocketContext } from "../../util/SocketContext";
import { Image } from "expo-image";
import { useAlert } from "../../util/AlertContext";
import Loader from "../../shared/Loader";
import ImageWithFallback from "../../util/ImageWithFallback";

// Sent messages — no avatar shown (WhatsApp style)
const SenderMessage = ({ content, timeAgo, pending, failed, onRetry }) => {
  const bubble = (
    <View style={[styles.senderMessageContainer, pending && { opacity: 0.5 }, failed && { backgroundColor: "#C0392B" }]}>
      <Text style={styles.senderMessage}>{content}</Text>
      <Text style={styles.senderTimeAgo}>
        {failed ? "Failed · Tap to retry" : pending ? "Sending…" : timeAgo}
      </Text>
    </View>
  );
  return (
    <View style={styles.senderContainer}>
      {failed ? <TouchableOpacity activeOpacity={0.8} onPress={onRetry}>{bubble}</TouchableOpacity> : bubble}
    </View>
  );
};

// Received messages — avatar + name + bubble
const ReceiverMessage = ({ name, profileUrl, content, timeAgo, isSelectedImage }) => {
  return (
    <View style={styles.receiverContainer}>
      <ImageWithFallback
        imageStyle={styles.profileImage}
        image={isNaN(profileUrl) == false ? `${profileUrl}` : profileUrl}
        isSelectedImage={isSelectedImage}
      />
      <View style={styles.receiverMessageContainer}>
        <Text style={styles.receiverMessage}>{content}</Text>
        <Text style={styles.receiverTimeAgo}>{timeAgo}</Text>
      </View>
    </View>
  );
};

const ChatInterface = ({ route, navigation }) => {
  const { name, image, conversationId, userId, userType, receiverId, isSelectedImage } =
    route.params;
  const [messages, setMessages] = useState([]);
  const { socket } = useSocketContext();
  const scrollView = useRef();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);

  // ── Deal (price lock / seal) state ────────────────────────────────────────
  const [deal, setDeal] = useState(null);
  const [priceModal, setPriceModal] = useState(false);
  const [priceInput, setPriceInput] = useState("");
  const amIInfluencer = userType === "influencer";
  const influencerId = amIInfluencer ? userId : receiverId;
  const brandId = amIInfluencer ? receiverId : userId;
  const amIProposer = deal && userType === deal.proposedBy;
  // Only the brand can start / reopen a deal; the influencer accepts or declines.
  const canStartDeal = !amIInfluencer;

  // ── Chat close / payment state ────────────────────────────────────────────
  const [chat, setChat] = useState({ closed: false, closeRequestBy: null });
  const amICloseRequester = chat.closeRequestBy && chat.closeRequestBy === userType;
  const otherRequestedClose = chat.closeRequestBy && chat.closeRequestBy !== userType;

  const refreshDeal = async () => {
    if (!conversationId) return;
    const d = await getConversationDeal(conversationId);
    setDeal(d);
  };

  const refreshChat = async () => {
    if (!conversationId) return;
    const s = await getChatState(conversationId);
    setChat(s);
  };

  const reloadThread = async () => {
    await getMessages(conversationId, userId, userType, setMessages);
    await refreshChat();
    await refreshDeal();
  };

  useEffect(() => {
    const getdata = async () => {
      await getMessages(conversationId, userId, userType, setMessages);
      await refreshDeal();
      await refreshChat();
      setLoading(false);
    };
    setLoading(true);
    getdata();
  }, [conversationId]);

  // Real-time: append incoming messages instantly via the socket (the backend
  // emits "newMessage" on send). No polling, no refetch — no manual refresh.
  useEffect(() => {
    if (!socket) return;
    const onNewMessage = (message) => {
      const from = String(message?.sender?._id || message?.sender || "");
      const to = String(message?.receiver?._id || message?.receiver || "");
      // Only messages from the other party in THIS conversation.
      if (from !== String(receiverId) || to !== String(userId)) return;
      setMessages((prev) => [
        ...prev,
        {
          content: message.content,
          sender: { name: name || "", profileUrl: image, isSelectedImage },
          timeAgo: "now",
        },
      ]);
      // A deal/close system note may have changed chat state — keep it fresh.
      refreshDeal();
      refreshChat();
    };
    socket.on("newMessage", onNewMessage);
    return () => socket.off("newMessage", onNewMessage);
  }, [socket, receiverId, userId, name, image, isSelectedImage]);

  const handlePaymentPending = async () => {
    const ok = await sendPaymentPending(
      conversationId,
      { senderId: userId, receiverId },
      showAlert
    );
    if (ok) await reloadThread();
  };

  const handleRequestClose = async () => {
    const r = await requestCloseChat(
      conversationId,
      { requestedBy: userType, senderId: userId, receiverId },
      showAlert
    );
    if (r) await reloadThread();
  };

  const handleAcceptClose = async () => {
    const r = await acceptCloseChat(
      conversationId,
      { userType, senderId: userId, receiverId },
      showAlert
    );
    if (r) await reloadThread();
  };

  const handleDeclineClose = async () => {
    const r = await declineCloseChat(
      conversationId,
      { senderId: userId, receiverId },
      showAlert
    );
    if (r) await reloadThread();
  };

  // Reopen a closed chat — just unlocks messaging; no deal is created.
  const handleReopenChat = async () => {
    const r = await reopenChat(
      conversationId,
      { senderId: userId, receiverId },
      showAlert
    );
    if (r) await reloadThread();
  };

  const handleLockPrice = async () => {
    const amount = Number(priceInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      showAlert("Error", "Enter a valid price");
      return;
    }
    const d = await proposeDeal(
      {
        influencerId,
        brandId,
        conversationId,
        price: amount,
        proposedBy: userType,
        senderId: userId,
        receiverId,
      },
      showAlert
    );
    if (d) {
      setDeal(d);
      setPriceModal(false);
      setPriceInput("");
      await reloadThread(); // a new deal reopens a closed chat
    }
  };

  const handleSealDeal = async () => {
    if (!deal?._id) return;
    const d = await sealDeal(deal._id, { userType, senderId: userId, receiverId }, showAlert);
    if (d) {
      setDeal(d);
      track("deal_sealed", { price: d.price });
      await reloadThread();
    }
  };

  const handleDeclineDeal = async () => {
    if (!deal?._id) return;
    const d = await declineDeal(deal._id, { senderId: userId, receiverId }, showAlert);
    // Declined → clear the banner (getConversationDeal ignores declined).
    if (d) {
      setDeal(null);
      await reloadThread();
    }
  };

  const localIdRef = useRef(0);

  const handleSend = async (message) => {
    if (message.trim() === "") {
      showAlert("Error", "Please provide proper message");
      return;
    }
    // Optimistic: show the message instantly in a faded "Sending…" state.
    const localId = ++localIdRef.current;
    setMessages((prev) => [
      ...prev,
      { localId, sender: { name: "You" }, content: message, timeAgo: "Sending…", pending: true },
    ]);
    const ok = await sendMessage(userId, receiverId, message);
    if (ok) {
      // Delivered → un-fade the optimistic bubble in place (no refetch round-trip).
      setMessages((prev) =>
        prev.map((m) => (m.localId === localId ? { ...m, pending: false, timeAgo: "now" } : m))
      );
    } else {
      // Failed → mark it red + tap-to-retry (keep it in place).
      setMessages((prev) =>
        prev.map((m) => (m.localId === localId ? { ...m, pending: false, failed: true } : m))
      );
    }
  };

  // Retry a failed message: drop the failed bubble and send it again.
  const handleRetry = (content, localId) => {
    setMessages((prev) => prev.filter((m) => m.localId !== localId));
    handleSend(content);
  };
  return (
    <View style={styles.container}>
      {loading && <Loader loading={loading} />}
      <TouchableOpacity
        style={styles.topbar}
        onPress={() => navigation.navigate("InboxInterface")}
      >
        <Depth1Frame7
          depth4Frame0={require("../../assets/depth-4-frame-017.png")}
          requestDetails={`Chat with ${name ? name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : ""}`}
          depth3Frame0BackgroundColor="#fff"
          requestDetailsWidth={"auto"}
          depth4Frame0FontFamily="BeVietnamPro-Bold"
          depth4Frame0Color="#000"
        />
      </TouchableOpacity>

      {/* ── Deal bar: lock price / accept & seal / close chat / payment ── */}
      <View style={styles.dealBar}>
        {chat.closed ? (
          <View style={styles.dealRow}>
            <Text style={styles.dealClosedText} numberOfLines={1}>
              {canStartDeal
                ? "🔒 Chat closed — reopen to message again"
                : "🔒 Chat closed — the brand can reopen it"}
            </Text>
            {canStartDeal && (
              <TouchableOpacity style={styles.dealSealBtn} onPress={handleReopenChat}>
                <Text style={styles.dealSealText}>Reopen Chat</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {deal?.status === "proposed" && amIProposer && (
              <View style={styles.dealRow}>
                <Text style={styles.dealPendingText} numberOfLines={1}>
                  ₹{deal.price} locked · waiting for {name || "the other party"} to accept
                </Text>
                <TouchableOpacity style={styles.dealGhostBtn} onPress={handleDeclineDeal}>
                  <Text style={styles.dealGhostText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}

            {deal?.status === "proposed" && !amIProposer && (
              <View style={styles.dealRow}>
                <Text style={styles.dealPendingText} numberOfLines={1}>
                  ₹{deal.price} proposed
                </Text>
                <View style={styles.dealActions}>
                  <TouchableOpacity style={styles.dealGhostBtn} onPress={handleDeclineDeal}>
                    <Text style={styles.dealGhostText}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dealSealBtn} onPress={handleSealDeal}>
                    <Text style={styles.dealSealText}>Accept & Seal</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Nothing pending (no deal, or last one sealed) → can seal a (new) deal. */}
            {deal?.status !== "proposed" && (
              <View style={styles.dealRow}>
                {deal?.status === "sealed" && (
                  <Text style={styles.dealSealedText} numberOfLines={1}>
                    ✓ Last deal sealed · ₹{deal.price}
                  </Text>
                )}
                <TouchableOpacity style={styles.dealPrimaryBtn} onPress={() => setPriceModal(true)}>
                  <Text style={styles.dealPrimaryText}>🤝  Seal a Deal</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Close request states */}
            {amICloseRequester && (
              <View style={styles.chatActionRow}>
                <Text style={styles.dealPendingText} numberOfLines={1}>
                  Close requested · waiting for {name || "the other party"} to accept
                </Text>
                <TouchableOpacity style={styles.dealGhostBtn} onPress={handleDeclineClose}>
                  <Text style={styles.dealGhostText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}

            {otherRequestedClose && (
              <View style={styles.chatActionRow}>
                <Text style={styles.dealPendingText} numberOfLines={1}>
                  {name || "The other party"} wants to close this chat
                </Text>
                <View style={styles.dealActions}>
                  <TouchableOpacity style={styles.dealGhostBtn} onPress={handleDeclineClose}>
                    <Text style={styles.dealGhostText}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dealSealBtn} onPress={handleAcceptClose}>
                    <Text style={styles.dealSealText}>Accept Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Secondary actions — hidden while a close request is pending */}
            {!chat.closeRequestBy && (
              <View style={styles.chatLinksRow}>
                {amIInfluencer && (
                  <TouchableOpacity style={styles.linkBtn} onPress={handlePaymentPending}>
                    <Text style={styles.linkText}>💰 Payment pending</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.linkBtn} onPress={handleRequestClose}>
                  <Text style={styles.linkText}>🔒 Close chat</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>

      {/* Price-lock modal */}
      <Modal visible={priceModal} transparent animationType="fade" onRequestClose={() => setPriceModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Lock the agreed price</Text>
            <Text style={styles.modalBody}>
              Enter the final amount you both agreed on. {name ? name : "The other party"} will
              need to accept before the deal is sealed.
            </Text>
            <View style={styles.priceInputRow}>
              <Text style={styles.rupee}>₹</Text>
              <TextInput
                style={styles.priceInput}
                value={priceInput}
                onChangeText={setPriceInput}
                placeholder="0"
                placeholderTextColor="#9aa1ad"
                keyboardType="numeric"
                autoFocus
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setPriceModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleLockPrice}>
                <Text style={styles.modalConfirmText}>Lock Price</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView
        ref={scrollView}
        contentContainerStyle={styles.scrollContentContainer}
        onContentSizeChange={() => scrollView.current?.scrollToEnd()}
      >
        <View style={styles.chatContent}>
          <View style={styles.messagesContainer}>
            {messages.map((message, index) =>
              message.sender.name == "You" ? (
                <SenderMessage
                  key={index}
                  name={message?.sender?.name}
                  content={message?.content}
                  timeAgo={message?.timeAgo}
                  pending={message?.pending}
                  failed={message?.failed}
                  onRetry={() => handleRetry(message?.content, message?.localId)}
                  profileUrl={message?.sender?.profileUrl}
                  isSelectedImage={message?.sender?.isSelectedImage}
                />
              ) : (
                <ReceiverMessage
                  key={index}
                  name={message?.sender?.name}
                  content={message?.content}
                  timeAgo={message?.timeAgo}
                  profileUrl={message?.sender?.profileUrl}
                  isSelectedImage={message?.sender?.isSelectedImage}
                />
              )
            )}
          </View>
        </View>
      </ScrollView>
      <View style={styles.bottomBar}>
        {chat.closed ? (
          <View style={styles.lockedBar}>
            <Text style={styles.lockedText}>
              🔒 This chat is closed. Start a new deal to reopen it.
            </Text>
          </View>
        ) : (
          <MessageInput setNewMessage={handleSend} profileUrl={isNaN(image)==false?`${image}`:image} isSelectedImage={isSelectedImage} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create(chatStyles);

export default ChatInterface;
