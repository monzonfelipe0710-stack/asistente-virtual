import { useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "@/compartido/ui/Text";

import { Radius, Spacing, useColors } from "@/compartido/constantes/theme";
import {
  documentCategories,
  documentFormats,
  type DocumentCategory,
  type DocumentFormat,
  type MockDocument,
} from "@/funcionalidades/admin/documentos";
import { useSortable } from "@/funcionalidades/admin/hooks/useSortable";
import { Modal } from "@/compartido/ui/Modal";
import { Icon } from "@/compartido/ui/Icon";
import { usePagination } from "@/funcionalidades/admin/hooks/usePagination";
import { Pagination } from "@/compartido/ui/Pagination";
import { Tabs } from "@/compartido/ui/Tabs";
import { useAvisoNoDisponible } from "@/compartido/ui/AvisoNoDisponible";
import { useToast } from "@/compartido/ui/Toast";
import { AvisoDeEjemplo } from "@/compartido/ui/AvisoDeEjemplo";
import { Btn } from "@/compartido/ui/Btn";
import { Field } from "@/compartido/ui/Field";
import { Input } from "@/compartido/ui/Input";
import { EmptyState } from "@/compartido/ui/EmptyState";
import { Screen } from "@/compartido/ui/Screen";
import { PageHeader } from "@/compartido/ui/PageHeader";
import { Select } from "@/compartido/ui/Select";

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
  const avisarNoDisponible = useAvisoNoDisponible();

  const [docs] = useState<MockDocument[]>([]);
  const [filterCat, setFilterCat] = useState<DocumentCategory>("Todos");
  const [sortLabel, setSortLabel] = useState<SortLabel>("Título");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<DocForm>(EMPTY_DOC);

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
    if (label === sortLabel) return;
    setSortLabel(label);
    toggleSort(SORT_OPTIONS[label]);
  }

  function openNew() {
    setForm(EMPTY_DOC);
    setFormOpen(true);
  }

  function save() {
    if (!form.title.trim()) {
      push("El título es obligatorio.");
      return;
    }

    avisarNoDisponible();
  }

  return (
    <Screen>
      <PageHeader
        title="Documentos"
        description={`Formularios que los agentes pueden descargar. ${docs.length} archivos · ${totalDownloads.toLocaleString("es-AR")} descargas.`}
      />

      <AvisoDeEjemplo />

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
          <Icon
            name={sortDir === "asc" ? "arrowUp" : "arrowDown"}
            size={18}
            color={C.ink2}
          />
        </Pressable>
      </View>

      <View style={{ marginTop: Spacing[3] }}>
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
        title="Nuevo documento"
        onClose={() => setFormOpen(false)}
        footer={
          <Btn label="Crear documento" onPress={save} />
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
