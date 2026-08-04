import { Color, Padding, FontFamily, FontSize } from "../../GlobalStyles";

export const BrandProfileStyles = {
  container: {
    flex: 1,
    backgroundColor: Color.colorWhitesmoke_100,
    // No marginBottom — it left a band at the bottom that the floating bar sat on.
    // The content's own bottom margin (contentWrapper) clears the floating bar.
    overflow: "hidden",
  },
  // Inner wrapper for the ScrollView content — must NOT use flex:1, otherwise it
  // collapses to height 0 inside a ScrollView on native (blank screen).
  contentWrapper: {
    width: "100%",
    backgroundColor: Color.colorWhitesmoke_100,
    marginBottom: 100,
  },
  header: {
    paddingTop: 24,
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Padding.p_base,
  },
  backArrow: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  profileContainer: {
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: Padding.p_base,
    boxSizing: "border-box",
  },
  profileImageContainer: {
    width: "100%",
    alignItems: "center",
  },
  profileImage: {
    width: 128,
    height: 128,
    borderRadius: 64,
  },
  profileInfoContainer: {
    width: "100%",
    // No flex:1 — inside a ScrollView column it collapses to height 0 on Android,
    // hiding the brand name + category (they render on web but vanish on the app).
    alignItems: "center",
  },
  brandName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    textAlign: "center",
  },
  brandDetails: {
    color: "#4A709C",
    marginTop: 5,
    textAlign: "center",
  },
  actionButtons: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    gap: 12,
  },
  button: {
    justifyContent: "center",
    alignItems: "center",
    width: "50%",
    height: 40,
    borderRadius: 12,
  },
  followButton: {
    backgroundColor: "#E8EDF5",
    color: "black",
  },
  messageButton: {
    backgroundColor: Color.colorRoyalblue,
  },
  followButtonText: {
    fontWeight: "bold",
    color: "#333",
  },
  buttonText: {
    fontWeight: "bold",
    color: "#fff",
  },
  section: {
    padding: 16,
    paddingTop: 0,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  insightContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  insightIcon: {
    width: 24,
    height: 24,
  },
  insightDetails: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 5,
  },
  insightText: {
    color: "#666",
  },
  requirementContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  requirementIcon: {
    width: 24,
    height: 24,
  },
  iconBg: {
    backgroundColor: "#E8EDF5",
    borderRadius: 8,
    padding: 10,
    width: 48,
    height: 48,
    marginRight: 15,
  },
  requirementDetails: {
    flex: 1,
  },
  requirementTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 5,
  },
  requirementText: {
    color: "#666",
  },
  collabCountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  collabIcon: {
    width: 28,
    height: 28,
  },
  collabCount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  bottomBar: {
    // Let the bar's own floating position (bottom:16, side margins) apply —
    // don't override bottom to 0, or it sticks flush to the screen edge.
    position: "absolute",
  },
  depth1Frame2: {
    height: 60,
    paddingTop: Padding.p_xl,
    paddingBottom: Padding.p_xs,
    flexDirection: "row",
  },
  depth1FrameSpaceBlock: {
    paddingHorizontal: Padding.p_base,
    width: "100%",
  },
  depth2Frame01: {
    width: "auto",
    height: 28,
  },
  depth3Frame01: {
    alignSelf: "stretch",
  },
  collaborationRequests: {
    fontSize: FontSize.size_3xl,
    letterSpacing: 0,
    lineHeight: 28,
    fontWeight: "700",
    fontFamily: FontFamily.beVietnamProBold,
    color: "black",
    textAlign: "left",
  },
};
