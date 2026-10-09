import { Pressable, StyleSheet, View } from "react-native";

import { Icon } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";
import { useAvisoNoDisponible } from "@/components/ui/AvisoNoDisponible";
import { Fonts, Radius, Spacing, Weight, useColors } from "@/constants/theme";
import type { MockDocument } from "@/data/mockDocuments";

/**
 * Fila de descarga: tarjeta gris de radio 16, ícono de documento en una caja de
 * 40 del color del fondo, nombre, y formato y peso en Geist Mono.
 */
export function TarjetaDeDocumento({ documento }: { documento: MockDocument }) {
  const C = useColors();
  const avisarNoDisponible = useAvisoNoDisponible();

  return (
    <Pressable
      onPress={() => avisarNoDisponible()}
      accessibilityRole="button"
      accessibilityLabel={`Descargar ${documento.title}, ${documento.format}, ${documento.fileSize}`}
      style={({ pressed }) => [
        styles.tarjeta,
        { backgroundColor: pressed ? C.surface2 : C.surface },
      ]}
    >
      <View style={[styles.icono, { backgroundColor: C.canvas }]}>
        <Icon name="fileText" size={20} color={C.ink2} />
      </View>

      <View style={styles.texto}>
        <Text style={[styles.titulo, { color: C.ink }]} numberOfLines={2}>
          {documento.title}
        </Text>
        <Text style={[styles.detalle, { color: C.ink3 }]} numberOfLines={1}>
          {documento.format} · {documento.fileSize}
        </Text>
      </View>

      <Icon name="download" size={20} color={C.ink2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[4],
    paddingHorizontal: Spacing[4],
    paddingVertical: 14,
    borderRadius: Radius.xl,
  },
  icono: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  texto: {
    flex: 1,
    minWidth: 0,
  },
  titulo: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: Weight.medium,
  },
  detalle: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: Fonts.mono,
    letterSpacing: 0.66,
    textTransform: "uppercase",
    marginTop: Spacing[1],
  },
});
