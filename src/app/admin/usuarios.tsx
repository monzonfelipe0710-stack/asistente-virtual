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

type FiltroDeRol = "todos" | AuthRole;

function obtenerEstado(user: AuthUser) {
  return user.status ?? "Activo";
}

function filtrarCuentas(cuentas: AuthUser[], search: string, roleFilter: FiltroDeRol) {
  const texto = search.trim().toLowerCase();
  const resultado: AuthUser[] = [];
  for (const cuenta of cuentas) {
    const coincideRol = roleFilter === "todos" || cuenta.role === roleFilter;
    const sinTexto = !texto;
    const coincideNombre = cuenta.name.toLowerCase().includes(texto);
    const coincideCorreo = cuenta.email.toLowerCase().includes(texto);
    const coincideTexto = sinTexto || coincideNombre || coincideCorreo;
    if (coincideRol && coincideTexto) {
      resultado.push(cuenta);
    }
  }
  return resultado;
}

function contarPorRol(cuentas: AuthUser[], rol: AuthRole) {
  let total = 0;
  for (const cuenta of cuentas) {
    if (cuenta.role === rol) total += 1;
  }
  return total;
}

function armarItemsDeTabs(cuentas: AuthUser[]) {
  const items: { id: FiltroDeRol; label: string; count: number }[] = [
    { id: "todos", label: "Todos", count: cuentas.length },
  ];
  for (const rol of rolesDePersonal) {
    items.push({ id: rol, label: rol, count: contarPorRol(cuentas, rol) });
  }
  return items;
}

function armarMensajeDeSuspension(user: AuthUser, esMiCuenta: boolean, suspendida: boolean) {
  if (esMiCuenta) return "No podés suspender tu propia cuenta.";
  if (suspendida) return `${user.name} no puede ingresar hasta que reactives la cuenta.`;
  return `Si suspendés la cuenta, ${user.name} no podrá ingresar hasta que la reactives.`;
}

function FilaDeUsuario({ user, onPress }: { user: AuthUser; onPress: () => void }) {
  const C = useColors();
  const estado = obtenerEstado(user);
  const active = estado === "Activo";
  const tonoDelEstado = TONO_DEL_ESTADO[estado] ?? "muted";

  return (
    <Row
      onPress={onPress}
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
            <Badge label={estado} tone={tonoDelEstado} />
            <Text style={[Type.meta, { color: C.ink2 }]}>{user.role}</Text>
          </View>
        </View>
        <Icon name="chevronRight" size={20} color={C.ink2} />

      </View>
    </Row>
  );
}

function DetalleDeUsuario({
  user,
  esMiCuenta,
  suspendida,
}: {
  user: AuthUser;
  esMiCuenta: boolean;
  suspendida: boolean;
}) {
  const C = useColors();
  const estado = obtenerEstado(user);
  const tonoDelEstado = TONO_DEL_ESTADO[estado] ?? "muted";
  const mensaje = armarMensajeDeSuspension(user, esMiCuenta, suspendida);

  return (
    <>
      <KeyValueCard>
        <KeyValue label="Correo" value={user.email} />
        <KeyValue label="Rol" value={user.role} />
        <KeyValue label="Estado">
          <Badge label={estado} tone={tonoDelEstado} />
        </KeyValue>
        <KeyValue label="Alta" value={formatDate(user.createdAt)} />
      </KeyValueCard>
      <Text style={[Type.meta, { color: C.ink2 }]}>{mensaje}</Text>
    </>
  );
}

export default function UserTable() {
  const C = useColors();
  const push = useToast();
  const { user: yo } = useAuth();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<FiltroDeRol>("todos");
  const [selected, setSelected] = useState<AuthUser | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [creando, setCreando] = useState(false);
  const { cuentas, cargando, error, cambiarEstado, crear } = useCuentas();

  const filtered = useMemo(() => {
    return filtrarCuentas(cuentas, search, roleFilter);
  }, [cuentas, search, roleFilter]);

  const esMiCuenta = selected?.id === yo?.id;
  const suspendida = selected?.status === "Suspendido";

  async function alternarSuspension() {
    if (!selected) return;
    setGuardando(true);
    try {
      const accion = suspendida ? "reactivar" : "suspender";
      await cambiarEstado(selected.id, accion);
      if (suspendida) {
        push(`"${selected.name}" fue reactivado.`);
      } else {
        push(`"${selected.name}" fue suspendido.`);
      }
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
          items={armarItemsDeTabs(cuentas)}
          value={roleFilter}
          onChange={setRoleFilter}
        />
      </View>

      {!!error && (
        <Text style={[Type.meta, { color: C.danger, marginTop: Spacing[3] }]}>{error}</Text>
      )}

      <View>
        {filtered.map((user) => (
          <FilaDeUsuario key={user.id} user={user} onPress={() => setSelected(user)} />
        ))}

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
          <DetalleDeUsuario user={selected} esMiCuenta={esMiCuenta} suspendida={suspendida} />
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
