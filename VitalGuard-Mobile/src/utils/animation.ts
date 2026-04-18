import { Easing } from "react-native-reanimated";

import { theme } from "@/constants/theme";

export const springConfig = {
  damping: theme.motion.spring.damping,
  stiffness: theme.motion.spring.stiffness,
  mass: theme.motion.spring.mass
};

export const timing = {
  fast: {
    duration: theme.motion.fast,
    easing: Easing.out(Easing.cubic)
  },
  normal: {
    duration: theme.motion.normal,
    easing: Easing.out(Easing.cubic)
  },
  slow: {
    duration: theme.motion.slow,
    easing: Easing.out(Easing.quad)
  }
};
