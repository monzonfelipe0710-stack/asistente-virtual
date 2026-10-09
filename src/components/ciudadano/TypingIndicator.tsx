import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { Palette, Radius, Spacing, useColors } from "../../constants/theme";

/** Tres puntos de 8 px que se encienden en secuencia (1.2 s, desfase 0.2 s). */
export default function TypingIndicator() {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 0–40 % sube a 1, 40–80 % baja a 0.25, el resto quieto: el ciclo dura 1.2 s
    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 480,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 480,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(240 - delay),
        ])
      );

    const loops = [pulse(dot1, 0), pulse(dot2, 200), pulse(dot3, 400)];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [dot1, dot2, dot3]);

  return (
    <View
      style={styles.row}
      accessibilityLabel="El asistente está escribiendo"
      accessibilityLiveRegion="polite"
    >
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            { opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }) },
          ]}
        />
      ))}
    </View>
  );
}

const createStyles = (C: Palette) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      height: 28,
      marginTop: Spacing[6],
      paddingHorizontal: Spacing[5],
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: Radius.full,
      backgroundColor: C.ink2,
    },
  });
