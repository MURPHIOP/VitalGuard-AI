import { memo, useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming
} from "react-native-reanimated";
import { Wifi } from "lucide-react-native";

import { ROOM_STATUS } from "@/constants/roomStatus";
import { theme } from "@/constants/theme";
import { RoomModel } from "@/types";
import { formatTimeAgo } from "@/utils/format";
import { GlassCard } from "./GlassCard";
import { LiveTelemetryChart } from "./LiveTelemetryChart";
import { StatusPill } from "./StatusPill";

type Props = {
  room: RoomModel;
  index: number;
};

export const RoomCard = memo(({ room, index }: Props) => {
  const router = useRouter();
  const scale = useSharedValue(1);
  const emergencyPulse = useSharedValue(0);

  useEffect(() => {
    emergencyPulse.value =
      room.status === ROOM_STATUS.FALL
        ? withRepeat(
            withSequence(withTiming(1, { duration: 640 }), withTiming(0, { duration: 640 })),
            -1,
            true
          )
        : withTiming(0, { duration: 260 });
  }, [emergencyPulse, room.status]);

  const emergencyStyle = useAnimatedStyle(() => ({
    borderColor:
      room.status === ROOM_STATUS.FALL
        ? `rgba(255, 94, 114, ${0.42 + emergencyPulse.value * 0.48})`
        : theme.colors.borderSoft,
    transform: [{ scale: scale.value }],
    shadowColor: room.status === ROOM_STATUS.FALL ? "#FF4F67" : "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity:
      room.status === ROOM_STATUS.FALL ? 0.3 + emergencyPulse.value * 0.4 : 0,
    shadowRadius: 16,
    elevation: room.status === ROOM_STATUS.FALL ? 8 : 0
  }));

  return (
    <Animated.View entering={FadeInUp.delay(index * 70).springify()}>
      <Pressable
        onPress={() => router.push(`/room/${room.id}`)}
        onPressIn={() => {
          scale.value = withSpring(0.985, theme.motion.spring);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, theme.motion.spring);
        }}
      >
        <Animated.View style={emergencyStyle}>
          <GlassCard glow={room.status === ROOM_STATUS.FALL ? "alert" : "soft"}>
            <View style={styles.topRow}>
              <View>
                <Text style={styles.roomLabel}>{room.label}</Text>
                <Text style={styles.timestamp}>Updated {formatTimeAgo(room.lastUpdated)}</Text>
              </View>
              <StatusPill status={room.status} />
            </View>

            <View style={styles.chartRow}>
              <LiveTelemetryChart points={room.chartBuffer.slice(-22)} compact />
              <View style={styles.sideMetrics}>
                <View style={styles.metricItem}>
                  <Wifi size={13} color={theme.colors.textSecondary} />
                  <Text style={styles.metricText}>{room.latency} ms</Text>
                </View>
                <View style={styles.metricItem}>
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          room.status === ROOM_STATUS.FALL
                            ? theme.colors.fall
                            : room.status === ROOM_STATUS.OFFLINE
                              ? theme.colors.warning
                              : theme.colors.normal
                      }
                    ]}
                  />
                  <Text style={styles.metricText}>conf {Math.round(room.telemetry.confidence * 100)}%</Text>
                </View>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
});

RoomCard.displayName = "RoomCard";

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.md + 2
  },
  roomLabel: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h3,
    lineHeight: 26,
    fontWeight: theme.typography.weights.bold
  },
  timestamp: {
    color: theme.colors.textMuted,
    marginTop: 5,
    fontSize: theme.typography.caption
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md + 2
  },
  sideMetrics: {
    gap: theme.spacing.sm + 1,
    alignItems: "flex-end"
  },
  metricItem: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: "rgba(183, 221, 255, 0.2)",
    backgroundColor: "rgba(7, 13, 23, 0.35)"
  },
  metricText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    fontWeight: theme.typography.weights.medium,
    letterSpacing: 0.2
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999
  }
});
