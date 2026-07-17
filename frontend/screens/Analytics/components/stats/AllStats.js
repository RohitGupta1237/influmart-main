import { StyleSheet, View, Text } from "react-native";
import { statsStyles } from "./stats.scss";
import { formatNumber } from "../../../../helpers/GraphData";

// Average over the real months (ignore padded zeros).
const avgOf = (arr) => {
  const vals = (arr || []).filter((v) => v > 0);
  return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
};

const FBStats = ({ fbData }) => {
  return (
    <View style={styles.container}>
      <View style={[styles.statsContainer, styles.fullWidth]}>
        <Text style={styles.statsTitle}>
          {`Followers: ${formatNumber((fbData?.followers || [0]).slice(-1)[0] || 0)}`}
        </Text>
      </View>
      <View style={[styles.statsContainer, styles.fullWidth]}>
        <Text style={styles.statsTitle}>
          {`Avg Engagement Rate: ${avgOf(fbData?.avgER).toFixed(2)}%`}
        </Text>
      </View>
      <View style={[styles.statsContainer, styles.fullWidth]}>
        <Text style={styles.statsTitle}>
          {`Avg Reactions: ${formatNumber(avgOf(fbData?.avgPostReactions))}`}
        </Text>
      </View>
      <View style={[styles.statsContainer, styles.fullWidth]}>
        <Text style={styles.statsTitle}>
          {`Avg Comments: ${formatNumber(avgOf(fbData?.avgPostComments))}`}
        </Text>
      </View>
    </View>
  );
};
const YTStats = ({ ytData }) => {
  return (
    <View style={styles.container}>
      <View style={[styles.statsContainer, styles.fullWidth]}>
        <Text style={styles.statsTitle}>
          {ytData?.views &&
            `Avg Views: ${formatNumber(Math.max(...ytData?.views))}`}
        </Text>
      </View>
      <View style={[styles.statsContainer, styles.fullWidth]}>
        <Text style={styles.statsTitle}>
          {ytData?.likes &&
            `Avg Likes: ${formatNumber(Math.max(...ytData?.likes))}`}
        </Text>
      </View>
      <View style={[styles.statsContainer, styles.fullWidth]}>
        <Text style={styles.statsTitle}>
          {ytData?.comments &&
            `Avg Comments: ${formatNumber(Math.max(...ytData?.comments))}`}
        </Text>
      </View>
      <View style={[styles.statsContainer, styles.fullWidth]}>
        <Text style={styles.statsTitle}>
          {ytData?.shares &&
            `Avg Shares: ${formatNumber(Math.max(...ytData?.shares))}`}
        </Text>
      </View>
      <View style={[styles.statsContainer, styles.fullWidth]}>
        <Text style={styles.statsTitle}>
          {ytData?.subscribersGained &&
            `Subscribers Gained: ${formatNumber(Math.max(...ytData?.subscribersGained))}`}
        </Text>
      </View>
      <View style={[styles.statsContainer, styles.fullWidth]}>
        <Text style={styles.statsTitle}>
          {ytData?.subscribersLost &&
            `Subscribers Lost: ${formatNumber(Math.max(...ytData?.subscribersLost))}`}
        </Text>
      </View>
      <View style={[styles.statsContainer, styles.fullWidth]}>
        <Text style={styles.statsTitle}>
          {ytData?.engagementRate &&
            `Avg Engagement: ${formatNumber(Math.max(...ytData?.engagementRate))}`}
        </Text>
      </View>
    </View>
  );
};
const InstaStats = ({ instaData }) => {
  return (
    <View style={styles.container}>
      <View style={[styles.statsContainer, styles.fullWidth]}>
        <Text style={styles.statsTitle}>
          {instaData?.followers &&
            `Followers: ${formatNumber(instaData.followers.slice(-1)[0] || 0)}`}
        </Text>
      </View>
      <View style={[styles.statsContainer, styles.fullWidth]}>
        <Text style={styles.statsTitle}>
          {instaData?.avgER &&
            `Avg Engagement Rate: ${avgOf(instaData?.avgER).toFixed(2)}%`}
        </Text>
      </View>
      <View style={[styles.statsContainer, styles.fullWidth]}>
        <Text style={styles.statsTitle}>
          {instaData?.avgLikes &&
            `Average Likes Rate: ${formatNumber(
              avgOf(instaData?.avgLikes)
            )}`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create(statsStyles);

export { FBStats, YTStats, InstaStats };
