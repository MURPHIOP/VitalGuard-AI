import { PropsWithChildren } from "react";
import { Pressable, StyleSheet, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

import { theme } from "@/constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = PropsWithChildren<{
  style?: ViewStyle;
  onPress?: () => void;
  glow?: "none" | "soft" | "alert";
}>;

export const GlassCard = ({ children, style, onPress, glow = "none" }: Props) => {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.98, theme.motion.spring);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, theme.motion.spring);
      }}
      style={[styles.wrapper, glow === "soft" && theme.shadows.glowSoft, glow === "alert" && theme.shadows.glowAlert, style, animStyle]}
    >
      <LinearGradient colors={theme.gradients.card} style={styles.gradient}>
        <LinearGradient colors={["rgba(255,255,255,0.16)", "rgba(255,255,255,0.02)"]} style={styles.innerStroke} />
        <BlurView intensity={theme.blur.medium} tint="dark" style={styles.blur}>
          {children}
        </BlurView>
      </LinearGradient>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: theme.radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(190, 225, 255, 0.24)",
    backgroundColor: theme.colors.bgCard,
    ...theme.shadows.card
  },
  gradient: {
    width: "100%",
    position: "relative"
  },
  innerStroke: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55
  },
  blur: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg + 2
  }
});
