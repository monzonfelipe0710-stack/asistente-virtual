import { useMemo, useState } from "react";
import {
  Linking,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "@/components/ui/Text";

import { Radius, Spacing, Type, useColors } from "@/constants/theme";
import {
  mesaStatuses,
  type MesaAdjunto,
  type MesaEntrada,
  type MesaStatus,
} from "@/data/mockMesaEntrada";
import { formatDate } from "@/utils/date";
import { MesaIngresoModal } from "@/components/admin/MesaIngresoModal";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { useAvisoNoDisponible } from "@/components/ui/AvisoNoDisponible";
import { useToast } from "@/components/ui/Toast";
import { AvisoDeEjemplo } from "@/components/ui/AvisoDeEjemplo";
import { Btn } from "@/components/ui/Btn";
import { OptionGrid } from "@/components/ui/OptionGrid";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState } from "@/components/ui/EmptyState";
import { RecordRow } from "@/components/ui/RecordRow";
import { Screen } from "@/components/ui/Screen";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatCard } from "@/components/ui/StatCard";

export default function MesaDeEntrada() {
  const C = useColors();
  const push = useToast();
  const avisarNoDisponible = useAvisoNoDisponible();

  const [items] = useState<MesaEntrada[]>([]);
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"todos" | MesaStatus>("todos");
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<MesaEntrada | null>(null);
  // el estado se elige en la hoja y se aplica al guardar
  const [detailStatus, setDetailStatus] = useState<MesaStatus>("Ingresado");

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

  const conteos = useMemo(() => {
    const porEstado: Record<MesaStatus, number> = {
      Ingresado: 0,
      "En proceso": 0,
      Observado: 0,
      Finalizado: 0,
    };
    for (const it of items) porEstado[it.estado] += 1;
    return porEstado;
  }, [items]);

  function registrar() {
    avisarNoDisponible();
  }

  function changeStatus() {
    avisarNoDisponible();
  }

  async function openAttachment(file: MesaAdjunto) {
    // El visor embebido del panel web usaba pdfjs (solo navegador). Acá lo abre
    // la app que el sistema tenga asociada al tipo de archivo.
    const supported = await Linking.canOpenURL(file.uri);
    if (supported) Linking.openURL(file.uri);
    else push("No hay una app para abrir este archivo.");
  }

  return (
    <Screen>
      <PageHeader
        title="Mesa de Entradas"
        description="Registrá y seguí los ingresos de trámites y expedientes."
      >
        <Btn label="Registrar ingreso" icon="plus" onPress={() => setFormOpen(true)} />
      </PageHeader>

      <AvisoDeEjemplo />

      <StatGrid>
        <StatCard
          label="Ingresados"
          value={conteos.Ingresado}
          tone="info"
          icon="box"
          hint="sin asignar"
        />
        <StatCard
          label="En proceso"
          value={conteos["En proceso"]}
          tone="warn"
          icon="clock"
          hint="en curso"
        />
        <StatCard
          label="Observados"
          value={conteos.Observado}
          tone="bad"
          icon="alert"
          hint="con reparos"
        />
        <StatCard
          label="Finalizados"
          value={conteos.Finalizado}
          tone="ok"
          icon="checkDouble"
          hint="cerrados"
        />
      </StatGrid>

      <SectionTitle>Ingresos</SectionTitle>

      <SearchInput
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar por solicitante, asunto o número"
        autoCapitalize="none"
      />

      <View style={{ marginTop: Spacing[3] }}>
        <Tabs
          items={[
            { id: "todos" as const, label: "Todos", count: items.length },
            ...mesaStatuses.map((st) => ({
              id: st,
              label: st,
              count: conteos[st],
            })),
          ]}
          value={filterStatus}
          onChange={setFilterStatus}
        />
      </View>

      <View>
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
                  <Icon name="paperclip" size={13} color={C.ink3} />
                  <Text style={[Type.mono, { color: C.ink3 }]}>{it.adjuntos.length}</Text>
                </View>
              )
            }
          />
        ))}

        {filtered.length === 0 && <EmptyState title="Sin resultados." />}
      </View>

      {/* Alta de ingreso */}
      {formOpen && (
        <MesaIngresoModal
          onClose={() => setFormOpen(false)}
          onSave={registrar}
        />
      )}

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
                changeStatus();
              }
              setDetail(null);
            }}
          />
        }
      >
        {!!detail && (
          <>
            <Text style={[Type.mono, { color: C.ink3, marginTop: -Spacing[3] }]}>
              {detail.id}
            </Text>
            {!!detail.observaciones && (
              <Text style={[Type.label, { fontWeight: "400", color: C.ink2, marginTop: -Spacing[2] }]}>
                {detail.observaciones}
              </Text>
            )}

            <View style={[styles.grid, { borderColor: C.border }]}>
              {[
                ["Solicitante", detail.solicitante],
                ["Dependencia", detail.dependencia],
                ["Prioridad", detail.prioridad],
                ["Ingreso", formatDate(detail.fecha)],
              ].map(([l, v]) => (
                <View key={l} style={styles.gridCell}>
                  <Text style={{ fontSize: 12, lineHeight: 16, color: C.ink2 }}>{l}</Text>
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
                      style={[styles.fileRow, { backgroundColor: C.surface }]}
                    >
                      <Icon name="file" size={18} color={C.ink2} />
                      <Text style={[Type.body, { color: C.ink, flex: 1 }]} numberOfLines={1}>
                        {file.name}
                      </Text>
                      <Icon name="external" size={18} color={C.accentText} />
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  attachCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
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
