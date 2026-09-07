import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Spacing, Type, useAdminColors } from "../../constants/theme";
import { knowledgeBase } from "../../data/mockKnowledge";
import { sigedRecords } from "../../data/mockSiged";
import { users } from "../../data/mockUsers";
import {
  AdminScreen,
  CardHeader,
  ListCard,
  PageHeader,
  Row,
  StatGrid,
  StatCard,
  StatusPill,
  type Tone,
} from "./ui";

interface Stat {
  title: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  tone: Tone;
  hint?: string;
}

export default function Dashboard() {
  const C = useAdminColors();

  const stats: Stat[] = [
    {
      title: "Usuarios activos",
      value: users.filter((u) => u.status === "Activo").length,
      icon: "people-outline",
      tone: "brand",
      hint: `de ${users.length} usuarios`,
    },
    {
      title: "Artículos publicados",
      value: knowledgeBase.filter((k) => k.active).length,
      icon: "bulb-outline",
      tone: "ok",
      hint: `de ${knowledgeBase.length} artículos`,
    },
    {
      title: "Expedientes SIGED",
      value: sigedRecords.length,
      icon: "documents-outline",
      tone: "info",
      hint: "en el sistema",
    },
    {
      title: "Pendientes",
      value: sigedRecords.filter(
        (r) => r.status === "En proceso" || r.status === "Ingresado"
      ).length,
      icon: "time-outline",
      tone: "warn",
      hint: "requieren atención",
    },
  ];

  return (
    <AdminScreen>
      <PageHeader
        title="Panel general"
        description="Resumen de la actividad del Acceso Interno."
      />

      <StatGrid>
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            label={stat.title}
            value={stat.value}
            tone={stat.tone}
            hint={stat.hint}
            icon={stat.icon}
          />
        ))}
      </StatGrid>

      <ListCard style={{ marginTop: Spacing[8] }}>
        <CardHeader
          title="Últimos movimientos"
          subtitle="Sistema de Gestión Documental"
        />
        {sigedRecords.slice(0, 4).map((rec) => (
          <Row key={rec.id}>
            <View style={styles.rowTop}>
              <Text style={[Type.bodyStrong, { color: C.ink, flexShrink: 1 }]} numberOfLines={1}>
                {rec.type}
              </Text>
              <StatusPill status={rec.status} />
            </View>

            <Text style={[Type.meta, { color: C.muted, marginTop: 2 }]} numberOfLines={1}>
              {rec.applicant}
            </Text>
            <Text style={[Type.meta, { color: C.faint }]} numberOfLines={2}>
              {rec.id} — {rec.lastMovement}
            </Text>
          </Row>
        ))}
      </ListCard>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing[2],
  },
});
