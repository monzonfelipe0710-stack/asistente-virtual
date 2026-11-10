import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { DonutChart, type Segment } from "@/components/reportes/DonutChart";
import { HBarRow } from "@/components/reportes/HBarRow";
import { RankRow } from "@/components/reportes/RankRow";
import { Text } from "@/components/ui/Text";
import { Radius, Spacing, Type, Weight, useColors } from "@/constants/theme";
import { useCuentas } from "@/hooks/useCuentas";
import { useMetricas } from "@/hooks/useMetricas";
import { useTramites } from "@/hooks/useTramites";
import { rolesDePersonal, type AuthUser } from "@/lib/auth";
import type { ConsultaSinRespuestaApi, ConsultasPorTramiteApi } from "@/lib/backend";
import { formatDate } from "@/utils/date";
import { Screen } from "@/components/ui/Screen";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { CountUp } from "@/components/ui/CountUp";
import { StatCard } from "@/components/ui/StatCard";
import { StatGrid } from "@/components/ui/StatGrid";

interface UsuariosDeUnRol {
  label: string;
  count: number;
}

function contarUsuariosActivos(cuentas: AuthUser[]) {
  let activos = 0;
  for (const cuenta of cuentas) {
    const estado = cuenta.status ?? "Activo";
    if (estado === "Activo") activos = activos + 1;
  }
  return activos;
}

function contarUsuariosPorRol(cuentas: AuthUser[]) {
  const usuariosPorRol: UsuariosDeUnRol[] = [];
  for (const rol of rolesDePersonal) {
    const usuariosDelRol = cuentas.filter((u) => u.role === rol);
    usuariosPorRol.push({ label: rol, count: usuariosDelRol.length });
  }
  return usuariosPorRol;
}

function sumarConsultasRespondidas(porTramite: ConsultasPorTramiteApi[]) {
  let total = 0;
  for (const tramite of porTramite) {
    total = total + tramite.cantidad;
  }
  return total;
}

function calcularMaximoPorRol(usuariosPorRol: UsuariosDeUnRol[]) {
  let maximo = 1;
  for (const rol of usuariosPorRol) {
    if (rol.count > maximo) maximo = rol.count;
  }
  return maximo;
}

function calcularPorcentajeActivos(activos: number, totalCuentas: number) {
  if (totalCuentas === 0) return 0;
  return Math.round((activos / totalCuentas) * 100);
}

function TarjetasResumen({
  consultasRespondidas,
  cantidadSinRespuesta,
  cantidadTramites,
  tramitesAceptados,
}: {
  consultasRespondidas: number;
  cantidadSinRespuesta: number;
  cantidadTramites: number;
  tramitesAceptados: number;
}) {
  return (
    <StatGrid>
      <StatCard
        label="Consultas respondidas"
        value={consultasRespondidas}
        hint="en el asistente"
        icon="eye"
        tone="info"
      />
      <StatCard
        label="Sin respuesta"
        value={cantidadSinRespuesta}
        hint="últimas consultas"
        icon="bulb"
        tone="brand"
      />
      <StatCard
        label="Trámites"
        value={cantidadTramites}
        hint="en el sistema"
        icon="files"
        tone="warn"
      />
      <StatCard
        label="Publicados"
        value={tramitesAceptados}
        hint="visibles al público"
        icon="download"
        tone="ok"
      />
    </StatGrid>
  );
}

function BloqueRevisionDeTramites({ segments }: { segments: Segment[] }) {
  const C = useColors();
  return (
    <View style={styles.block}>
      <Text style={[Type.cardTitle, { color: C.ink }]}>Revisión de trámites</Text>
      <Text style={[styles.cardSub, { color: C.ink2 }]}>
        Trámites aceptados y rechazados por el Administrador
      </Text>
      <View style={{ marginTop: Spacing[4] }}>
        <DonutChart segments={segments} />
      </View>
    </View>
  );
}

function BloqueUsuariosPorRol({
  usuariosPorRol,
  maximo,
}: {
  usuariosPorRol: UsuariosDeUnRol[];
  maximo: number;
}) {
  const C = useColors();
  return (
    <View style={[styles.block, styles.blockNext, { gap: Spacing[3] }]}>
      <Text style={[Type.cardTitle, { color: C.ink }]}>Usuarios por rol</Text>
      {usuariosPorRol.map((r) => (
        <HBarRow
          key={r.label}
          label={r.label}
          value={r.count}
          max={maximo}
          color={C.info}
        />
      ))}
    </View>
  );
}

