import { useEffect, useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

import { Radius, Spacing, Type, useAdminColors, withAlpha } from "../../constants/theme";
import { useToast } from "../common/Toast";
import {
  AdminScreen,
  Btn,
  Card,
  Field,
  Input,
  ListCard,
  PageHeader,
  Select,
  SkeletonList,
} from "./ui";

const WORKING_HOURS = [
  "24/7 — Todos los días",
  "08:00 — 18:00 hs",
  "08:00 — 20:00 hs",
  "09:00 — 17:00 hs",
] as const;

type WorkingHours = (typeof WORKING_HOURS)[number];

interface Settings {
  name: string;
  welcomeMessage: string;
  secondaryMessage: string;
  autoResponse: boolean;
  workingHours: WorkingHours;
  department: string;
}

const DEFAULTS: Settings = {
  name: "ChatAP",
  welcomeMessage:
    "¡Hola! Soy ChatAP, el asistente virtual de la Subsecretaría de Recursos Humanos. Estoy acá para ayudarte con tus consultas sobre licencias, haberes, trámites y más. ¿En qué puedo ayudarte hoy?",
  secondaryMessage:
    "Podés preguntarme sobre licencias, recibos de haberes, trámites, o escribir 'menú' para ver todas las opciones disponibles.",
  autoResponse: true,
  workingHours: "24/7 — Todos los días",
  department: "Subsecretaría de Recursos Humanos",
};

export default function ChatbotSettings() {
  const C = useAdminColors();
  const push = useToast();

  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

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
        title="Configuración del Chatbot"
        description="Personalizá el comportamiento y los mensajes del asistente virtual."
      >
        <View style={styles.statusChip}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: settings.autoResponse ? C.ok : C.line },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: settings.autoResponse ? C.ok : C.muted },
            ]}
          >
            {settings.autoResponse
              ? "Respuestas automáticas activas"
              : "Respuestas automáticas desactivadas"}
          </Text>
        </View>
      </PageHeader>

      <Card padded style={{ gap: Spacing[4] }}>
        <Text style={[styles.sectionTitle, { color: C.ink }]}>
          Mensajes del chatbot
        </Text>

        <Field label="Nombre del asistente">
          <Input
            value={settings.name}
            onChangeText={(name) => setSettings((s) => ({ ...s, name }))}
          />
        </Field>

        <Field label="Mensaje de bienvenida">
          <Input
            value={settings.welcomeMessage}
            onChangeText={(welcomeMessage) =>
              setSettings((s) => ({ ...s, welcomeMessage }))
            }
            multiline
            style={{ minHeight: 110, textAlignVertical: "top" }}
          />
        </Field>

        <Field label="Mensaje secundario">
          <Input
            value={settings.secondaryMessage}
            onChangeText={(secondaryMessage) =>
              setSettings((s) => ({ ...s, secondaryMessage }))
            }
            multiline
            style={{ minHeight: 84, textAlignVertical: "top" }}
          />
        </Field>
      </Card>

      <Card padded style={{ gap: Spacing[4], marginTop: Spacing[4] }}>
        <Text style={[styles.sectionTitle, { color: C.ink }]}>Comportamiento</Text>

        <View style={styles.switchRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.switchLabel, { color: C.ink }]}>
              Respuestas automáticas
            </Text>
            <Text style={[styles.switchHint, { color: C.muted }]}>
              El chatbot responde solo, con la base de conocimiento.
            </Text>
          </View>
          <Switch
            value={settings.autoResponse}
            onValueChange={(autoResponse) =>
              setSettings((s) => ({ ...s, autoResponse }))
            }
            trackColor={{ false: C.line, true: withAlpha(C.brand, 0.5) }}
            thumbColor={settings.autoResponse ? C.brand : C.faint}
          />
        </View>

        <Field label="Horario de atención">
          <Select
            value={settings.workingHours}
            options={WORKING_HOURS}
            onChange={(workingHours) => setSettings((s) => ({ ...s, workingHours }))}
          />
        </Field>

        <Field label="Dependencia">
          <Input
            value={settings.department}
            onChangeText={(department) => setSettings((s) => ({ ...s, department }))}
          />
        </Field>
      </Card>

      <View style={{ marginTop: Spacing[5], flexDirection: "row", gap: Spacing[2] }}>
        <Btn
          label="Guardar configuración"
          icon="checkmark"
          onPress={() => push("Configuración guardada correctamente.", "success")}
        />
        <Btn
          label="Restablecer"
          variant="ghost"
          onPress={() => {
            setSettings(DEFAULTS);
            push("Se restablecieron los valores por defecto.", "info");
          }}
        />
      </View>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    ...Type.cardTitle,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
  },
  statusText: {
    ...Type.metaStrong,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
  },
  switchLabel: {
    ...Type.bodyStrong,
  },
  switchHint: {
    ...Type.meta,
  },
});
