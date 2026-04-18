import axios from "axios";

import { config } from "@/constants/config";
import { AnomalyHistoryItem, FeedbackPayload } from "@/types";

type HistoryResponse = {
  history: AnomalyHistoryItem[];
  count: number;
};

export type RoomWire = {
  roomId: string;
  label: string;
  confidence: number;
  lastUpdate: string;
  latencyMs: number;
  connectivity: string;
  nodeBattery?: number;
  latestTelemetry?: {
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
};

type RoomsResponse = {
  rooms: RoomWire[];
  count: number;
};

const api = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 10000
});

export const fetchHistory = async (): Promise<AnomalyHistoryItem[]> => {
  const { data } = await api.get<HistoryResponse>(config.historyEndpoint);
  return data.history ?? [];
};

export const fetchRooms = async (): Promise<RoomWire[]> => {
  const { data } = await api.get<RoomsResponse>("/api/rooms");
  return data.rooms ?? [];
};

export const submitFeedback = async (
  payload: FeedbackPayload
): Promise<{ ok: true; feedback?: { anomalyId?: string } }> => {
  const { data } = await api.post<{ ok: true; feedback?: { anomalyId?: string } }>(
    config.feedbackEndpoint,
    payload
  );
  return data;
};

export default api;
