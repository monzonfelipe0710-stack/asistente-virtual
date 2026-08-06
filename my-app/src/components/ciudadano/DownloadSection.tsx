import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import DocumentCard from "./DocumentCard";
import FilterPill from "../common/FilterPill";
import { documents, documentCategories, DocumentCategory } from "../../data/mockDocuments";
import { Colors, Typography, Spacing, Radius, Shadows } from "../../constants/theme";

export default function DownloadSection() {
  const [activeCategory, setActiveCategory] = useState<DocumentCategory>("Todos");

  const filtered =
    activeCategory === "Todos"
      ? documents
      : documents.filter((d) => d.category === activeCategory);

  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Descargas</Text>
        <Text style={styles.subtitle}>Formularios, guías y plantillas administrativas</Text>
      </View>

      {/* Category filter */}
      <FilterPill
        options={documentCategories}
        active={activeCategory}
        onChange={(cat) => setActiveCategory(cat as DocumentCategory)}
        containerStyle={styles.filterScroll}
      />

      {/* Document list */}
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

const styles = StyleSheet.create({
  section: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.slate200,
    overflow: "hidden",
    ...Shadows.sm,
  },
  header: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate100,
  },
  title: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.slate800,
  },
  subtitle: {
    fontSize: Typography.xs,
    color: Colors.slate500,
    marginTop: 2,
  },
  filterScroll: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    gap: Spacing[2],
    flexDirection: "row",
    backgroundColor: Colors.slate50,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate100,
  },
  list: {
    padding: Spacing[4],
  },
  empty: {
    textAlign: "center",
    color: Colors.slate400,
    fontSize: Typography.sm,
    paddingVertical: Spacing[6],
  },
});