import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";

import { ROOM_STATUS, RoomStatus } from "@/constants/roomStatus";
import { theme } from "@/constants/theme";

type Props = {
  status: RoomStatus;
};

export const FloatingStatusOrb = ({ status }: Props) => {
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withSequence(withTiming(-8, { duration: 1800 }), withTiming(0, { duration: 1800 })),
      -1,
      true
    );
  }, [float]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }]
  }));

  const color = status === ROOM_STATUS.FALL ? theme.colors.fall : status === ROOM_STATUS.EMPTY ? theme.colors.empty : theme.colors.normal;

  return <Animated.View style={[styles.orb, { backgroundColor: `${color}66`, shadowColor: color }, style]} />;
};

const styles = StyleSheet.create({
  orb: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.34)",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 14,
    shadowOpacity: 0.78,
    elevation: 6
  }
});
