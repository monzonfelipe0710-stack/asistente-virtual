import { useCuentas } from "@/hooks/useCuentas";
import { useMetricas } from "@/hooks/useMetricas";
import { useTramites } from "@/hooks/useTramites";
import { type Tone } from "@/components/ui/Badge";
import { type AuthUser } from "@/lib/auth";
import { type TramiteApi } from "@/lib/backend";
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

function contarUsuariosActivos(cuentas: AuthUser[]) {
  let total = 0;
  for (const cuenta of cuentas) {
    const estado = cuenta.status ?? "Activo";
    if (estado === "Activo") total += 1;
  }
  return total;
}

function contarTramitesPublicados(tramites: TramiteApi[]) {
  let total = 0;
  for (const tramite of tramites) {
    if (tramite.publicado) total += 1;
  }
  return total;
}

export default function Dashboard() {
  const { cuentas } = useCuentas();
  const { tramites } = useTramites();
  const { sinRespuesta } = useMetricas();

  const usuariosActivos = contarUsuariosActivos(cuentas);
  const aceptados = contarTramitesPublicados(tramites);
  const rechazados = tramites.length - aceptados;

  const stats: Stat[] = [
    {
      title: "Usuarios activos",
      value: usuariosActivos,
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
      value: rechazados,
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
