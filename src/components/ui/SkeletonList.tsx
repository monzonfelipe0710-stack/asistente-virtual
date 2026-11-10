import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { Row } from "./Row";
import { Radius, Spacing, useColors } from "@/constants/theme";
import { useAjustes } from "@/lib/accesibilidad";

/** Bloque gris que late mientras se espera; quieto si se reducen las animaciones. */
function Skeleton({
  width,
  height = 16,
  radius = Radius.sm,
}: {
  width: number | `${number}%`;
  height?: number;
  radius?: number;
}) {
  const C = useColors();
  const { reducirAnimaciones } = useAjustes();
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reducirAnimaciones) return;
    const loop = Animated.loop(
      Animated.sequence(
        [1, 0].map((toValue) =>
          Animated.timing(pulse, {
            toValue,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
        )
      )
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reducirAnimaciones]);

  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius: radius,
        backgroundColor: C.surface2,
        opacity: reducirAnimaciones ? 1 : pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
      }}
    />
  );
}

/** Filas fantasma mientras llegan los datos. */
export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <View accessibilityLabel="Cargando" accessibilityRole="progressbar">
      {Array.from({ length: rows }).map((_, index) => (
        <Row key={index}>
          <View style={styles.skeletonRow}>
            <Skeleton width={44} height={44} radius={Radius.xl} />
            <View style={styles.skeletonText}>
              <Skeleton width="65%" />
              <Skeleton width="42%" height={12} radius={6} />
            </View>
          </View>
        </Row>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
  },
  skeletonText: {
    flex: 1,
    gap: Spacing[2],
  },
});
