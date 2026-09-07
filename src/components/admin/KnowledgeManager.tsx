import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Radius, Spacing, Type, useAdminColors } from "../../constants/theme";
import {
  knowledgeBase,
  knowledgeCategories,
  type KnowledgeCategory,
  type KnowledgeEntry,
} from "../../data/mockKnowledge";
import { useToast } from "../common/Toast";
import {
  AdminScreen,
  Btn,
  Card,
  CardHeader,
  EmptyState,
  Field,
  FilterChip,
  Input,
  ListCard,
  PageHeader,
  Row,
  Select,
} from "./ui";

type ArticleCategory = Exclude<KnowledgeCategory, "Todas">;

const EDITABLE_CATEGORIES = knowledgeCategories.filter(
  (c): c is ArticleCategory => c !== "Todas"
);

export default function KnowledgeManager() {
  const C = useAdminColors();
  const push = useToast();

  const [activeCategory, setActiveCategory] = useState<KnowledgeCategory>("Todas");
  const [items, setItems] = useState<KnowledgeEntry[]>(knowledgeBase);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState<ArticleCategory>("Licencias");
  const [error, setError] = useState("");

  const filtered = useMemo(
    () =>
      activeCategory === "Todas"
        ? items
        : items.filter((k) => k.category === activeCategory),
    [items, activeCategory]
  );

  function resetForm() {
    setEditingId(null);
    setQuestion("");
    setAnswer("");
    setCategory("Licencias");
    setError("");
  }

  function startEdit(article: KnowledgeEntry) {
    setEditingId(article.id);
    setQuestion(article.question);
    setAnswer(article.answer);
    setCategory(article.category);
    setError("");
  }

  function save() {
    if (!question.trim() || !answer.trim()) {
      setError("La pregunta y la respuesta son obligatorias.");
      return;
    }

    const now = new Date().toLocaleDateString("es-AR");

    if (editingId !== null) {
      setItems((prev) =>
        prev.map((k) =>
          k.id === editingId
            ? {
                ...k,
                question: question.trim(),
                answer: answer.trim(),
                category,
                updatedAt: now,
              }
            : k
        )
      );
      push("Artículo actualizado.", "success");
    } else {
      const nextId = Math.max(0, ...items.map((k) => k.id)) + 1;
      setItems((prev) => [
        {
          id: nextId,
          question: question.trim(),
          answer: answer.trim(),
          category,
          active: true,
          views: 0,
          createdAt: now,
          updatedAt: now,
        },
        ...prev,
      ]);
      push("Artículo agregado.", "success");
    }
    resetForm();
  }

  function toggleActive(id: number) {
    setItems((prev) =>
      prev.map((k) => (k.id === id ? { ...k, active: !k.active } : k))
    );
  }

  function deleteArticle(id: number) {
    setItems((prev) => prev.filter((k) => k.id !== id));
    if (editingId === id) resetForm();
    push("Artículo eliminado.", "info");
  }

  return (
    <AdminScreen>
      <PageHeader
        title="Base de conocimiento"
        description="Preguntas y respuestas con las que contesta el asistente."
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {knowledgeCategories.map((cat) => (
          <FilterChip
            key={cat}
            label={cat}
            active={activeCategory === cat}
            onPress={() => setActiveCategory(cat)}
          />
        ))}
      </ScrollView>

      <ListCard style={{ marginTop: Spacing[3] }}>
        {filtered.map((article, i) => (
          <Row key={article.id} first={i === 0}>
            <Text style={[Type.bodyStrong, { color: C.ink }]}>{article.question}</Text>

            <Text style={[Type.meta, { color: C.muted, marginTop: Spacing[1] }]}>
              {article.answer}
            </Text>

            <View style={styles.rowFoot}>
              {/* El estado se toca para cambiarlo: es a la vez indicador y control */}
              <Pressable
                onPress={() => toggleActive(article.id)}
                accessibilityRole="switch"
                accessibilityState={{ checked: article.active }}
                accessibilityLabel={`Artículo ${article.active ? "activo" : "inactivo"}`}
                style={({ pressed }) => [
                  styles.stateChip,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <View
                  style={[
                    styles.stateDot,
                    { backgroundColor: article.active ? C.ok : C.faint },
                  ]}
                />
                <Text
                  style={[Type.meta, { color: article.active ? C.ok : C.muted }]}
                >
                  {article.active ? "Activo" : "Inactivo"}
                </Text>
              </Pressable>

              <Text style={[Type.meta, { color: C.faint, flex: 1 }]} numberOfLines={1}>
                {article.category} · {article.views} consultas · {article.updatedAt}
              </Text>

              <Pressable
                onPress={() => startEdit(article)}
                accessibilityRole="button"
                accessibilityLabel={`Editar ${article.question}`}
                hitSlop={8}
              >
                <Ionicons name="create-outline" size={20} color={C.muted} />
              </Pressable>
              <Pressable
                onPress={() => deleteArticle(article.id)}
                accessibilityRole="button"
                accessibilityLabel={`Eliminar ${article.question}`}
                hitSlop={8}
              >
                <Ionicons name="trash-outline" size={20} color={C.bad} />
              </Pressable>
            </View>
          </Row>
        ))}

        {filtered.length === 0 && (
          <EmptyState
            icon="bulb-outline"
            title="Sin artículos"
            description="No hay artículos en esta categoría."
          />
        )}
      </ListCard>

      <Card style={{ marginTop: Spacing[6] }}>
        <CardHeader
          title={editingId !== null ? "Editar artículo" : "Agregar artículo"}
          subtitle={
            editingId !== null
              ? "Los cambios se aplican a lo que responde el asistente."
              : "Sumá una pregunta nueva a la base."
          }
        />
        <View style={styles.form}>
          <Field label="Pregunta" required error={error}>
            <Input
              value={question}
              onChangeText={setQuestion}
              placeholder="¿Cómo solicito licencia anual?"
            />
          </Field>

          <Field label="Respuesta" required>
            <Input
              value={answer}
              onChangeText={setAnswer}
              placeholder="Explicá el trámite paso a paso"
              multiline
              numberOfLines={4}
              style={{ minHeight: 96, textAlignVertical: "top" }}
            />
          </Field>

          <Field label="Categoría">
            <Select
              value={category}
              options={EDITABLE_CATEGORIES}
              onChange={setCategory}
            />
          </Field>

          <View style={styles.formActions}>
            {editingId !== null && (
              <Btn label="Cancelar" variant="ghost" onPress={resetForm} />
            )}
            <Btn
              label={editingId !== null ? "Guardar cambios" : "Agregar artículo"}
              onPress={save}
            />
          </View>
        </View>
      </Card>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: "row",
    gap: Spacing[2],
    paddingRight: Spacing[4],
  },
  rowFoot: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    marginTop: Spacing[3],
  },
  stateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  stateDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
  },
  form: {
    paddingTop: Spacing[4],
    gap: Spacing[4],
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing[2],
  },
});
