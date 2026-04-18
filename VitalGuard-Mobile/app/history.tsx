import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { HistoryItem } from "@/components/HistoryItem";
import { ScreenBackground } from "@/components/ScreenBackground";
import { SectionHeader } from "@/components/SectionHeader";
import { ROOM_STATUS } from "@/constants/roomStatus";
import { theme } from "@/constants/theme";
import { useAppStore } from "@/store/appStore";

const filters = ["ALL", "FALL", "FALSE_ALARM", "CONFIRMED_FALL", "PENDING"] as const;
type Filter = (typeof filters)[number];

export default function HistoryScreen() {
  const router = useRouter();
  const history = useAppStore((state) => state.history);
  const bootstrapped = useAppStore((state) => state.bootstrapped);
  const connectionState = useAppStore((state) => state.connectionState);
  const [filter, setFilter] = useState<Filter>("ALL");

  const filtered = useMemo(() => {
    if (filter === "ALL") {
      return history;
    }
    if (filter === "FALL") {
      return history.filter((item) => item.type === ROOM_STATUS.FALL);
    }
    return history.filter((item) => item.feedback === filter);
  }, [filter, history]);

  return (
    <View style={styles.flex}>
      <ScreenBackground />
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
          <View style={styles.headerRow}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <ChevronLeft color={theme.colors.textPrimary} size={18} />
            </Pressable>
            <Text style={styles.headerTitle}>Anomaly History</Text>
          </View>

          <SectionHeader title="Clinical Timeline" subtitle="Event-level diagnostics with feedback loop status" />

          <View style={styles.chips}>
            {filters.map((item) => {
              const active = item === filter;
              return (
                <Pressable
                  key={item}
                  onPress={() => setFilter(item)}
                  style={[styles.chip, active && styles.activeChip]}
                >
                  <Text style={[styles.chipText, active && styles.activeText]}>
                    {item === "CONFIRMED_FALL" ? "CONFIRMED" : item}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.listWrap}>
            {!bootstrapped ? (
              <EmptyState title="Loading history" message="Syncing anomaly timeline from the backend." />
            ) : filtered.length === 0 ? (
              <EmptyState
                title={connectionState === "DISCONNECTED" ? "History unavailable" : "No matching history"}
                message={
                  connectionState === "DISCONNECTED"
                    ? "Backend connection dropped. Reconnect to retrieve anomaly history."
                    : "Try a broader filter or wait for new telemetry events."
                }
              />
            ) : (
              filtered.map((item, index) => <HistoryItem item={item} index={index} key={item.id} />)
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
  container: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 132,
    paddingTop: theme.spacing.md + 2
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl + 2
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(191, 225, 255, 0.28)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)"
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h2,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 0.2
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg
  },
  chip: {
    borderRadius: theme.radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "rgba(189, 224, 255, 0.22)",
    backgroundColor: "rgba(255,255,255,0.06)"
  },
  activeChip: {
    backgroundColor: "rgba(91, 201, 255, 0.24)",
    borderColor: "rgba(91, 201, 255, 0.5)"
  },
  chipText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
    fontSize: theme.typography.caption,
    letterSpacing: 0.4,
    textTransform: "uppercase"
  },
  activeText: {
    color: theme.colors.textPrimary
  },
  listWrap: {
    marginTop: theme.spacing.sm + 2
  }
});
