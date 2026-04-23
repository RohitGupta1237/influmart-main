import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Rect, Line, Text as SvgText, G } from "react-native-svg";
import { formatNumber } from "../helpers/GraphData";

const CHART_WIDTH = 310;
const CHART_HEIGHT = 200;
const PAD_LEFT = 44;
const PAD_RIGHT = 12;
const PAD_TOP = 20;
const PAD_BOTTOM = 32;

const DRAW_W = CHART_WIDTH - PAD_LEFT - PAD_RIGHT;
const DRAW_H = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

const COLOR_POS = "#4ade80";
const COLOR_NEG = "#f87171";
const COLOR_ZERO = "#d1d5db";
const COLOR_AXIS = "#e5e7eb";
const COLOR_LABEL = "#9ca3af";

function niceMax(val) {
  if (val === 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(Math.abs(val))));
  return Math.ceil(val / mag) * mag;
}

export default function MonthlyGainedChart({ data = [], labels = [] }) {
  const nums = data.map((d) => (isNaN(d) || d === null ? 0 : Number(d)));

  const rawMax = Math.max(...nums, 0);
  const rawMin = Math.min(...nums, 0);

  // Ensure a minimum visual range so single tiny bars don't fill the chart
  const absMax = Math.max(Math.abs(rawMax), Math.abs(rawMin), 1);
  const scaleMax = niceMax(absMax * 1.25);
  const scaleMin = rawMin < 0 ? -scaleMax : 0;
  const range = scaleMax - scaleMin;

  const zeroY = PAD_TOP + DRAW_H * (scaleMax / range);
  const barW = Math.max(6, (DRAW_W / nums.length) * 0.5);
  const slotW = DRAW_W / nums.length;

  // Y-axis tick values
  const ticks =
    scaleMin < 0
      ? [scaleMax, 0, scaleMin]
      : [scaleMax, Math.round(scaleMax / 2), 0];

  return (
    <View style={styles.wrapper}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {/* Grid lines at ticks */}
        {ticks.map((tick, i) => {
          const ty = PAD_TOP + DRAW_H * ((scaleMax - tick) / range);
          return (
            <G key={i}>
              <Line
                x1={PAD_LEFT}
                y1={ty}
                x2={CHART_WIDTH - PAD_RIGHT}
                y2={ty}
                stroke={tick === 0 ? COLOR_AXIS : COLOR_AXIS}
                strokeWidth={tick === 0 ? 1.5 : 0.8}
                strokeDasharray={tick === 0 ? "" : "3,3"}
              />
              <SvgText
                x={PAD_LEFT - 4}
                y={ty + 4}
                textAnchor="end"
                fontSize={9}
                fill={COLOR_LABEL}
              >
                {tick === 0 ? "0" : formatNumber(tick)}
              </SvgText>
            </G>
          );
        })}

        {/* Bars */}
        {nums.map((val, i) => {
          const cx = PAD_LEFT + i * slotW + slotW / 2;
          const barH = Math.max(Math.abs((val / range) * DRAW_H), val !== 0 ? 2 : 0);
          const x = cx - barW / 2;
          const y = val >= 0 ? zeroY - barH : zeroY;
          const color = val > 0 ? COLOR_POS : val < 0 ? COLOR_NEG : COLOR_ZERO;

          return (
            <Rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={barH}
              fill={color}
              rx={2}
            />
          );
        })}

        {/* X-axis labels */}
        {labels.map((label, i) => (
          <SvgText
            key={i}
            x={PAD_LEFT + i * slotW + slotW / 2}
            y={CHART_HEIGHT - 8}
            textAnchor="middle"
            fontSize={9}
            fill={COLOR_LABEL}
          >
            {label || ""}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 4,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
});
