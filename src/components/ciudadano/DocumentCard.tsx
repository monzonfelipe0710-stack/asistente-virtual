import { useMemo } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Text } from "../common/Text";
import Icon from "../common/Icon";
import { useToast } from "../common/Toast";
import { MockDocument } from "../../data/mockDocuments";
import { Fonts, Palette, Radius, Spacing, useColors } from "../../constants/theme";

interface Props {
  document: MockDocument;
}

/**
 * Fila de descarga: tarjeta gris de radio 16, ícono de documento en una caja
 * de 40 del color del fondo, nombre 15/500, formato y peso en Geist Mono.
 */
export default function DocumentCard({ document }: Props) {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const toast = useToast();

  return (
    <Pressable
      onPress={() => toast("Descargando…")}
      accessibilityRole="button"
      accessibilityLabel={`Descargar ${document.title}, ${document.format}, ${document.fileSize}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: pressed ? C.surface2 : C.surface },
      ]}
    >
      <View style={styles.iconBox}>
        <Icon name="fileText" size={20} color={C.ink2} />
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {document.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {document.format} · {document.fileSize}
        </Text>
      </View>

      <Icon name="download" size={20} color={C.ink2} />
    </Pressable>
  );
}

const createStyles = (C: Palette) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing[4],
      paddingHorizontal: Spacing[4],
      paddingVertical: 14,
      borderRadius: Radius.xl,
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: Radius.lg,
      backgroundColor: C.canvas,
      justifyContent: "center",
      alignItems: "center",
    },
    info: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "500",
      color: C.ink,
    },
    meta: {
      fontSize: 11,
      lineHeight: 14,
      fontFamily: Fonts.mono,
      letterSpacing: 0.66,
      textTransform: "uppercase",
      color: C.ink3,
      marginTop: Spacing[1],
    },
  });
