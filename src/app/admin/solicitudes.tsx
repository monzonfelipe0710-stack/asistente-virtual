import { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  View,
} from "react-native";
import { Text } from "@/components/ui/Text";

import { Spacing, Type, useColors } from "@/constants/theme";
import {
  employeeDepartments,
  type EmployeeRequest,
  type EmployeeRequestStatus,
} from "@/data/mockEmployeeApprovals";
import { loadUsers, saveUsers } from "@/lib/auth";
import { loadEmployeeRequests, saveEmployeeRequests } from "@/lib/employeeRequests";
import { formatDate } from "@/utils/date";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Btn } from "@/components/ui/Btn";
import { Field, Input } from "@/components/ui/Fields";
import { Avatar, EmptyState, KeyValue, Row, SkeletonList } from "@/components/ui/Lists";
import { Screen, PageHeader } from "@/components/ui/Screen";
import { Select } from "@/components/ui/Select";

const TABS: { id: EmployeeRequestStatus; label: string }[] = [
  { id: "Pendiente", label: "Pendientes" },
  { id: "Activo", label: "Aprobadas" },
  { id: "Rechazado", label: "Rechazadas" },
];

const STATUS_LABEL: Record<EmployeeRequestStatus, string> = {
  Pendiente: "Pendiente",
  Activo: "Aprobada",
  Rechazado: "Rechazada",
};

const STATUS_TONE: Record<EmployeeRequestStatus, Tone> = {
  Pendiente: "warn",
  Activo: "ok",
  Rechazado: "bad",
};

const DEPT_OPTIONS = ["Todas", ...employeeDepartments];

interface Confirm {
  id: string;
  name: string;
  action: Extract<EmployeeRequestStatus, "Activo" | "Rechazado">;
}

