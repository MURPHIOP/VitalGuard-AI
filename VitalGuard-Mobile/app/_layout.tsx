import "react-native-reanimated";

import { ReactNode } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useRadarSocket } from "@/hooks/useRadarSocket";

const AppBootstrap = ({ children }: { children: ReactNode }) => {
  useRadarSocket();
  return <>{children}</>;
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppBootstrap>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "fade"
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="history" />
            <Stack.Screen name="room/[id]" />
          </Stack>
        </AppBootstrap>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
