import { useMemo, useState } from "react";
import {
  StyleSheet,
  View,
} from "react-native";
import { Text } from "../common/Text";

import { Radius, Spacing, Type, useAdminColors } from "../../constants/theme";
import { users as seedUsers, userRoles, type AppUser, type UserRole } from "../../data/mockUsers";
import Tabs from "../common/Tabs";
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
  const [roleFilter, setRoleFilter] = useState<"todos" | UserRole>("todos");
  const [rows, setRows] = useState<AppUser[]>(seedUsers);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<AppUser | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(
      (u) =>
        (roleFilter === "todos" || u.role === roleFilter) &&
        (!q ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.department.toLowerCase().includes(q))
    );
  }, [rows, search, roleFilter]);

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
        description={`${rows.length} personas con acceso al panel.`}
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
        placeholder="Buscar por nombre o correo"
        autoCapitalize="none"
      />

      <View style={{ marginTop: Spacing[4] }}>
        <Tabs
          items={[
            { id: "todos" as const, label: "Todos", count: rows.length },
            ...userRoles.map((r) => ({
              id: r,
              label: r,
              count: rows.filter((u) => u.role === r).length,
            })),
          ]}
          value={roleFilter}
          onChange={setRoleFilter}
        />
      </View>

      <ListCard>
        {filtered.map((user) => {
          const active = user.status === "Activo";
          return (
            <Row
              key={user.id}
              onPress={() => {
                setEditUser(user);
                setModalOpen(true);
              }}
              accessibilityLabel={`Editar ${user.name}`}
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
                  <Text style={[Type.meta, { color: C.muted }]} numberOfLines={1}>
                    {user.email}
                  </Text>
                </View>

                <View style={styles.right}>
                  <Text style={[Type.label, { color: C.ink }]}>{user.role}</Text>
                  <View style={styles.status}>
                    <View
                      style={[styles.statusDot, { backgroundColor: active ? C.ok : C.faint }]}
                    />
                    <Text style={[Type.metaStrong, { color: active ? C.ok : C.faint }]}>
                      {active ? "Activo" : "Suspendido"}
                    </Text>
                  </View>
                </View>
              </View>
            </Row>
          );
        })}

        {filtered.length === 0 && <EmptyState title="Sin resultados." />}
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
  right: {
    alignItems: "flex-end",
    gap: 2,
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
  },
});
