import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Encabezado } from "@/components/menu/Encabezado";
import { Icon } from "@/components/ui/Icon";
import { Screen } from "@/components/ui/Screen";
import { Tabs } from "@/components/ui/Tabs";
import { Text } from "@/components/ui/Text";
import { useToast } from "@/components/ui/Toast";
import { Fonts, Radius, Spacing, Type, Weight, useColors } from "@/constants/theme";
import {
  documentCategories,
  documents,
  type DocumentCategory,
  type MockDocument,
} from "@/data/mockDocuments";

/** Ruta "/descargas": formularios y notas, filtrados por categoría. */
export default function Descargas() {
  const C = useColors();
  const [categoria, setCategoria] = useState<DocumentCategory>("Todos");

  const visibles =
    categoria === "Todos" ? documents : documents.filter((d) => d.category === categoria);

  const pestanias = documentCategories.map((nombre) => ({
    id: nombre,
    label: nombre,
    count:
      nombre === "Todos" ? documents.length : documents.filter((d) => d.category === nombre).length,
  }));

  return (
    <View style={[styles.pantalla, { backgroundColor: C.canvas }]}>
      <Encabezado titulo="Descargas" />

      <Screen>
        <Text style={[Type.lead, { color: C.ink2, marginBottom: Spacing[2] }]}>
          Formularios y notas para tus trámites.
        </Text>

        <Tabs items={pestanias} value={categoria} onChange={setCategoria} />

        <View style={styles.lista}>
          {visibles.map((documento) => (
            <TarjetaDeDocumento key={documento.id} documento={documento} />
          ))}
        </View>
      </Screen>
    </View>
  );
}

/**
 * Fila de descarga: tarjeta gris de radio 16, ícono de documento en una caja de
 * 40 del color del fondo, nombre, y formato y peso en Geist Mono.
 */
function TarjetaDeDocumento({ documento }: { documento: MockDocument }) {
  const C = useColors();
  const toast = useToast();

  return (
    <Pressable
      onPress={() => toast("Descargando…")}
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
  pantalla: {
    flex: 1,
  },
  lista: {
    gap: Spacing[2],
    marginTop: Spacing[4],
  },
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
