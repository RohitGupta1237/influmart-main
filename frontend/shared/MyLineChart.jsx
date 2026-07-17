import React from "react";
import { LineChart } from "react-native-chart-kit";
import { View, Text, StyleSheet } from "react-native";
import { formatNumber } from "../helpers/GraphData";

const chartConfig = {
  backgroundGradientFrom: "#FFFFFF",
  backgroundGradientFromOpacity: 0,
  backgroundGradientTo: "#FFFFFF",
  backgroundGradientToOpacity: 0,
  color: (opacity = 0.5) => `rgba(99, 112, 135, ${opacity})`,
  strokeWidth: 5,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
  propsForBackgroundLines: {
    strokeDasharray: "",
    strokeWidth: 0,
  },
  hideLegend: true,
  decimalPlaces: 2,
  hideHorizontalGridLines: true,
  hideVerticalGridLines: true,
};

const MyLineChart = ({ tracking, data, title }) => {
  // Fill the card: measure the container and size the chart to it, instead of
  // a hardcoded width (which caused the overflow / dead-space on desktop).
  const [containerW, setContainerW] = React.useState(300);

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Data Not Available</Text>
      </View>
    );
  }

  const isValidData = (data) => {
    return data.every((point) => !isNaN(point));
  };

  const validatedData = data.map(point =>
    point !== undefined && point !== " " ? Number(point) : 0
  );

  if (!isValidData(validatedData)) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Data Not Available</Text>
      </View>
    );
  }

  const chartData = {
    labels: tracking,
    datasets: [
      {
        data: validatedData,
        color: (opacity = 1) => `rgba(99, 112, 135, ${opacity})`,
        strokeWidth: 6,
      },
    ],
  };

  return (
    <View
      style={{ alignItems: "center", width: "100%" }}
      onLayout={(e) => {
        const w = Math.round(e.nativeEvent.layout.width);
        if (w && Math.abs(w - containerW) > 1) setContainerW(w);
      }}
    >
      <LineChart
        data={chartData}
        width={Math.max(containerW, 220)}
        height={220}
        formatYLabel={formatNumber}
        chartConfig={chartConfig}
        withInnerLines={false}
        withOuterLines={false}
        segments={4}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 220,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
});

export default MyLineChart;
