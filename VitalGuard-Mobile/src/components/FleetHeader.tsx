import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AudioLines, OctagonAlert, ServerCog } from "lucide-react-native";

import { theme } from "@/constants/theme";
import { useRealtimeMetrics } from "@/hooks/useRealtimeMetrics";
import { ConnectionBadge } from "./ConnectionBadge";

export const FleetHeader = () => {
  const { avgLatency, connection, falls, total } = useRealtimeMetrics();

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradients.hero} style={styles.heroCard}>
        <Text style={styles.kicker}>VITALGUARD AI</Text>
        <Text style={styles.title}>Care Intelligence Grid</Text>
        <Text style={styles.subtitle}>Privacy-preserving mmWave telemetry across monitored rooms.</Text>
      </LinearGradient>
      <View style={styles.metricRow}>
        <View style={styles.metricCard}>
          <ServerCog size={15} color={theme.colors.empty} />
          <Text style={styles.metricValue}>{total}</Text>
          <Text style={styles.metricLabel}>rooms</Text>
        </View>
        <View style={styles.metricCard}>
          <OctagonAlert size={15} color={theme.colors.fall} />
          <Text style={styles.metricValue}>{falls}</Text>
          <Text style={styles.metricLabel}>critical</Text>
        </View>
        <View style={styles.metricCard}>
          <AudioLines size={15} color={theme.colors.normal} />
          <Text style={styles.metricValue}>{avgLatency}</Text>
          <Text style={styles.metricLabel}>avg ms</Text>
        </View>
      </View>
      <ConnectionBadge state={connection} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xl + 2,
    gap: theme.spacing.md + 2
  },
  heroCard: {
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: "rgba(188, 224, 255, 0.24)",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: "rgba(18, 32, 52, 0.5)"
  },
  kicker: {
    color: theme.colors.empty,
    textTransform: "uppercase",
    letterSpacing: 1.8,
    fontSize: theme.typography.caption,
    fontWeight: theme.typography.weights.semibold
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h1,
    lineHeight: 41,
    marginTop: 5,
    fontWeight: theme.typography.weights.bold
  },
  subtitle: {
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginTop: 5,
    maxWidth: "92%"
  },
  metricRow: {
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  metricCard: {
    flex: 1,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: "rgba(184, 222, 255, 0.2)",
    padding: theme.spacing.md,
    backgroundColor: "rgba(16, 30, 49, 0.62)"
  },
  metricValue: {
    marginTop: 5,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h3,
    fontWeight: theme.typography.weights.bold
  },
  metricLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.85
  }
});
