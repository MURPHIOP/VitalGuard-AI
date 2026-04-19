import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

import { config } from "@/constants/config";
import { ROOM_STATUS, RoomStatus } from "@/constants/roomStatus";
import {
  createMockTelemetry,
  getMockRoomIds,
  setAllMockManualStatus,
  setMockManualStatus
} from "@/services/mockData";
import {
  AnomalyHistoryItem,
  ConnectionState,
  FeedbackSubmissionState,
  RoomModel,
  RoomTelemetryPoint,
  TelemetryPayload
} from "@/types";

type AppState = {
  rooms: Record<string, RoomModel>;
  roomOrder: string[];
  history: AnomalyHistoryItem[];
  connectionState: ConnectionState;
  selectedRoomId?: string;
  feedbackStateByRoom: Record<string, FeedbackSubmissionState>;
  bootstrapped: boolean;
  setBootstrapped: (ready: boolean) => void;
  setConnectionState: (state: ConnectionState) => void;
  upsertTelemetry: (payload: TelemetryPayload) => void;
  addHistoryItems: (items: AnomalyHistoryItem[]) => void;
  prependHistoryItem: (item: AnomalyHistoryItem) => void;
  setSelectedRoom: (id?: string) => void;
  markAcknowledged: (roomId: string) => void;
  markRoomsOffline: () => void;
  setFeedbackState: (roomId: string, status: FeedbackSubmissionState) => void;
  setRoomFeedbackResult: (
    roomId: string,
    feedback: "CONFIRMED_FALL" | "FALSE_ALARM",
    anomalyId?: string
  ) => void;
  ensureDemoRooms: () => void;
  forceRoomStatus: (roomId: string, status: RoomStatus) => void;
  forceAllRoomStatuses: (status: RoomStatus) => void;
  injectDemoHistoryFall: (roomId?: string) => void;
  simulateFeedbackSuccess: (roomId?: string) => void;
  simulateReconnect: () => void;
};

const toChartPoint = (payload: TelemetryPayload): RoomTelemetryPoint => ({
  timestamp: new Date(payload.server_ts).getTime(),
  movingEnergy: payload.me,
  stationaryEnergy: payload.se,
  distance: payload.dd,
  confidence: payload.confidence
});

const createEmptyRoom = (payload: TelemetryPayload): RoomModel => ({
  id: payload.roomId,
  label: `Room ${payload.roomId}`,
  status: payload.label,
  latency: payload.latency_ms,
  lastUpdated: payload.server_ts,
  nodeBattery: payload.nodeBattery,
  telemetry: payload,
  chartBuffer: [toChartPoint(payload)],
  alertActive: payload.label === ROOM_STATUS.FALL,
  acknowledged: false
});

const trimBuffer = (buffer: RoomTelemetryPoint[]) =>
  buffer.length > config.chartBufferSize ? buffer.slice(buffer.length - config.chartBufferSize) : buffer;

const makeDemoPayload = (roomId: string, status: RoomStatus): TelemetryPayload => {
  setMockManualStatus(roomId, status, 60000);
  const payload = createMockTelemetry(roomId, status);
  return {
    ...payload,
    label: status,
    confidence:
      status === ROOM_STATUS.FALL
        ? Math.max(0.9, payload.confidence)
        : status === ROOM_STATUS.OFFLINE
          ? Math.min(0.55, payload.confidence)
          : payload.confidence,
    latency_ms: status === ROOM_STATUS.OFFLINE ? 0 : Math.max(32, payload.latency_ms),
    server_ts: new Date().toISOString()
  };
};

