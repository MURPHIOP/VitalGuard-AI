import { ROOM_STATUS, RoomStatus } from "@/constants/roomStatus";
import { AnomalyHistoryItem, TelemetryPayload } from "@/types";

const roomIds = ["401", "402", "403", "404", "405", "406"];

const baseByRoom: Record<string, { me: number; se: number; dd: number }> = {
  "401": { me: 56, se: 18, dd: 138 },
  "402": { me: 36, se: 12, dd: 112 },
  "403": { me: 49, se: 22, dd: 146 },
  "404": { me: 29, se: 11, dd: 102 },
  "405": { me: 42, se: 16, dd: 128 },
  "406": { me: 33, se: 14, dd: 117 }
};

type RoomRuntime = {
  status: RoomStatus;
  phaseTicksRemaining: number;
  tick: number;
  battery: number;
  drift: number;
  fallStage: number;
};

const runtimeByRoom: Record<string, RoomRuntime> = {};

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

const randomInt = (min: number, max: number) => Math.round(randomBetween(min, max));

const ensureRuntime = (roomId: string): RoomRuntime => {
  const existing = runtimeByRoom[roomId];
  if (existing) {
    return existing;
  }

  const seeded: RoomRuntime = {
    status: ROOM_STATUS.NORMAL,
    phaseTicksRemaining: randomInt(8, 16),
    tick: randomInt(0, 100),
    battery: randomInt(62, 98),
    drift: randomBetween(-0.18, 0.18),
    fallStage: 0
  };

  runtimeByRoom[roomId] = seeded;
  return seeded;
};

const scheduleNextPhase = (runtime: RoomRuntime) => {
  const roll = Math.random();

  if (runtime.status === ROOM_STATUS.FALL) {
    runtime.status = ROOM_STATUS.NORMAL;
    runtime.phaseTicksRemaining = randomInt(10, 20);
    runtime.fallStage = 0;
    return;
  }

  if (runtime.status === ROOM_STATUS.EMPTY) {
    if (roll < 0.72) {
      runtime.status = ROOM_STATUS.NORMAL;
      runtime.phaseTicksRemaining = randomInt(10, 24);
    } else {
      runtime.status = ROOM_STATUS.EMPTY;
      runtime.phaseTicksRemaining = randomInt(6, 14);
    }
    return;
  }

  if (roll < 0.05) {
    runtime.status = ROOM_STATUS.FALL;
    runtime.phaseTicksRemaining = randomInt(4, 7);
    runtime.fallStage = 0;
    return;
  }

  if (roll < 0.21) {
    runtime.status = ROOM_STATUS.EMPTY;
    runtime.phaseTicksRemaining = randomInt(6, 14);
    return;
  }

  runtime.status = ROOM_STATUS.NORMAL;
  runtime.phaseTicksRemaining = randomInt(8, 20);
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const generateTelemetryValues = (roomId: string, runtime: RoomRuntime) => {
  const base = baseByRoom[roomId] ?? baseByRoom["401"];
  const harmonic = Math.sin(runtime.tick / 3.2) * 6 + Math.cos(runtime.tick / 6.1) * 4;
  const drift = runtime.drift * runtime.tick;

  if (runtime.status === ROOM_STATUS.EMPTY) {
    const me = clamp(base.me * 0.14 + harmonic * 0.18 + randomBetween(-1.8, 1.8), 1.8, 14);
    const se = clamp(base.se * 0.3 + Math.sin(runtime.tick / 5.5) * 1.1 + randomBetween(-1.1, 1.1), 1, 10);
    const dd = clamp(base.dd + drift * 0.2 + randomBetween(-2.3, 2.3), 55, 220);
    return { me, se, dd, confidence: randomBetween(0.56, 0.79), latency: randomInt(48, 128) };
  }

  if (runtime.status === ROOM_STATUS.FALL) {
    runtime.fallStage += 1;
    const burstDecay = Math.max(0.42, 1.55 - runtime.fallStage * 0.23);
    const me = clamp(base.me * burstDecay + 96 + randomBetween(-14, 22), 72, 238);
    const se = clamp(base.se * 1.5 + 22 + randomBetween(-8, 10), 18, 94);
    const ddShift = runtime.fallStage < 3 ? randomBetween(-24, -11) : randomBetween(-8, 14);
    const dd = clamp(base.dd + ddShift + drift * 0.4, 35, 240);
    return { me, se, dd, confidence: randomBetween(0.9, 0.99), latency: randomInt(32, 86) };
  }

  const microSpike = Math.random() < 0.08 ? randomBetween(9, 22) : 0;
  const me = clamp(base.me + harmonic + drift + randomBetween(-5.5, 7.5) + microSpike, 10, 130);
  const se = clamp(base.se + harmonic * 0.4 + randomBetween(-3.2, 3.4), 4, 74);
  const dd = clamp(base.dd + Math.sin(runtime.tick / 7.6) * 5 + drift * 0.3 + randomBetween(-4.2, 4.2), 45, 220);

  return {
    me,
    se,
    dd,
    confidence: randomBetween(0.64, 0.9),
    latency: randomInt(36, 118)
  };
};

export const createMockTelemetry = (roomId: string, previous: RoomStatus = ROOM_STATUS.NORMAL): TelemetryPayload => {
  const runtime = ensureRuntime(roomId);
  runtime.tick += 1;

  if (runtime.phaseTicksRemaining <= 0) {
    scheduleNextPhase(runtime);
  }
  runtime.phaseTicksRemaining -= 1;

  if (previous === ROOM_STATUS.FALL && runtime.status !== ROOM_STATUS.FALL && Math.random() < 0.35) {
    runtime.status = ROOM_STATUS.NORMAL;
    runtime.phaseTicksRemaining = randomInt(12, 20);
  }

  const { me, se, dd, confidence, latency } = generateTelemetryValues(roomId, runtime);

  runtime.battery = clamp(runtime.battery - randomBetween(0.01, 0.08), 35, 100);

  const status = runtime.status;
  const serverTime = new Date().toISOString();

  const ms = clamp(dd + randomBetween(6, 15), 20, 260);
  const ss = clamp(dd - randomBetween(8, 21), 12, 250);

  return {
    roomId,
    label: status,
    ms: Math.round(ms),
    me: Math.round(me),
    ss: Math.round(ss),
    se: Math.round(se),
    dd: Math.round(dd),
    confidence: Number(confidence.toFixed(3)),
    server_ts: serverTime,
    latency_ms: latency,
    nodeBattery: Math.round(runtime.battery)
  };
};

export const getMockRoomIds = () => roomIds;

export const createInitialMockHistory = (): AnomalyHistoryItem[] => {
  const now = Date.now();
  return [
    {
      id: "evt_mock_001",
      roomId: "404",
      type: ROOM_STATUS.FALL,
      timestamp: new Date(now - 4 * 60 * 1000).toISOString(),
      confidence: 0.93,
      feedback: "PENDING"
    },
    {
      id: "evt_mock_002",
      roomId: "402",
      type: ROOM_STATUS.NORMAL,
      timestamp: new Date(now - 39 * 60 * 1000).toISOString(),
      confidence: 0.74,
      feedback: "CONFIRMED_FALL"
    },
    {
      id: "evt_mock_003",
      roomId: "401",
      type: ROOM_STATUS.FALL,
      timestamp: new Date(now - 132 * 60 * 1000).toISOString(),
      confidence: 0.88,
      feedback: "FALSE_ALARM"
    }
  ];
};