export default function EmployeeApprovals() {
  const C = useColors();
  const push = useToast();

  const [requests, setRequests] = useState<EmployeeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<EmployeeRequestStatus>("Pendiente");
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("Todas");
  const [detail, setDetail] = useState<EmployeeRequest | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [note, setNote] = useState("");

  // El almacenamiento es asíncrono: la lista entra por effect, no por estado inicial.
  useEffect(() => {
    let alive = true;
    loadEmployeeRequests().then((list) => {
      if (!alive) return;
      setRequests(list);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const counts = useMemo(
    () => ({
      total: requests.length,
      Pendiente: requests.filter((r) => r.status === "Pendiente").length,
      Activo: requests.filter((r) => r.status === "Activo").length,
      Rechazado: requests.filter((r) => r.status === "Rechazado").length,
    }),
    [requests]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter((r) => {
      const matchTab = r.status === tab;
      const matchDept = department === "Todas" || r.department === department;
      const matchQ =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        (r.dni || "").toLowerCase().includes(q) ||
        (r.cuil || "").toLowerCase().includes(q) ||
        r.position.toLowerCase().includes(q);
      return matchTab && matchDept && matchQ;
    });
  }, [requests, tab, query, department]);

  function openConfirm(req: EmployeeRequest, action: Confirm["action"]) {
    setDetail(null);
    setNote(action === "Rechazado" ? req.reviewNote || "" : "");
    setConfirm({ id: req.id, name: req.name, action });
  }

  async function applyDecision() {
    if (!confirm) return;

    // El rechazo deja constancia obligatoria: sin motivo no se puede cerrar.
    if (confirm.action === "Rechazado" && !note.trim()) {
      push("Indicá el motivo del rechazo para dejar constancia.");
      return;
    }

    const now = new Date().toISOString();
    const finalNote =
      note.trim() ||
      (confirm.action === "Activo" ? "Aprobado. Alta de empleado confirmada." : "");

    const target = requests.find((r) => r.id === confirm.id);
    const updated = requests.map((r) =>
      r.id === confirm.id
        ? {
            ...r,
            status: confirm.action,
            reviewedBy: "Superadmin",
            reviewedAt: now,
            reviewNote: finalNote,
          }
        : r
    );

    setRequests(updated);
    await saveEmployeeRequests(updated);

    // Si la solicitud vino de un registro real, se actualiza esa cuenta:
    // aprobado → pasa a Administrador; rechazado → sigue como Ciudadano.
    if (target?.userId) {
      const accounts = await loadUsers();
      if (accounts.some((u) => u.id === target.userId)) {
        await saveUsers(
          accounts.map((u) =>
            u.id === target.userId
              ? {
                  ...u,
                  role: confirm.action === "Activo" ? "Administrador" : u.role,
                  status: confirm.action,
                }
              : u
          )
        );
      }
    }

    push(
      confirm.action === "Activo"
        ? `${confirm.name} fue aprobado como empleado.`
        : `Solicitud de ${confirm.name} rechazada.`
    );

    setTab(confirm.action);
    setConfirm(null);
    setNote("");
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
        title="Solicitudes"
        description="Revisá los pedidos de alta y definí quién ingresa como empleado."
      />

      <Tabs
        items={TABS.map((t) => ({ ...t, count: counts[t.id] }))}
        value={tab}
        onChange={setTab}
      />

      <View style={{ gap: Spacing[3], marginTop: Spacing[4] }}>
        <Input
          icon="search"
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por nombre, correo, DNI o puesto"
          autoCapitalize="none"
        />
        <Select
          value={department}
          options={DEPT_OPTIONS}
          onChange={setDepartment}
          placeholder="Dependencia"
        />
      </View>

      <View style={{ marginTop: Spacing[2] }}>
        {filtered.map((req) => (
          <Row
            key={req.id}
            onPress={() => setDetail(req)}
            accessibilityLabel={`Ver solicitud de ${req.name}`}
            style={{ gap: Spacing[3] }}
          >
            <View style={styles.line}>
              <Avatar name={req.name} />
              <View style={styles.body}>
                <Text style={[Type.rowTitle, { color: C.ink }]} numberOfLines={1}>
                  {req.name}
                </Text>
                <Text
                  style={[Type.label, { fontWeight: "400", color: C.ink2 }]}
                  numberOfLines={1}
                >
                  {req.department}
                </Text>
              </View>
              <Badge label={STATUS_LABEL[req.status]} tone={STATUS_TONE[req.status]} />
            </View>

            <View style={styles.mono}>
              {!!req.dni && <Text style={[Type.mono, { color: C.ink3 }]}>DNI {req.dni}</Text>}
              <Text style={[Type.mono, { color: C.ink3 }]}>
                {formatDate(req.requestedAt.slice(0, 10))}
              </Text>
            </View>

            {req.status === "Pendiente" && (
              <View style={styles.actions}>
                <Btn
                  label="Rechazar"
                  variant="secondary"
                  size="md"
                  onPress={() => openConfirm(req, "Rechazado")}
                  style={{ flex: 1 }}
                />
                <Btn
                  label="Aprobar"
                  size="md"
                  onPress={() => openConfirm(req, "Activo")}
                  style={{ flex: 1 }}
                />
              </View>
            )}
          </Row>
        ))}

        {filtered.length === 0 && (
          <EmptyState title="No hay solicitudes en esta categoría." />
        )}
      </View>

      {/* Ficha completa. Aprobar y rechazar viven acá, con su nombre a la vista:
          son decisiones que cambian el acceso de una persona al sistema. */}
      <Modal
        open={detail !== null}
        title={detail?.name ?? ""}
        onClose={() => setDetail(null)}
        footer={
          detail?.status === "Pendiente" ? (
            <>
              <Btn
                label="Rechazar"
                variant="secondary"
                onPress={() => detail && openConfirm(detail, "Rechazado")}
              />
              <Btn
                label="Aprobar"
                onPress={() => detail && openConfirm(detail, "Activo")}
              />
            </>
          ) : undefined
        }
      >
        {!!detail && (
          <>
            <Badge label={STATUS_LABEL[detail.status]} tone={STATUS_TONE[detail.status]} />

            <View>
              <KeyValue label="Solicitud" value={detail.id} />
              <KeyValue label="Correo" value={detail.email} />
              <KeyValue label="DNI" value={detail.dni} />
              <KeyValue label="CUIL" value={detail.cuil} />
              <KeyValue label="Teléfono" value={detail.phone} />
              <KeyValue label="Dependencia" value={detail.department} />
              <KeyValue label="Puesto" value={detail.position} />
              <KeyValue label="Rol solicitado" value={detail.role} />
              <KeyValue label="Origen" value={detail.submittedBy} />
            </View>

            <Field label="Motivo del pedido">
              <Text style={[Type.body, { color: C.ink }]}>{detail.reason}</Text>
            </Field>

            {!!detail.reviewedBy && (
              <Field label="Revisión">
                <View>
                  <KeyValue label="Revisado por" value={detail.reviewedBy} />
                  <KeyValue
                    label="Observación"
                    value={detail.reviewNote || "Sin observaciones"}
                  />
                </View>
              </Field>
            )}
          </>
        )}
      </Modal>

      <Modal
        open={confirm !== null}
        title={confirm?.action === "Activo" ? "Aprobar solicitud" : "Rechazar solicitud"}
        onClose={() => {
          setConfirm(null);
          setNote("");
        }}
        footer={
          <Btn
            label={confirm?.action === "Activo" ? "Aprobar" : "Rechazar"}
            variant={confirm?.action === "Activo" ? "primary" : "dangerFill"}
            onPress={applyDecision}
          />
        }
      >
        <Text style={[Type.body, { color: C.ink2 }]}>
          {confirm?.action === "Activo"
            ? `${confirm?.name} pasa a rol Administrador y entra al panel interno.`
            : `${confirm?.name} sigue como Ciudadano y no entra al panel interno.`}
        </Text>

        <Field
          label={
            confirm?.action === "Rechazado" ? "Motivo del rechazo" : "Observación"
          }
          
          hint={
            confirm?.action === "Rechazado"
              ? "Queda registrado en la solicitud."
              : "Opcional."
          }
        >
          <Input
            value={note}
            onChangeText={setNote}
            placeholder="Dejá constancia de la decisión"
            multiline
          />
        </Field>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  line: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  mono: {
    flexDirection: "row",
    gap: Spacing[3],
  },
  actions: {
    flexDirection: "row",
    gap: Spacing[3],
  },
});
