import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { View } from "react-native";

import { Spacing } from "@/constants/theme";
import { knowledgeBase } from "@/data/mockKnowledge";
import { sigedRecords } from "@/data/mockSiged";
import { users } from "@/data/mockUsers";
import { formatDate } from "@/utils/date";
import { type Tone } from "@/components/ui/Badge";
import { Btn } from "@/components/ui/Btn";
import { RecordRow } from "@/components/ui/Lists";
import { Screen, SectionHeader, PageHeader } from "@/components/ui/Screen";
import { StatGrid, StatCard } from "@/components/ui/Stats";

interface Stat {
  title: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  tone: Tone;
  hint?: string;
}

export default function Dashboard() {
  const router = useRouter();

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
      tone: "brand",
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
    <Screen>
      <PageHeader
        title="Panel general"
        description="Resumen de la actividad del acceso interno."
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

      <View style={{ marginTop: Spacing[8] }}>
        <SectionHeader
          title="Últimos movimientos"
          subtitle="Sistema de Gestión Documental"
          right={
            <Btn
              label="Ver todos"
              variant="ghost"
              size="md"
              onPress={() => router.push("/admin/siged")}
            />
          }
        />
        {sigedRecords.slice(0, 4).map((rec) => (
          <RecordRow
            key={rec.id}
            title={rec.type}
            status={rec.status}
            who={rec.applicant}
            area={rec.department}
            priority={rec.priority}
            id={rec.id}
            date={formatDate(rec.date)}
            note={rec.lastMovement}
          />
        ))}
      </View>
    </Screen>
  );
}
