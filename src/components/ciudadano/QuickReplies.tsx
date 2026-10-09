import { memo, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "../common/Text";
import { quickReplies as options } from "../../data/mockQuickReplies";
import { Palette, Radius, Spacing, useColors } from "../../constants/theme";

interface Props {
  onSelect: (query: string) => void;
}

/**
 * Sugerencias de la bienvenida: tarjetas de 184 px con título y descripción,
 * sin color de ícono, pegadas a la barra de mensaje (12 px).
 */
function QuickReplies({ onSelect }: Props) {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // sin esto el primer toque solo cierra el teclado y hay que tocar dos veces
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.scroll}
      style={styles.container}
    >
      {options.map((opt) => (
        <Pressable
          key={opt.label}
          onPress={() => onSelect(opt.query)}
          accessibilityRole="button"
          accessibilityLabel={`${opt.label}. ${opt.description}`}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: pressed ? C.surface2 : C.surface },
          ]}
        >
          <Text style={styles.label}>{opt.label}</Text>
          <Text style={styles.description}>{opt.description}</Text>
        </Pressable>
      ))}
      <View style={styles.endPad} />
    </ScrollView>
  );
}

export default memo(QuickReplies);

const createStyles = (C: Palette) =>
  StyleSheet.create({
    container: {
      flexGrow: 0,
    },
    scroll: {
      paddingLeft: Spacing[5],
      paddingBottom: Spacing[3],
      gap: Spacing[2],
      flexDirection: "row",
      // sin esto las tarjetas se estiran al alto del carrusel
      alignItems: "flex-start",
    },
    card: {
      width: 184,
      gap: 2,
      paddingHorizontal: Spacing[4],
      paddingVertical: Spacing[3],
      borderRadius: Radius.xl,
    },
    label: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "500",
      color: C.ink,
    },
    description: {
      fontSize: 13,
      lineHeight: 18,
      color: C.ink2,
    },
    // margen final: la última tarjeta no queda pegada al borde al desplazar
    endPad: {
      width: Spacing[3],
    },
  });
