# VITALGUARD AI BACKEND

VITALGUARD AI BACKEND is a production-style FastAPI service for privacy-preserving, real-time mmWave radar fall detection.

It ingests telemetry from edge nodes, runs sliding-window feature extraction and ML inference, stores data in MongoDB, pushes live state updates to mobile clients over WebSockets, and captures caregiver feedback for model quality loops.

## Architecture

- Ingestion WebSocket for ESP32 nodes: /ws/telemetry
- Broadcast WebSocket for mobile clients: /ws/clients
- Real-time room cache with stale/offline tracking
- Sliding window feature extraction (window + step)
- Inference engine with model loading and deterministic fallback
- MongoDB repositories for telemetry, anomalies, feedback, room snapshots
- REST APIs for rooms, system status, history, and feedback submission
- Optional mock telemetry stream for hardware-free demo mode

## Project Layout

- app/config.py: environment-based settings
- app/logging_config.py: Loguru + stdlib logging interception
- app/models: pydantic request/response contracts
- app/db: Mongo manager, indexes, repository layer
- app/core: buffers, feature extraction, inference, websocket manager, mock stream
- app/services: orchestration layer for telemetry, anomalies, feedback, broadcast
- app/api: REST route modules
- app/main.py: app startup, dependency wiring, websocket routes, lifecycle
- scripts/generate_mock_model.py: build classifier artifact
- scripts/seed_mock_data.py: seed sample anomaly history
- tests: feature extraction, inference, feedback API tests

## Environment Setup

1. Copy environment template:

cp .env.example .env

2. Update:

- MONGODB_URI
- MONGODB_DB
- MODEL_PATH
- USE_MOCK_STREAM
- CORS_ORIGINS

## Install

pip install -r requirements.txt

## Run

python run.py

Default host and port are controlled by APP_HOST and APP_PORT.

## Running With Real Telemetry

1. Set USE_MOCK_STREAM=false
2. Ensure ESP32 nodes connect to /ws/telemetry
3. Send payloads in schema:

{
  "roomId": "401",
  "ts": 1710000000,
  "ms": 142,
  "me": 73,
  "ss": 138,
  "se": 21,
  "dd": 150,
  "nodeBattery": 92
}

Backend validates, enriches, infers label/confidence, stores records, and broadcasts updates.

## Running In Mock Mode

1. Set USE_MOCK_STREAM=true
2. Configure MOCK_ROOM_IDS
3. Start backend normally

Mock stream simulates NORMAL, EMPTY, and occasional FALL transitions and drives the same processing pipeline as real telemetry.

## API Overview

### REST

- GET /api/health
- GET /api/status
- GET /api/rooms
- GET /api/rooms/{room_id}
- GET /api/telemetry/{room_id}
- GET /api/history
- GET /api/history/{room_id}
- POST /api/feedback

### WebSockets

- /ws/telemetry: edge node ingestion channel
- /ws/clients: live room and alert updates

## ML Inference Flow

1. Telemetry enters room-specific rolling buffer
2. When buffer is ready (window + step), features are extracted:
   - mean moving energy
   - variance moving energy
   - max moving energy
   - range moving energy
   - variance detection distance
   - mean stationary energy
3. Inference engine predicts NORMAL/EMPTY/FALL with confidence
4. FALL events create anomaly records and urgent broadcasts
5. Feedback endpoint links false alarms or confirmed falls to anomalies

If the model file is missing and USE_MOCK_INFERENCE=true, deterministic fallback inference is used.

## WebSocket Usage (Client)

Connect to /ws/clients and keep the socket alive (send pings or text heartbeats).

Incoming message types:

- bootstrap
- room_update
- alert
- system

## Future Improvements

- JWT authentication and role-based authorization
- Multi-tenant room/ward partitioning
- Event bus integration (Kafka/NATS) for scale-out processing
- Background retraining pipeline from feedback-labeled anomalies
- Distributed cache for horizontally scaled room state
- Prometheus metrics and OpenTelemetry tracing
