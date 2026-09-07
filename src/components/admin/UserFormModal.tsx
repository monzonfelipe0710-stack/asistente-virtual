import { useEffect, useState } from "react";
import { View } from "react-native";

import { Spacing } from "../../constants/theme";
import {
  departments,
  userRoles,
  type AppUser,
  type UserRole,
  type UserStatus,
} from "../../data/mockUsers";
import Modal from "../common/Modal";
import { Btn, Field, Input, Select } from "./ui";

export interface UserForm {
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status: UserStatus;
}

const EMPTY: UserForm = {
  name: "",
  email: "",
  role: "Ciudadano",
  department: "Mesa de Entradas",
  status: "Activo",
};

const STATUSES: UserStatus[] = ["Activo", "Inactivo"];

export default function UserFormModal({
  open,
  onClose,
  onSave,
  editUser,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (form: UserForm) => void;
  editUser: AppUser | null;
}) {
  const [form, setForm] = useState<UserForm>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof UserForm, string>>>({});

  useEffect(() => {
    if (!open) return;
    setForm(
      editUser
        ? {
            name: editUser.name,
            email: editUser.email,
            role: editUser.role,
            department: editUser.department,
            status: editUser.status,
          }
        : EMPTY
    );
    setErrors({});
  }, [open, editUser]);

  function submit() {
    const errs: Partial<Record<keyof UserForm, string>> = {};
    if (!form.name.trim()) errs.name = "El nombre es obligatorio";
    if (!form.email.trim()) errs.email = "El email es obligatorio";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Email inválido";

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    onSave(form);
  }

  return (
    <Modal
      open={open}
      title={editUser ? "Editar usuario" : "Nuevo usuario"}
      onClose={onClose}
      footer={
        <>
          <Btn label="Cancelar" variant="ghost" onPress={onClose} />
          <Btn
            label={editUser ? "Guardar cambios" : "Crear usuario"}
            onPress={submit}
          />
        </>
      }
    >
      <Field label="Nombre completo" required error={errors.name}>
        <Input
          value={form.name}
          onChangeText={(name) => setForm((f) => ({ ...f, name }))}
          placeholder="Ej: Juan Pérez"
          autoCapitalize="words"
        />
      </Field>

      <Field label="Email" required error={errors.email}>
        <Input
          value={form.email}
          onChangeText={(email) => setForm((f) => ({ ...f, email }))}
          placeholder="ejemplo@rrhh.gob.ar"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </Field>

      <View style={{ flexDirection: "row", gap: Spacing[3] }}>
        <View style={{ flex: 1 }}>
          <Field label="Rol">
            <Select
              value={form.role}
              options={userRoles}
              onChange={(role) => setForm((f) => ({ ...f, role }))}
            />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Estado">
            <Select
              value={form.status}
              options={STATUSES}
              onChange={(status) => setForm((f) => ({ ...f, status }))}
            />
          </Field>
        </View>
      </View>

      <Field label="Departamento">
        <Select
          value={form.department}
          options={departments}
          onChange={(department) => setForm((f) => ({ ...f, department }))}
        />
      </Field>
    </Modal>
  );
}
