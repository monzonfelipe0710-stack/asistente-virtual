import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Spacing, Type, useAdminColors } from "../../constants/theme";
import { useAdmin } from "../../context/AdminContext";
import {
  createMesaEntrada,
  initialMesaEntradas,
  mesaDependencias,
  mesaPriorities,
  mesaStatuses,
  mesaTipoDocumento,
  peekNextMesaId,
  type MesaAdjunto,
  type MesaEntrada,
  type MesaPriority,
  type MesaStatus,
} from "../../data/mockMesaEntrada";
import { formatDate } from "../../utils/date";
import Modal from "../common/Modal";
import { useToast } from "../common/Toast";
import {
  AdminScreen,
  Badge,
  Btn,
  Card,
  EmptyState,
  Field,
  FilterChip,
  Input,
  KeyValue,
  ListCard,
  PageHeader,
  StatGrid,
  PriorityDot,
  Row,
  SectionTitle,
  Segmented,
  Select,
  StatCard,
  type Tone,
} from "./ui";

const STATUS_TONE: Record<MesaStatus, Tone> = {
  Ingresado: "info",
  "En proceso": "warn",
  Observado: "bad",
  Finalizado: "ok",
};

const MAX_ASUNTO = 120;

interface FormState {
  solicitante: string;
  tipo: string;
  dependencia: string;
  prioridad: MesaPriority;
  asunto: string;
  observaciones: string;
}

