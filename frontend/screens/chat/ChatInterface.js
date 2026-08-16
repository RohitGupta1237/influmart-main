import React, { useRef, useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import Depth1Frame7 from "../../components/Depth1Frame7";
import MessageInput from "./components/MessageInput";
import {
  getMessages,
  sendMessage,
} from "../../controller/connectionsController";
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
  useEffect(() => {
    const getdata = async () => {
      await getMessages(conversationId, userId, userType, setMessages);
      setLoading(false);
    };
    setLoading(true);
    getdata();
  }, [conversationId]);

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
      // Delivered → refresh with the server list (replaces the optimistic one, un-faded).
      await getMessages(conversationId, userId, userType, setMessages);
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
        <MessageInput setNewMessage={handleSend} profileUrl={isNaN(image)==false?`${image}`:image} isSelectedImage={isSelectedImage} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create(chatStyles);

export default ChatInterface;
