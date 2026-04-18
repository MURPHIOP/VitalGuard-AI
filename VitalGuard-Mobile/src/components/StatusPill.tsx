import { StyleSheet, Text, View } from "react-native";

import { ROOM_STATUS, RoomStatus, STATUS_LABELS } from "@/constants/roomStatus";
import { theme } from "@/constants/theme";

type Props = {
  status: RoomStatus;
};

export const StatusPill = ({ status }: Props) => {
  const color =
    status === ROOM_STATUS.FALL
      ? theme.colors.fall
      : status === ROOM_STATUS.EMPTY
        ? theme.colors.empty
        : status === ROOM_STATUS.OFFLINE
          ? theme.colors.warning
          : theme.colors.normal;

  return (
    <View style={[styles.container, { borderColor: `${color}55`, backgroundColor: `${color}1A` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    gap: 7,
    minHeight: 30
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999
  },
  text: {
    fontSize: theme.typography.caption,
    fontWeight: theme.typography.weights.semibold,
    letterSpacing: 0.45,
    textTransform: "uppercase"
  }
});
