import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/Text";

import { Spacing, Type, useColors } from "@/constants/theme";
import {
  knowledgeCategories,
  type KnowledgeCategory,
  type KnowledgeEntry,
} from "@/data/mockKnowledge";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { useAvisoNoDisponible } from "@/components/ui/AvisoNoDisponible";
import { Badge } from "@/components/ui/Badge";
import { AvisoDeEjemplo } from "@/components/ui/AvisoDeEjemplo";
import { Btn } from "@/components/ui/Btn";
import { Segmented } from "@/components/ui/Segmented";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Row } from "@/components/ui/Row";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { formatDate } from "@/utils/date";

type ArticleCategory = Exclude<KnowledgeCategory, "Todas">;
type Visibility = "Publicado" | "Borrador";

const EDITABLE_CATEGORIES = knowledgeCategories.filter(
  (c): c is ArticleCategory => c !== "Todas"
);
const VISIBILITY: Visibility[] = ["Publicado", "Borrador"];

export default function KnowledgeManager() {
  const C = useColors();
  const avisarNoDisponible = useAvisoNoDisponible();

  const [activeCategory, setActiveCategory] = useState<KnowledgeCategory>("Todas");
  const [items] = useState<KnowledgeEntry[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState<ArticleCategory>("Licencias");
  const [visibility, setVisibility] = useState<Visibility>("Publicado");
  const [error, setError] = useState("");

  const filtered = useMemo(
    () =>
      activeCategory === "Todas"
        ? items
        : items.filter((k) => k.category === activeCategory),
    [items, activeCategory]
  );

  const published = items.filter((k) => k.active).length;

  function openNew() {
    setEditingId(null);
    setQuestion("");
    setAnswer("");
    setCategory("Licencias");
    setVisibility("Publicado");
    setError("");
    setSheetOpen(true);
  }

  function startEdit(article: KnowledgeEntry) {
    setEditingId(article.id);
    setQuestion(article.question);
    setAnswer(article.answer);
    setCategory(article.category);
    setVisibility(article.active ? "Publicado" : "Borrador");
    setError("");
    setSheetOpen(true);
  }

  function save() {
    if (!question.trim() || !answer.trim()) {
      setError("La pregunta y la respuesta son obligatorias.");
      return;
    }

    avisarNoDisponible();
  }

  function deleteArticle() {
    if (editingId === null) return;
    avisarNoDisponible();
  }

  return (
    <Screen>
      <PageHeader
        title="Conocimiento"
        description="Lo que sabe el asistente y con qué responde."
      />

      <AvisoDeEjemplo />

      <Tabs
        items={knowledgeCategories.map((cat) => ({
          id: cat,
          label: cat,
          count:
            cat === "Todas"
              ? items.length
              : items.filter((k) => k.category === cat).length,
        }))}
        value={activeCategory}
        onChange={setActiveCategory}
      />

      <View style={{ marginTop: Spacing[6] }}>
        <SectionHeader
          title="Artículos"
          subtitle={`${published} publicados · tocá uno para editarlo`}
          right={<Btn label="Nuevo" variant="ghost" size="md" onPress={openNew} />}
        />

        {filtered.map((article) => (
          <Row
            key={article.id}
            onPress={() => startEdit(article)}
            accessibilityLabel={`Editar ${article.question}`}
            style={styles.row}
          >
            <View style={styles.body}>
              <Text style={[styles.title, { color: C.ink }]} numberOfLines={2}>
                {article.question}
              </Text>
              <Text style={[Type.meta, { color: C.ink3 }]} numberOfLines={1}>
                {article.category} · {article.views} consultas · {formatDate(article.updatedAt)}
              </Text>
            </View>
            <Badge
              label={article.active ? "Publicado" : "Borrador"}
              tone={article.active ? "ok" : "muted"}
            />
          </Row>
        ))}

        {filtered.length === 0 && <EmptyState title="No hay artículos en esta categoría." />}
      </View>

      <Modal
        open={sheetOpen}
        title={editingId !== null ? "Editar artículo" : "Nuevo artículo"}
        onClose={() => setSheetOpen(false)}
        footer={
          <Btn
            label={editingId !== null ? "Guardar cambios" : "Publicar en Conocimiento"}
            onPress={save}
          />
        }
      >
        <Field label="Pregunta" error={error}>
          <Input
            value={question}
            onChangeText={setQuestion}
            placeholder="¿Cómo solicito licencia anual?"
          />
        </Field>

        <Field label="Respuesta del asistente">
          <Input
            value={answer}
            onChangeText={setAnswer}
            placeholder="Escribí la respuesta que va a dar ChatAP…"
            multiline
            style={{ minHeight: 120 }}
          />
        </Field>

        <Field label="Categoría">
          <Select value={category} options={EDITABLE_CATEGORIES} onChange={setCategory} />
        </Field>

        <Field label="Estado">
          <Segmented value={visibility} options={VISIBILITY} onChange={setVisibility} />
        </Field>

        {editingId !== null && (
          <Btn label="Eliminar artículo" variant="danger" size="md" onPress={deleteArticle} />
        )}
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    paddingVertical: 14,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "500",
  },
});
