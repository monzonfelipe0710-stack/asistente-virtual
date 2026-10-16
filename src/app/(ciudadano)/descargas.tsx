import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { TarjetaDeDocumento } from "@/components/descargas/TarjetaDeDocumento";
import { Encabezado } from "@/components/menu/Encabezado";
import { Screen } from "@/components/ui/Screen";
import { Tabs } from "@/components/ui/Tabs";
import { Text } from "@/components/ui/Text";
import { Spacing, Type, useColors } from "@/constants/theme";
import { documentCategories, type DocumentCategory, type MockDocument } from "@/data/mockDocuments";

/** Ruta "/descargas": formularios y notas, filtrados por categoría. */
export default function Descargas() {
  const C = useColors();
  const [documents] = useState<MockDocument[]>([]);
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

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  lista: {
    gap: Spacing[2],
    marginTop: Spacing[4],
  },
});
