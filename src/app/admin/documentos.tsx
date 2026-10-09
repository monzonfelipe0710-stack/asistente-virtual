import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "@/components/ui/Text";

import { Radius, Spacing, Type, useColors } from "@/constants/theme";
import {
  documentCategories,
  documentFormats,
  documents as initialDocs,
  type DocumentCategory,
  type DocumentFormat,
  type MockDocument,
} from "@/data/mockDocuments";
import { useSortable } from "@/hooks/useSortable";
import { formatDate } from "@/utils/date";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { Btn } from "@/components/ui/Btn";
import { Field, Input } from "@/components/ui/Fields";
import { EmptyState, Row, SkeletonList } from "@/components/ui/Lists";
import { Screen, PageHeader } from "@/components/ui/Screen";
import { Select } from "@/components/ui/Select";

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
  const C = useColors();
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
      push("El título es obligatorio.");
      return;
    }

    if (editDoc) {
      setDocs((prev) => prev.map((d) => (d.id === editDoc.id ? { ...d, ...form } : d)));
      push("Documento actualizado.");
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
      push("Documento creado.");
    }
    setFormOpen(false);
  }

  function confirmDelete() {
    setDocs((prev) => prev.filter((d) => d.id !== deleteId));
    setDeleteId(null);
    push("Documento eliminado.");
  }

  if (loading) {
    return (
      <Screen>
        <View>
          <SkeletonList rows={5} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader
        title="Documentos"
        description={`Formularios que los agentes pueden descargar. ${docs.length} archivos · ${totalDownloads.toLocaleString("es-AR")} descargas.`}
      />

      <Tabs
        items={documentCategories.map((cat) => ({
          id: cat,
          label: cat,
          count: catCounts[cat] ?? 0,
        }))}
        value={filterCat}
        onChange={(cat) => {
          setFilterCat(cat);
          setPage(1);
        }}
      />

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
            color={C.ink2}
          />
        </Pressable>
      </View>

      <View style={{ marginTop: Spacing[3] }}>
        {paginatedItems.map((doc) => (
          <Row
            key={doc.id}
            onPress={() => openEdit(doc)}
            accessibilityLabel={`Editar ${doc.title}`}
            style={styles.line}
          >
            <View style={[styles.fileIcon, { backgroundColor: C.surface }]}>
              <Icon name="file" size={20} color={C.ink2} />
            </View>

            <View style={styles.body}>
              <Text style={[styles.title, { color: C.ink }]} numberOfLines={2}>
                {doc.title}
              </Text>
              <Text style={[styles.meta, { color: C.ink3 }]} numberOfLines={1}>
                {doc.format} · {doc.fileSize} · {doc.downloads.toLocaleString("es-AR")} descargas
              </Text>
            </View>

            <Text style={[Type.meta, { color: C.ink3 }]}>{doc.category}</Text>
          </Row>
        ))}

        {paginatedItems.length === 0 && (
          <EmptyState title="No hay documentos en esta categoría." />
        )}

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </View>

      <Pressable
        onPress={openNew}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.upload,
          { borderColor: C.border, backgroundColor: pressed ? C.surface : "transparent" },
        ]}
      >
        <Icon name="upload" size={18} color={C.ink} />
        <Text style={{ fontSize: 15, fontWeight: "500", color: C.ink }}>Subir documento</Text>
      </Pressable>

      <Modal
        open={formOpen}
        title={editDoc ? "Editar documento" : "Nuevo documento"}
        onClose={() => setFormOpen(false)}
        footer={
          <Btn label={editDoc ? "Guardar cambios" : "Crear documento"} onPress={save} />
        }
      >
        <Field label="Título">
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

        {!!editDoc && (
          <Btn
            label="Eliminar documento"
            variant="danger"
            size="md"
            onPress={() => {
              setFormOpen(false);
              setDeleteId(editDoc.id);
            }}
          />
        )}
      </Modal>

      <Modal
        open={deleteId !== null}
        title="Eliminar documento"
        onClose={() => setDeleteId(null)}
        footer={
          <>
            <Btn label="Cancelar" variant="secondary" onPress={() => setDeleteId(null)} />
            <Btn label="Eliminar" variant="dangerFill" onPress={confirmDelete} />
          </>
        }
      >
        <Text style={[Type.body, { color: C.ink2 }]}>
          Se elimina “{docs.find((d) => d.id === deleteId)?.title}”. No se puede
          deshacer.
        </Text>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sortBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
    marginTop: Spacing[4],
  },
  sortDir: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  line: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[4],
    paddingVertical: 14,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "500",
  },
  meta: {
    ...Type.overline,
    letterSpacing: 0,
    marginTop: 2,
  },
  upload: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing[2],
    height: 48,
    borderWidth: 1,
    borderRadius: Radius.xl,
    marginTop: Spacing[6],
  },
});
