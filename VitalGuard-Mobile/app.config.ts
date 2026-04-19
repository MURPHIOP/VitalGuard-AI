import type { ConfigContext, ExpoConfig } from "expo/config";

type ExtraConfig = {
  apiBaseUrl?: string;
  socketUrl?: string;
  appMode?: string;
  mockMode?: boolean;
  allowLocalhost?: boolean;
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const extra = (config.extra ?? {}) as ExtraConfig;

  return {
    name: "VITALGUARD AI",
    slug: "vitalguard-ai",
    scheme: "vitalguard",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "dark",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ededed"
    },
    newArchEnabled: false,
    assetBundlePatterns: ["**/*"],
    android: {
      package: "com.murphiop.vitalguardai",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ededed"
      }
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.murphiop.vitalguardai",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    plugins: ["expo-router"],
    experiments: { typedRoutes: true },
    extra: {
      ...extra,
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? extra.apiBaseUrl,
      socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL ?? extra.socketUrl,
      appMode: process.env.EXPO_PUBLIC_APP_MODE ?? extra.appMode ?? "LIVE",
      mockMode: process.env.EXPO_PUBLIC_MOCK_MODE
        ? process.env.EXPO_PUBLIC_MOCK_MODE === "true"
        : extra.mockMode ?? false,
      allowLocalhost: process.env.EXPO_PUBLIC_ALLOW_LOCALHOST
        ? process.env.EXPO_PUBLIC_ALLOW_LOCALHOST === "true"
        : extra.allowLocalhost ?? false,
      router: {},
      eas: {
        projectId: "0e4d99bd-2042-4d33-98ad-7ef7df757692",
      },
    },
  };
};