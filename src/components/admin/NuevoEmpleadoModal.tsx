import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Btn } from "@/components/ui/Btn";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Text } from "@/components/ui/Text";
import { Toggle } from "@/components/ui/Toggle";
import { Spacing, Type, useColors } from "@/constants/theme";
import { assertValidPassword, isValidEmail, normalizeEmail } from "@/lib/auth";
import { pedirSectores, type EmpleadoDatos, type SectorApi } from "@/lib/backend";

export function NuevoEmpleadoModal({
  open,
  onClose,
  onCrear,
}: {
  open: boolean;
  onClose: () => void;
  onCrear: (datos: EmpleadoDatos) => Promise<void>;
}) {
  const C = useColors();
  const [sectores, setSectores] = useState<SectorApi[]>([]);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [elegidos, setElegidos] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;
    let activo = true;
    pedirSectores()
      .then((lista) => {
        if (activo) setSectores(lista);
      })
      .catch((e) => {
        if (activo) setError(e instanceof Error ? e.message : "No se pudieron cargar los sectores.");
      });
    return () => {
      activo = false;
    };
  }, [open]);

  function alternar(id: number) {
    setElegidos((actuales) =>
      actuales.includes(id) ? actuales.filter((x) => x !== id) : [...actuales, id]
    );
  }

  function cerrar() {
    setNombre("");
    setEmail("");
    setPassword("");
    setElegidos([]);
    setError("");
    onClose();
  }

  async function guardar() {
    setError("");
    const correo = normalizeEmail(email);
    try {
      if (!nombre.trim()) throw new Error("Ingresá el nombre.");
      if (!isValidEmail(correo)) throw new Error("Ingresá un correo electrónico válido.");
      assertValidPassword(password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revisá los datos.");
      return;
    }
    setGuardando(true);
    try {
      await onCrear({ nombre: nombre.trim(), email: correo, password, sectorIds: elegidos });
      cerrar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear el empleado.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Nuevo empleado"
      onClose={cerrar}
      footer={<Btn label="Crear empleado" onPress={guardar} loading={guardando} />}
    >
      <Field label="Nombre y apellido">
        <Input value={nombre} onChangeText={setNombre} placeholder="Ana Pérez" autoCapitalize="words" />
      </Field>
      <Field label="Correo electrónico">
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder="nombre@formosa.gob.ar"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </Field>
      <Field label="Contraseña provisoria" hint="Al menos 8 caracteres. Tendrá que cambiarla al ingresar.">
        <PasswordInput
          value={password}
          onChangeText={setPassword}
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
        />
      </Field>

      <Field label="Sectores" error={error || undefined}>
        <View>
          {sectores.map((sector) => (
            <Pressable
              key={sector.id}
              onPress={() => alternar(sector.id)}
              accessibilityRole="switch"
              accessibilityState={{ checked: elegidos.includes(sector.id) }}
              style={styles.fila}
            >
              <Text style={[Type.rowTitle, { color: C.ink, flex: 1 }]}>{sector.nombre}</Text>
              <Toggle value={elegidos.includes(sector.id)} />
            </Pressable>
          ))}
        </View>
      </Field>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    minHeight: 48,
  },
});
