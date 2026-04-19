import { config } from "@/constants/config";
import { ROOM_STATUS, RoomStatus } from "@/constants/roomStatus";
import { AlertPayload, ConnectionState, TelemetryPayload } from "@/types";

type RoomWire = {
  roomId: string;
  label: string;
  confidence: number;
  lastUpdate: string;
  latencyMs: number;
  connectivity: string;
  nodeBattery?: number;
  latestTelemetry?: TelemetryWire;
};

type TelemetryWire = {
  roomId: string;
  ts: number;
  ms: number;
  me: number;
  ss: number;
  se: number;
  dd: number;
  nodeBattery?: number;
  label: string;
  confidence: number;
  server_ts: string;
  latency_ms: number;
};

type WsEnvelope =
  | { type: "bootstrap"; payload: { rooms: RoomWire[] } }
  | { type: "room_update"; payload: { room?: RoomWire; telemetry?: TelemetryWire } }
  | { type: "alert"; payload: AlertPayload }
  | { type: "system"; payload?: { rooms?: RoomWire[]; kind?: string } };

type ListenerMap = {
  telemetry: (payload: TelemetryPayload) => void;
  alert: (payload: AlertPayload) => void;
  connection: (state: ConnectionState) => void;
  error: (message: string) => void;
};

type ListenerType = keyof ListenerMap;

const normalizeStatus = (value: string | undefined, connectivity?: string): RoomStatus => {
  if (String(connectivity ?? "").toUpperCase() === "OFFLINE") {
    return ROOM_STATUS.OFFLINE;
  }

  const normalized = String(value ?? "").toUpperCase();
  if (normalized === ROOM_STATUS.NORMAL) {
    return ROOM_STATUS.NORMAL;
  }
  if (normalized === ROOM_STATUS.EMPTY) {
    return ROOM_STATUS.EMPTY;
  }
  if (normalized === ROOM_STATUS.FALL) {
    return ROOM_STATUS.FALL;
  }
  if (normalized === ROOM_STATUS.OFFLINE) {
    return ROOM_STATUS.OFFLINE;
  }

  return ROOM_STATUS.NORMAL;
};

class RadarSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private shouldReconnect = true;
  private listeners: { [K in ListenerType]: Set<ListenerMap[K]> } = {
    telemetry: new Set(),
    alert: new Set(),
    connection: new Set(),
    error: new Set()
  };

  connect() {
    this.shouldReconnect = true;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.emit("connection", this.reconnectAttempts > 0 ? "RECONNECTING" : "CONNECTING");

    try {
      this.ws = new WebSocket(config.socketUrl);
    } catch {
      this.ws = null;
      this.emit("error", "WebSocket URL is invalid.");
      this.emit("connection", "RECONNECTING");
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.emit("connection", "CONNECTED");
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      try {
        const raw = String(event.data ?? "").trim();
        if (!raw || raw === "ping" || raw === "pong") {
          return;
        }

        const parsed = JSON.parse(raw) as WsEnvelope;

        if (parsed.type === "bootstrap") {
          (parsed.payload.rooms ?? []).forEach((room) => {
            const normalized = this.normalizeTelemetry(room, room.latestTelemetry);
            if (normalized) {
              this.emit("telemetry", normalized);
            }
          });
          return;
        }

        if (parsed.type === "room_update") {
          const normalized = this.normalizeTelemetry(parsed.payload.room, parsed.payload.telemetry);
          if (!normalized) {
            this.emit("error", "Malformed room update received.");
            return;
          }
          this.emit("telemetry", normalized);
          return;
        }

        if (parsed.type === "system") {
          (parsed.payload?.rooms ?? []).forEach((room) => {
            const normalized = this.normalizeTelemetry(room, room.latestTelemetry);
            if (normalized) {
              this.emit("telemetry", normalized);
            }
          });
          return;
        }

        if (parsed.type === "alert") {
          this.emit("alert", parsed.payload);
          return;
        }

        this.emit("error", "Unsupported websocket message type.");
      } catch {
        this.emit("error", "Failed to parse websocket payload.");
      }
    };

    this.ws.onerror = () => {
      this.emit("error", "WebSocket error encountered.");
    };

    this.ws.onclose = () => {
      this.stopHeartbeat();
      this.ws = null;
      if (this.shouldReconnect) {
        this.emit("connection", "RECONNECTING");
        this.scheduleReconnect();
      } else {
        this.emit("connection", "DISCONNECTED");
      }
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.emit("connection", "DISCONNECTED");
  }

  restart() {
    this.shouldReconnect = true;
    this.connect();
  }

  on<T extends ListenerType>(type: T, callback: ListenerMap[T]) {
    this.listeners[type].add(callback as never);
    return () => {
      this.listeners[type].delete(callback as never);
    };
  }

  private emit<T extends ListenerType>(type: T, payload: Parameters<ListenerMap[T]>[0]) {
    this.listeners[type].forEach((callback) => {
      callback(payload as never);
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.reconnectAttempts += 1;
    const delay = Math.min(
      config.reconnectBaseDelayMs * 2 ** (this.reconnectAttempts - 1),
      config.reconnectMaxDelayMs
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send("ping");
      }
    }, 10000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private normalizeTelemetry(room?: RoomWire, telemetry?: TelemetryWire): TelemetryPayload | null {
    const source = telemetry ?? room?.latestTelemetry;
    if (!source) {
      return null;
    }

    const status = normalizeStatus(room?.label ?? source.label, room?.connectivity);

    return {
      roomId: room?.roomId ?? source.roomId,
      label: status,
      ms: Number(source.ms),
      me: Number(source.me),
      ss: Number(source.ss),
      se: Number(source.se),
      dd: Number(source.dd),
      confidence: Number(room?.confidence ?? source.confidence ?? 0),
      server_ts: String(source.server_ts ?? room?.lastUpdate),
      latency_ms: Number(source.latency_ms ?? room?.latencyMs ?? 0),
      nodeBattery: source.nodeBattery ?? room?.nodeBattery
    };
  }
}

export const radarSocket = new RadarSocketClient();
