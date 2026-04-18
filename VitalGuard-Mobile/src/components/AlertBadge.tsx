import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ShieldAlert, ShieldCheck } from "lucide-react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from "react-native-reanimated";

import { ROOM_STATUS, RoomStatus } from "@/constants/roomStatus";
import { theme } from "@/constants/theme";

type Props = {
  status: RoomStatus;
};

export const AlertBadge = ({ status }: Props) => {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value =
      status === ROOM_STATUS.FALL
        ? withRepeat(
            withSequence(withTiming(1, { duration: 800 }), withTiming(0, { duration: 800 })),
            -1,
            false
          )
        : withTiming(0, { duration: 220 });
  }, [pulse, status]);

  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.08]) }],
    shadowOpacity: interpolate(pulse.value, [0, 1], [0.22, 0.65])
  }));

  const isFall = status === ROOM_STATUS.FALL;
  const isOffline = status === ROOM_STATUS.OFFLINE;

  return (
    <Animated.View style={[styles.badge, isFall ? styles.fall : isOffline ? styles.offline : styles.normal, animated]}>
      <View style={styles.iconWrap}>
        {isFall ? (
          <ShieldAlert color={theme.colors.fall} size={24} />
        ) : (
          <ShieldCheck color={isOffline ? theme.colors.warning : theme.colors.normal} size={24} />
        )}
      </View>
      <Text style={styles.title}>{isFall ? "Emergency Detected" : isOffline ? "Sensor Offline" : "Monitoring Stable"}</Text>
      <Text style={styles.subtitle}>
        {isFall
          ? "Immediate caregiver action recommended"
          : isOffline
            ? "No recent telemetry from this room"
            : "No high-risk anomaly in current window"}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    paddingVertical: theme.spacing.xl + 4,
    paddingHorizontal: theme.spacing.xxl,
    alignItems: "center",
    shadowColor: "#FF4F67",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 22,
    elevation: 8
  },
  normal: {
    backgroundColor: "rgba(43, 191, 150, 0.14)",
    borderColor: "rgba(64, 209, 168, 0.35)"
  },
  fall: {
    backgroundColor: "rgba(207, 49, 77, 0.24)",
    borderColor: "rgba(247, 101, 126, 0.64)"
  },
  offline: {
    backgroundColor: "rgba(247, 176, 104, 0.17)",
    borderColor: "rgba(247, 176, 104, 0.48)"
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: theme.spacing.md
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h3,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 0.2
  },
  subtitle: {
    color: theme.colors.textSecondary,
    marginTop: 6,
    fontSize: theme.typography.label,
    lineHeight: 20
  }
});
