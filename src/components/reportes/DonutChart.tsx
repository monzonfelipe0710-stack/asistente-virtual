import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import { CountUp } from "@/components/ui/CountUp";
import { Text } from "@/components/ui/Text";
import { Radius, Spacing, Type, Weight, useColors } from "@/constants/theme";

export interface Segment {
  label: string;
  value: number;
  color: string;
}

const SIZE = 190;
const THICKNESS = 26;

/**
 * Dona en SVG, sin librerías de gráficos. Al tocar una porción se resalta y el
 * centro muestra su porcentaje: en web esto era `hover`, acá es un toque.
 */
export function DonutChart({ segments }: { segments: Segment[] }) {
  const C = useColors();
  const [active, setActive] = useState<number | null>(null);

  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = 62;
  const circumference = 2 * Math.PI * r;

  const activeSeg = active !== null ? segments[active] : null;
  const activePct =
    activeSeg && total ? Math.round((activeSeg.value / total) * 100) : 0;

  let acc = 0;
  const arcs = segments.map((s, i) => {
    const frac = total ? s.value / total : 0;
    // El hueco de 5 unidades separa las porciones; el mínimo de 3 evita que una
    // porción de valor 1 desaparezca del todo.
    const len = s.value ? Math.max(frac * circumference - 5, 3) : 0;
    const arc = { seg: s, i, len, offset: -acc };
    acc += frac * circumference;
    return arc;
  });

  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ width: SIZE, height: SIZE }}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <G rotation={-90} origin={`${SIZE / 2}, ${SIZE / 2}`}>
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={r}
              fill="none"
              strokeWidth={THICKNESS}
              stroke={C.surface}
            />
            {total > 0 &&
              arcs.map(({ seg, i, len, offset }) =>
                len > 0 ? (
                  <Circle
                    key={seg.label}
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={r}
                    fill="none"
                    stroke={seg.color}
                    strokeLinecap="round"
                    strokeWidth={active === i ? THICKNESS + 6 : THICKNESS}
                    strokeDasharray={`${len} ${circumference - len}`}
                    strokeDashoffset={offset}
                    opacity={active === null || active === i ? 1 : 0.28}
                  />
                ) : null
              )}
          </G>
        </Svg>

        <View style={[StyleSheet.absoluteFill, styles.donutCenter]} pointerEvents="none">
          {activeSeg ? (
            <>
              <Text style={[styles.donutBig, { color: activeSeg.color }]}>
                {activePct}%
              </Text>
              <View
                style={[styles.donutRule, { backgroundColor: activeSeg.color, opacity: 0.5 }]}
              />
              <Text style={[styles.donutLabel, { color: C.ink }]}>{activeSeg.label}</Text>
              <Text style={[styles.donutHint, { color: C.ink2 }]}>
                {activeSeg.value} expedientes
              </Text>
            </>
          ) : (
            <>
              <CountUp value={total} style={[styles.donutBig, { color: C.ink }]} />
              <View style={[styles.donutRule, { backgroundColor: C.border }]} />
              <Text style={[styles.donutHint, { color: C.ink2 }]}>
                expedientes en total
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Leyenda: además de explicar, es lo que se toca para resaltar */}
      <View style={styles.legend}>
        {segments.map((s, i) => (
          <Pressable
            key={s.label}
            onPress={() => setActive(active === i ? null : i)}
            accessibilityRole="button"
            accessibilityState={{ selected: active === i }}
            accessibilityLabel={`${s.label}: ${s.value} expedientes`}
            style={styles.legendItem}
          >
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text style={[styles.legendText, { color: active === i ? C.ink : C.ink2 }]}>
              {s.label} ({s.value})
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  donutCenter: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing[10],
  },
  donutBig: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: Weight.semibold,
  },
  donutRule: {
    width: 32,
    height: 2,
    borderRadius: Radius.full,
    marginTop: Spacing[2],
  },
  donutLabel: {
    ...Type.metaStrong,
    marginTop: 6,
    textAlign: "center",
  },
  donutHint: {
    ...Type.meta,
    marginTop: 2,
    textAlign: "center",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing[3],
    marginTop: Spacing[4],
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
  },
  legendText: {
    fontSize: 13,
  },
});