export const useAppStore = create<AppState>((set, get) => ({
  rooms: {},
  roomOrder: [],
  history: [],
  connectionState: config.mockMode ? "MOCK" : "CONNECTING",
  selectedRoomId: undefined,
  feedbackStateByRoom: {},
  bootstrapped: false,
  setBootstrapped: (ready) => set({ bootstrapped: ready }),
  setConnectionState: (state) => set({ connectionState: state }),
  setSelectedRoom: (id) => set({ selectedRoomId: id }),
  setFeedbackState: (roomId, status) =>
    set((state) => ({
      feedbackStateByRoom: {
        ...state.feedbackStateByRoom,
        [roomId]: status
      }
    })),
  markAcknowledged: (roomId) =>
    set((state) => {
      const room = state.rooms[roomId];
      if (!room) {
        return state;
      }
      return {
        rooms: {
          ...state.rooms,
          [roomId]: {
            ...room,
            acknowledged: true,
            alertActive: false
          }
        }
      };
    }),
  markRoomsOffline: () =>
    set((state) => ({
      rooms: Object.fromEntries(
        Object.entries(state.rooms).map(([roomId, room]) => [
          roomId,
          {
            ...room,
            status: ROOM_STATUS.OFFLINE,
            telemetry: {
              ...room.telemetry,
              label: ROOM_STATUS.OFFLINE
            }
          }
        ])
      )
    })),
  upsertTelemetry: (payload) =>
    set((state) => {
      const existing = state.rooms[payload.roomId];
      const currentRoom = existing ?? createEmptyRoom(payload);
      const nextPoint = toChartPoint(payload);
      const nextStatusIsFall = payload.label === ROOM_STATUS.FALL;

      const updatedRoom: RoomModel = {
        ...currentRoom,
        status: payload.label,
        latency: payload.latency_ms,
        lastUpdated: payload.server_ts,
        nodeBattery: payload.nodeBattery,
        telemetry: payload,
        chartBuffer: trimBuffer([...currentRoom.chartBuffer, nextPoint]),
        alertActive: nextStatusIsFall ? true : currentRoom.alertActive && !currentRoom.acknowledged,
        acknowledged: nextStatusIsFall ? false : currentRoom.acknowledged
      };

      const isNew = !existing;
      return {
        rooms: {
          ...state.rooms,
          [payload.roomId]: updatedRoom
        },
        roomOrder: isNew ? [...state.roomOrder, payload.roomId] : state.roomOrder
      };
    }),
  addHistoryItems: (items) =>
    set((state) => ({
      history: [...items].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
    })),
  prependHistoryItem: (item) =>
    set((state) => ({
      history: [item, ...state.history].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
    })),
  setRoomFeedbackResult: (roomId, feedback, anomalyId) =>
    set((state) => ({
      history: state.history.map((entry) =>
        ((anomalyId && entry.id === anomalyId) || (!anomalyId && entry.roomId === roomId && entry.feedback === "PENDING"))
          ? { ...entry, feedback }
          : entry
      )
    })),
  ensureDemoRooms: () => {
    const state = get();
    if (state.roomOrder.length > 0) {
      return;
    }

    getMockRoomIds().forEach((roomId) => {
      const payload = makeDemoPayload(roomId, ROOM_STATUS.NORMAL);
      get().upsertTelemetry(payload);
    });

    get().setConnectionState("MOCK");
    get().setBootstrapped(true);
  },
  forceRoomStatus: (roomId, status) => {
    if (!roomId) {
      return;
    }

    const payload = makeDemoPayload(roomId, status);
    get().upsertTelemetry(payload);

    if (status === ROOM_STATUS.FALL) {
      get().prependHistoryItem({
        id: `evt_demo_fall_${roomId}_${Date.now()}`,
        roomId,
        type: ROOM_STATUS.FALL,
        timestamp: payload.server_ts,
        confidence: payload.confidence,
        feedback: "PENDING"
      });
    }

    if (status === ROOM_STATUS.OFFLINE) {
      get().setConnectionState("RECONNECTING");
    }
  },
  forceAllRoomStatuses: (status) => {
    get().ensureDemoRooms();
    setAllMockManualStatus(status, 60000);
    const roomIds = get().roomOrder.length > 0 ? get().roomOrder : getMockRoomIds();
    roomIds.forEach((roomId) => {
      get().forceRoomStatus(roomId, status);
    });
  },
  injectDemoHistoryFall: (roomId) => {
    get().ensureDemoRooms();
    const targetRoomId = roomId ?? get().roomOrder[0] ?? getMockRoomIds()[0];
    const payload = makeDemoPayload(targetRoomId, ROOM_STATUS.FALL);
    get().upsertTelemetry(payload);
    get().prependHistoryItem({
      id: `evt_demo_injected_${targetRoomId}_${Date.now()}`,
      roomId: targetRoomId,
      type: ROOM_STATUS.FALL,
      timestamp: payload.server_ts,
      confidence: payload.confidence,
      feedback: "PENDING"
    });
  },
  simulateFeedbackSuccess: (roomId) => {
    get().ensureDemoRooms();
    const targetRoomId = roomId ?? get().roomOrder[0] ?? getMockRoomIds()[0];
    const pending = get()
      .history.find((item) => item.roomId === targetRoomId && item.feedback === "PENDING" && item.type === ROOM_STATUS.FALL);

    if (!pending) {
      get().injectDemoHistoryFall(targetRoomId);
    }

    const resolved = get()
      .history.find((item) => item.roomId === targetRoomId && item.feedback === "PENDING" && item.type === ROOM_STATUS.FALL);

    if (resolved) {
      get().setRoomFeedbackResult(targetRoomId, "CONFIRMED_FALL", resolved.id);
    }

    get().setFeedbackState(targetRoomId, "success");
  },
  simulateReconnect: () => {
    get().setConnectionState("RECONNECTING");
    setTimeout(() => {
      const current = get().connectionState;
      if (current === "RECONNECTING") {
        get().setConnectionState("CONNECTED");
      }
    }, 1200);
  }
}));

export const useRooms = () =>
  useAppStore(
    useShallow((state) => state.roomOrder.map((id) => state.rooms[id]).filter(Boolean))
  );

export const useRoomById = (id: string) => useAppStore((state) => state.rooms[id]);

export const useCriticalCount = () =>
  useAppStore((state) => Object.values(state.rooms).filter((room) => room.status === ROOM_STATUS.FALL).length);

export const useConnectedCount = () =>
  useAppStore((state) => Object.values(state.rooms).filter((room) => room.latency > 0 && room.latency < 250).length);

export const getStoreSnapshot = () => useAppStore.getState();
