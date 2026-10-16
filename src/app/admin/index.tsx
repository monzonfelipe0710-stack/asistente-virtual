import { useState } from "react";
import { useRouter } from "expo-router";
import { View } from "react-native";

import { Spacing } from "@/constants/theme";
import type { KnowledgeEntry } from "@/data/mockKnowledge";
import type { SigedRecord } from "@/data/mockSiged";
import { useCuentas } from "@/hooks/useCuentas";
import { formatDate } from "@/utils/date";
import { type Tone } from "@/components/ui/Badge";
import { AvisoDeEjemplo } from "@/components/ui/AvisoDeEjemplo";
import { Btn } from "@/components/ui/Btn";
import { type IconName } from "@/components/ui/Icon";
import { RecordRow } from "@/components/ui/RecordRow";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatCard } from "@/components/ui/StatCard";

interface Stat {
  title: string;
  value: number;
  icon: IconName;
  tone: Tone;
  hint?: string;
  ejemplo?: boolean;
}

export default function Dashboard() {
  const router = useRouter();
  const { cuentas } = useCuentas();
  const [knowledgeBase] = useState<KnowledgeEntry[]>([]);
  const [sigedRecords] = useState<SigedRecord[]>([]);

  const stats: Stat[] = [
    {
      title: "Usuarios activos",
      value: cuentas.filter((u) => (u.status ?? "Activo") === "Activo").length,
      icon: "users",
      tone: "ok",
      hint: "Dato real",
    },
    {
      title: "Artículos publicados",
      value: knowledgeBase.filter((k) => k.active).length,
      icon: "bulb",
      tone: "info",
      hint: "Ejemplo",
      ejemplo: true,
    },
    {
      title: "Expedientes SIGED",
      value: sigedRecords.length,
      icon: "files",
      tone: "info",
      hint: "Ejemplo",
      ejemplo: true,
    },
    {
      title: "Pendientes",
      value: sigedRecords.filter(
        (r) => r.status === "En proceso" || r.status === "Ingresado"
      ).length,
      icon: "clock",
      tone: "info",
      hint: "Ejemplo",
      ejemplo: true,
    },
  ];

  return (
    <Screen>
      <PageHeader
        title="Panel general"
        description="Resumen de la actividad del acceso interno."
      />

      <AvisoDeEjemplo texto="Solo los usuarios activos vienen del servidor. El resto es de ejemplo." />

      <StatGrid>
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            label={stat.title}
            value={stat.value}
            tone={stat.tone}
            hint={stat.hint}
            icon={stat.icon}
            ejemplo={stat.ejemplo}
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
