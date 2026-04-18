import { useMemo } from "react";

import { ROOM_STATUS } from "@/constants/roomStatus";
import { useAppStore } from "@/store/appStore";

export const useRealtimeMetrics = () => {
  const rooms = useAppStore((state) => state.roomOrder.map((id) => state.rooms[id]).filter(Boolean));
  const connection = useAppStore((state) => state.connectionState);

  return useMemo(() => {
    const total = rooms.length;
    const falls = rooms.filter((room) => room.status === ROOM_STATUS.FALL).length;
    const empty = rooms.filter((room) => room.status === ROOM_STATUS.EMPTY).length;
    const avgLatency =
      total > 0 ? Math.round(rooms.reduce((sum, room) => sum + (room.latency || 0), 0) / total) : 0;

    return {
      total,
      falls,
      empty,
      avgLatency,
      connection
    };
  }, [connection, rooms]);
};
