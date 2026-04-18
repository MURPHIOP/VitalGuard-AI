import { useCallback, useEffect, useRef } from "react";

import { config } from "@/constants/config";
import { ROOM_STATUS, RoomStatus } from "@/constants/roomStatus";
import { fetchHistory, fetchRooms, RoomWire } from "@/services/api";
import { radarSocket } from "@/services/socket";
import { useAppStore } from "@/store/appStore";

import { useHaptics } from "./useHaptics";
import { useMockTelemetry } from "./useMockTelemetry";

export const useRadarSocket = () => {
  const upsertTelemetry = useAppStore((state) => state.upsertTelemetry);
  const setConnectionState = useAppStore((state) => state.setConnectionState);
  const addHistoryItems = useAppStore((state) => state.addHistoryItems);
  const prependHistoryItem = useAppStore((state) => state.prependHistoryItem);
  const setBootstrapped = useAppStore((state) => state.setBootstrapped);
  const markRoomsOffline = useAppStore((state) => state.markRoomsOffline);
  const { triggerFall, triggerReconnect } = useHaptics();
  const previousConnection = useRef<string>("DISCONNECTED");
  const previousLabels = useRef<Record<string, string>>({});
  const lastFallSignalAt = useRef<Record<string, number>>({});
  const shouldUseMock = config.mockMode;

  useMockTelemetry(shouldUseMock);

  const triggerFallOnce = useCallback(
    (roomId: string) => {
      const now = Date.now();
      const last = lastFallSignalAt.current[roomId] ?? 0;
      if (now - last < 1500) {
        return;
      }
      lastFallSignalAt.current[roomId] = now;
      void triggerFall();
    },
    [triggerFall]
  );

  const roomToTelemetry = (room: RoomWire) => {
    const latest = room.latestTelemetry;
    const rawStatus = String(room.label ?? latest?.label ?? ROOM_STATUS.NORMAL).toUpperCase();
    const isOffline = String(room.connectivity ?? "").toUpperCase() === "OFFLINE";
    const status: RoomStatus =
      isOffline || rawStatus === ROOM_STATUS.OFFLINE
        ? ROOM_STATUS.OFFLINE
        : rawStatus === ROOM_STATUS.EMPTY
          ? ROOM_STATUS.EMPTY
          : rawStatus === ROOM_STATUS.FALL
            ? ROOM_STATUS.FALL
            : ROOM_STATUS.NORMAL;

    return {
      roomId: room.roomId,
      label: status,
      ms: Number(latest?.ms ?? latest?.dd ?? 0),
      me: Number(latest?.me ?? 0),
      ss: Number(latest?.ss ?? 0),
      se: Number(latest?.se ?? 0),
      dd: Number(latest?.dd ?? 0),
      confidence: Number(room.confidence ?? latest?.confidence ?? 0),
      server_ts: String(latest?.server_ts ?? room.lastUpdate),
      latency_ms: Number(latest?.latency_ms ?? room.latencyMs ?? 0),
      nodeBattery: latest?.nodeBattery ?? room.nodeBattery
    };
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrapHistory = async () => {
      if (shouldUseMock) {
        setBootstrapped(true);
        return;
      }

      try {
        const [historyResponse, roomsResponse] = await Promise.all([fetchHistory(), fetchRooms()]);

        if (isMounted) {
          roomsResponse.forEach((room) => upsertTelemetry(roomToTelemetry(room)));
          addHistoryItems(historyResponse);
        }
      } catch {
        if (isMounted) {
          addHistoryItems([]);
        }
      } finally {
        if (isMounted) {
          setBootstrapped(true);
        }
      }
    };

    void bootstrapHistory();

    if (shouldUseMock) {
      return () => {
        isMounted = false;
      };
    }

    const offTelemetry = radarSocket.on("telemetry", (payload) => {
      upsertTelemetry(payload);
      const previous = previousLabels.current[payload.roomId];
      previousLabels.current[payload.roomId] = payload.label;

      if (previous !== ROOM_STATUS.FALL && payload.label === ROOM_STATUS.FALL) {
        triggerFallOnce(payload.roomId);
      }
    });

    const offAlert = radarSocket.on("alert", (alert) => {
      const existing = useAppStore.getState().history.some((item) => item.id === alert.anomalyId);
      if (!existing) {
        prependHistoryItem({
          id: alert.anomalyId,
          roomId: alert.roomId,
          type: ROOM_STATUS.FALL,
          timestamp: alert.timestamp,
          confidence: alert.confidence,
          feedback: "PENDING"
        });
      }
      triggerFallOnce(alert.roomId);
    });

    const offConnection = radarSocket.on("connection", (state) => {
      if (previousConnection.current === "RECONNECTING" && state === "CONNECTED") {
        void triggerReconnect();
      }

      if (state === "RECONNECTING" || state === "DISCONNECTED") {
        markRoomsOffline();
      }

      previousConnection.current = state;
      setConnectionState(state);
    });

    const offError = radarSocket.on("error", () => {
      markRoomsOffline();
      setConnectionState("RECONNECTING");
    });

    radarSocket.connect();

    return () => {
      isMounted = false;
      offTelemetry();
      offAlert();
      offConnection();
      offError();
      radarSocket.disconnect();
    };
  }, [addHistoryItems, markRoomsOffline, prependHistoryItem, setBootstrapped, setConnectionState, shouldUseMock, triggerFallOnce, triggerReconnect, upsertTelemetry]);
};
