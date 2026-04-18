import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { theme } from "@/constants/theme";
import { ConnectionState } from "@/types";

type Props = {
  state: ConnectionState;
};

const colorMap: Record<ConnectionState, string> = {
  CONNECTED: theme.colors.normal,
  CONNECTING: theme.colors.empty,
  RECONNECTING: theme.colors.warning,
  DISCONNECTED: theme.colors.fall,
  MOCK: "#6FA8FF"
};

export const ConnectionBadge = ({ state }: Props) => {
  const color = colorMap[state];
  const labelMap: Record<ConnectionState, string> = {
    CONNECTED: "LIVE",
    CONNECTING: "CONNECTING",
    RECONNECTING: "RECONNECTING",
    DISCONNECTED: "DISCONNECTED",
    MOCK: "MOCK MODE"
  };

  return (
    <View style={[styles.container, { borderColor: `${color}66`, backgroundColor: `${color}1A` }]}>
      {state === "CONNECTING" || state === "RECONNECTING" ? <ActivityIndicator size="small" color={color} /> : <View style={[styles.dot, { backgroundColor: color }]} />}
      <Text style={[styles.text, { color }]}>{labelMap[state]}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 12,
    gap: 8,
    minHeight: 32
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 999
  },
  text: {
    fontWeight: theme.typography.weights.semibold,
    fontSize: theme.typography.caption,
    letterSpacing: 0.7,
    textTransform: "uppercase"
  }
});
