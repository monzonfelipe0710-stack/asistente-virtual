import { Pressable, StyleSheet, View } from "react-native";

import { Icon } from "@/compartido/ui/Icon";
import { Text } from "@/compartido/ui/Text";
import { Fonts, Radius, Spacing, Weight, useColors } from "@/compartido/constantes/theme";
import type { DocumentoApi } from "@/compartido/lib/backend";

function obtenerTipoDeArchivo(tipoMime: string | null) {
  if (tipoMime === null || tipoMime === undefined) return "ARCHIVO";
  const partes = tipoMime.split("/");
  const ultimaParte = partes.pop();
  if (ultimaParte === undefined) return "ARCHIVO";
  return ultimaParte.toUpperCase();
}

export function TarjetaDeDocumento({
  documento,
  onPress,
}: {
  documento: DocumentoApi;
  onPress: () => void;
}) {
  const C = useColors();
  const tipo = obtenerTipoDeArchivo(documento.tipo);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Descargar ${documento.nombre}, ${tipo}`}
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
          {documento.nombre}
        </Text>
        <Text style={[styles.detalle, { color: C.ink3 }]} numberOfLines={1}>
          {tipo}
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
