import { useMemo } from "react";
import { SharedValue, useAnimatedStyle } from "react-native-reanimated";

export const useParallax = (scrollY: SharedValue<number>, intensity = 0.18) => {
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -scrollY.value * intensity }]
  }));

  return useMemo(() => ({ style }), [style]);
};
