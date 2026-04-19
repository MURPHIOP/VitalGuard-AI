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

const envApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const envSocketUrl = process.env.EXPO_PUBLIC_SOCKET_URL?.trim();
const envAppMode = process.env.EXPO_PUBLIC_APP_MODE?.trim().toUpperCase();
const envMockMode = process.env.EXPO_PUBLIC_MOCK_MODE?.trim().toLowerCase();
const envAllowLocalhost = process.env.EXPO_PUBLIC_ALLOW_LOCALHOST?.trim().toLowerCase();
const envDemoControls = process.env.EXPO_PUBLIC_DEMO_CONTROLS?.trim().toLowerCase();

const ensureWsClientsPath = (value: string) => {
  const normalized = normalizeUrl(value);
  if (/\/ws\/clients$/i.test(normalized)) {
    return normalized;
  }
  return `${normalized}/ws/clients`;
};

const deriveSocketUrl = (apiBaseUrl: string) => {
  const normalized = normalizeUrl(apiBaseUrl);
  if (/^https:\/\//i.test(normalized)) {
    return ensureWsClientsPath(normalized.replace(/^https:/i, "wss:"));
  }
  if (/^http:\/\//i.test(normalized)) {
    return ensureWsClientsPath(normalized.replace(/^http:/i, "ws:"));
  }
  if (/^wss?:\/\//i.test(normalized)) {
    return ensureWsClientsPath(normalized);
  }

  return ensureWsClientsPath(`ws://${normalized}`);
};

const normalizeSocketUrl = (socketUrl: string, apiBaseUrl: string) => {
  const normalized = ensureWsClientsPath(socketUrl);
  if (/^https:\/\//i.test(apiBaseUrl) && normalized.startsWith("ws://")) {
    return normalized.replace(/^ws:/i, "wss:");
  }
  if (/^http:\/\//i.test(apiBaseUrl) && normalized.startsWith("wss://")) {
    return normalized.replace(/^wss:/i, "ws:");
  }
  return normalized;
};

const fallbackApiBaseUrl = "https://vitalguard-ai-1.onrender.com";
const resolvedApiBaseUrl = normalizeUrl(envApiBaseUrl ?? extra.apiBaseUrl ?? fallbackApiBaseUrl);
const appMode: AppMode = (envAppMode === "MOCK" ? "MOCK" : envAppMode === "LIVE" ? "LIVE" : extra.appMode ?? (extra.mockMode ? "MOCK" : "LIVE")) as AppMode;
const fallbackSocketUrl = deriveSocketUrl(resolvedApiBaseUrl);
const resolvedSocketUrl = envSocketUrl
  ? normalizeSocketUrl(envSocketUrl, resolvedApiBaseUrl)
  : normalizeSocketUrl(extra.socketUrl ?? fallbackSocketUrl, resolvedApiBaseUrl);
const allowLocalhost = envAllowLocalhost ? envAllowLocalhost === "true" : Boolean(extra.allowLocalhost);
const mockMode = envMockMode ? envMockMode === "true" : appMode === "MOCK";
const demoControlsEnabled = envDemoControls ? envDemoControls === "true" : true;

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
  mockMode,
  demoControlsEnabled,
  chartBufferSize: 120,
  heartbeatTimeoutMs: 15000,
  reconnectBaseDelayMs: 800,
  reconnectMaxDelayMs: 12000,
  historyEndpoint: "/api/history",
  feedbackEndpoint: "/api/feedback"
};
