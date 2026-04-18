import { ROOM_STATUS } from "@/constants/roomStatus";
import { TelemetryPayload } from "@/types";

export const isFallTelemetry = (payload: TelemetryPayload): boolean => payload.label === ROOM_STATUS.FALL;

export const telemetryHealthScore = (payload: TelemetryPayload): number => {
  const latencyPenalty = Math.min(40, payload.latency_ms / 4);
  const confidenceBonus = payload.confidence * 35;
  const movementPenalty = Math.min(25, payload.me / 8);
  return Math.max(0, Math.min(100, Math.round(70 + confidenceBonus - latencyPenalty - movementPenalty)));
};
