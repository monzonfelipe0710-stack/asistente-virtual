import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Spacing, Type, useAdminColors } from "../../constants/theme";
import {
  documentCategories,
  documentFormats,
  documents as initialDocs,
  type DocumentCategory,
  type DocumentFormat,
  type MockDocument,
} from "../../data/mockDocuments";
import { useSortable } from "../../hooks/useSortable";
import { formatDate } from "../../utils/date";
import Modal from "../common/Modal";
import Pagination, { usePagination } from "../common/Pagination";
import { useToast } from "../common/Toast";
import {
  AdminScreen,
  Btn,
  EmptyState,
  Field,
  FilterChip,
  Input,
  ListCard,
  PageHeader,
  Row,
  Select,
  SkeletonList,
} from "./ui";

type DocCategory = Exclude<DocumentCategory, "Todos">;

interface DocForm {
  title: string;
  description: string;
  category: DocCategory;
  format: DocumentFormat;
  fileSize: string;
}

const EMPTY_DOC: DocForm = {
  title: "",
  description: "",
  category: "Formularios",
  format: "PDF",
  fileSize: "",
};

const EDITABLE_CATEGORIES = documentCategories.filter(
  (c): c is DocCategory => c !== "Todos"
);

/** Etiqueta visible → campo por el que se ordena. */
const SORT_OPTIONS = {
  Título: "title",
  Categoría: "category",
  Descargas: "downloads",
  Actualizado: "updatedAt",
} as const;

type SortLabel = keyof typeof SORT_OPTIONS;

