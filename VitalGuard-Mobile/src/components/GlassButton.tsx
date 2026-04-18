import { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { theme } from "@/constants/theme";

type Props = {
  title: string;
  icon?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "danger" | "ghost";
};

export const GlassButton = ({ title, icon, onPress, disabled, loading, variant = "primary" }: Props) => {
  const scale = useSharedValue(1);

  const isGhost = variant === "ghost";
  const ghostGradient = ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.02)"] as const;
  const colors =
    variant === "danger"
      ? theme.gradients.buttonDanger
      : variant === "ghost"
        ? ghostGradient
        : theme.gradients.buttonPrimary;

  const elevatedStyle =
    variant === "danger"
      ? styles.dangerShadow
      : variant === "ghost"
        ? styles.ghostShadow
        : styles.primaryShadow;

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      onPressIn={() => {
        scale.value = withSpring(0.94, theme.motion.spring);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, theme.motion.spring);
      }}
      style={[styles.pressable, disabled && styles.disabled]}
    >
      <Animated.View style={scaleStyle}>
        <LinearGradient colors={colors} style={[styles.container, elevatedStyle, isGhost && styles.ghostBorder]}>
          {loading ? (
            <ActivityIndicator color={theme.colors.textPrimary} />
          ) : (
            <>
              {icon ? <View style={styles.icon}>{icon}</View> : null}
              <Text style={styles.text}>{title}</Text>
            </>
          )}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    flex: 1
  },
  container: {
    minHeight: 52,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)"
  },
  primaryShadow: {
    shadowColor: "#30D3AD",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.26,
    shadowRadius: 14,
    elevation: 6
  },
  dangerShadow: {
    shadowColor: "#FF5E75",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 7
  },
  ghostShadow: {
    shadowColor: "#81CFFF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3
  },
  ghostBorder: {
    borderColor: "rgba(193, 225, 255, 0.34)"
  },
  text: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: theme.typography.weights.semibold,
    letterSpacing: 0.2
  },
  icon: {
    marginRight: 3
  },
  disabled: {
    opacity: 0.52
  }
});
