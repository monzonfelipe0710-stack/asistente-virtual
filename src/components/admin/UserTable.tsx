import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Radius, Spacing, Type, useAdminColors } from "../../constants/theme";
import { users as seedUsers, type AppUser } from "../../data/mockUsers";
import { useToast } from "../common/Toast";
import UserFormModal, { type UserForm } from "./UserFormModal";
import {
  AdminScreen,
  Avatar,
  Btn,
  EmptyState,
  Input,
  ListCard,
  PageHeader,
  Row,
} from "./ui";

export default function UserTable() {
  const C = useAdminColors();
  const push = useToast();

  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<AppUser[]>(seedUsers);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<AppUser | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q)
    );
  }, [rows, search]);

  function closeModal() {
    setModalOpen(false);
    setEditUser(null);
  }

  function handleSave(form: UserForm) {
    if (editUser) {
      setRows((prev) =>
        prev.map((u) => (u.id === editUser.id ? { ...u, ...form } : u))
      );
      push(`Usuario "${form.name}" actualizado.`, "success");
    } else {
      const nextId = Math.max(0, ...rows.map((u) => u.id)) + 1;
      const created: AppUser = {
        ...form,
        id: nextId,
        lastAccess: "—",
        avatar: null,
        phone: "",
        createdAt: new Date().toLocaleDateString("es-AR"),
      };
      setRows((prev) => [created, ...prev]);
      push(`Usuario "${form.name}" creado.`, "success");
    }
    closeModal();
  }

  return (
    <AdminScreen>
      <PageHeader
        title="Usuarios"
        description={`${rows.length} usuarios registrados`}
      >
        <Btn
          label="Nuevo usuario"
          icon="add"
          onPress={() => {
            setEditUser(null);
            setModalOpen(true);
          }}
        />
      </PageHeader>

      <Input
        icon="search"
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar por nombre, correo o departamento"
        autoCapitalize="none"
      />

      <ListCard style={{ marginTop: Spacing[3] }}>
        {filtered.map((user, i) => (
          <Row
            key={user.id}
            first={i === 0}
            onPress={() => {
              setEditUser(user);
              setModalOpen(true);
            }}
            accessibilityLabel={`Editar ${user.name}`}
          >
            <View style={styles.line}>
              <Avatar name={user.name} />

              <View style={styles.body}>
                <View style={styles.nameLine}>
                  <Text style={[Type.bodyStrong, { color: C.ink, flexShrink: 1 }]} numberOfLines={1}>
                    {user.name}
                  </Text>
                  <RoleTag role={user.role} />
                </View>

                <Text style={[Type.meta, { color: C.muted }]} numberOfLines={1}>
                  {user.email}
                </Text>

                <View style={styles.footLine}>
                  <View style={styles.status}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: user.status === "Activo" ? C.ok : C.faint },
                      ]}
                    />
                    <Text
                      style={[
                        Type.meta,
                        { color: user.status === "Activo" ? C.ok : C.muted },
                      ]}
                    >
                      {user.status}
                    </Text>
                  </View>
                  <Text style={[Type.meta, { color: C.faint, flexShrink: 1 }]} numberOfLines={1}>
                    {user.department}
                  </Text>
                </View>

                <Text style={[Type.meta, { color: C.faint }]} numberOfLines={1}>
                  Último acceso: {user.lastAccess}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color={C.faint} />
            </View>
          </Row>
        ))}

        {filtered.length === 0 && (
          <EmptyState
            icon="people-outline"
            title="Sin usuarios"
            description="No se encontraron usuarios con ese criterio de búsqueda."
          />
        )}
      </ListCard>

      <UserFormModal
        open={modalOpen}
        onClose={closeModal}
        onSave={handleSave}
        editUser={editUser}
      />
    </AdminScreen>
  );
}

/**
 * El rol es lo que decide qué puede hacer la persona, así que se lee de un
 * golpe: Superadmin en tinta plena, Administrador en el azul de marca, y
 * Ciudadano sin relleno, porque no tiene acceso al panel.
 */
function RoleTag({ role }: { role: AppUser["role"] }) {
  const C = useAdminColors();

  // Sin pastilla: el rol se distingue por color y peso. Superadmin en tinta
  // plena, Administrador en el azul de marca, Ciudadano apagado porque no
  // entra al panel.
  const color =
    role === "Superadmin" ? C.ink : role === "Administrador" ? C.brandDeep : C.faint;

  return <Text style={[Type.metaStrong, { color }]}>{role}</Text>;
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
    gap: 2,
  },
  nameLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
  },
  footLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    marginTop: 2,
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
  },
});
