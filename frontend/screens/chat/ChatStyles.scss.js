import { Color, FontSize, Border, FontFamily, Padding } from "../../GlobalStyles";

export const chatStyles = {
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#fff",
  },
  topbar: {
    width: "100%",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingVertical: 8,
  },
  chatContent: {
    flex: 1,
    width: "100%",
  },
  messagesContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: "100%",
  },
  bottomBar: {
    width: "100%",
    backgroundColor: "#F0F0F0",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },

  // ── Sent message (you) ────────────────────────────────────────────────────
  senderContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
    marginVertical: 2,
    paddingHorizontal: 8,
  },
  senderMessageContainer: {
    backgroundColor: Color.colorMediumslateblue,
    maxWidth: "75%",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 2,
    paddingHorizontal: 10,
    paddingTop: 7,
    paddingBottom: 5,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  senderMessageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  senderMessage: {
    fontSize: 15,
    fontFamily: FontFamily.beVietnamProRegular,
    color: "#fff",
    lineHeight: 22,
    flexShrink: 1,
  },
  senderTimeAgo: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    textAlign: "right",
    marginTop: 2,
  },
  senderName: {
    display: "none",
  },

  // ── Received message ──────────────────────────────────────────────────────
  receiverContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    marginVertical: 2,
    paddingHorizontal: 8,
    gap: 6,
  },
  receiverMessageContainer: {
    backgroundColor: Color.colorWhitesmoke_300,
    maxWidth: "75%",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 10,
    paddingHorizontal: 10,
    paddingTop: 7,
    paddingBottom: 5,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  receiverName: {
    display: "none",
  },
  receiverMessageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  receiverMessage: {
    fontSize: 15,
    fontFamily: FontFamily.beVietnamProRegular,
    color: "#111",
    lineHeight: 22,
    flexShrink: 1,
  },
  receiverTimeAgo: {
    fontSize: 11,
    color: "#999",
    textAlign: "right",
    marginTop: 2,
  },

  // ── Avatar ────────────────────────────────────────────────────────────────
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  // ── Unused legacy styles (kept to avoid import errors) ───────────────────
  lineHeight: { width: 2, backgroundColor: Color.colorGainsboro_400 },
  timeText: { textAlign: "left", lineHeight: 24, fontSize: FontSize.size_base },
  messageDot: { height: 16 },
  messageSmallDot: { borderRadius: Border.br_9xs, backgroundColor: Color.colorGray_200, width: 8, height: 8, marginTop: 4 },
  messageLine: { width: 40, alignItems: "center", justifyContent: "center", height: 72 },
  messageText: { fontWeight: "500", fontFamily: FontFamily.beVietnamProMedium, color: Color.colorBlack },
  messageTextWrapper: { alignSelf: "stretch" },
  messageTextContainer: { width: "auto", height: "auto" },
  messageTimeContainer: { width: "auto", height: 24 },
  messageContent: { flex: 1, paddingHorizontal: Padding.p_base, paddingVertical: Padding.p_base, marginLeft: 8, height: "auto", backgroundColor: Color.colorWhitesmoke_300, borderRadius: Border.br_base },
  messageRow: { flex: 1, flexDirection: "row", height: "auto", marginVertical: 6 },
  spacer: { height: 389, width: "100%" },
  footerSpacer: { height: 20, width: "100%", backgroundColor: Color.colorWhite },
};
