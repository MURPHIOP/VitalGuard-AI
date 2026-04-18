import { StyleSheet, Text, View } from "react-native";
import { CircleOff } from "lucide-react-native";

import { theme } from "@/constants/theme";

type Props = {
  title: string;
  message: string;
};

export const EmptyState = ({ title, message }: Props) => (
  <View style={styles.container}>
    <View style={styles.iconWrap}>
      <CircleOff size={20} color={theme.colors.empty} />
    </View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: "rgba(189, 224, 255, 0.23)",
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.xxl,
    alignItems: "center",
    backgroundColor: "rgba(86, 130, 206, 0.12)"
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: "rgba(108, 195, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h3,
    fontWeight: theme.typography.weights.semibold
  },
  message: {
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: theme.spacing.sm + 1,
    lineHeight: 21
  }
});
