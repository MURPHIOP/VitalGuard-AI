import { StyleSheet, Text, View } from "react-native";
import { BadgeCheck, Siren } from "lucide-react-native";
import Animated, { FadeInRight } from "react-native-reanimated";

import { ROOM_STATUS } from "@/constants/roomStatus";
import { theme } from "@/constants/theme";
import { AnomalyHistoryItem } from "@/types";
import { formatClock, formatPercent } from "@/utils/format";

type Props = {
  item: AnomalyHistoryItem;
  index: number;
};

export const HistoryItem = ({ item, index }: Props) => {
  const isFall = item.type === ROOM_STATUS.FALL;

  return (
    <Animated.View entering={FadeInRight.delay(index * 40)} style={styles.container}>
      <View style={styles.iconWrap}>{isFall ? <Siren size={16} color={theme.colors.fall} /> : <BadgeCheck size={16} color={theme.colors.normal} />}</View>
      <View style={styles.main}>
        <View style={styles.row}>
          <Text style={styles.title}>{item.type}</Text>
          <Text style={styles.time}>{formatClock(item.timestamp)}</Text>
        </View>
        <Text style={styles.meta}>Room {item.roomId} • Confidence {formatPercent(item.confidence)}</Text>
      </View>
      <View
        style={[
          styles.feedback,
          item.feedback === "FALSE_ALARM" && styles.false,
          item.feedback === "CONFIRMED_FALL" && styles.confirmed
        ]}
      >
        <Text style={styles.feedbackText}>{item.feedback === "CONFIRMED_FALL" ? "CONFIRMED" : item.feedback}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(189, 224, 255, 0.2)",
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md + 1,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: "rgba(18, 31, 49, 0.66)",
    marginBottom: theme.spacing.sm
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md
  },
  main: {
    flex: 1
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  title: {
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
    letterSpacing: 0.2
  },
  time: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption
  },
  meta: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.label
  },
  feedback: {
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: "rgba(241, 201, 120, 0.36)",
    backgroundColor: "rgba(241, 201, 120, 0.16)",
    paddingVertical: 5,
    paddingHorizontal: 10
  },
  false: {
    borderColor: "rgba(90, 197, 255, 0.35)",
    backgroundColor: "rgba(90, 197, 255, 0.14)"
  },
  confirmed: {
    borderColor: "rgba(57, 210, 144, 0.35)",
    backgroundColor: "rgba(57, 210, 144, 0.14)"
  },
  feedbackText: {
    color: theme.colors.textPrimary,
    fontSize: 10,
    fontWeight: theme.typography.weights.semibold,
    letterSpacing: 0.4
  }
});
