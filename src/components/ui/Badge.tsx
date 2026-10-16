import { StyleSheet, View } from "react-native";

import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";
import { Weight, useColors, type Palette } from "@/constants/theme";

/** El color marca un estado, no decora. */
export type Tone = "brand" | "ok" | "warn" | "bad" | "info" | "muted";

export function toneColor(C: Palette, tone: Tone): string {
  switch (tone) {
    case "ok":
      return C.ok;
    case "warn":
      return C.warn;
    case "bad":
      return C.bad;
    case "info":
      return C.info;
    case "muted":
      return C.ink2;
    case "brand":
      return C.accent;
  }
}

function toneBackground(C: Palette, tone: Tone): string {
  switch (tone) {
    case "ok":
      return C.okBg;
    case "warn":
      return C.warnBg;
    case "bad":
      return C.badBg;
    case "info":
      return C.infoBg;
    case "muted":
      return C.surface2;
    case "brand":
      return C.activeBg;
  }
}

const ICONO: Partial<Record<Tone, IconName>> = {
  ok: "check",
  warn: "alert",
  bad: "close",
  info: "info",
};

/**
 * Etiqueta de estado: píldora con fondo suave, borde y texto del mismo color, y
 * un ícono. El estado no depende solo del color: el ícono y el texto lo repiten.
 */
export function Badge({ label, tone = "brand" }: { label: string; tone?: Tone }) {
  const C = useColors();
  const color = toneColor(C, tone);
  const icono = ICONO[tone];

  return (
    <View style={[styles.badge, { backgroundColor: toneBackground(C, tone), borderColor: color }]}>
      {!!icono && <Icon name={icono} size={14} color={color} />}
      <Text style={[styles.texto, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  texto: {
    fontSize: 14,
    lineHeight: 17,
    fontWeight: Weight.semibold,
  },
});
