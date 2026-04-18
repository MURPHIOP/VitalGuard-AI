import Constants from "expo-constants";

type AppMode = "LIVE" | "MOCK";

type ExtraConfig = {
  apiBaseUrl?: string;
  socketUrl?: string;
  appMode?: AppMode;
  mockMode?: boolean;
  allowLocalhost?: boolean;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;

const normalizeUrl = (value: string) => value.trim().replace(/\/+$/, "");

const isLoopback = (value: string) => /localhost|127\.0\.0\.1/.test(value);

const ensureWsClientsPath = (value: string) => {
  const normalized = normalizeUrl(value);
  if (/\/ws\/clients$/i.test(normalized)) {
    return normalized;
  }
  return `${normalized}/ws/clients`;
};

const fallbackApiBaseUrl = "http://192.168.29.225:8000";
const resolvedApiBaseUrl = normalizeUrl(extra.apiBaseUrl ?? fallbackApiBaseUrl);
const appMode: AppMode = extra.appMode ?? (extra.mockMode ? "MOCK" : "LIVE");
const fallbackSocketUrl = ensureWsClientsPath(resolvedApiBaseUrl.replace(/^http/i, "ws"));
const resolvedSocketUrl = ensureWsClientsPath(extra.socketUrl ?? fallbackSocketUrl);
const allowLocalhost = Boolean(extra.allowLocalhost);

if (appMode === "LIVE" && !allowLocalhost && (isLoopback(resolvedApiBaseUrl) || isLoopback(resolvedSocketUrl))) {
  console.warn(
    "[VitalGuard config] LIVE mode is using localhost/127.0.0.1. Use a LAN IP for physical devices or set extra.allowLocalhost=true for simulator-only testing."
  );
}

export const config = {
  // LIVE reads telemetry from backend APIs and /ws/clients; MOCK runs deterministic simulator streams.
  appMode,
  apiBaseUrl: resolvedApiBaseUrl,
  socketUrl: resolvedSocketUrl,
  mockMode: appMode === "MOCK",
  chartBufferSize: 120,
  heartbeatTimeoutMs: 15000,
  reconnectBaseDelayMs: 800,
  reconnectMaxDelayMs: 12000,
  historyEndpoint: "/api/history",
  feedbackEndpoint: "/api/feedback"
};
