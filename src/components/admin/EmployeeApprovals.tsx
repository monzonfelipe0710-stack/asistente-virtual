import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Radius, Spacing, Type, useAdminColors } from "../../constants/theme";
import { useAdmin } from "../../context/AdminContext";
import {
  employeeDepartments,
  initialsOf,
  type EmployeeRequest,
  type EmployeeRequestStatus,
} from "../../data/mockEmployeeApprovals";
import { loadUsers, saveUsers } from "../../lib/auth";
import { loadEmployeeRequests, saveEmployeeRequests } from "../../lib/employeeRequests";
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
  Row,
  SectionTitle,
  Select,
  SkeletonList,
  StatCard,
  type Tone,
} from "./ui";

const TABS: EmployeeRequestStatus[] = ["Pendiente", "Activo", "Rechazado"];

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
  const C = useAdminColors();
  const { can, role } = useAdmin();
  const push = useToast();

  const [requests, setRequests] = useState<EmployeeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<EmployeeRequestStatus>("Pendiente");
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("Todas");
  const [detail, setDetail] = useState<EmployeeRequest | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [note, setNote] = useState("");

  const allowed = can("solicitudes");

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

  if (!allowed) {
    return (
      <AdminScreen>
        <Card padded style={{ alignItems: "center", gap: Spacing[2] }}>
          <Ionicons name="lock-closed-outline" size={30} color={C.bad} />
          <Text style={[Type.cardTitle, { color: C.ink }]}>Acceso restringido</Text>
          <Text style={[Type.body, { color: C.muted, textAlign: "center" }]}>
            Aprobar altas de empleados es exclusivo del rol Superadmin. Tu rol actual
            es {role}.
          </Text>
        </Card>
      </AdminScreen>
    );
  }

  function openConfirm(req: EmployeeRequest, action: Confirm["action"]) {
    setDetail(null);
    setNote(action === "Rechazado" ? req.reviewNote || "" : "");
    setConfirm({ id: req.id, name: req.name, action });
  }

  async function applyDecision() {
    if (!confirm) return;

    // El rechazo deja constancia obligatoria: sin motivo no se puede cerrar.
    if (confirm.action === "Rechazado" && !note.trim()) {
      push("Indicá el motivo del rechazo para dejar constancia.", "error");
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
        : `Solicitud de ${confirm.name} rechazada.`,
      confirm.action === "Activo" ? "success" : "error"
    );

    setTab(confirm.action);
    setConfirm(null);
    setNote("");
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
        title="Solicitudes"
        description="Revisá los pedidos de alta y definí quién ingresa como empleado."
      />

      <StatGrid>
        <StatCard
          label="Pendientes"
          value={counts.Pendiente}
          tone="warn"
          hint="aguardan revisión"
          icon="time-outline"
        />
        <StatCard
          label="Aprobadas"
          value={counts.Activo}
          tone="ok"
          hint="empleados activos"
          icon="checkmark-outline"
        />
        <StatCard
          label="Rechazadas"
          value={counts.Rechazado}
          tone="bad"
          hint="no ingresaron"
          icon="close-outline"
        />
        <StatCard
          label="Total recibidas"
          value={counts.total}
          tone="brand"
          hint="historial completo"
          icon="people-outline"
        />
      </StatGrid>

      <SectionTitle>Bandeja</SectionTitle>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {TABS.map((t) => (
          <FilterChip
            key={t}
            label={t}
            count={counts[t]}
            active={tab === t}
            onPress={() => setTab(t)}
          />
        ))}
      </ScrollView>

      <View style={{ gap: Spacing[2], marginTop: Spacing[3] }}>
        <Input
          icon="search"
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por nombre, correo, DNI, CUIL o puesto"
          autoCapitalize="none"
        />
        <Select
          value={department}
          options={DEPT_OPTIONS}
          onChange={setDepartment}
          placeholder="Dependencia"
        />
      </View>

      <ListCard style={{ marginTop: Spacing[3] }}>
        {filtered.map((req, i) => (
          <Row
            key={req.id}
            first={i === 0}
            onPress={() => setDetail(req)}
            accessibilityLabel={`Ver solicitud de ${req.name}`}
          >
            <View style={styles.line}>
              <View style={[styles.initials, { backgroundColor: C.mist }]}>
                <Text style={[Type.metaStrong, { color: C.muted }]}>
                  {initialsOf(req.name)}
                </Text>
              </View>

              <View style={styles.body}>
                <View style={styles.nameLine}>
                  <Text
                    style={[Type.bodyStrong, { color: C.ink, flexShrink: 1 }]}
                    numberOfLines={1}
                  >
                    {req.name}
                  </Text>
                  <Badge label={req.status} tone={STATUS_TONE[req.status]} dot />
                </View>

                <Text style={[Type.meta, { color: C.muted }]} numberOfLines={1}>
                  {req.position} · {req.department}
                </Text>
                <Text style={[Type.meta, { color: C.faint }]} numberOfLines={1}>
                  {req.email}
                </Text>
                <Text style={[Type.meta, { color: C.faint }]} numberOfLines={1}>
                  {req.id} · {formatDate(req.requestedAt.slice(0, 10))}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color={C.faint} />
            </View>
          </Row>
        ))}

        {filtered.length === 0 && (
          <EmptyState
            icon="checkmark-done-outline"
            title="Sin solicitudes"
            description="No hay solicitudes que coincidan con los filtros actuales."
          />
        )}
      </ListCard>

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
                variant="danger"
                onPress={() => detail && openConfirm(detail, "Rechazado")}
              />
              <Btn
                label="Aprobar"
                onPress={() => detail && openConfirm(detail, "Activo")}
              />
            </>
          ) : (
            <Btn label="Cerrar" variant="ghost" onPress={() => setDetail(null)} />
          )
        }
      >
        {!!detail && (
          <>
            <Badge label={detail.status} tone={STATUS_TONE[detail.status]} dot />

            <View style={{ gap: Spacing[2] }}>
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
                <View style={{ gap: Spacing[2] }}>
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
          <>
            <Btn
              label="Cancelar"
              variant="ghost"
              onPress={() => {
                setConfirm(null);
                setNote("");
              }}
            />
            <Btn
              label={confirm?.action === "Activo" ? "Aprobar" : "Rechazar"}
              variant={confirm?.action === "Activo" ? "primary" : "danger"}
              onPress={applyDecision}
            />
          </>
        }
      >
        <Text style={[Type.body, { color: C.muted }]}>
          {confirm?.action === "Activo"
            ? `${confirm?.name} pasa a rol Administrador y entra al panel interno.`
            : `${confirm?.name} sigue como Ciudadano y no entra al panel interno.`}
        </Text>

        <Field
          label={
            confirm?.action === "Rechazado" ? "Motivo del rechazo" : "Observación"
          }
          required={confirm?.action === "Rechazado"}
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
            style={{ minHeight: 84, textAlignVertical: "top" }}
          />
        </Field>
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
  line: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
  },
  initials: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nameLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
  },

});
