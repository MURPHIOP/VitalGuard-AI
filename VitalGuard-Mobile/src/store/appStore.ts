import { create } from "zustand";

import { config } from "@/constants/config";
import { ROOM_STATUS } from "@/constants/roomStatus";
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
    }))
}));

export const useRooms = () =>
  useAppStore((state) => state.roomOrder.map((id) => state.rooms[id]).filter(Boolean));

export const useRoomById = (id: string) => useAppStore((state) => state.rooms[id]);

export const useCriticalCount = () =>
  useAppStore((state) => Object.values(state.rooms).filter((room) => room.status === ROOM_STATUS.FALL).length);

export const useConnectedCount = () =>
  useAppStore((state) => Object.values(state.rooms).filter((room) => room.latency > 0 && room.latency < 250).length);

export const getStoreSnapshot = () => useAppStore.getState();
