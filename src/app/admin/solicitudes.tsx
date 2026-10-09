import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/Text";

import { Radius, Spacing, Type, Weight, useColors } from "@/constants/theme";
import { useCuentas } from "@/hooks/useCuentas";
import type { AuthStatus, AuthUser } from "@/lib/auth";
import { formatDate } from "@/utils/date";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Btn } from "@/components/ui/Btn";
import { SearchInput } from "@/components/ui/SearchInput";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { KeyValue, KeyValueCard } from "@/components/ui/KeyValue";
import { SkeletonList } from "@/components/ui/SkeletonList";
import { Screen } from "@/components/ui/Screen";
import { PageHeader } from "@/components/ui/PageHeader";

type Pestana = "Pendiente" | "Activo" | "Rechazado";

const TABS: { id: Pestana; label: string }[] = [
  { id: "Pendiente", label: "Pendientes" },
  { id: "Activo", label: "Aprobadas" },
  { id: "Rechazado", label: "Rechazadas" },
];

const STATUS_LABEL: Record<AuthStatus, string> = {
  Pendiente: "Pendiente",
  Activo: "Aprobada",
  Suspendido: "Aprobada",
  Rechazado: "Rechazada",
};

const STATUS_TONE: Record<AuthStatus, Tone> = {
  Pendiente: "warn",
  Activo: "ok",
  Suspendido: "ok",
  Rechazado: "bad",
};

function pestanaDe(status: AuthStatus | undefined): Pestana {
  if (status === "Pendiente" || status === "Rechazado") return status;
  return "Activo";
}

interface Confirm {
  id: string;
  name: string;
  action: "aprobar" | "rechazar";
}

export default function EmployeeApprovals() {
  const C = useColors();
  const push = useToast();
  const { usuarios: requests, cargando, error, cambiarEstado } = useCuentas();

  const [tab, setTab] = useState<Pestana>("Pendiente");
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<AuthUser | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [guardando, setGuardando] = useState(false);

  const counts = useMemo(
    () => ({
      Pendiente: requests.filter((r) => pestanaDe(r.status) === "Pendiente").length,
      Activo: requests.filter((r) => pestanaDe(r.status) === "Activo").length,
      Rechazado: requests.filter((r) => pestanaDe(r.status) === "Rechazado").length,
    }),
    [requests]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter(
      (r) =>
        pestanaDe(r.status) === tab &&
        (!q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q))
    );
  }, [requests, tab, query]);

  function openConfirm(req: AuthUser, action: Confirm["action"]) {
    setDetail(null);
    setConfirm({ id: req.id, name: req.name, action });
  }

  async function applyDecision() {
    if (!confirm) return;
    setGuardando(true);
    try {
      await cambiarEstado(confirm.id, confirm.action);
      push(
        confirm.action === "aprobar"
          ? `Solicitud de "${confirm.name}" aprobada.`
          : `Solicitud de "${confirm.name}" rechazada.`
      );
      setConfirm(null);
    } catch (e) {
      push(e instanceof Error ? e.message : "No se pudo guardar la decisión.");
    } finally {
      setGuardando(false);
    }
  }

  if (cargando && requests.length === 0) {
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
        title="Solicitudes"
        description="Revisá los pedidos de alta y definí quién ingresa al panel interno."
      />

      <Tabs
        items={TABS.map((t) => ({ ...t, count: counts[t.id] }))}
        value={tab}
        onChange={setTab}
      />

      <View style={{ gap: Spacing[3], marginTop: Spacing[4] }}>
        <SearchInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por nombre o correo"
          autoCapitalize="none"
        />
      </View>

      {!!error && (
        <Text style={[Type.meta, { color: C.danger, marginTop: Spacing[3] }]}>{error}</Text>
      )}

      <View style={{ marginTop: Spacing[4], gap: Spacing[3] }}>
        {filtered.map((req) => (
          <Pressable
            key={req.id}
            onPress={() => setDetail(req)}
            accessibilityRole="button"
            accessibilityLabel={`Ver solicitud de ${req.name}`}
            style={[styles.tarjeta, { backgroundColor: C.surface, borderColor: C.border }]}
          >
            <View style={styles.line}>
              <Avatar name={req.name} />
              <View style={styles.body}>
                <Text style={[styles.nombre, { color: C.ink }]} numberOfLines={1}>
                  {req.name}
                </Text>
                <Text style={[Type.meta, { color: C.ink2 }]} numberOfLines={1}>
                  {req.email}
                </Text>
                <Text style={[Type.mono, { color: C.ink2 }]}>{formatDate(req.createdAt)}</Text>
              </View>
            </View>

            {req.status !== "Pendiente" && (
              <Badge
                label={STATUS_LABEL[req.status ?? "Activo"]}
                tone={STATUS_TONE[req.status ?? "Activo"]}
              />
            )}

            {req.status === "Pendiente" && (
              <View style={styles.actions}>
                <Btn
                  label="Rechazar"
                  variant="danger"
                  size="md"
                  onPress={() => openConfirm(req, "rechazar")}
                  style={{ flex: 1 }}
                />
                <Btn
                  label="Aprobar"
                  size="md"
                  onPress={() => openConfirm(req, "aprobar")}
                  style={{ flex: 1 }}
                />
              </View>
            )}
          </Pressable>
        ))}

        {filtered.length === 0 && (
          <EmptyState title="No hay solicitudes en esta categoría." />
        )}
      </View>

      <Modal
        open={detail !== null}
        title={detail?.name ?? ""}
        onClose={() => setDetail(null)}
        footer={
          detail?.status === "Pendiente" ? (
            <>
              <Btn
                label="Rechazar"
                variant="danger"
                onPress={() => detail && openConfirm(detail, "rechazar")}
              />
              <Btn
                label="Aprobar"
                onPress={() => detail && openConfirm(detail, "aprobar")}
              />
            </>
          ) : undefined
        }
      >
        {!!detail && (
          <>
            <Badge
              label={STATUS_LABEL[detail.status ?? "Activo"]}
              tone={STATUS_TONE[detail.status ?? "Activo"]}
            />

            <KeyValueCard>
              <KeyValue label="Solicitud" value={detail.id} />
              <KeyValue label="Correo" value={detail.email} />
              <KeyValue label="Rol solicitado" value={detail.role} />
              <KeyValue label="Fecha" value={formatDate(detail.createdAt)} />
            </KeyValueCard>
          </>
        )}
      </Modal>

      <Modal
        open={confirm !== null}
        title={confirm?.action === "aprobar" ? "Aprobar solicitud" : "Rechazar solicitud"}
        onClose={() => setConfirm(null)}
        footer={
          <Btn
            label={confirm?.action === "aprobar" ? "Aprobar" : "Rechazar"}
            variant={confirm?.action === "aprobar" ? "primary" : "dangerFill"}
            onPress={applyDecision}
            loading={guardando}
          />
        }
      >
        <Text style={[Type.body, { color: C.ink2 }]}>
          {confirm?.action === "aprobar"
            ? `${confirm?.name} pasa a rol Empleado y entra al panel interno.`
            : `${confirm?.name} no podrá entrar al panel interno.`}
        </Text>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    gap: Spacing[3],
    padding: Spacing[4],
    borderRadius: Radius["2xl"],
    borderWidth: 1,
  },
  nombre: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: Weight.bold,
  },
  line: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing[3],
  },
});
