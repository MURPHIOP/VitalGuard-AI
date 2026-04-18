import { memo, useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

import { theme } from "@/constants/theme";
import { RoomTelemetryPoint } from "@/types";
import { buildSmoothPath, normalizeSeries } from "@/utils/charts";

const AnimatedPath = Animated.createAnimatedComponent(Path);

type Props = {
  points: RoomTelemetryPoint[];
  compact?: boolean;
};

const CHART_H = 160;

const lineToPath = (values: number[], width: number, height: number) => {
  if (!values.length) {
    return "";
  }

  const normalized = normalizeSeries(values);
  const mapped = normalized.map((value, i) => ({
    x: (i / Math.max(1, normalized.length - 1)) * width,
    y: height - value * height
  }));

  return buildSmoothPath(mapped);
};

export const LiveTelemetryChart = memo(({ points, compact = false }: Props) => {
  const width = compact ? 120 : 320;
  const height = compact ? 42 : CHART_H;

  const moving = useMemo(() => points.map((p) => p.movingEnergy), [points]);
  const stationary = useMemo(() => points.map((p) => p.stationaryEnergy), [points]);

  const movingPath = useMemo(() => lineToPath(moving, width, height), [height, moving, width]);
  const stationaryPath = useMemo(() => lineToPath(stationary, width, height), [height, stationary, width]);

  const progress = useSharedValue(0);

  useEffect(() => {
    if (compact) {
      progress.value = 1;
      return;
    }

    progress.value = 0;
    progress.value = withTiming(1, { duration: 420 });
  }, [compact, movingPath, progress, stationaryPath]);

  const movingProps = useAnimatedProps(() => ({
    strokeDashoffset: compact ? 0 : (1 - progress.value) * 220
  }));

  const secondaryProps = useAnimatedProps(() => ({
    strokeDashoffset: compact ? 0 : (1 - progress.value) * 160
  }));

  return (
    <View style={[styles.container, compact && styles.compact]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="movingGlow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={theme.colors.chartMoving} stopOpacity="0.95" />
            <Stop offset="100%" stopColor={theme.colors.chartMoving} stopOpacity="0.45" />
          </LinearGradient>
          <LinearGradient id="stationaryGlow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={theme.colors.chartStationary} stopOpacity="0.9" />
            <Stop offset="100%" stopColor={theme.colors.chartStationary} stopOpacity="0.4" />
          </LinearGradient>
        </Defs>
        <AnimatedPath
          animatedProps={movingProps}
          d={movingPath}
          stroke="url(#movingGlow)"
          strokeWidth={compact ? 2.3 : 3.1}
          fill="none"
          strokeDasharray={compact ? undefined : "220"}
          strokeLinecap="round"
        />
        <AnimatedPath
          animatedProps={secondaryProps}
          d={stationaryPath}
          stroke="url(#stationaryGlow)"
          strokeWidth={compact ? 1.8 : 2.2}
          fill="none"
          strokeDasharray={compact ? undefined : "160"}
          strokeLinecap="round"
          opacity={0.88}
        />
      </Svg>
    </View>
  );
});

LiveTelemetryChart.displayName = "LiveTelemetryChart";

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: "rgba(186, 223, 255, 0.24)",
    backgroundColor: "rgba(10, 18, 30, 0.56)",
    padding: 12,
    shadowColor: "#6ECFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3
  },
  compact: {
    borderWidth: 0,
    backgroundColor: "transparent",
    padding: 0,
    shadowOpacity: 0,
    elevation: 0
  }
});
