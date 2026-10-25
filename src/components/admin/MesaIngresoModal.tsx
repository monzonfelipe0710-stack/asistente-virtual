import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Radius, Spacing, Type, useColors } from "@/constants/theme";
import { departments } from "@/data/departments";
import {
  mesaPriorities,
  mesaTipoDocumento,
  type MesaAdjunto,
  type MesaEntradaDraft,
  type MesaPriority,
} from "@/data/mockMesaEntrada";
import { formatDate } from "@/utils/date";
import { formatFileSize } from "@/utils/file";
import { Btn } from "@/components/ui/Btn";
import { Segmented } from "@/components/ui/Segmented";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { KeyValue } from "@/components/ui/KeyValue";
import { Modal } from "@/components/ui/Modal";
import { vibrarAlConfirmar, vibrarAlElegir } from "@/lib/haptica";
import { Select } from "@/components/ui/Select";
import { Text } from "@/components/ui/Text";

const MAX_ASUNTO = 120;

interface FormState {
  solicitante: string;
  tipo: string;
  dependencia: string;
  prioridad: MesaPriority;
  asunto: string;
  observaciones: string;
}

const EMPTY_FORM: FormState = {
  solicitante: "",
  tipo: mesaTipoDocumento[0],
  dependencia: "Mesa de Entradas",
  prioridad: "Normal",
  asunto: "",
  observaciones: "",
};

export function MesaIngresoModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (draft: MesaEntradaDraft) => void;
}) {
  const C = useColors();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [adjuntos, setAdjuntos] = useState<MesaAdjunto[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  async function pickFiles() {
    vibrarAlElegir();
    const res = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (res.canceled) return;
    vibrarAlConfirmar();
    setAdjuntos((prev) => [
      ...prev,
      ...res.assets.map((a) => ({
        name: a.name,
        uri: a.uri,
        size: a.size ?? undefined,
        mimeType: a.mimeType ?? undefined,
      })),
    ]);
  }

  function submit() {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.solicitante.trim()) next.solicitante = "El solicitante es obligatorio.";
    if (!form.asunto.trim()) next.asunto = "El asunto es obligatorio.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSave({ ...form, adjuntos });
  }

  return (
    <Modal
      open
      title="Registrar ingreso"
      onClose={onClose}
      footer={<Btn label="Registrar" onPress={submit} />}
    >
      <View>
        <KeyValue label="Fecha" value={formatDate(new Date())} />
      </View>

      <Field label="Solicitante" error={errors.solicitante}>
        <Input
          value={form.solicitante}
          onChangeText={(solicitante) => setForm((f) => ({ ...f, solicitante }))}
          placeholder="Nombre y apellido"
          autoCapitalize="words"
        />
      </Field>

      <View style={{ flexDirection: "row", gap: Spacing[3] }}>
        <View style={{ flex: 1 }}>
          <Field label="Tipo">
            <Select
              value={form.tipo}
              options={mesaTipoDocumento}
              onChange={(tipo) => setForm((f) => ({ ...f, tipo }))}
            />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Dependencia">
            <Select
              value={form.dependencia}
              options={departments}
              onChange={(dependencia) => setForm((f) => ({ ...f, dependencia }))}
            />
          </Field>
        </View>
      </View>

      {/* Segmentado y no chips: acá se elige un valor del trámite, no se filtra */}
      <Field label="Prioridad">
        <Segmented
          value={form.prioridad}
          options={mesaPriorities}
          onChange={(prioridad) => setForm((f) => ({ ...f, prioridad }))}
        />
      </Field>

      <Field
        label="Asunto"
        error={errors.asunto}
        hint={`${form.asunto.length} de ${MAX_ASUNTO} caracteres`}
      >
        <Input
          value={form.asunto}
          onChangeText={(asunto) =>
            setForm((f) => ({ ...f, asunto: asunto.slice(0, MAX_ASUNTO) }))
          }
          placeholder="Motivo del ingreso"
          maxLength={MAX_ASUNTO}
        />
      </Field>

      <Field label="Observaciones">
        <Input
          value={form.observaciones}
          onChangeText={(observaciones) => setForm((f) => ({ ...f, observaciones }))}
          placeholder="Documentación presentada, datos adicionales"
          multiline
          style={{ minHeight: 84, textAlignVertical: "top" }}
        />
      </Field>

      <Field label="Adjuntos">
        <View style={{ gap: Spacing[2] }}>
          {adjuntos.map((file, i) => (
            <View
              key={`${file.uri}-${i}`}
              style={[styles.fileRow, { backgroundColor: C.surface }]}
            >
              <Icon name="file" size={16} color={C.ink2} />
              <Text style={[Type.meta, { color: C.ink, flex: 1 }]} numberOfLines={1}>
                {file.name}
              </Text>
              <Text style={[Type.meta, { color: C.ink3 }]}>
                {formatFileSize(file.size)}
              </Text>
              <Pressable
                onPress={() => setAdjuntos((a) => a.filter((_, idx) => idx !== i))}
                accessibilityRole="button"
                accessibilityLabel={`Quitar ${file.name}`}
                hitSlop={8}
              >
                <Icon name="close" size={16} color={C.bad} />
              </Pressable>
            </View>
          ))}
          <Btn
            label="Adjuntar archivo"
            variant="secondary"
            icon="paperclip"
            onPress={pickFiles}
          />
        </View>
      </Field>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    minHeight: 48,
    paddingHorizontal: Spacing[4],
    borderRadius: Radius.lg,
  },
});
