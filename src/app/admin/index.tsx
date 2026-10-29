import { useCuentas } from "@/hooks/useCuentas";
import { useMetricas } from "@/hooks/useMetricas";
import { useTramites } from "@/hooks/useTramites";
import { type Tone } from "@/components/ui/Badge";
import { type IconName } from "@/components/ui/Icon";
import { Screen } from "@/components/ui/Screen";
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
  const { cuentas } = useCuentas();
  const { tramites } = useTramites();
  const { sinRespuesta } = useMetricas();

  const aceptados = tramites.filter((t) => t.publicado).length;

  const stats: Stat[] = [
    {
      title: "Usuarios activos",
      value: cuentas.filter((u) => (u.status ?? "Activo") === "Activo").length,
      icon: "users",
      tone: "ok",
      hint: "Dato real",
    },
    {
      title: "Consultas sin respuesta",
      value: sinRespuesta.length,
      icon: "bulb",
      tone: "info",
      hint: "Dato real",
    },
    {
      title: "Trámites aceptados",
      value: aceptados,
      icon: "files",
      tone: "ok",
      hint: "Dato real",
    },
    {
      title: "Trámites rechazados",
      value: tramites.length - aceptados,
      icon: "clock",
      tone: "bad",
      hint: "Dato real",
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
            ejemplo={stat.ejemplo}
          />
        ))}
      </StatGrid>
    </Screen>
  );
}
