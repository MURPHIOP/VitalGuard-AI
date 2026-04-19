import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";

import { ROOM_STATUS, RoomStatus } from "@/constants/roomStatus";
import { createInitialMockHistory, createMockTelemetry, getMockRoomIds } from "@/services/mockData";
import { useAppStore } from "@/store/appStore";

import { useHaptics } from "./useHaptics";

export const useMockTelemetry = (enabled: boolean) => {
  const upsertTelemetry = useAppStore((state) => state.upsertTelemetry);
  const prependHistoryItem = useAppStore((state) => state.prependHistoryItem);
  const addHistoryItems = useAppStore((state) => state.addHistoryItems);
  const setConnectionState = useAppStore((state) => state.setConnectionState);
  const setBootstrapped = useAppStore((state) => state.setBootstrapped);
  const { triggerFall } = useHaptics();

  const statusesRef = useRef<Record<string, RoomStatus>>({});
  const lastFallSignalAt = useRef<Record<string, number>>({});

  const triggerFallOnce = useCallback(
    (roomId: string) => {
      const now = Date.now();
      const last = lastFallSignalAt.current[roomId] ?? 0;
      if (now - last < 1600) {
        return;
      }
      lastFallSignalAt.current[roomId] = now;
      void triggerFall();
    },
    [triggerFall]
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    setConnectionState("MOCK");
    addHistoryItems(createInitialMockHistory());

    const roomIds = getMockRoomIds();
    roomIds.forEach((roomId) => {
      statusesRef.current[roomId] = ROOM_STATUS.NORMAL;
      const payload = createMockTelemetry(roomId, ROOM_STATUS.NORMAL);
      statusesRef.current[roomId] = payload.label;
      upsertTelemetry(payload);
    });

    setBootstrapped(true);

    const tickIntervalMs = Platform.OS === "ios" ? 1300 : 1000;

    const interval = setInterval(() => {
      roomIds.forEach((roomId) => {
        const payload = createMockTelemetry(roomId, statusesRef.current[roomId]);
        const wasFall = statusesRef.current[roomId] === ROOM_STATUS.FALL;
        statusesRef.current[roomId] = payload.label;

        upsertTelemetry(payload);

        if (!wasFall && payload.label === ROOM_STATUS.FALL) {
          triggerFallOnce(roomId);
          prependHistoryItem({
            id: `evt_mock_${roomId}_${Date.now()}`,
            roomId,
            type: ROOM_STATUS.FALL,
            timestamp: payload.server_ts,
            confidence: payload.confidence,
            feedback: "PENDING"
          });
        }
      });
    }, tickIntervalMs);

    return () => {
      clearInterval(interval);
    };
  }, [addHistoryItems, enabled, prependHistoryItem, setBootstrapped, setConnectionState, triggerFallOnce, upsertTelemetry]);
};
