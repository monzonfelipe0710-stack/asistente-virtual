import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { Motion, Shadows, useColors } from "../../constants/theme";

/**
 * Interruptor v6: pista de 51 × 31 y perilla blanca de 27. Encendido en azul
 * ChatAP, apagado en el gris de borde. No recibe toques propios: lo envuelve la
 * fila entera, que es el área táctil.
 */
export default function Toggle({ value }: { value: boolean }) {
  const C = useColors();
  const x = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(x, {
      toValue: value ? 1 : 0,
      duration: 220,
      easing: Easing.bezier(...Motion.bezier),
      useNativeDriver: true,
    }).start();
  }, [value, x]);

  return (
    <View
      style={[styles.track, { backgroundColor: value ? C.accentBlue : C.toggleOff }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View
        style={[
          styles.knob,
          { transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) }] },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 51,
    height: 31,
    borderRadius: 999,
  },
  knob: {
    position: "absolute",
    top: 2,
    left: 2,
    width: 27,
    height: 27,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    ...Shadows.md,
  },
});
