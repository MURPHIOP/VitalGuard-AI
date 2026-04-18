import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/constants/theme";

type Props = {
  title: string;
  subtitle?: string;
  right?: string;
};

export const SectionHeader = ({ title, subtitle, right }: Props) => (
  <View style={styles.row}>
    <View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
    {right ? <Text style={styles.right}>{right}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: theme.spacing.md + 2
  },
  title: {
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.bold,
    fontSize: theme.typography.h3,
    letterSpacing: 0.2
  },
  subtitle: {
    color: theme.colors.textSecondary,
    marginTop: 4,
    fontSize: theme.typography.label,
    lineHeight: 20,
    maxWidth: 280
  },
  right: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    letterSpacing: 0.75
  }
});
