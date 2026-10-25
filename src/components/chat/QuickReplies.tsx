import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Icon } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";
import { Radius, Spacing, Type, useColors } from "@/constants/theme";
import { quickReplies } from "@/data/mockQuickReplies";
import { vibrarAlElegir } from "@/lib/haptica";

/**
 * Sugerencias de la bienvenida: filas con ícono en un recuadro, título,
 * descripción y flecha, separadas por una línea. Todas visibles a la vez y sin
 * desplazamiento, pegadas a la barra de mensaje.
 */
function QuickRepliesBase({ onSelect }: { onSelect: (consulta: string) => void }) {
  const C = useColors();

  return (
    <View style={styles.lista}>
      {quickReplies.map((sugerencia, indice) => (
        <Pressable
          key={sugerencia.label}
          onPress={() => {
            vibrarAlElegir();
            onSelect(sugerencia.query);
          }}
          accessibilityRole="button"
          accessibilityLabel={`${sugerencia.label}. ${sugerencia.description}`}
          style={({ pressed }) => [
            styles.fila,
            {
              borderBottomColor: C.border,
              borderBottomWidth: indice === quickReplies.length - 1 ? 0 : 1,
            },
            pressed && { backgroundColor: C.surface },
          ]}
        >
          <View style={[styles.icono, { backgroundColor: C.surface2 }]}>
            <Icon name={sugerencia.icon} size={22} color={C.ink} />
          </View>
          <View style={styles.texto}>
            <Text style={[Type.rowTitle, { color: C.ink }]}>{sugerencia.label}</Text>
            <Text style={[Type.meta, { color: C.ink2 }]}>{sugerencia.description}</Text>
          </View>
          <Icon name="chevronRight" size={20} color={C.ink2} />
        </Pressable>
      ))}
    </View>
  );
}

export const QuickReplies = memo(QuickRepliesBase);

const styles = StyleSheet.create({
  lista: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    paddingHorizontal: Spacing[5],
    paddingBottom: 6,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    minHeight: 64,
    paddingVertical: Spacing[3] + 2,
  },
  icono: {
    width: 44,
    height: 44,
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  texto: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
});
