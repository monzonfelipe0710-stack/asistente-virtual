import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import { CountUp } from "@/components/ui/Stats";
import { Text } from "@/components/ui/Text";
import { Radius, Spacing, Type, Weight, useColors } from "@/constants/theme";

const DEPT_SHORT: Record<string, string> = {
  "Mesa de Entradas": "Mesa",
  "Recursos Humanos": "RR.HH.",
  Legajos: "Legajos",
  Liquidaciones: "Liquid.",
  Sistemas: "Sistemas",
};

export interface Segment {
  label: string;
  value: number;
  color: string;
}

/**
 * Dona en SVG, sin librerías de gráficos. Al tocar una porción se resalta y el
 * centro muestra su porcentaje: en web esto era `hover`, acá es un toque.
 */
export function DonutChart({
  segments,
  size = 190,
  thickness = 26,
}: {
  segments: Segment[];
  size?: number;
  thickness?: number;
}) {
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
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              strokeWidth={thickness}
              stroke={C.surface}
            />
            {total > 0 &&
              arcs.map(({ seg, i, len, offset }) =>
                len > 0 ? (
                  <Circle
                    key={seg.label}
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={seg.color}
                    strokeLinecap="round"
                    strokeWidth={active === i ? thickness + 6 : thickness}
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

/** Barras verticales por área. */
export function VBars({ data }: { data: { label: string; value: number }[] }) {
  const C = useColors();
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <View style={styles.vbars}>
      {data.map((d, i) => {
        const pct = Math.round((d.value / max) * 100);
        const pctTotal = total ? Math.round((d.value / total) * 100) : 0;
        const isActive = active === i;

        return (
          <Pressable
            key={d.label}
            onPress={() => setActive(isActive ? null : i)}
            accessibilityRole="button"
            accessibilityLabel={`${d.label}: ${d.value} expedientes, ${pctTotal} por ciento`}
            style={styles.vbarCol}
          >
            <Text
              style={[styles.vbarValue, { color: isActive ? C.accentText : C.ink }]}
            >
              {isActive ? `${pctTotal}%` : d.value}
            </Text>
            <View style={[styles.vbarTrack, { backgroundColor: C.surface }]}>
              <View
                style={{
                  width: "60%",
                  height: `${d.value > 0 ? Math.max(pct, 6) : 0}%`,
                  backgroundColor: isActive ? C.accentText : C.accent,
                  borderTopLeftRadius: Radius.sm,
                  borderTopRightRadius: Radius.sm,
                }}
              />
            </View>
            <Text style={[styles.vbarLabel, { color: C.ink2 }]} numberOfLines={1}>
              {DEPT_SHORT[d.label] ?? d.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Barra horizontal con etiqueta y valor. */
export function HBarRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const C = useColors();
  const pct = max ? Math.round((value / max) * 100) : 0;

  return (
    <View style={styles.hbarRow}>
      <Text style={[styles.hbarLabel, { color: C.ink2 }]} numberOfLines={1}>
        {label}
      </Text>
      <View style={[styles.hbarTrack, { backgroundColor: C.surface }]}>
        <View
          style={{
            width: `${pct}%`,
            height: "100%",
            backgroundColor: color,
            borderRadius: Radius.full,
          }}
        />
      </View>
      <Text style={[styles.hbarValue, { color: C.ink }]}>{value}</Text>
    </View>
  );
}

export function RankRow({
  index,
  title,
  subtitle,
  value,
}: {
  index: number;
  title: string;
  subtitle: string;
  value: number;
}) {
  const C = useColors();
  // El puesto es solo el número: los tres primeros en el color de destaque.
  const badgeFg = index < 3 ? C.warn : C.ink3;

  return (
    <View style={styles.rankRow}>
      <Text style={[styles.rankBadgeText, { color: badgeFg }]}>{index + 1}</Text>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.rankTitle, { color: C.ink }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.rankSub, { color: C.ink2 }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <CountUp value={value} style={[styles.rankValue, { color: C.ink2 }]} />
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
  vbars: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: Spacing[2],
    height: 190,
  },
  vbarCol: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },
  vbarValue: {
    fontSize: 13,
    fontWeight: Weight.semibold,
    marginBottom: Spacing[1],
  },
  vbarTrack: {
    width: "100%",
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    borderRadius: Radius.sm,
    overflow: "hidden",
  },
  vbarLabel: {
    ...Type.meta,
    marginTop: 6,
    textAlign: "center",
  },
  hbarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
  },
  hbarLabel: {
    width: 92,
    fontSize: 13,
    fontWeight: Weight.medium,
  },
  hbarTrack: {
    flex: 1,
    height: 16,
    borderRadius: Radius.full,
    overflow: "hidden",
  },
  hbarValue: {
    width: 26,
    textAlign: "right",
    fontSize: 13,
    fontWeight: Weight.semibold,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    paddingVertical: 6,
  },
  rankBadgeText: {
    ...Type.metaStrong,
    width: 18,
  },
  rankTitle: {
    ...Type.bodyStrong,
  },
  rankSub: {
    ...Type.meta,
    marginTop: 1,
  },
  rankValue: {
    ...Type.metaStrong,
  },
});