function BloqueDistribucionDeUsuarios({
  activos,
  inactivos,
  porcentajeActivos,
}: {
  activos: number;
  inactivos: number;
  porcentajeActivos: number;
}) {
  const C = useColors();
  return (
    <View style={[styles.block, styles.blockNext]}>
      <Text style={[Type.cardTitle, { color: C.ink }]}>
        Distribución de usuarios
      </Text>
      <View style={[styles.splitBar, { backgroundColor: C.surface }]}>
        <View style={{ width: `${porcentajeActivos}%`, backgroundColor: C.ok }} />
        <View style={{ width: `${100 - porcentajeActivos}%`, backgroundColor: C.border }} />
      </View>
      <View style={styles.splitLegend}>
        <View style={styles.splitCell}>
          <View style={[styles.legendDot, { backgroundColor: C.ok }]} />
          <View>
            <CountUp
              value={activos}
              style={[styles.splitValue, { color: C.ink }]}
            />
            <Text style={[styles.splitLabel, { color: C.ink2 }]}>
              Activos · {porcentajeActivos}%
            </Text>
          </View>
        </View>
        <View style={styles.splitCell}>
          <View style={[styles.legendDot, { backgroundColor: C.border }]} />
          <View>
            <CountUp
              value={inactivos}
              style={[styles.splitValue, { color: C.ink }]}
            />
            <Text style={[styles.splitLabel, { color: C.ink2 }]}>
              Suspendidos · {100 - porcentajeActivos}%
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function BloquePreguntasFrecuentes({ topTramites }: { topTramites: ConsultasPorTramiteApi[] }) {
  const C = useColors();
  return (
    <View style={[styles.block, { gap: Spacing[2] }]}>
      <Text style={[Type.cardTitle, { color: C.ink }]}>
        Preguntas más frecuentes
      </Text>
      {topTramites.map((t, i) => (
        <RankRow
          key={t.tramiteId}
          index={i}
          title={t.nombre ?? `Trámite #${t.tramiteId}`}
          subtitle={`${t.sector?.nombre ?? "Sin sector"} · ${t.cantidad} consultas`}
          value={t.cantidad}
        />
      ))}
      {topTramites.length === 0 && (
        <Text style={[Type.meta, { color: C.ink2 }]}>Todavía no hay consultas respondidas.</Text>
      )}
    </View>
  );
}

function BloqueConsultasSinRespuesta({ sinRespuesta }: { sinRespuesta: ConsultaSinRespuestaApi[] }) {
  const C = useColors();
  return (
    <View style={[styles.block, styles.blockNext, { gap: Spacing[2] }]}>
      <Text style={[Type.cardTitle, { color: C.ink }]}>
        Consultas sin respuesta
      </Text>
      {sinRespuesta.slice(0, 10).map((c) => (
        <View key={c.id} style={styles.consultaSin}>
          <Text style={[Type.body, { color: C.ink }]}>{c.textoConsulta}</Text>
          <Text style={[Type.meta, { color: C.ink2 }]}>{formatDate(c.fecha)}</Text>
        </View>
      ))}
      {sinRespuesta.length === 0 && (
        <Text style={[Type.meta, { color: C.ink2 }]}>No hay consultas sin respuesta.</Text>
      )}
    </View>
  );
}

export default function Reportes() {
  const C = useColors();
  const { cuentas } = useCuentas();
  const { tramites } = useTramites();
  const { porTramite, sinRespuesta, error: errorMetricas } = useMetricas();

  const stats = useMemo(() => {
    const activeUsers = contarUsuariosActivos(cuentas);

    return {
      activeUsers,
      inactiveUsers: cuentas.length - activeUsers,
      consultasRespondidas: sumarConsultasRespondidas(porTramite),
      usersByRole: contarUsuariosPorRol(cuentas),
      topTramites: porTramite.slice(0, 5),
    };
  }, [cuentas, porTramite]);

  const tramitesAceptados = tramites.filter((t) => t.publicado).length;
  const tramiteSegments: Segment[] = [
    { label: "Aceptados", value: tramitesAceptados, color: C.ok },
    { label: "Rechazados", value: tramites.length - tramitesAceptados, color: C.bad },
  ];

  const maxRole = calcularMaximoPorRol(stats.usersByRole);
  const activePct = calcularPorcentajeActivos(stats.activeUsers, cuentas.length);

  return (
    <Screen>
      <PageHeader
        title="Reportes"
        description="Métricas del sistema y del contenido."
      />

      {!!errorMetricas && (
        <Text style={[Type.meta, { color: C.danger, marginBottom: Spacing[3] }]}>{errorMetricas}</Text>
      )}

      <TarjetasResumen
        consultasRespondidas={stats.consultasRespondidas}
        cantidadSinRespuesta={sinRespuesta.length}
        cantidadTramites={tramites.length}
        tramitesAceptados={tramitesAceptados}
      />

      <SectionTitle>Gráficos</SectionTitle>

      <BloqueRevisionDeTramites segments={tramiteSegments} />

      <BloqueUsuariosPorRol usuariosPorRol={stats.usersByRole} maximo={maxRole} />

      <BloqueDistribucionDeUsuarios
        activos={stats.activeUsers}
        inactivos={stats.inactiveUsers}
        porcentajeActivos={activePct}
      />

      <SectionTitle>Lo más solicitado</SectionTitle>

      <BloquePreguntasFrecuentes topTramites={stats.topTramites} />

      <BloqueConsultasSinRespuesta sinRespuesta={sinRespuesta} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: {
    paddingVertical: Spacing[2],
  },
  blockNext: {
    marginTop: Spacing[3],
  },
  consultaSin: {
    gap: 2,
    paddingVertical: Spacing[2],
  },
  splitBar: {
    flexDirection: "row",
    height: 20,
    borderRadius: Radius.full,
    overflow: "hidden",
    marginTop: Spacing[4],
  },
  splitLegend: {
    flexDirection: "row",
    gap: Spacing[3],
    marginTop: Spacing[4],
  },
  splitCell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
  },
  splitValue: {
    fontSize: 17,
    fontWeight: Weight.semibold,
  },
  splitLabel: {
    ...Type.meta,
    marginTop: 2,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
  },
  cardSub: {
    ...Type.meta,
    marginTop: 2,
  },
});
