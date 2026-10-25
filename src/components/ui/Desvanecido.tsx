import { useId } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { useColors } from "@/constants/theme";

export function Desvanecido({
  alto,
  solido = 0,
  lado = "arriba",
}: {
  alto: number | "100%";
  solido?: number;
  lado?: "arriba" | "abajo";
}) {
  const C = useColors();
  const id = useId().replace(/:/g, "");

  return (
    <View style={[styles.caja, lado === "arriba" ? styles.arriba : styles.abajo, { height: alto }]}>
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={id} x1="0" y1={lado === "arriba" ? "0" : "1"} x2="0" y2={lado === "arriba" ? "1" : "0"}>
            <Stop offset={0} stopColor={C.canvas} stopOpacity={1} />
            <Stop offset={solido} stopColor={C.canvas} stopOpacity={1} />
            <Stop offset={1} stopColor={C.canvas} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  caja: {
    position: "absolute",
    left: 0,
    right: 0,
    pointerEvents: "none",
  },
  arriba: {
    top: 0,
  },
  abajo: {
    bottom: 0,
  },
});
