import { memo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/Text";
import { Radius, Spacing, Weight, useColors } from "@/constants/theme";
import { quickReplies } from "@/data/mockQuickReplies";

/**
 * Sugerencias de la bienvenida: tarjetas de 184 con título y descripción, sin
 * color de ícono, pegadas a la barra de mensaje.
 */
function QuickRepliesBase({ onSelect }: { onSelect: (consulta: string) => void }) {
  const C = useColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // Sin esto el primer toque solo cierra el teclado y hay que tocar dos veces.
      keyboardShouldPersistTaps="handled"
      style={styles.carrusel}
      contentContainerStyle={styles.contenido}
    >
      {quickReplies.map((sugerencia) => (
        <Pressable
          key={sugerencia.label}
          onPress={() => onSelect(sugerencia.query)}
          accessibilityRole="button"
          accessibilityLabel={`${sugerencia.label}. ${sugerencia.description}`}
          style={({ pressed }) => [
            styles.tarjeta,
            { backgroundColor: pressed ? C.surface2 : C.surface },
          ]}
        >
          <Text style={[styles.titulo, { color: C.ink }]}>{sugerencia.label}</Text>
          <Text style={[styles.descripcion, { color: C.ink2 }]}>{sugerencia.description}</Text>
        </Pressable>
      ))}
      {/* Margen final: la última tarjeta no queda pegada al borde al desplazar. */}
      <View style={styles.margenFinal} />
    </ScrollView>
  );
}

export const QuickReplies = memo(QuickRepliesBase);

const styles = StyleSheet.create({
  carrusel: {
    flexGrow: 0,
  },
  contenido: {
    flexDirection: "row",
    // Sin esto las tarjetas se estiran al alto del carrusel.
    alignItems: "flex-start",
    gap: Spacing[2],
    paddingLeft: Spacing[5],
    paddingBottom: Spacing[3],
  },
  tarjeta: {
    width: 184,
    gap: 2,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderRadius: Radius.xl,
  },
  titulo: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: Weight.medium,
  },
  descripcion: {
    fontSize: 13,
    lineHeight: 18,
  },
  margenFinal: {
    width: Spacing[3],
  },
});
