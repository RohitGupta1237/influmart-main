import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../util/ThemeContext";

// The Jira-style pipeline. Order = board columns.
export const COLLAB_STATUSES = [
  { key: "pending", label: "Pending", icon: "hourglass-outline" },
  { key: "accepted", label: "Accepted", icon: "checkmark-circle-outline" },
  { key: "negotiation", label: "Negotiation", icon: "chatbubbles-outline" },
  { key: "in_campaign", label: "In Campaign", icon: "megaphone-outline" },
  { key: "brief_docs", label: "Brief & Docs", icon: "document-text-outline" },
];

// "Closed" ends a ticket and drops it off the board — a move target only,
// never a board column/tab.
export const CLOSED_STATUS = { key: "closed", label: "Closed", icon: "close-circle-outline" };

export const statusLabel = (key) =>
  key === "closed"
    ? "Closed"
    : COLLAB_STATUSES.find((s) => s.key === key)?.label || "Pending";

// Horizontal status filter tabs with per-status counts.
export const StatusTabs = ({ active, onChange, counts = {} }) => {
  const { theme } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabsRow}
    >
      {COLLAB_STATUSES.map((s) => {
        const on = active === s.key;
        const count = counts[s.key] || 0;
        return (
          <TouchableOpacity
            key={s.key}
            onPress={() => onChange(s.key)}
            style={[
              styles.tab,
              { borderColor: theme.cardBorder, backgroundColor: theme.card },
              on && { backgroundColor: "#ec4899", borderColor: "#ec4899" },
            ]}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabText, { color: on ? "#fff" : theme.subText }]}>{s.label}</Text>
            <View style={[styles.tabCount, { backgroundColor: on ? "rgba(255,255,255,0.25)" : theme.pill }]}>
              <Text style={[styles.tabCountText, { color: on ? "#fff" : theme.subText }]}>{count}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

// Quick "move to status" menu on a request card.
export const StatusMenu = ({ current = "pending", onSelect }) => {
  const { theme } = useTheme();
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <TouchableOpacity
        style={[styles.menuBtn, { borderColor: theme.cardBorder, backgroundColor: theme.pill }]}
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
      >
        <Text style={[styles.menuBtnText, { color: theme.text }]} numberOfLines={1}>{statusLabel(current)}</Text>
        <Ionicons name="chevron-down" size={13} color={theme.subText} />
      </TouchableOpacity>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} onPress={() => {}}>
            <Text style={[styles.sheetTitle, { color: theme.subText }]}>MOVE TO</Text>
            {/* 'Pending' is the pre-accept state — not a manual target you can move back to. */}
            {/* 'Pending' is the pre-accept state — not a manual target. 'Closed'
                ends the ticket and removes it from the board. */}
            {[...COLLAB_STATUSES.filter((s) => s.key !== "pending"), CLOSED_STATUS].map((s) => {
              const on = s.key === current;
              return (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.option, on && { backgroundColor: theme.pill }]}
                  onPress={() => { setOpen(false); if (!on) onSelect?.(s.key); }}
                >
                  <Ionicons name={s.icon} size={18} color={on ? "#ec4899" : theme.text} />
                  <Text style={[styles.optionText, { color: on ? "#ec4899" : theme.text }]}>{s.label}</Text>
                  {on && <Ionicons name="checkmark" size={16} color="#ec4899" style={{ marginLeft: "auto" }} />}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  tabsRow: { gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  tab: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  tabText: { fontSize: 13, fontWeight: "600" },
  tabCount: { minWidth: 20, paddingHorizontal: 6, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  tabCountText: { fontSize: 11, fontWeight: "700" },

  menuBtn: { alignSelf: "stretch", height: 34, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },
  menuBtnText: { fontSize: 12, fontWeight: "600", flexShrink: 1 },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  sheet: { width: 280, borderRadius: 16, borderWidth: 1, padding: 10 },
  sheetTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6, paddingHorizontal: 8, paddingVertical: 6 },
  option: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 10, paddingVertical: 12, borderRadius: 10 },
  optionText: { fontSize: 15, fontWeight: "600" },
});
