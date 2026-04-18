export const ROOM_STATUS = {
  NORMAL: "NORMAL",
  EMPTY: "EMPTY",
  FALL: "FALL",
  OFFLINE: "OFFLINE"
} as const;

export type RoomStatus = (typeof ROOM_STATUS)[keyof typeof ROOM_STATUS];

export const STATUS_PRIORITY: Record<RoomStatus, number> = {
  FALL: 3,
  NORMAL: 2,
  EMPTY: 1,
  OFFLINE: 0
};

export const STATUS_LABELS: Record<RoomStatus, string> = {
  NORMAL: "Stable",
  EMPTY: "No Occupancy",
  FALL: "Fall Detected",
  OFFLINE: "Sensor Offline"
};
