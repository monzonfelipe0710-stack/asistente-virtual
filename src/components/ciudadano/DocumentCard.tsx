import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { MockDocument } from "../../data/mockDocuments";
import Card from "../common/Card";
import { Colors, Typography, Spacing, Radius } from "../../constants/theme";

interface Props {
  document: MockDocument;
}

const formatConfig = {
  PDF: { bg: Colors.pdfBg, text: Colors.pdfText, label: "PDF" },
  DOCX: { bg: Colors.docxBg, text: Colors.docxText, label: "DOC" },
  XLSX: { bg: Colors.xlsxBg, text: Colors.xlsxText, label: "XLS" },
};

export default function DocumentCard({ document }: Props) {
  const fmt = formatConfig[document.format] ?? formatConfig.PDF;
  const categoryTag = document.category.slice(0, -1);

  return (
    <Card style={styles.card}>
      <View style={[styles.formatBadge, { backgroundColor: fmt.bg }]}>
        <Text style={[styles.formatText, { color: fmt.text }]}>{fmt.label}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {document.title}
        </Text>
        <Text style={styles.description} numberOfLines={1}>
          {document.description}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.fileSize}>{document.fileSize}</Text>
          <Text style={styles.separator}>|</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{categoryTag}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.downloadBtn}
        onPress={() => Alert.alert("Descarga", `Descargando: ${document.title}`)}
        activeOpacity={0.7}
      >
        <Text style={styles.downloadText}>Descargar</Text>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    padding: Spacing[3],
    borderRadius: Radius.lg,
    marginBottom: Spacing[2],
  },
  formatBadge: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  formatText: {
    fontSize: 10,
    fontWeight: Typography.bold,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.slate800,
  },
  description: {
    fontSize: Typography.xs,
    color: Colors.slate500,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[1],
    marginTop: 2,
  },
  fileSize: {
    fontSize: Typography.xs,
    color: Colors.slate400,
  },
  separator: {
    fontSize: Typography.xs,
    color: Colors.slate300,
  },
  categoryBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  categoryText: {
    fontSize: Typography.xs,
    color: Colors.primary,
    fontWeight: Typography.medium,
  },
  downloadBtn: {
    paddingHorizontal: Spacing[3],
    paddingVertical: 7,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    flexShrink: 0,
  },
  downloadText: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
    color: Colors.primary,
  },
});