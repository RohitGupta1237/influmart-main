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
      <View style={{ width, height, overflow: "hidden", borderRadius: 8 }}>
        <iframe
          width={width}
          height={height}
          src={`https://www.youtube.com/embed/${videoId}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ display: "block", borderRadius: 8 }}
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

const FBDemo = ({ item, width = 320, height = 400 }) => {
  return (
    <View style={[styles.container, { width, height }]}>
      {item.thumbnail ? (
        <Image
          source={{ uri: item.thumbnail }}
          style={{ width, height: height * 0.7, resizeMode: "cover" }}
        />
      ) : (
        <View style={{ width, height: height * 0.7, backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#999" }}>No Preview</Text>
        </View>
      )}
      <View style={{ padding: 8, flex: 1, justifyContent: "space-between" }}>
        {item.description ? (
          <Text style={{ fontSize: 12, color: "#333" }} numberOfLines={2}>{item.description}</Text>
        ) : null}
        <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 4 }}>
          <Text style={{ fontSize: 11, color: "#666" }}>▶ {item.playCount?.toLocaleString() || 0}</Text>
          <Text style={{ fontSize: 11, color: "#666" }}>♥ {item.reactions?.toLocaleString() || 0}</Text>
          <Text style={{ fontSize: 11, color: "#666" }}>💬 {item.comments?.toLocaleString() || 0}</Text>
        </View>
      </View>
    </View>
  );
};

const InstaDemo = ({ url, width = 320, height = 400 }) => {
  const [loading, setLoading] = useState(true);

  if (Platform.OS === "web") {
    return (
      <View style={{ width, height, overflow: "hidden", borderRadius: 8 }}>
        <iframe
          width={width}
          height={height}
          src={`${url}embed/`}
          frameBorder="0"
          scrolling="no"
          allowTransparency
          style={{ display: "block", borderRadius: 8 }}
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

