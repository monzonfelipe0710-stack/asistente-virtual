import { useMemo, useState } from "react";
import {
  StyleSheet,
  View,
} from "react-native";
import { Text } from "@/components/ui/Text";

import { Spacing, Type, useColors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useCuentas } from "@/hooks/useCuentas";
import { rolesDePersonal, type AuthRole, type AuthUser } from "@/lib/auth";
import { formatDate } from "@/utils/date";
import { NuevoEmpleadoModal } from "@/components/admin/NuevoEmpleadoModal";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Btn } from "@/components/ui/Btn";
import { Icon } from "@/components/ui/Icon";
import { KeyValue, KeyValueCard } from "@/components/ui/KeyValue";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { SearchInput } from "@/components/ui/SearchInput";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Row } from "@/components/ui/Row";
import { Screen } from "@/components/ui/Screen";
import { PageHeader } from "@/components/ui/PageHeader";

const TONO_DEL_ESTADO: Record<string, Tone> = {
  Activo: "ok",
  Pendiente: "warn",
  Rechazado: "bad",
  Suspendido: "bad",
};

export default function UserTable() {
  const C = useColors();
  const push = useToast();
  const { user: yo } = useAuth();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"todos" | AuthRole>("todos");
  const [selected, setSelected] = useState<AuthUser | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [creando, setCreando] = useState(false);
  const { cuentas, cargando, error, cambiarEstado, crear } = useCuentas();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cuentas.filter(
      (u) =>
        (roleFilter === "todos" || u.role === roleFilter) &&
        (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    );
  }, [cuentas, search, roleFilter]);

  const esMiCuenta = selected?.id === yo?.id;
  const suspendida = selected?.status === "Suspendido";

  async function alternarSuspension() {
    if (!selected) return;
    setGuardando(true);
    try {
      await cambiarEstado(selected.id, suspendida ? "reactivar" : "suspender");
      push(suspendida ? `"${selected.name}" fue reactivado.` : `"${selected.name}" fue suspendido.`);
      setSelected(null);
    } catch (e) {
      push(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Screen>
      <PageHeader
        title="Usuarios"
        description={`${cuentas.length} cuentas registradas.`}
      >
        <Btn label="Nuevo empleado" size="md" onPress={() => setCreando(true)} />
      </PageHeader>

      <NuevoEmpleadoModal
        open={creando}
        onClose={() => setCreando(false)}
        onCrear={async (datos) => {
          const { mensaje } = await crear(datos);
          push(mensaje);
        }}
      />

      <SearchInput
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar por nombre o correo"
        autoCapitalize="none"
      />

      <View style={{ marginTop: Spacing[4] }}>
        <Tabs
          items={[
            { id: "todos" as const, label: "Todos", count: cuentas.length },
            ...rolesDePersonal.map((r) => ({
              id: r,
              label: r,
              count: cuentas.filter((u) => u.role === r).length,
            })),
          ]}
          value={roleFilter}
          onChange={setRoleFilter}
        />
      </View>

      {!!error && (
        <Text style={[Type.meta, { color: C.danger, marginTop: Spacing[3] }]}>{error}</Text>
      )}

      <View>
        {filtered.map((user) => {
          const estado = user.status ?? "Activo";
          const active = estado === "Activo";
          return (
            <Row
              key={user.id}
              onPress={() => setSelected(user)}
              accessibilityLabel={`Ver ${user.name}`}
              style={{ paddingVertical: 14 }}
            >
              <View style={styles.line}>
                <View style={{ opacity: active ? 1 : 0.5 }}>
                  <Avatar name={user.name} />
                </View>

                <View style={styles.body}>
                  <Text style={[Type.rowTitle, { color: C.ink }]} numberOfLines={1}>
                    {user.name}
                  </Text>
                  <Text style={[Type.meta, { color: C.ink2 }]} numberOfLines={1}>
                    {user.email}
                  </Text>
                  <View style={styles.status}>
                    <Badge label={estado} tone={TONO_DEL_ESTADO[estado] ?? "muted"} />
                    <Text style={[Type.meta, { color: C.ink2 }]}>{user.role}</Text>
                  </View>
                </View>
                <Icon name="chevronRight" size={20} color={C.ink2} />

              </View>
            </Row>
          );
        })}

        {!cargando && filtered.length === 0 && <EmptyState title="Sin resultados." />}
      </View>

      <Modal
        open={selected !== null}
        title={selected?.name ?? ""}
        onClose={() => setSelected(null)}
        footer={
          <Btn
            label={suspendida ? "Reactivar cuenta" : "Suspender cuenta"}
            variant={suspendida ? "primary" : "danger"}
            onPress={alternarSuspension}
            loading={guardando}
            disabled={esMiCuenta}
          />
        }
      >
        {!!selected && (
          <>
            <KeyValueCard>
              <KeyValue label="Correo" value={selected.email} />
              <KeyValue label="Rol" value={selected.role} />
              <KeyValue label="Estado">
                <Badge
                  label={selected.status ?? "Activo"}
                  tone={TONO_DEL_ESTADO[selected.status ?? "Activo"] ?? "muted"}
                />
              </KeyValue>
              <KeyValue label="Alta" value={formatDate(selected.createdAt)} />
            </KeyValueCard>
            <Text style={[Type.meta, { color: C.ink2 }]}>
              {esMiCuenta
                ? "No podés suspender tu propia cuenta."
                : suspendida
                  ? `${selected.name} no puede ingresar hasta que reactives la cuenta.`
                  : `Si suspendés la cuenta, ${selected.name} no podrá ingresar hasta que la reactives.`}
            </Text>
          </>
        )}
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
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
    marginTop: 6,
  },
});
