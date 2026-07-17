import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Platform,
  ScrollView,
} from "react-native";
import { WebView } from "react-native-webview";

import { Text, Image } from "react-native";
import { ImageStyles } from "./images.scss";

const YTDemo = ({ videoId, width = 320, height = 180 }) => {
  const [loading, setLoading] = useState(true);

  if (Platform.OS === "web") {
    return (
      <View style={{ width, height, overflow: "hidden", borderRadius: 14 }}>
        <iframe
          width={width}
          height={height}
          src={`https://www.youtube.com/embed/${videoId}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ display: "block", borderRadius: 14 }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { width, height }]}>
      <WebView
        source={{ uri: `https://www.youtube.com/embed/${videoId}` }}
        style={{ opacity: loading ? 0 : 1, width, height }}
        onLoad={() => setLoading(false)}
        startInLoadingState
        renderLoading={() => (
          <ActivityIndicator size="large" style={styles.spinner} />
        )}
      />
    </View>
  );
};

const StatChip = ({ icon, value }) => (
  <View style={styles.statChip}>
    <Text style={styles.statChipIcon}>{icon}</Text>
    <Text style={styles.statChipText}>{value?.toLocaleString() || 0}</Text>
  </View>
);

const FBDemo = ({ item, width = 320 }) => {
  // Self-sizing card: media area + caption + stat chips sit together (no dead gap).
  const mediaH = Math.round(width * 1.4);
  return (
    <View style={{ width, backgroundColor: "#fff" }}>
      <View style={{ width, height: mediaH, backgroundColor: "#eef1f6" }}>
        {item.thumbnail ? (
          <Image
            source={{ uri: item.thumbnail }}
            style={{ width, height: mediaH, resizeMode: "cover" }}
          />
        ) : (
          <View style={styles.noPreview}>
            <Text style={{ color: "#9aa3b2", fontSize: 13 }}>No Preview</Text>
          </View>
        )}
        <View style={styles.playBadge}>
          <Text style={styles.playBadgeIcon}>▶</Text>
        </View>
      </View>
      <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14 }}>
        {item.description ? (
          <Text style={styles.caption} numberOfLines={2}>{item.description}</Text>
        ) : null}
        <View style={styles.statsRow}>
          <StatChip icon="▶" value={item.playCount} />
          <StatChip icon="♥" value={item.reactions} />
          <StatChip icon="💬" value={item.comments} />
        </View>
      </View>
    </View>
  );
};

const InstaDemo = ({ url, width = 320, height = 400 }) => {
  const [loading, setLoading] = useState(true);

  if (Platform.OS === "web") {
    return (
      <View style={{ width, height, overflow: "hidden", borderRadius: 14 }}>
        <iframe
          width={width}
          height={height}
          src={`${url}embed/`}
          frameBorder="0"
          scrolling="no"
          allowTransparency
          style={{ display: "block", borderRadius: 14 }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { width, height }]}>
      <WebView
        source={{ uri: `${url}?utm_source=ig_embed&utm_campaign=loading` }}
        style={{ opacity: loading ? 0 : 1, width, height }}
        onLoad={() => setLoading(false)}
        startInLoadingState
        renderLoading={() => (
          <ActivityIndicator size="large" style={styles.spinner} />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create(ImageStyles);

export { YTDemo, FBDemo, InstaDemo };