export default function DocumentManager() {
  const C = useAdminColors();
  const push = useToast();

  const [docs, setDocs] = useState<MockDocument[]>(initialDocs);
  const [filterCat, setFilterCat] = useState<DocumentCategory>("Todos");
  const [sortLabel, setSortLabel] = useState<SortLabel>("Título");
  const [formOpen, setFormOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<MockDocument | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<DocForm>(EMPTY_DOC);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(
    () => (filterCat === "Todos" ? docs : docs.filter((d) => d.category === filterCat)),
    [docs, filterCat]
  );

  const { sorted, sortDir, toggleSort } = useSortable(filtered, "title", "asc");
  const { page, totalPages, paginatedItems, setPage } = usePagination(sorted, 6);

  const totalDownloads = docs.reduce((s, d) => s + d.downloads, 0);

  const catCounts: Record<string, number> = { Todos: docs.length };
  for (const c of EDITABLE_CATEGORIES) {
    catCounts[c] = docs.filter((d) => d.category === c).length;
  }

  function changeSort(label: SortLabel) {
    setSortLabel(label);
    toggleSort(SORT_OPTIONS[label]);
  }

  function openNew() {
    setEditDoc(null);
    setForm(EMPTY_DOC);
    setFormOpen(true);
  }

  function openEdit(doc: MockDocument) {
    setEditDoc(doc);
    setForm({
      title: doc.title,
      description: doc.description,
      category: doc.category,
      format: doc.format,
      fileSize: doc.fileSize,
    });
    setFormOpen(true);
  }

  function save() {
    if (!form.title.trim()) {
      push("El título es obligatorio.", "error");
      return;
    }

    if (editDoc) {
      setDocs((prev) => prev.map((d) => (d.id === editDoc.id ? { ...d, ...form } : d)));
      push("Documento actualizado.", "success");
    } else {
      setDocs((prev) => [
        ...prev,
        {
          id: Math.max(0, ...prev.map((d) => d.id)) + 1,
          ...form,
          fileSize: form.fileSize || "—",
          downloads: 0,
          updatedAt: formatDate(new Date()),
        },
      ]);
      push("Documento creado.", "success");
    }
    setFormOpen(false);
  }

  function confirmDelete() {
    setDocs((prev) => prev.filter((d) => d.id !== deleteId));
    setDeleteId(null);
    push("Documento eliminado.", "info");
  }

  /** El color del formato lo hace reconocible de un vistazo en la lista. */
  function formatColor(format: DocumentFormat) {
    return format === "PDF" ? C.bad : format === "DOCX" ? C.info : C.ok;
  }

  if (loading) {
    return (
      <AdminScreen>
        <ListCard>
          <SkeletonList rows={5} />
        </ListCard>
      </AdminScreen>
    );
  }

  return (
    <AdminScreen>
      <PageHeader
        title="Documentos"
        description={`${docs.length} archivos · ${totalDownloads.toLocaleString("es-AR")} descargas`}
      >
        <Btn label="Nuevo documento" icon="add" onPress={openNew} />
      </PageHeader>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {documentCategories.map((cat) => (
          <FilterChip
            key={cat}
            label={cat}
            count={catCounts[cat] ?? 0}
            active={filterCat === cat}
            onPress={() => {
              setFilterCat(cat);
              setPage(1);
            }}
          />
        ))}
      </ScrollView>

      {/* Un desplegable y un botón de sentido, en vez de cuatro textos con flechas */}
      <View style={styles.sortBar}>
        <View style={{ flex: 1 }}>
          <Select
            value={sortLabel}
            options={Object.keys(SORT_OPTIONS) as SortLabel[]}
            onChange={changeSort}
          />
        </View>
        <Pressable
          onPress={() => toggleSort(SORT_OPTIONS[sortLabel])}
          accessibilityRole="button"
          accessibilityLabel={
            sortDir === "asc" ? "Orden ascendente, cambiar a descendente" : "Orden descendente, cambiar a ascendente"
          }
          style={({ pressed }) => [styles.sortDir, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons
            name={sortDir === "asc" ? "arrow-up" : "arrow-down"}
            size={18}
            color={C.muted}
          />
        </Pressable>
      </View>

      <ListCard style={{ marginTop: Spacing[3] }}>
        {paginatedItems.map((doc, i) => (
          <Row key={doc.id} first={i === 0}>
            <View style={styles.line}>
              <View style={styles.fileIcon}>
                <Text style={[Type.metaStrong, { color: formatColor(doc.format) }]}>
                  {doc.format}
                </Text>
              </View>

              <View style={styles.body}>
                <Text style={[Type.bodyStrong, { color: C.ink }]} numberOfLines={2}>
                  {doc.title}
                </Text>
                <Text style={[Type.meta, { color: C.muted }]} numberOfLines={2}>
                  {doc.description}
                </Text>
                <Text style={[Type.meta, { color: C.faint, marginTop: 2 }]} numberOfLines={1}>
                  {doc.category} · {doc.fileSize}
                </Text>
                <Text style={[Type.meta, { color: C.faint }]} numberOfLines={1}>
                  {doc.downloads.toLocaleString("es-AR")} descargas · actualizado{" "}
                  {doc.updatedAt}
                </Text>
              </View>

              <View style={styles.actions}>
                <Pressable
                  onPress={() => openEdit(doc)}
                  accessibilityRole="button"
                  accessibilityLabel={`Editar ${doc.title}`}
                  hitSlop={8}
                >
                  <Ionicons name="create-outline" size={20} color={C.muted} />
                </Pressable>
                <Pressable
                  onPress={() => setDeleteId(doc.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Eliminar ${doc.title}`}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={20} color={C.bad} />
                </Pressable>
              </View>
            </View>
          </Row>
        ))}

        {paginatedItems.length === 0 && (
          <EmptyState
            icon="folder-open-outline"
            title="Sin documentos"
            description="No hay documentos en esta categoría."
            action={<Btn label="Nuevo documento" icon="add" onPress={openNew} />}
          />
        )}

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </ListCard>

      <Modal
        open={formOpen}
        title={editDoc ? "Editar documento" : "Nuevo documento"}
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <Btn label="Cancelar" variant="ghost" onPress={() => setFormOpen(false)} />
            <Btn label={editDoc ? "Guardar cambios" : "Crear documento"} onPress={save} />
          </>
        }
      >
        <Field label="Título" required>
          <Input
            value={form.title}
            onChangeText={(title) => setForm((f) => ({ ...f, title }))}
            placeholder="Formulario de licencia anual"
          />
        </Field>

        <Field label="Descripción" hint="Para qué sirve, en una línea">
          <Input
            value={form.description}
            onChangeText={(description) => setForm((f) => ({ ...f, description }))}
            placeholder="Solicitud de licencia anual ordinaria"
            multiline
            style={{ minHeight: 72, textAlignVertical: "top" }}
          />
        </Field>

        <View style={{ flexDirection: "row", gap: Spacing[3] }}>
          <View style={{ flex: 1 }}>
            <Field label="Categoría">
              <Select
                value={form.category}
                options={EDITABLE_CATEGORIES}
                onChange={(category) => setForm((f) => ({ ...f, category }))}
              />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Formato">
              <Select
                value={form.format}
                options={documentFormats}
                onChange={(format) => setForm((f) => ({ ...f, format }))}
              />
            </Field>
          </View>
        </View>

        <Field label="Tamaño">
          <Input
            value={form.fileSize}
            onChangeText={(fileSize) => setForm((f) => ({ ...f, fileSize }))}
            placeholder="245 KB"
          />
        </Field>
      </Modal>

      <Modal
        open={deleteId !== null}
        title="Eliminar documento"
        onClose={() => setDeleteId(null)}
        footer={
          <>
            <Btn label="Cancelar" variant="ghost" onPress={() => setDeleteId(null)} />
            <Btn label="Eliminar" variant="danger" onPress={confirmDelete} />
          </>
        }
      >
        <Text style={[Type.body, { color: C.muted }]}>
          Se elimina “{docs.find((d) => d.id === deleteId)?.title}”. No se puede
          deshacer.
        </Text>
      </Modal>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: "row",
    gap: Spacing[2],
    paddingRight: Spacing[4],
  },
  sortBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
    marginTop: Spacing[3],
  },
  sortDir: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  line: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing[3],
  },
  fileIcon: {
    width: 44,
    paddingTop: 2,
    alignItems: "flex-start",
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  actions: {
    gap: Spacing[3],
    alignItems: "center",
    paddingTop: 2,
  },
});
