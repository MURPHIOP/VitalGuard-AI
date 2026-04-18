import * as Haptics from "expo-haptics";
import { useCallback } from "react";

export const useHaptics = () => {
  const triggerFall = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  const triggerReconnect = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const triggerSuccess = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  return {
    triggerFall,
    triggerReconnect,
    triggerSuccess
  };
};
