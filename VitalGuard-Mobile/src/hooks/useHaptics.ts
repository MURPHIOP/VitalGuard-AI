import * as Haptics from "expo-haptics";
import { useCallback } from "react";

export const useHaptics = () => {
  const triggerFall = useCallback(async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      // Haptics support may be unavailable on some simulators/devices.
    }
  }, []);

  const triggerReconnect = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore haptics failures to keep interaction flow stable.
    }
  }, []);

  const triggerSuccess = useCallback(async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Ignore haptics failures to keep interaction flow stable.
    }
  }, []);

  return {
    triggerFall,
    triggerReconnect,
    triggerSuccess
  };
};
