import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/Text";
import { Radius, Spacing, Weight, useColors } from "@/constants/theme";
import { useAjustes } from "@/lib/accesibilidad";

/** Un punto que sube y se enciende; `retraso` lo desfasa del resto. */
function Punto({ retraso }: { retraso: number }) {
  const C = useColors();
  const { reducirAnimaciones } = useAjustes();
  const [pulso] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reducirAnimaciones) return;
    const paso = (hasta: number) =>
      Animated.timing(pulso, {
        toValue: hasta,
        duration: 480,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      });

    // Cada vuelta dura 1.2 s: sube, baja y descansa.
    const animacion = Animated.sequence([
      Animated.delay(retraso),
      Animated.loop(Animated.sequence([paso(1), paso(0), Animated.delay(240)])),
    ]);
    animacion.start();
    return () => animacion.stop();
  }, [pulso, retraso, reducirAnimaciones]);

  return (
    <Animated.View
      style={[
        styles.punto,
        {
          backgroundColor: C.ink,
          opacity: reducirAnimaciones ? 1 : pulso.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
          transform: [{ translateY: pulso.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
        },
      ]}
    />
  );
}

/** Píldora con tres puntos y la palabra "Pensando" mientras el asistente responde. */
export function TypingIndicator() {
  const C = useColors();
  return (
    <View style={styles.fila}>
      <View
        style={[styles.pildora, { backgroundColor: C.surface, borderColor: C.border }]}
        accessibilityLabel="El asistente está pensando"
        accessibilityLiveRegion="polite"
      >
        <View style={styles.puntos}>
          <Punto retraso={0} />
          <Punto retraso={200} />
          <Punto retraso={400} />
        </View>
        <Text style={[styles.texto, { color: C.ink }]}>Pensando</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    marginTop: Spacing[6],
    paddingHorizontal: Spacing[5],
    alignItems: "flex-start",
  },
  pildora: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    minHeight: 48,
    paddingVertical: 10,
    paddingLeft: 18,
    paddingRight: Spacing[5],
    borderRadius: Radius["2xl"] + 4,
    borderWidth: 1,
  },
  puntos: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 16,
  },
  punto: {
    width: 9,
    height: 9,
    borderRadius: Radius.full,
  },
  texto: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: Weight.semibold,
  },
});
