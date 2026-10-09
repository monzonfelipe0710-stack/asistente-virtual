import { useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "../common/Text";
import DocumentCard from "./DocumentCard";
import Tabs from "../common/Tabs";
import { documents, documentCategories, DocumentCategory } from "../../data/mockDocuments";
import { Palette, Spacing, Type, useColors } from "../../constants/theme";

export default function DownloadSection() {
  const [activeCategory, setActiveCategory] = useState<DocumentCategory>("Todos");
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);

  const filtered =
    activeCategory === "Todos"
      ? documents
      : documents.filter((d) => d.category === activeCategory);

  const tabs = documentCategories.map((cat) => ({
    id: cat,
    label: cat,
    count:
      cat === "Todos"
        ? documents.length
        : documents.filter((d) => d.category === cat).length,
  }));

  return (
    <View>
      <Text style={styles.subtitle}>Formularios y notas para tus trámites.</Text>

      <Tabs items={tabs} value={activeCategory} onChange={setActiveCategory} />

      <View style={styles.list}>
        {filtered.length > 0 ? (
          filtered.map((doc) => <DocumentCard key={doc.id} document={doc} />)
        ) : (
          <Text style={styles.empty}>No hay documentos en esta categoría.</Text>
        )}
      </View>
    </View>
  );
}

const createStyles = (C: Palette) =>
  StyleSheet.create({
    subtitle: {
      ...Type.lead,
      color: C.ink2,
      marginBottom: Spacing[2],
    },
    list: {
      gap: Spacing[2],
      marginTop: Spacing[4],
    },
    empty: {
      ...Type.lead,
      textAlign: "center",
      color: C.ink2,
      paddingVertical: Spacing[10],
    },
  });
