import "react-native-reanimated";
import "react-native-gesture-handler";

import type { ReactNode } from "react";
import { Component } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
// eslint-disable-next-line import/no-duplicates
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useRadarSocket } from "@/hooks/useRadarSocket";
import { theme } from "@/constants/theme";

class RootErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.crashRoot}>
          <Text style={styles.crashTitle}>VitalGuard is recovering</Text>
          <Text style={styles.crashBody}>
            A startup component failed. Restart the app to continue in demo-safe mode.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const AppBootstrap = ({ children }: { children: ReactNode }) => {
  useRadarSocket();
  return <>{children}</>;
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RootErrorBoundary>
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
        </RootErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  crashRoot: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl
  },
  crashTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h2,
    fontWeight: theme.typography.weights.bold,
    marginBottom: theme.spacing.sm,
    textAlign: "center"
  },
  crashBody: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    textAlign: "center",
    lineHeight: 22
  }
});
