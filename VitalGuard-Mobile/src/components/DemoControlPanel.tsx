import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { config } from "@/constants/config";
import { ROOM_STATUS, RoomStatus } from "@/constants/roomStatus";
import { theme } from "@/constants/theme";
import { useAppStore } from "@/store/appStore";

import { GlassButton } from "./GlassButton";
import { GlassCard } from "./GlassCard";

const STATE_BUTTONS: { label: string; status: RoomStatus; variant: "primary" | "ghost" | "danger" }[] = [
  { label: "Normal", status: ROOM_STATUS.NORMAL, variant: "primary" },
  { label: "Empty", status: ROOM_STATUS.EMPTY, variant: "ghost" },
  { label: "Fall", status: ROOM_STATUS.FALL, variant: "danger" },
  { label: "Offline", status: ROOM_STATUS.OFFLINE, variant: "ghost" }
];

export const DemoControlPanel = () => {
  const [open, setOpen] = useState(false);

  const roomOrder = useAppStore((state) => state.roomOrder);
  const ensureDemoRooms = useAppStore((state) => state.ensureDemoRooms);
  const demoDataMode = useAppStore((state) => state.demoDataMode);
  const setDemoDataMode = useAppStore((state) => state.setDemoDataMode);
  const forceAllRoomStatuses = useAppStore((state) => state.forceAllRoomStatuses);
  const simulateReconnect = useAppStore((state) => state.simulateReconnect);
  const injectDemoHistoryFall = useAppStore((state) => state.injectDemoHistoryFall);
  const simulateFeedbackSuccess = useAppStore((state) => state.simulateFeedbackSuccess);

  const activeRoomLabel = useMemo(() => roomOrder[0] ?? "401", [roomOrder]);

  if (!config.demoControlsEnabled) {
    return null;
  }

  return (
    <GlassCard style={styles.card} glow="none">
      <Pressable style={styles.headerRow} onPress={() => setOpen((value) => !value)}>
        <Text style={styles.title}>Demo Controls</Text>
        <Text style={styles.toggle}>{open ? "HIDE" : "SHOW"}</Text>
      </Pressable>
      {open ? (
        <View style={styles.content}>
          <Text style={styles.caption}>
            Demo-safe controls for class presentation. Active room target: {activeRoomLabel}
          </Text>

          <Text style={styles.sectionLabel}>Mode</Text>
          <View style={styles.grid}>
            <GlassButton
              title={demoDataMode === "MOCK" ? "MOCK MODE ON" : "MOCK MODE"}
              variant={demoDataMode === "MOCK" ? "primary" : "ghost"}
              onPress={() => {
                setDemoDataMode("MOCK");
                ensureDemoRooms();
              }}
            />
            <GlassButton
              title={demoDataMode === "RANDOMIZER" ? "RANDOMISER ON" : "RANDOMISER"}
              variant={demoDataMode === "RANDOMIZER" ? "primary" : "ghost"}
              onPress={() => {
                setDemoDataMode("RANDOMIZER");
              }}
            />
          </View>

          <Text style={styles.sectionLabel}>Scene</Text>
          <View style={styles.wrapGrid}>
            {STATE_BUTTONS.map((item) => (
              <View key={item.label} style={styles.halfButton}>
                <GlassButton
                  title={item.label}
                  variant={item.variant}
                  onPress={() => {
                    ensureDemoRooms();
                    forceAllRoomStatuses(item.status);
                  }}
                />
              </View>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Actions</Text>
          <View style={styles.wrapGrid}>
            <View style={styles.halfButton}>
              <GlassButton
                title="Reconnect"
                variant="ghost"
                onPress={() => {
                  ensureDemoRooms();
                  simulateReconnect();
                }}
              />
            </View>
            <View style={styles.halfButton}>
              <GlassButton
                title="Add Fall"
                variant="danger"
                onPress={() => {
                  ensureDemoRooms();
                  injectDemoHistoryFall();
                }}
              />
            </View>
          </View>

          <View style={styles.wrapGrid}>
            <View style={styles.halfButton}>
              <GlassButton
                title="Feedback Success"
                variant="primary"
                onPress={() => {
                  ensureDemoRooms();
                  simulateFeedbackSuccess();
                }}
              />
            </View>
          </View>
        </View>
      ) : null}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.title,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 0.25
  },
  toggle: {
    color: theme.colors.empty,
    fontSize: theme.typography.caption,
    letterSpacing: 1,
    fontWeight: theme.typography.weights.semibold
  },
  content: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm
  },
  caption: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    lineHeight: 18
  },
  sectionLabel: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 2
  },
  grid: {
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  wrapGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  halfButton: {
    width: "48%"
  }
});