const EMPTY_FORM: FormState = {
  solicitante: "",
  tipo: mesaTipoDocumento[0],
  dependencia: "Mesa de Entradas",
  prioridad: "Normal",
  asunto: "",
  observaciones: "",
};

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MesaDeEntrada() {
  const C = useAdminColors();
  const { can, role } = useAdmin();
  const push = useToast();

  const [items, setItems] = useState<MesaEntrada[]>(initialMesaEntradas);
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"todos" | MesaStatus>("todos");
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<MesaEntrada | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [adjuntos, setAdjuntos] = useState<MesaAdjunto[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const allowed = can("mesa_entrada");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      const matchQ =
        !q ||
        it.solicitante.toLowerCase().includes(q) ||
        it.asunto.toLowerCase().includes(q) ||
        it.id.toLowerCase().includes(q);
      const matchS = filterStatus === "todos" || it.estado === filterStatus;
      return matchQ && matchS;
    });
  }, [items, query, filterStatus]);

  const stats = useMemo(
    () => ({
      total: items.length,
      proceso: items.filter((i) => i.estado === "En proceso").length,
      observado: items.filter((i) => i.estado === "Observado").length,
      finalizado: items.filter((i) => i.estado === "Finalizado").length,
    }),
    [items]
  );

  if (!allowed) {
    return (
      <AdminScreen>
        <Card padded style={{ alignItems: "center", gap: Spacing[2] }}>
          <Ionicons name="lock-closed-outline" size={30} color={C.bad} />
          <Text style={[Type.cardTitle, { color: C.ink }]}>Acceso restringido</Text>
          <Text style={[Type.body, { color: C.muted, textAlign: "center" }]}>
            Tu rol actual ({role}) no puede gestionar la Mesa de Entradas. Pedíselo a
            un Administrador.
          </Text>
        </Card>
      </AdminScreen>
    );
  }

  function openForm() {
    setForm(EMPTY_FORM);
    setAdjuntos([]);
    setErrors({});
    setFormOpen(true);
  }

  async function pickFiles() {
    const res = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (res.canceled) return;
    setAdjuntos((prev) => [
      ...prev,
      ...res.assets.map((a) => ({
        name: a.name,
        uri: a.uri,
        size: a.size ?? undefined,
        mimeType: a.mimeType ?? undefined,
      })),
    ]);
  }

  function submitForm() {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.solicitante.trim()) next.solicitante = "El solicitante es obligatorio.";
    if (!form.asunto.trim()) next.asunto = "El asunto es obligatorio.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const entry = createMesaEntrada({ ...form, adjuntos });
    setItems((prev) => [entry, ...prev]);
    push(`Ingreso ${entry.id} registrado.`, "success");
    setFormOpen(false);
  }

  function changeStatus(id: string, estado: MesaStatus) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, estado } : it)));
    setDetail((prev) => (prev && prev.id === id ? { ...prev, estado } : prev));
    push(`Ingreso ${id} pasó a "${estado}".`, "info");
  }

  async function openAttachment(file: MesaAdjunto) {
    // El visor embebido del panel web usaba pdfjs (solo navegador). Acá lo abre
    // la app que el sistema tenga asociada al tipo de archivo.
    const supported = await Linking.canOpenURL(file.uri);
    if (supported) Linking.openURL(file.uri);
    else push("No hay una app para abrir este archivo.", "error");
  }

  return (
    <AdminScreen>
      <PageHeader
        title="Mesa de Entradas"
        description="Registrá y seguí los ingresos de trámites y expedientes."
      >
        <Btn label="Registrar ingreso" icon="add" onPress={openForm} />
      </PageHeader>

      <StatGrid>
        <StatCard label="Ingresos" value={stats.total} tone="brand" icon="cube-outline" hint="en total" />
        <StatCard
          label="En proceso"
          value={stats.proceso}
          tone="warn"
          icon="time-outline"
          hint="en curso"
        />
        <StatCard
          label="Observados"
          value={stats.observado}
          tone="bad"
          icon="alert-circle-outline"
          hint="con reparos"
        />
        <StatCard
          label="Finalizados"
          value={stats.finalizado}
          tone="ok"
          icon="checkmark-done-outline"
          hint="cerrados"
        />
      </StatGrid>

      <SectionTitle>Ingresos</SectionTitle>

      <Input
        icon="search"
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar por solicitante, asunto o expediente"
        autoCapitalize="none"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={{ marginTop: Spacing[3] }}
      >
        <FilterChip
          label="Todos"
          count={items.length}
          active={filterStatus === "todos"}
          onPress={() => setFilterStatus("todos")}
        />
        {mesaStatuses.map((s) => (
          <FilterChip
            key={s}
            label={s}
            count={items.filter((i) => i.estado === s).length}
            active={filterStatus === s}
            onPress={() => setFilterStatus(s)}
          />
        ))}
      </ScrollView>

      <ListCard style={{ marginTop: Spacing[3] }}>
        {filtered.map((it, i) => (
          <Row
            key={it.id}
            first={i === 0}
            onPress={() => setDetail(it)}
            accessibilityLabel={`Ver ingreso ${it.id}`}
          >
            <View style={styles.rowTop}>
              <Text
                style={[Type.bodyStrong, { color: C.ink, flex: 1 }]}
                numberOfLines={2}
              >
                {it.asunto}
              </Text>
              <Badge label={it.estado} tone={STATUS_TONE[it.estado]} dot />
            </View>

            <Text style={[Type.meta, { color: C.muted, marginTop: 2 }]} numberOfLines={1}>
              {it.solicitante} · {it.tipo}
            </Text>

            <View style={styles.rowFoot}>
              <PriorityDot priority={it.prioridad} showLabel />
              <Text style={[Type.meta, { color: C.faint }]}>{it.id}</Text>
              <Text style={[Type.meta, { color: C.faint }]}>{formatDate(it.fecha)}</Text>
              {!!it.adjuntos?.length && (
                <View style={styles.attachCount}>
                  <Ionicons name="attach-outline" size={13} color={C.faint} />
                  <Text style={[Type.meta, { color: C.faint }]}>
                    {it.adjuntos.length}
                  </Text>
                </View>
              )}
            </View>
          </Row>
        ))}

        {filtered.length === 0 && (
          <EmptyState
            icon="cube-outline"
            title="Sin ingresos"
            description="No hay ingresos que coincidan con la búsqueda."
            action={<Btn label="Registrar ingreso" icon="add" onPress={openForm} />}
          />
        )}
      </ListCard>

      {/* Alta de ingreso */}
      <Modal
        open={formOpen}
        title="Registrar ingreso"
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <Btn label="Cancelar" variant="ghost" onPress={() => setFormOpen(false)} />
            <Btn label="Registrar" onPress={submitForm} />
          </>
        }
      >
        <View style={styles.previewId}>
          <KeyValue label="Expediente" value={peekNextMesaId()} />
          <KeyValue label="Fecha" value={formatDate(new Date())} />
        </View>

        <Field label="Solicitante" required error={errors.solicitante}>
          <Input
            value={form.solicitante}
            onChangeText={(solicitante) => setForm((f) => ({ ...f, solicitante }))}
            placeholder="Nombre y apellido"
            autoCapitalize="words"
          />
        </Field>

        <View style={{ flexDirection: "row", gap: Spacing[3] }}>
          <View style={{ flex: 1 }}>
            <Field label="Tipo">
              <Select
                value={form.tipo}
                options={mesaTipoDocumento}
                onChange={(tipo) => setForm((f) => ({ ...f, tipo }))}
              />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Dependencia">
              <Select
                value={form.dependencia}
                options={mesaDependencias}
                onChange={(dependencia) => setForm((f) => ({ ...f, dependencia }))}
              />
            </Field>
          </View>
        </View>

        {/* Segmentado y no chips: acá se elige un valor del trámite, no se filtra */}
        <Field label="Prioridad">
          <Segmented
            value={form.prioridad}
            options={mesaPriorities}
            onChange={(prioridad) => setForm((f) => ({ ...f, prioridad }))}
          />
        </Field>

        <Field
          label="Asunto"
          required
          error={errors.asunto}
          hint={`${form.asunto.length} de ${MAX_ASUNTO} caracteres`}
        >
          <Input
            value={form.asunto}
            onChangeText={(asunto) =>
              setForm((f) => ({ ...f, asunto: asunto.slice(0, MAX_ASUNTO) }))
            }
            placeholder="Motivo del ingreso"
            maxLength={MAX_ASUNTO}
          />
        </Field>

        <Field label="Observaciones">
          <Input
            value={form.observaciones}
            onChangeText={(observaciones) => setForm((f) => ({ ...f, observaciones }))}
            placeholder="Documentación presentada, datos adicionales"
            multiline
            style={{ minHeight: 84, textAlignVertical: "top" }}
          />
        </Field>

        <Field label="Adjuntos">
          <View style={{ gap: Spacing[2] }}>
            {adjuntos.map((file, i) => (
              <View
                key={`${file.uri}-${i}`}
                style={[styles.fileRow, { backgroundColor: C.mist }]}
              >
                <Ionicons name="document-outline" size={16} color={C.muted} />
                <Text style={[Type.meta, { color: C.ink, flex: 1 }]} numberOfLines={1}>
                  {file.name}
                </Text>
                <Text style={[Type.meta, { color: C.faint }]}>
                  {formatFileSize(file.size)}
                </Text>
                <Pressable
                  onPress={() => setAdjuntos((a) => a.filter((_, idx) => idx !== i))}
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar ${file.name}`}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={16} color={C.bad} />
                </Pressable>
              </View>
            ))}
            <Btn
              label="Adjuntar archivo"
              variant="ghost"
              icon="attach-outline"
              onPress={pickFiles}
            />
          </View>
        </Field>
      </Modal>

      {/* Detalle */}
      <Modal
        open={detail !== null}
        title={detail?.id ?? ""}
        onClose={() => setDetail(null)}
        footer={<Btn label="Cerrar" variant="ghost" onPress={() => setDetail(null)} />}
      >
        {!!detail && (
          <>
            <Text style={[Type.cardTitle, { color: C.ink }]}>{detail.asunto}</Text>
            <Badge label={detail.estado} tone={STATUS_TONE[detail.estado]} dot />

            <View style={{ gap: Spacing[2] }}>
              <KeyValue label="Solicitante" value={detail.solicitante} />
              <KeyValue label="Tipo" value={detail.tipo} />
              <KeyValue label="Dependencia" value={detail.dependencia} />
              <KeyValue label="Prioridad" value={detail.prioridad} />
              <KeyValue label="Fecha" value={formatDate(detail.fecha)} />
            </View>

            <Field label="Observaciones">
              <Text style={[Type.body, { color: C.ink }]}>
                {detail.observaciones || "Sin observaciones"}
              </Text>
            </Field>

            {!!detail.adjuntos?.length && (
              <Field label="Adjuntos" hint="Se abren con la app del sistema">
                <View style={{ gap: Spacing[2] }}>
                  {detail.adjuntos.map((file, i) => (
                    <Pressable
                      key={`${file.uri}-${i}`}
                      onPress={() => openAttachment(file)}
                      accessibilityRole="button"
                      accessibilityLabel={`Abrir ${file.name}`}
                      style={[styles.fileRow, { backgroundColor: C.mist }]}
                    >
                      <Ionicons name="document-outline" size={16} color={C.muted} />
                      <Text style={[Type.meta, { color: C.ink, flex: 1 }]} numberOfLines={1}>
                        {file.name}
                      </Text>
                      <Ionicons name="open-outline" size={16} color={C.brand} />
                    </Pressable>
                  ))}
                </View>
              </Field>
            )}

            <Field label="Estado" hint="Cambia el estado del expediente">
              <Segmented
                value={detail.estado}
                options={mesaStatuses}
                onChange={(estado) => changeStatus(detail.id, estado)}
              />
            </Field>
          </>
        )}
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
  rowTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing[2],
  },
  rowFoot: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing[3],
    marginTop: Spacing[2],
  },
  attachCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  previewId: {
    gap: Spacing[2],
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
    paddingVertical: Spacing[3],
  },
});
