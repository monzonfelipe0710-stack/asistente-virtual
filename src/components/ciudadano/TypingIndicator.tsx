import { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Palette, Radius, Spacing, useColors } from "../../constants/theme";

export default function TypingIndicator() {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -6,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(600),
        ]),
      );

    const a1 = bounce(dot1, 0);
    const a2 = bounce(dot2, 200);
    const a3 = bounce(dot3, 400);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.bubble}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[styles.dot, { transform: [{ translateY: dot }] }]}
          />
        ))}
      </View>
    </View>
  );
}

const createStyles = (C: Palette) =>
  StyleSheet.create({
    wrapper: {
      alignItems: "flex-start",
      paddingHorizontal: Spacing[4],
    },
    // sin fondo, igual que las respuestas del bot
    bubble: {
      flexDirection: "row",
      gap: 4,
      paddingVertical: 14,
      alignItems: "center",
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: Radius.full,
      backgroundColor: C.slate400,
    },
  });
