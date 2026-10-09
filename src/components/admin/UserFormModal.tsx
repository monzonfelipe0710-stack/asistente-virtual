import { useEffect, useState } from "react";
import { Btn } from "@/components/ui/Btn";
import { Segmented } from "@/components/ui/Choices";
import { Field, Input } from "@/components/ui/Fields";
import { Select } from "@/components/ui/Select";
import {
  departments,
  userRoles,
  type AppUser,
  type UserRole,
  type UserStatus,
} from "@/data/mockUsers";
import { Modal } from "@/components/ui/Modal";

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

export function UserFormModal({
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
    if (!form.name.trim()) errs.name = "Ingresá el nombre y apellido.";
    if (!form.email.trim()) errs.email = "Ingresá el correo.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Revisá el formato del correo.";

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
        <Btn
          label={editUser ? "Guardar cambios" : "Crear usuario"}
          onPress={submit}
        />
      }
    >
      <Field label="Nombre completo" error={errors.name}>
        <Input
          value={form.name}
          onChangeText={(name) => setForm((f) => ({ ...f, name }))}
          placeholder="Nombre y apellido"
          autoCapitalize="words"
        />
      </Field>

      <Field label="Correo electrónico" error={errors.email}>
        <Input
          value={form.email}
          onChangeText={(email) => setForm((f) => ({ ...f, email }))}
          placeholder="ejemplo@rrhh.gob.ar"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </Field>

      <Field label="Rol">
        <Segmented
          value={form.role}
          options={userRoles}
          onChange={(role) => setForm((f) => ({ ...f, role }))}
        />
      </Field>

      <Field label="Estado">
        <Segmented
          value={form.status}
          options={STATUSES}
          onChange={(status) => setForm((f) => ({ ...f, status }))}
        />
      </Field>

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
