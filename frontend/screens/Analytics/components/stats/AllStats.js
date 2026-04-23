import { StyleSheet, View, Text } from "react-native";
import { statsStyles } from "./stats.scss";
import { formatNumber } from "../../../../helpers/GraphData";

const FBStats = ({ fbData }) => {
  return (
    <View style={styles.container}>
      <View style={[styles.statsContainer, styles.fullWidth]}>
        <Text style={styles.statsTitle}>
          {`Followers: ${formatNumber(Math.max(...(fbData?.followers || [0])))}`}
        </Text>
      </View>
      <View style={[styles.statsContainer, styles.fullWidth]}>
        <Text style={styles.statsTitle}>
          {`Engagement Rate: ${Math.max(...(fbData?.avgER || [0])).toFixed(2)}%`}
        </Text>
      </View>
      <View style={[styles.statsContainer, styles.fullWidth]}>
        <Text style={styles.statsTitle}>
          {`Avg Reactions: ${formatNumber(Math.max(...(fbData?.avgPostReactions || [0])))}`}
        </Text>
      </View>
      <View style={[styles.statsContainer, styles.fullWidth]}>
        <Text style={styles.statsTitle}>
          {`Avg Comments: ${formatNumber(Math.max(...(fbData?.avgPostComments || [0])))}`}
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
            `Followers: ${formatNumber(Math.max(...instaData?.followers))}`}
        </Text>
      </View>
      <View style={[styles.statsContainer, styles.fullWidth]}>
        <Text style={styles.statsTitle}>
          {instaData?.avgER &&
            `Engagement Rate: ${Math.max(...instaData?.avgER).toPrecision(2)}%`}
        </Text>
      </View>
      <View style={[styles.statsContainer, styles.fullWidth]}>
        <Text style={styles.statsTitle}>
          {instaData?.avgLikes &&
            `Average Likes Rate: ${formatNumber(
              Math.max(...instaData?.avgLikes)
            )}`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create(statsStyles);

export { FBStats, YTStats, InstaStats };
