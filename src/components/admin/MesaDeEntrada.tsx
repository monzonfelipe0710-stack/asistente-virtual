import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useMemo, useState } from "react";
import {
  Linking,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "../common/Text";

import { Radius, Spacing, Type, useAdminColors } from "../../constants/theme";
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
import Tabs from "../common/Tabs";
import { useToast } from "../common/Toast";
import {
  AdminScreen,
  Btn,
  Card,
  EmptyState,
  Field,
  Input,
  KeyValue,
  ListCard,
  OptionGrid,
  PageHeader,
  RecordRow,
  StatGrid,
  SectionTitle,
  Segmented,
  Select,
  StatCard,
} from "./ui";

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
  // el estado se elige en la hoja y se aplica al guardar
  const [detailStatus, setDetailStatus] = useState<MesaStatus>("Ingresado");

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
      ingresado: items.filter((i) => i.estado === "Ingresado").length,
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
        <StatCard
          label="Ingresados"
          value={stats.ingresado}
          tone="info"
          icon="cube-outline"
          hint="sin asignar"
        />
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
        placeholder="Buscar por solicitante, asunto o número"
        autoCapitalize="none"
      />

      <View style={{ marginTop: Spacing[3] }}>
        <Tabs
          items={[
            { id: "todos" as const, label: "Todos", count: stats.total },
            ...mesaStatuses.map((st) => ({
              id: st,
              label: st,
              count: items.filter((i) => i.estado === st).length,
            })),
          ]}
          value={filterStatus}
          onChange={setFilterStatus}
        />
      </View>

      <ListCard>
        {filtered.map((it) => (
          <RecordRow
            key={it.id}
            title={it.asunto}
            status={it.estado}
            who={it.solicitante}
            area={it.tipo}
            priority={it.prioridad}
            id={it.id}
            date={formatDate(it.fecha)}
            note={it.observaciones}
            onPress={() => {
              setDetail(it);
              setDetailStatus(it.estado);
            }}
            extra={
              !!it.adjuntos?.length && (
                <View style={styles.attachCount}>
                  <Ionicons name="attach-outline" size={13} color={C.faint} />
                  <Text style={[Type.mono, { color: C.faint }]}>{it.adjuntos.length}</Text>
                </View>
              )
            }
          />
        ))}

        {filtered.length === 0 && <EmptyState title="Sin resultados." />}
      </ListCard>

      {/* Alta de ingreso */}
      <Modal
        open={formOpen}
        title="Registrar ingreso"
        onClose={() => setFormOpen(false)}
        footer={<Btn label="Registrar" onPress={submitForm} />}
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
              variant="secondary"
              icon="attach-outline"
              onPress={pickFiles}
            />
          </View>
        </Field>
      </Modal>

      {/* Detalle: número, asunto, datos en dos columnas y estado con radios */}
      <Modal
        open={detail !== null}
        title={detail?.asunto ?? ""}
        onClose={() => setDetail(null)}
        footer={
          <Btn
            label="Guardar cambios"
            onPress={() => {
              if (detail && detail.estado !== detailStatus) {
                changeStatus(detail.id, detailStatus);
              }
              setDetail(null);
            }}
          />
        }
      >
        {!!detail && (
          <>
            <Text style={[Type.mono, { color: C.faint, marginTop: -Spacing[3] }]}>
              {detail.id}
            </Text>
            {!!detail.observaciones && (
              <Text style={[Type.label, { fontWeight: "400", color: C.muted, marginTop: -Spacing[2] }]}>
                {detail.observaciones}
              </Text>
            )}

            <View style={[styles.grid, { borderColor: C.line }]}>
              {[
                ["Solicitante", detail.solicitante],
                ["Dependencia", detail.dependencia],
                ["Prioridad", detail.prioridad],
                ["Ingreso", formatDate(detail.fecha)],
              ].map(([l, v]) => (
                <View key={l} style={styles.gridCell}>
                  <Text style={{ fontSize: 12, lineHeight: 16, color: C.muted }}>{l}</Text>
                  <Text style={{ fontSize: 15, lineHeight: 20, fontWeight: "500", color: C.ink, marginTop: 2 }}>
                    {v}
                  </Text>
                </View>
              ))}
            </View>

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
                      <Ionicons name="document-outline" size={18} color={C.muted} />
                      <Text style={[Type.body, { color: C.ink, flex: 1 }]} numberOfLines={1}>
                        {file.name}
                      </Text>
                      <Ionicons name="open-outline" size={18} color={C.brandDeep} />
                    </Pressable>
                  ))}
                </View>
              </Field>
            )}

            <Field label="Estado">
              <OptionGrid
                value={detailStatus}
                options={mesaStatuses}
                onChange={setDetailStatus}
              />
            </Field>
          </>
        )}
      </Modal>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  attachCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  previewId: {
    gap: 0,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: Spacing[3],
    columnGap: Spacing[3],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 14,
  },
  gridCell: {
    flexGrow: 1,
    flexBasis: "45%",
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    minHeight: 48,
    paddingHorizontal: Spacing[4],
    borderRadius: Radius.lg,
  },
});
