//AllGraphs.js
import { StyleSheet, View, Text } from "react-native";
import { formatNumber } from "../../../../helpers/GraphData";
import graphStyles from "./graphs.scss";
import MyLineChart from "../../../../shared/MyLineChart";
import { useTheme } from "../../../../util/ThemeContext";

// Average across the real months only — arrays are padded with leading zeros
// to fill the window, so we ignore zeros to avoid deflating short histories.
const avgOf = (arr) => {
  const vals = (arr || []).filter((v) => v > 0);
  return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
};
const latestOf = (arr) => (arr || []).slice(-1)[0] || 0;

const YTGraph = ({ ytData }) => {
  const { theme } = useTheme();
  const ct = { backgroundColor: theme.card, borderColor: theme.cardBorder };
  const tc = { color: theme.text };
  const dc = { color: theme.subText };
  return (
    <View style={styles.row}>
      <View style={[styles.chartContainer, ct]}>
        <Text style={[styles.chartTitle, tc]}>Views Over Time</Text>
        <Text style={[styles.chartValue, tc]}>
          {ytData?.views && `${formatNumber(Math.max(...ytData?.views))}`}
        </Text>
        <Text
          style={[styles.chartDesc, dc]}
        >{`Last ${ytData?.views?.length} Months`}</Text>
        <MyLineChart
          data={ytData?.views}
          title={"Views data"}
          tracking={ytData?.trackingData}
        />
      </View>
      <View style={[styles.chartContainer, ct]}>
        <Text style={[styles.chartTitle, tc]}>Likes Over Time</Text>
        <Text style={[styles.chartValue, tc]}>
          {ytData?.likes && `${formatNumber(Math.max(...ytData?.likes))}`}
        </Text>
        <Text
          style={[styles.chartDesc, dc]}
        >{`Last ${ytData?.likes?.length} Months`}</Text>
        <MyLineChart
          data={ytData?.likes}
          title={"Likes data"}
          tracking={ytData?.trackingData}
        />
      </View>
      <View style={[styles.chartContainer, ct]}>
        <Text style={[styles.chartTitle, tc]}>Comments Over Time</Text>
        <Text style={[styles.chartValue, tc]}>
          {ytData?.comments && `${formatNumber(Math.max(...ytData?.comments))}`}
        </Text>
        <Text
          style={[styles.chartDesc, dc]}
        >{`Last ${ytData?.comments?.length} Months`}</Text>
        <MyLineChart
          data={ytData?.comments}
          title={"Comments data"}
          tracking={ytData?.trackingData}
        />
      </View>
      <View style={[styles.chartContainer, ct]}>
        <Text style={[styles.chartTitle, tc]}>Shares Over Time</Text>
        <Text style={[styles.chartValue, tc]}>
          {ytData?.shares && `${formatNumber(Math.max(...ytData?.shares))}`}
        </Text>
        <Text
          style={[styles.chartDesc, dc]}
        >{`Last ${ytData?.shares?.length} Months`}</Text>
        <MyLineChart
          data={ytData?.shares}
          title={"Shares data"}
          tracking={ytData?.trackingData}
        />
      </View>
      <View style={[styles.chartContainer, ct]}>
        <Text style={[styles.chartTitle, tc]}>Subscribers Gained Over Time</Text>
        <Text style={[styles.chartValue, tc]}>
          {ytData?.subscribersGained &&
            `${formatNumber(Math.max(...ytData?.subscribersGained))}`}
        </Text>
        <Text
          style={[styles.chartDesc, dc]}
        >{`Last ${ytData?.subscribersGained?.length} Months`}</Text>
        <MyLineChart
          data={ytData?.subscribersGained}
          title={"Subscribers data"}
          tracking={ytData?.trackingData}
        />
      </View>
      <View style={[styles.chartContainer, ct]}>
        <Text style={[styles.chartTitle, tc]}>Subscribers Lost Over Time</Text>
        <Text style={[styles.chartValue, tc]}>
          {ytData?.subscribersLost &&
            `${formatNumber(Math.max(...ytData?.subscribersLost))}`}
        </Text>
        <Text
          style={[styles.chartDesc, dc]}
        >{`Last ${ytData?.subscribersLost?.length} Months`}</Text>
        <MyLineChart
          data={ytData?.subscribersLost}
          title={"Subscribers data"}
          tracking={ytData?.trackingData}
        />
      </View>
      <View style={[styles.chartContainer, ct]}>
        <Text style={[styles.chartTitle, tc]}>Engagement Over Time</Text>
        <Text style={[styles.chartValue, tc]}>
          {ytData?.engagementRate &&
            `${formatNumber(Math.max(...ytData?.engagementRate))}`}
        </Text>
        <Text
          style={[styles.chartDesc, dc]}
        >{`Last ${ytData?.engagementRate?.length} Months`}</Text>
        <MyLineChart
          data={ytData?.engagementRate}
          title={"Engagement data"}
          tracking={ytData?.trackingData}
        />
      </View>

      {/* Monthly Net Subscribers Gained */}
      {ytData?.subscribersNetGained && (
        <View style={[styles.chartContainer, ct]}>
          <Text style={[styles.chartTitle, tc]}>Last Month Subscribers Gained</Text>
          <Text style={[styles.chartValue, tc]}>
            {(() => {
              const latest = ytData.subscribersNetGained[ytData.subscribersNetGained.length - 1] || 0;
              return (latest >= 0 ? "+" : "") + formatNumber(latest);
            })()}
          </Text>
          <Text style={[styles.chartDesc, dc]}>Last 6 Months</Text>
          <MyLineChart
            data={ytData.subscribersNetGained}
            tracking={ytData.trackingData}
            title={"Subscribers gained"}
          />
        </View>
      )}
    </View>
  );
};
const FBGraph = ({ fbData }) => {
  const { theme } = useTheme();
  const ct = { backgroundColor: theme.card, borderColor: theme.cardBorder };
  const tc = { color: theme.text };
  const dc = { color: theme.subText };
  const months = fbData?.followers?.length || 0;
  const window = `Last ${months} Months`;
  return (
    <View style={styles.row}>
      <View style={[styles.chartContainer, ct]}>
        <Text style={[styles.chartTitle, tc]}>Followers Over Time</Text>
        <Text style={[styles.chartValue, tc]}>
          {`${formatNumber((fbData?.followers || [0]).slice(-1)[0] || 0)}`}
        </Text>
        <Text style={[styles.chartDesc, dc]}>{window}</Text>
        <MyLineChart
          data={fbData?.followers}
          tracking={fbData?.trackingData}
          title={"Followers data"}
        />
      </View>
      <View style={[styles.chartContainer, ct]}>
        <Text style={[styles.chartTitle, tc]}>Avg Post Reactions Over Time</Text>
        <Text style={[styles.chartValue, tc]}>
          {`${formatNumber(avgOf(fbData?.avgPostReactions))}`}
        </Text>
        <Text style={[styles.chartDesc, dc]}>{window}</Text>
        <MyLineChart
          data={fbData?.avgPostReactions}
          tracking={fbData?.trackingData}
          title={"Avg Post Reactions"}
        />
      </View>
      <View style={[styles.chartContainer, ct]}>
        <Text style={[styles.chartTitle, tc]}>Avg Post Comments Over Time</Text>
        <Text style={[styles.chartValue, tc]}>
          {`${formatNumber(avgOf(fbData?.avgPostComments))}`}
        </Text>
        <Text style={[styles.chartDesc, dc]}>{window}</Text>
        <MyLineChart
          data={fbData?.avgPostComments}
          tracking={fbData?.trackingData}
          title={"Avg Post Comments"}
        />
      </View>
      <View style={[styles.chartContainer, ct]}>
        <Text style={[styles.chartTitle, tc]}>Avg Post Shares Over Time</Text>
        <Text style={[styles.chartValue, tc]}>
          {`${formatNumber(avgOf(fbData?.avgPostShares))}`}
        </Text>
        <Text style={[styles.chartDesc, dc]}>{window}</Text>
        <MyLineChart
          data={fbData?.avgPostShares}
          tracking={fbData?.trackingData}
          title={"Avg Post Shares"}
        />
      </View>
      <View style={[styles.chartContainer, ct]}>
        <Text style={[styles.chartTitle, tc]}>Avg Engagement Rate Over Time</Text>
        <Text style={[styles.chartValue, tc]}>
          {`${avgOf(fbData?.avgER).toFixed(2)}%`}
        </Text>
        <Text style={[styles.chartDesc, dc]}>
          {`≈ ${(avgOf(fbData?.avgER) * 10).toFixed(1)} engaged per 1,000 followers`}
        </Text>
        <Text style={[styles.chartDesc, dc]}>{window}</Text>
        <MyLineChart
          data={fbData?.avgER}
          tracking={fbData?.trackingData}
          title={"Engagement Rate"}
        />
      </View>

      {/* Monthly Gained Followers */}
      {fbData?.followersGained && (
        <View style={[styles.chartContainer, ct]}>
          <Text style={[styles.chartTitle, tc]}>Last Month Followers Gained</Text>
          <Text style={[styles.chartValue, tc]}>
            {(() => {
              const latest = fbData.followersGained[fbData.followersGained.length - 1] || 0;
              return (latest >= 0 ? "+" : "") + formatNumber(latest);
            })()}
          </Text>
          <Text style={[styles.chartDesc, dc]}>{window}</Text>
          <MyLineChart
            data={fbData.followersGained}
            tracking={fbData.trackingData}
            title={"Followers gained"}
          />
        </View>
      )}
    </View>
  );
};
function IgGraph({ instaData }) {
  const { theme } = useTheme();
  const ct = { backgroundColor: theme.card, borderColor: theme.cardBorder };
  const tc = { color: theme.text };
  const dc = { color: theme.subText };
  return (
    <View style={styles.row}>
      <View style={[styles.chartContainer, ct]}>
        <Text style={[styles.chartTitle, tc]}>Avg Engagement Rate Over Time</Text>
        <Text style={[styles.chartValue, tc]}>
          {instaData?.avgER &&
            `${avgOf(instaData?.avgER).toFixed(2)}%`}
        </Text>
        {instaData?.avgER && (
          <Text style={[styles.chartDesc, dc]}>
            {`≈ ${(avgOf(instaData?.avgER) * 10).toFixed(1)} engaged per 1,000 followers`}
          </Text>
        )}
        <Text
          style={[styles.chartDesc, dc]}
        >{`Last ${instaData?.avgER?.length} Months`}</Text>
        <MyLineChart
          data={instaData?.avgER}
          tracking={instaData?.trackingData}
          title={"Followers data"}
        />
      </View>
      <View style={[styles.chartContainer, ct]}>
        <Text style={[styles.chartTitle, tc]}>Avg Likes Over Time</Text>
        <Text style={[styles.chartValue, tc]}>
          {instaData?.avgLikes &&
            `${formatNumber(avgOf(instaData?.avgLikes))}`}
        </Text>
        <Text
          style={[styles.chartDesc, dc]}
        >{`Last ${instaData?.avgLikes?.length} Months`}</Text>
        <MyLineChart
          data={instaData?.avgLikes}
          tracking={instaData?.trackingData}
          title={"Average Likes data"}
        />
      </View>
      <View style={[styles.chartContainer, ct]}>
        <Text style={[styles.chartTitle, tc]}>Avg Comments Over Time</Text>
        <Text style={[styles.chartValue, tc]}>
          {instaData?.avgComments &&
            `${formatNumber(avgOf(instaData?.avgComments))}`}
        </Text>
        <Text
          style={[styles.chartDesc, dc]}
        >{`Last ${instaData?.avgComments?.length} Months`}</Text>
        <MyLineChart
          data={instaData?.avgComments}
          tracking={instaData?.trackingData}
          title={"Average Comments data"}
        />
      </View>
      <View style={[styles.chartContainer, ct]}>
        <Text style={[styles.chartTitle, tc]}>Avg Interactions Over Time</Text>
        <Text style={[styles.chartValue, tc]}>
          {instaData?.avgInteractions &&
            `${formatNumber(avgOf(instaData?.avgInteractions))}`}
        </Text>
        <Text
          style={[styles.chartDesc, dc]}
        >{`Last ${instaData?.avgInteractions?.length} Months`}</Text>
        <MyLineChart
          data={instaData?.avgInteractions}
          tracking={instaData?.trackingData}
          title={"Average Interactions data"}
        />
      </View>
      <View style={[styles.chartContainer, ct]}>
        <Text style={[styles.chartTitle, tc]}>Followers Over Time</Text>
        <Text style={[styles.chartValue, tc]}>
          {instaData?.followers &&
            `${formatNumber(instaData.followers.slice(-1)[0] || 0)}`}
        </Text>
        <Text
          style={[styles.chartDesc, dc]}
        >{`Last ${instaData?.followers?.length} Months`}</Text>
        <MyLineChart
          data={instaData?.followers}
          tracking={instaData?.trackingData}
          title={"Average Engagement Rate data"}
        />
      </View>

      {/* Monthly Gained Followers */}
      {instaData?.followersGained && (
        <View style={[styles.chartContainer, ct]}>
          <Text style={[styles.chartTitle, tc]}>Last Month Followers Gained</Text>
          <Text style={[styles.chartValue, tc]}>
            {(() => {
              const latest = instaData.followersGained[instaData.followersGained.length - 1] || 0;
              return (latest >= 0 ? "+" : "") + formatNumber(latest);
            })()}
          </Text>
          <Text style={[styles.chartDesc, dc]}>{`Last ${instaData?.followersGained?.length} Months`}</Text>
          <MyLineChart
            data={instaData.followersGained}
            tracking={instaData.trackingData}
            title={"Followers gained"}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create(graphStyles);

export { YTGraph, FBGraph, IgGraph };
