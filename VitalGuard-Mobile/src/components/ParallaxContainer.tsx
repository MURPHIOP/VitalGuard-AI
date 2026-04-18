import { PropsWithChildren } from "react";
import { StyleSheet } from "react-native";
import Animated, { SharedValue, useAnimatedStyle } from "react-native-reanimated";

type Props = PropsWithChildren<{
  scrollY: SharedValue<number>;
  depth?: number;
}>;

export const ParallaxContainer = ({ children, scrollY, depth = 0.08 }: Props) => {
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -scrollY.value * depth }]
  }));

  return <Animated.View style={[styles.container, style]}>{children}</Animated.View>;
};

const styles = StyleSheet.create({
  container: {
    width: "100%"
  }
});
