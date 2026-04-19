import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Crosshair, PhoneCall, Radar, ShieldX, Siren } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AlertBadge } from "@/components/AlertBadge";
import { ConnectionBadge } from "@/components/ConnectionBadge";
import { EmptyState } from "@/components/EmptyState";
import { GlassButton } from "@/components/GlassButton";
import { GlassCard } from "@/components/GlassCard";
import { LiveTelemetryChart } from "@/components/LiveTelemetryChart";
import { MetricChip } from "@/components/MetricChip";
import { ScreenBackground } from "@/components/ScreenBackground";
import { StatusPill } from "@/components/StatusPill";
import { config } from "@/constants/config";
import { ROOM_STATUS } from "@/constants/roomStatus";
import { theme } from "@/constants/theme";
import { useHaptics } from "@/hooks/useHaptics";
import { submitFeedback } from "@/services/api";
import { useAppStore, useRoomById } from "@/store/appStore";
import { FeedbackPayload } from "@/types";
import { formatClock, formatLatency, formatPercent } from "@/utils/format";

export default function RoomDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const roomId = Array.isArray(params.id) ? params.id[0] : params.id;
  const room = useRoomById(roomId);

  const connectionState = useAppStore((state) => state.connectionState);
  const markAcknowledged = useAppStore((state) => state.markAcknowledged);
  const setFeedbackState = useAppStore((state) => state.setFeedbackState);
  const feedbackState = useAppStore((state) => (roomId ? state.feedbackStateByRoom[roomId] : undefined) ?? "idle");
  const setRoomFeedbackResult = useAppStore((state) => state.setRoomFeedbackResult);
  const { triggerSuccess } = useHaptics();

  const isFall = room?.status === ROOM_STATUS.FALL;
  const feedbackLocked = feedbackState === "loading" || feedbackState === "success";

  const submit = async (feedback: "CONFIRMED_FALL" | "FALSE_ALARM") => {
    if (!room) {
      return;
    }
    setFeedbackState(room.id, "loading");

    const pendingAnomaly = useAppStore
      .getState()
      .history.find((item) => item.roomId === room.id && item.feedback === "PENDING" && item.type === ROOM_STATUS.FALL);

    const payload: FeedbackPayload = {
      roomId: room.id,
      event: "FALL",
      feedback,
      timestamp: new Date().toISOString(),
      anomalyId: pendingAnomaly?.id
    };

    try {
      const response = await submitFeedback(payload);
      setFeedbackState(room.id, "success");
      setRoomFeedbackResult(room.id, feedback, response.feedback?.anomalyId ?? pendingAnomaly?.id);
      await triggerSuccess();
    } catch {
      if (config.mockMode || connectionState === "MOCK") {
        await new Promise((resolve) => setTimeout(resolve, 420));
        setFeedbackState(room.id, "success");
        setRoomFeedbackResult(room.id, feedback, pendingAnomaly?.id);
        await triggerSuccess();
        return;
      }
      setFeedbackState(room.id, "error");
    }
  };

  const chartPoints = useMemo(() => room?.chartBuffer.slice(-60) ?? [], [room?.chartBuffer]);

  if (!room) {
    return (
      <View style={styles.flex}>
        <ScreenBackground />
        <SafeAreaView style={styles.flex}>
          <View style={styles.container}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <ChevronLeft color={theme.colors.textPrimary} size={18} />
            </Pressable>
            <EmptyState title="Room not found" message="This room may not have streamed telemetry yet." />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <ScreenBackground status={room.status} />
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <ChevronLeft color={theme.colors.textPrimary} size={18} />
            </Pressable>
            <Text style={styles.roomTitle}>{room.label}</Text>
            <StatusPill status={room.status} />
          </View>

          <View style={styles.connectionRow}>
            <ConnectionBadge state={connectionState} />
            <Text style={styles.metaText}>Latency {formatLatency(room.latency)}</Text>
            <Text style={styles.metaText}>Battery {room.nodeBattery ?? "--"}%</Text>
          </View>

          <AlertBadge status={room.status} />

          <GlassCard style={styles.chartCard} glow={isFall ? "alert" : "soft"}>
            <Text style={styles.cardTitle}>Rolling 60s Telemetry</Text>
            <LiveTelemetryChart points={chartPoints} />
            <Text style={styles.cardFoot}>Last update {formatClock(room.lastUpdated)}</Text>
          </GlassCard>

          <View style={styles.metricsWrap}>
            <MetricChip title="Moving Energy" value={`${room.telemetry.me}`} icon={<Radar color={theme.colors.normal} size={14} />} />
            <MetricChip title="Stationary Energy" value={`${room.telemetry.se}`} icon={<Crosshair color={theme.colors.empty} size={14} />} />
            <MetricChip title="Distance" value={`${room.telemetry.dd} cm`} icon={<Crosshair color={theme.colors.textSecondary} size={14} />} />
            <MetricChip title="Confidence" value={formatPercent(room.telemetry.confidence)} icon={<Siren color={isFall ? theme.colors.fall : theme.colors.textSecondary} size={14} />} />
          </View>

          <GlassCard style={styles.actionCard} glow={isFall ? "alert" : "none"}>
            <Text style={styles.cardTitle}>Rapid Response Actions</Text>
            <View style={styles.actionRow}>
              <GlassButton title="Acknowledge" variant="ghost" onPress={() => markAcknowledged(room.id)} />
              <GlassButton title="Call Room" variant={isFall ? "danger" : "primary"} icon={<PhoneCall color={theme.colors.textPrimary} size={14} />} />
            </View>
          </GlassCard>

          {room.status === ROOM_STATUS.FALL ? (
            <GlassCard style={styles.feedbackCard} glow="alert">
              <Text style={styles.feedbackTitle}>Was this a real fall?</Text>
              <Text style={styles.feedbackSubtitle}>Your response is sent to clinical history and helps reduce false emergency dispatches.</Text>
              <View style={styles.actionRow}>
                <GlassButton
                  title="Yes, Confirmed"
                  variant="danger"
                  loading={feedbackState === "loading"}
                  disabled={feedbackLocked}
                  onPress={() => {
                    void submit("CONFIRMED_FALL");
                  }}
                />
                <GlassButton
                  title="No, False Alarm"
                  variant="ghost"
                  loading={feedbackState === "loading"}
                  disabled={feedbackLocked}
                  icon={<ShieldX color={theme.colors.textPrimary} size={14} />}
                  onPress={() => {
                    void submit("FALSE_ALARM");
                  }}
                />
              </View>
              {feedbackState === "success" ? <Text style={styles.success}>Feedback submitted successfully.</Text> : null}
              {feedbackState === "error" ? <Text style={styles.error}>Could not submit feedback. Check backend connectivity.</Text> : null}
            </GlassCard>
          ) : null}
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
    paddingBottom: 148,
    paddingTop: theme.spacing.md + 2,
    gap: theme.spacing.lg
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md
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
  roomTitle: {
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.bold,
    fontSize: theme.typography.h2,
    lineHeight: 34,
    flex: 1,
    marginLeft: theme.spacing.sm
  },
  connectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    flexWrap: "wrap"
  },
  metaText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.label,
    letterSpacing: 0.15
  },
  chartCard: {
    paddingBottom: theme.spacing.md + 2
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
    fontSize: theme.typography.title,
    marginBottom: theme.spacing.md + 1,
    letterSpacing: 0.2
  },
  cardFoot: {
    marginTop: theme.spacing.sm + 1,
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption
  },
  metricsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm + 1
  },
  actionCard: {
    gap: theme.spacing.md + 2
  },
  actionRow: {
    flexDirection: "row",
    gap: theme.spacing.sm + 2
  },
  feedbackCard: {
    gap: theme.spacing.sm + 1,
    borderColor: "rgba(255, 113, 131, 0.42)"
  },
  feedbackTitle: {
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.bold,
    fontSize: theme.typography.h3
  },
  feedbackSubtitle: {
    color: theme.colors.textSecondary,
    lineHeight: 21
  },
  success: {
    color: theme.colors.success,
    marginTop: theme.spacing.sm,
    fontWeight: theme.typography.weights.medium
  },
  error: {
    color: theme.colors.fall,
    marginTop: theme.spacing.sm,
    fontWeight: theme.typography.weights.medium
  }
});
