# VITALGUARD AI

VITALGUARD AI is a premium Expo React Native healthcare monitoring dashboard designed for privacy-preserving, zero-camera, zero-wearable real-time fall detection using mmWave radar edge nodes.

The app supports real-time telemetry, emergency fall escalation, anomaly history, and caregiver feedback to improve model quality while preserving patient privacy.

## Core Capabilities

- Multi-room fleet monitoring dashboard with live room status
- Real-time room detail telemetry and emergency presentation mode
- History timeline with filter chips and feedback states
- Auto-reconnecting WebSocket ingestion with exponential backoff
- REST-based false alarm / confirmed fall feedback submission
- Haptic system for fall alerts, reconnect, and success confirmation
- Full offline-safe mock telemetry mode for demos and development

## Architecture Summary

- Expo Router app shell in [app](app)
- Domain types in [src/types/index.ts](src/types/index.ts)
- Centralized global state with Zustand in [src/store/appStore.ts](src/store/appStore.ts)
- Socket service with reconnection strategy in [src/services/socket.ts](src/services/socket.ts)
- HTTP service layer in [src/services/api.ts](src/services/api.ts)
- Mock telemetry engine in [src/services/mockData.ts](src/services/mockData.ts)
- Reusable premium glass + motion components in [src/components](src/components)
- Screen-level orchestration in [app/index.tsx](app/index.tsx), [app/room/[id].tsx](app/room/[id].tsx), and [app/history.tsx](app/history.tsx)

## Stack

- React Native + Expo
- Expo Router
- TypeScript
- React Native Reanimated
- React Native Gesture Handler
- Expo Blur
- Expo Linear Gradient
- Expo Haptics
- React Native Safe Area Context
- Lucide React Native
- Axios
- Native WebSocket
- react-native-svg
- Zustand
- expo-status-bar

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the Expo dev server:

```bash
npm run start
```

3. Run on iOS simulator:

```bash
npm run ios
```

4. Run on Android emulator:

```bash
npm run android
```

## Environment and Configuration

Configuration is controlled in [app.json](app.json) under `expo.extra`:

- `apiBaseUrl`: HTTP backend base URL
- `socketUrl`: WebSocket telemetry endpoint
- `mockMode`: mock data toggle

Runtime configuration constants are defined in [src/constants/config.ts](src/constants/config.ts).

## Mock Mode

Set `expo.extra.mockMode` in [app.json](app.json):

- `true`: uses local telemetry simulation with multi-room status changes
- `false`: uses backend socket + API integration

Mock mode supports realistic transitions including occasional FALL states and history generation.

## WebSocket Integration

Socket logic is implemented in [src/services/socket.ts](src/services/socket.ts) and bootstrapped via [src/hooks/useRadarSocket.ts](src/hooks/useRadarSocket.ts).

Behavior:

- Connects on app boot
- Parses telemetry payloads with malformed payload safeguards
- Emits connection states (`CONNECTING`, `CONNECTED`, `RECONNECTING`, `DISCONNECTED`)
- Auto-reconnects with exponential backoff
- Cleans up listeners and sockets on unmount

Incoming telemetry is normalized into Zustand state buffers for chart rendering and room snapshots.

## Feedback Loop

Room detail screen exposes caregiver feedback when a FALL state is active.

Endpoint:

- `POST /api/feedback`

Payload structure:

```json
{
  "roomId": "401",
  "event": "FALL",
  "feedback": "FALSE_ALARM",
  "timestamp": "2026-04-17T12:00:00Z"
}
```

UI provides loading, success, and error states and updates local history feedback when submission succeeds.

## Design System Notes

The dark premium design system is centralized in [src/constants/theme.ts](src/constants/theme.ts):

- Layered gradients
- Glassmorphic card surfaces and border tints
- Alert-specific glow and emergency overlays
- Motion constants and spring tuning
- Consistent spacing, radius, and typography scales

## Package Highlights

- `react-native-reanimated`: fluid pulse, spring, and list transitions
- `react-native-svg`: custom chart rendering for telemetry
- `zustand`: high-frequency state updates with low overhead
- `expo-haptics`: emergency and feedback tactile cues
- `expo-router`: scalable route architecture

## Future Improvements

- Secure auth and role-based caregiver sessions
- FCM/APNs alert escalation workflow
- Historical analytics and trend scoring dashboards
- Device management and edge node provisioning UI
- Persisted local cache for offline anomaly review
- End-to-end integration tests for socket + API flows
