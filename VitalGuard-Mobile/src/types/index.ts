import { RoomStatus } from "@/constants/roomStatus";

export type TelemetryPayload = {
  roomId: string;
  label: RoomStatus;
  ms: number;
  me: number;
  ss: number;
  se: number;
  dd: number;
  confidence: number;
  server_ts: string;
  latency_ms: number;
  nodeBattery?: number;
};

export type HistoryFeedback = "PENDING" | "CONFIRMED_FALL" | "FALSE_ALARM";

export type AnomalyHistoryItem = {
  id: string;
  roomId: string;
  type: RoomStatus;
  timestamp: string;
  confidence: number;
  feedback: HistoryFeedback;
};

export type RoomTelemetryPoint = {
  timestamp: number;
  movingEnergy: number;
  stationaryEnergy: number;
  distance: number;
  confidence: number;
};

export type RoomModel = {
  id: string;
  label: string;
  status: RoomStatus;
  latency: number;
  lastUpdated: string;
  nodeBattery?: number;
  telemetry: TelemetryPayload;
  chartBuffer: RoomTelemetryPoint[];
  alertActive: boolean;
  acknowledged: boolean;
};

export type ConnectionState = "CONNECTING" | "CONNECTED" | "RECONNECTING" | "DISCONNECTED" | "MOCK";

export type SocketEvent =
  | { type: "telemetry"; payload: TelemetryPayload }
  | { type: "alert"; payload: AlertPayload }
  | { type: "error"; payload: string }
  | { type: "connection"; payload: ConnectionState };

export type AlertPayload = {
  event: "FALL";
  roomId: string;
  confidence: number;
  timestamp: string;
  anomalyId: string;
};

export type FeedbackPayload = {
  roomId: string;
  event: "FALL";
  feedback: "CONFIRMED_FALL" | "FALSE_ALARM";
  timestamp: string;
  anomalyId?: string;
};

export type FeedbackSubmissionState = "idle" | "loading" | "success" | "error";
