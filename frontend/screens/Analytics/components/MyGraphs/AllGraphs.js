//AllGraphs.js
import { StyleSheet, View, Text } from "react-native";
import { formatNumber } from "../../../../helpers/GraphData";
import graphStyles from "./graphs.scss";
import MyLineChart from "../../../../shared/MyLineChart";
import MonthlyGainedChart from "../../../../shared/MonthlyGainedChart";

const YTGraph = ({ ytData }) => {
  console.log("graph", ytData);
  return (
    <View style={styles.row}>
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Views Over Time</Text>
        <Text style={styles.chartValue}>
          {ytData?.views && `${formatNumber(Math.max(...ytData?.views))}`}
        </Text>
        <Text
          style={styles.chartDesc}
        >{`Last ${ytData?.views?.length} Months`}</Text>
        <MyLineChart
          data={ytData?.views}
          title={"Views data"}
          tracking={ytData?.trackingData}
        />
      </View>
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Likes Over Time</Text>
        <Text style={styles.chartValue}>
          {ytData?.likes && `${formatNumber(Math.max(...ytData?.likes))}`}
        </Text>
        <Text
          style={styles.chartDesc}
        >{`Last ${ytData?.likes?.length} Months`}</Text>
        <MyLineChart
          data={ytData?.likes}
          title={"Likes data"}
          tracking={ytData?.trackingData}
        />
      </View>
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Comments Over Time</Text>
        <Text style={styles.chartValue}>
          {ytData?.comments && `${formatNumber(Math.max(...ytData?.comments))}`}
        </Text>
        <Text
          style={styles.chartDesc}
        >{`Last ${ytData?.comments?.length} Months`}</Text>
        <MyLineChart
          data={ytData?.comments}
          title={"Comments data"}
          tracking={ytData?.trackingData}
        />
      </View>
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Shares Over Time</Text>
        <Text style={styles.chartValue}>
          {ytData?.shares && `${formatNumber(Math.max(...ytData?.shares))}`}
        </Text>
        <Text
          style={styles.chartDesc}
        >{`Last ${ytData?.shares?.length} Months`}</Text>
        <MyLineChart
          data={ytData?.shares}
          title={"Shares data"}
          tracking={ytData?.trackingData}
        />
      </View>
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Subscribers Gained Over Time</Text>
        <Text style={styles.chartValue}>
          {ytData?.subscribersGained &&
            `${formatNumber(Math.max(...ytData?.subscribersGained))}`}
        </Text>
        <Text
          style={styles.chartDesc}
        >{`Last ${ytData?.subscribersGained?.length} Months`}</Text>
        <MyLineChart
          data={ytData?.subscribersGained}
          title={"Subscribers data"}
          tracking={ytData?.trackingData}
        />
      </View>
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Subscribers Lost Over Time</Text>
        <Text style={styles.chartValue}>
          {ytData?.subscribersLost &&
            `${formatNumber(Math.max(...ytData?.subscribersLost))}`}
        </Text>
        <Text
          style={styles.chartDesc}
        >{`Last ${ytData?.subscribersLost?.length} Months`}</Text>
        <MyLineChart
          data={ytData?.subscribersLost}
          title={"Subscribers data"}
          tracking={ytData?.trackingData}
        />
      </View>
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Engagement Over Time</Text>
        <Text style={styles.chartValue}>
          {ytData?.engagementRate &&
            `${formatNumber(Math.max(...ytData?.engagementRate))}`}
        </Text>
        <Text
          style={styles.chartDesc}
        >{`Last ${ytData?.engagementRate?.length} Months`}</Text>
        <MyLineChart
          data={ytData?.engagementRate}
          title={"Engagement data"}
          tracking={ytData?.trackingData}
        />
      </View>

      {/* Monthly Net Subscribers Gained */}
      {ytData?.subscribersNetGained && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Monthly Gained Subscribers</Text>
          <Text style={styles.chartValue}>
            {(() => {
              const latest = ytData.subscribersNetGained[ytData.subscribersNetGained.length - 1] || 0;
              return (latest >= 0 ? "+" : "") + formatNumber(latest);
            })()}
          </Text>
          <Text style={styles.chartDesc}>Last 6 Months</Text>
          <MonthlyGainedChart
            data={ytData.subscribersNetGained}
            labels={ytData.trackingData}
          />
        </View>
      )}
    </View>
  );
};
const FBGraph = ({ fbData }) => {
  return (
    <View style={styles.row}>
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Followers Over Time</Text>
        <Text style={styles.chartValue}>
          {`${formatNumber(Math.max(...(fbData?.followers || [0])))}`}
        </Text>
        <Text style={styles.chartDesc}>Last 6 Months</Text>
        <MyLineChart
          data={fbData?.followers}
          tracking={fbData?.trackingData}
          title={"Followers data"}
        />
      </View>
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Avg Post Reactions Over Time</Text>
        <Text style={styles.chartValue}>
          {`${formatNumber(Math.max(...(fbData?.avgPostReactions || [0])))}`}
        </Text>
        <Text style={styles.chartDesc}>Last 6 Months</Text>
        <MyLineChart
          data={fbData?.avgPostReactions}
          tracking={fbData?.trackingData}
          title={"Avg Post Reactions"}
        />
      </View>
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Engagement Rate Over Time</Text>
        <Text style={styles.chartValue}>
          {`${Math.max(...(fbData?.avgER || [0])).toFixed(2)}%`}
        </Text>
        <Text style={styles.chartDesc}>Last 6 Months</Text>
        <MyLineChart
          data={fbData?.avgER}
          tracking={fbData?.trackingData}
          title={"Engagement Rate"}
        />
      </View>

      {/* Monthly Gained Followers */}
      {fbData?.followersGained && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Monthly Gained Followers</Text>
          <Text style={styles.chartValue}>
            {(() => {
              const latest = fbData.followersGained[fbData.followersGained.length - 1] || 0;
              return (latest >= 0 ? "+" : "") + formatNumber(latest);
            })()}
          </Text>
          <Text style={styles.chartDesc}>Last 6 Months</Text>
          <MonthlyGainedChart
            data={fbData.followersGained}
            labels={fbData.trackingData}
          />
        </View>
      )}
    </View>
  );
};
function IgGraph({ instaData }) {
  return (
    <View style={styles.row}>
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Engagement Rate Over Time</Text>
        <Text style={styles.chartValue}>
          {instaData?.avgER &&
            `${Math.max(...instaData?.avgER).toPrecision(2)}%`}
        </Text>
        <Text
          style={styles.chartDesc}
        >{`Last ${instaData?.avgER?.length} Months`}</Text>
        <MyLineChart
          data={instaData?.avgER}
          tracking={instaData?.trackingData}
          title={"Followers data"}
        />
      </View>
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Likes Over Time</Text>
        <Text style={styles.chartValue}>
          {instaData?.avgLikes &&
            `${formatNumber(Math.max(...instaData?.avgLikes))}`}
        </Text>
        <Text
          style={styles.chartDesc}
        >{`Last ${instaData?.avgLikes?.length} Months`}</Text>
        <MyLineChart
          data={instaData?.avgLikes}
          tracking={instaData?.trackingData}
          title={"Average Likes data"}
        />
      </View>
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Comments Over Time</Text>
        <Text style={styles.chartValue}>
          {instaData?.avgComments &&
            `${formatNumber(Math.max(...instaData?.avgComments))}`}
        </Text>
        <Text
          style={styles.chartDesc}
        >{`Last ${instaData?.avgComments?.length} Months`}</Text>
        <MyLineChart
          data={instaData?.avgComments}
          tracking={instaData?.trackingData}
          title={"Average Comments data"}
        />
      </View>
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Interactions Over Time</Text>
        <Text style={styles.chartValue}>
          {instaData?.avgInteractions &&
            `${formatNumber(Math.max(...instaData?.avgInteractions))}`}
        </Text>
        <Text
          style={styles.chartDesc}
        >{`Last ${instaData?.avgInteractions?.length} Months`}</Text>
        <MyLineChart
          data={instaData?.avgInteractions}
          tracking={instaData?.trackingData}
          title={"Average Interactions data"}
        />
      </View>
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Followers Over Time</Text>
        <Text style={styles.chartValue}>
          {instaData?.followers &&
            `${formatNumber(Math.max(...instaData?.followers))}`}
        </Text>
        <Text
          style={styles.chartDesc}
        >{`Last ${instaData?.followers?.length} Months`}</Text>
        <MyLineChart
          data={instaData?.followers}
          tracking={instaData?.trackingData}
          title={"Average Engagement Rate data"}
        />
      </View>

      {/* Monthly Gained Followers */}
      {instaData?.followersGained && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Monthly Gained Followers</Text>
          <Text style={styles.chartValue}>
            {(() => {
              const latest = instaData.followersGained[instaData.followersGained.length - 1] || 0;
              return (latest >= 0 ? "+" : "") + formatNumber(latest);
            })()}
          </Text>
          <Text style={styles.chartDesc}>Last 6 Months</Text>
          <MonthlyGainedChart
            data={instaData.followersGained}
            labels={instaData.trackingData}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create(graphStyles);

export { YTGraph, FBGraph, IgGraph };
