
import { Color } from "../../../../GlobalStyles";
export const ImageStyles = {
  container: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8, // Assuming borderRadius is defined or imported
    margin: 10,
  },
  main: {
    borderWidth: 0.5,
    borderRadius: 16,
    borderColor: Color.colorGainsboro_400,
  },
  spinnerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  spinner: {
    flex: 1,
  },
  noPreview: {
    flex: 1,
    backgroundColor: "#eef1f6",
    justifyContent: "center",
    alignItems: "center",
  },
  playBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  playBadgeIcon: {
    color: "#fff",
    fontSize: 13,
    marginLeft: 2,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    color: "#1c1c1e",
    fontWeight: "500",
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f2f4f7",
  },
  statChipIcon: {
    fontSize: 11,
    color: "#1877F2",
  },
  statChipText: {
    fontSize: 12,
    color: "#3a3f47",
    fontWeight: "600",
  },
};
