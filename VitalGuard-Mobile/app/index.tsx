import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeIn, useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { History } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { FleetHeader } from "@/components/FleetHeader";
import { ParallaxContainer } from "@/components/ParallaxContainer";
import { RoomCard } from "@/components/RoomCard";
import { ScreenBackground } from "@/components/ScreenBackground";
import { SectionHeader } from "@/components/SectionHeader";
import { ROOM_STATUS } from "@/constants/roomStatus";
import { theme } from "@/constants/theme";
import { useRooms } from "@/store/appStore";

export default function FleetScreen() {
  const router = useRouter();
  const rooms = useRooms();
  const scrollY = useSharedValue(0);

  const hasFall = useMemo(() => rooms.some((room) => room.status === ROOM_STATUS.FALL), [rooms]);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  return (
    <View style={styles.flex}>
      <ScreenBackground status={hasFall ? ROOM_STATUS.FALL : ROOM_STATUS.NORMAL} />
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <Animated.ScrollView
          entering={FadeIn.duration(300)}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <ParallaxContainer scrollY={scrollY} depth={0.07}>
            <FleetHeader />
          </ParallaxContainer>

          <View style={styles.sectionRow}>
            <SectionHeader title="Live Room Fleet" subtitle="Tap a room for deep telemetry" />
            <Pressable style={styles.historyBtn} onPress={() => router.push("/history")}>
              <History size={16} color={theme.colors.textPrimary} />
              <Text style={styles.historyText}>History</Text>
            </Pressable>
          </View>

          {rooms.length === 0 ? (
            <EmptyState
              title="Awaiting Telemetry"
              message="Room stream is initializing. Switch to mock mode or validate backend socket feed."
            />
          ) : (
            <View style={styles.list}>
              {rooms.map((room, index) => (
                <RoomCard room={room} index={index} key={room.id} />
              ))}
            </View>
          )}
        </Animated.ScrollView>
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
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: theme.spacing.md + 2
  },
  historyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "rgba(190, 226, 255, 0.26)",
    borderRadius: theme.radius.pill,
    backgroundColor: "rgba(255,255,255,0.07)"
  },
  historyText: {
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
    fontSize: theme.typography.label,
    letterSpacing: 0.2
  },
  list: {
    gap: theme.spacing.md + 2
  }
});
