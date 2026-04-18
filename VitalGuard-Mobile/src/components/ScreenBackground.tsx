import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

import { ROOM_STATUS, RoomStatus } from "@/constants/roomStatus";
import { theme } from "@/constants/theme";

type Props = {
  status?: RoomStatus;
};

export const ScreenBackground = ({ status }: Props) => {
  const drift = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(
      withSequence(withTiming(1, { duration: 5000 }), withTiming(0, { duration: 5000 })),
      -1,
      true
    );
  }, [drift]);

  const floatingA = useAnimatedStyle(() => ({
    transform: [{ translateY: drift.value * 12 - 8 }, { translateX: drift.value * -6 + 3 }]
  }));

  const floatingB = useAnimatedStyle(() => ({
    transform: [{ translateY: drift.value * -10 + 2 }, { translateX: drift.value * 8 - 4 }]
  }));

  const floatingC = useAnimatedStyle(() => ({
    transform: [{ translateY: drift.value * 14 - 10 }, { translateX: drift.value * 12 - 6 }]
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={theme.gradients.screenBase} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={["rgba(87, 163, 255, 0.08)", "rgba(0,0,0,0)"]} style={styles.topAmbient} />
      {status === ROOM_STATUS.FALL ? <LinearGradient colors={theme.gradients.emergency} style={StyleSheet.absoluteFill} /> : null}
      <Animated.View style={[styles.blob, styles.blobA, floatingA]}>
        <BlurView intensity={theme.blur.intense} tint="dark" style={styles.blurBlob} />
      </Animated.View>
      <Animated.View style={[styles.blob, styles.blobB, floatingB]}>
        <BlurView intensity={theme.blur.soft} tint="dark" style={styles.blurBlob} />
      </Animated.View>
      <Animated.View style={[styles.blob, styles.blobC, floatingC]}>
        <BlurView intensity={theme.blur.medium} tint="dark" style={styles.blurBlob} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  topAmbient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9
  },
  blob: {
    position: "absolute",
    borderRadius: 220,
    overflow: "hidden"
  },
  blobA: {
    top: -140,
    right: -80,
    width: 340,
    height: 340,
    backgroundColor: "rgba(86, 146, 233, 0.25)"
  },
  blobB: {
    bottom: -140,
    left: -100,
    width: 350,
    height: 350,
    backgroundColor: "rgba(40, 169, 143, 0.18)"
  },
  blobC: {
    top: "36%",
    left: "35%",
    width: 220,
    height: 220,
    backgroundColor: "rgba(108, 142, 255, 0.14)"
  },
  blurBlob: {
    flex: 1
  }
});
