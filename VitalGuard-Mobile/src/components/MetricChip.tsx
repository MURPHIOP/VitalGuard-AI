import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/constants/theme";

type Props = {
  title: string;
  value: string;
  icon?: ReactNode;
};

export const MetricChip = ({ title, value, icon }: Props) => (
  <View style={styles.card}>
    <View style={styles.topRow}>
      <Text style={styles.title}>{title}</Text>
      {icon}
    </View>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: "47%",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: "rgba(190, 226, 255, 0.22)",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md + 1,
    backgroundColor: "rgba(17, 30, 49, 0.64)"
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  title: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    letterSpacing: 0.8,
    textTransform: "uppercase"
  },
  value: {
    marginTop: theme.spacing.sm + 1,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.bold,
    fontSize: theme.typography.h3
  }
});
