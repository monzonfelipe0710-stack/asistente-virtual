import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import { Radius, Spacing, Type, Typography, useAdminColors } from "../../constants/theme";
import { documents } from "../../data/mockDocuments";
import { knowledgeBase, knowledgeCategories } from "../../data/mockKnowledge";
import { sigedRecords } from "../../data/mockSiged";
import { departments, users } from "../../data/mockUsers";
import {
  AdminScreen,
  Card,
  CountUp,
  FilterChip,
  PageHeader,
  StatGrid,
  SectionTitle,
  StatCard,
} from "./ui";

const DEPT_SHORT: Record<string, string> = {
  "Mesa de Entradas": "Mesa",
  "Recursos Humanos": "RR.HH.",
  Legajos: "Legajos",
  Liquidaciones: "Liquid.",
  Sistemas: "Sistemas",
};

interface Segment {
  label: string;
  value: number;
  color: string;
}

/**
 * Dona en SVG, sin librerías de gráficos. Al tocar una porción se resalta y el
 * centro muestra su porcentaje: en web esto era `hover`, acá es un toque.
 */
function DonutChart({
  segments,
  size = 190,
  thickness = 26,
}: {
  segments: Segment[];
  size?: number;
  thickness?: number;
}) {
  const C = useAdminColors();
  const [active, setActive] = useState<number | null>(null);

  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = 62;
  const circumference = 2 * Math.PI * r;

  const activeSeg = active !== null ? segments[active] : null;
  const activePct =
    activeSeg && total ? Math.round((activeSeg.value / total) * 100) : 0;

  let acc = 0;
  const arcs = segments.map((s, i) => {
    const frac = total ? s.value / total : 0;
    // El hueco de 5 unidades separa las porciones; el mínimo de 3 evita que una
    // porción de valor 1 desaparezca del todo.
    const len = s.value ? Math.max(frac * circumference - 5, 3) : 0;
    const arc = { seg: s, i, len, offset: -acc };
    acc += frac * circumference;
    return arc;
  });

  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              strokeWidth={thickness}
              stroke={C.mist}
            />
            {total > 0 &&
              arcs.map(({ seg, i, len, offset }) =>
                len > 0 ? (
                  <Circle
                    key={seg.label}
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={seg.color}
                    strokeLinecap="round"
                    strokeWidth={active === i ? thickness + 6 : thickness}
                    strokeDasharray={`${len} ${circumference - len}`}
                    strokeDashoffset={offset}
                    opacity={active === null || active === i ? 1 : 0.28}
                  />
                ) : null
              )}
          </G>
        </Svg>

        <View style={[StyleSheet.absoluteFill, styles.donutCenter]} pointerEvents="none">
          {activeSeg ? (
            <>
              <Text style={[styles.donutBig, { color: activeSeg.color }]}>
                {activePct}%
              </Text>
              <View
                style={[styles.donutRule, { backgroundColor: activeSeg.color, opacity: 0.5 }]}
              />
              <Text style={[styles.donutLabel, { color: C.ink }]}>{activeSeg.label}</Text>
              <Text style={[styles.donutHint, { color: C.muted }]}>
                {activeSeg.value} expedientes
              </Text>
            </>
          ) : (
            <>
              <CountUp value={total} style={[styles.donutBig, { color: C.ink }]} />
              <View style={[styles.donutRule, { backgroundColor: C.line }]} />
              <Text style={[styles.donutHint, { color: C.muted }]}>
                expedientes en total
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Leyenda: además de explicar, es lo que se toca para resaltar */}
      <View style={styles.legend}>
        {segments.map((s, i) => (
          <Pressable
            key={s.label}
            onPress={() => setActive(active === i ? null : i)}
            accessibilityRole="button"
            accessibilityState={{ selected: active === i }}
            accessibilityLabel={`${s.label}: ${s.value} expedientes`}
            style={styles.legendItem}
          >
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text style={[styles.legendText, { color: active === i ? C.ink : C.muted }]}>
              {s.label} ({s.value})
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** Barras verticales por área. */
function VBars({ data }: { data: { label: string; value: number }[] }) {
  const C = useAdminColors();
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <View style={styles.vbars}>
      {data.map((d, i) => {
        const pct = Math.round((d.value / max) * 100);
        const pctTotal = total ? Math.round((d.value / total) * 100) : 0;
        const isActive = active === i;

        return (
          <Pressable
            key={d.label}
            onPress={() => setActive(isActive ? null : i)}
            accessibilityRole="button"
            accessibilityLabel={`${d.label}: ${d.value} expedientes, ${pctTotal} por ciento`}
            style={styles.vbarCol}
          >
            <Text
              style={[styles.vbarValue, { color: isActive ? C.brandDeep : C.ink }]}
            >
              {isActive ? `${pctTotal}%` : d.value}
            </Text>
            <View style={[styles.vbarTrack, { backgroundColor: C.mist }]}>
              <View
                style={{
                  width: "60%",
                  height: `${d.value > 0 ? Math.max(pct, 6) : 0}%`,
                  backgroundColor: isActive ? C.brandDeep : C.brand,
                  borderTopLeftRadius: Radius.sm,
                  borderTopRightRadius: Radius.sm,
                }}
              />
            </View>
            <Text style={[styles.vbarLabel, { color: C.muted }]} numberOfLines={1}>
              {DEPT_SHORT[d.label] ?? d.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Barra horizontal con etiqueta y valor. */
function HBarRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const C = useAdminColors();
  const pct = max ? Math.round((value / max) * 100) : 0;

  return (
    <View style={styles.hbarRow}>
      <Text style={[styles.hbarLabel, { color: C.muted }]} numberOfLines={1}>
        {label}
      </Text>
      <View style={[styles.hbarTrack, { backgroundColor: C.mist }]}>
        <View
          style={{
            width: `${pct}%`,
            height: "100%",
            backgroundColor: color,
            borderRadius: Radius.full,
          }}
        />
      </View>
      <Text style={[styles.hbarValue, { color: C.ink }]}>{value}</Text>
    </View>
  );
}

function RankRow({
  index,
  title,
  subtitle,
  value,
}: {
  index: number;
  title: string;
  subtitle: string;
  value: number;
}) {
  const C = useAdminColors();
  // El puesto es solo el número: los tres primeros en el color de destaque.
  const badgeFg = index < 3 ? C.warn : C.faint;

  return (
    <View style={styles.rankRow}>
      <Text style={[styles.rankBadgeText, { color: badgeFg }]}>{index + 1}</Text>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.rankTitle, { color: C.ink }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.rankSub, { color: C.muted }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <CountUp value={value} style={[styles.rankValue, { color: C.muted }]} />
    </View>
  );
}

const PERIODS = ["7 días", "30 días", "90 días"] as const;

export default function ReportsPage() {
  const C = useAdminColors();
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("7 días");

  const stats = useMemo(() => {
    const activeUsers = users.filter((u) => u.status === "Activo").length;
    const activeArticles = knowledgeBase.filter((k) => k.active).length;
    const totalViews = knowledgeBase.reduce((s, k) => s + (k.views || 0), 0);
    const totalDownloads = documents.reduce((s, d) => s + d.downloads, 0);

    return {
      activeUsers,
      activeArticles,
      totalViews,
      totalDownloads,
      inactiveUsers: users.length - activeUsers,
      byCategory: knowledgeCategories
        .filter((c) => c !== "Todas")
        .map((cat) => ({
          label: cat,
          count: knowledgeBase.filter((k) => k.category === cat).length,
        })),
      byDept: departments.map((d) => ({
        label: d,
        value: sigedRecords.filter((r) => r.department === d).length,
      })),
      usersByRole: (["Superadmin", "Administrador", "Ciudadano"] as const).map((r) => ({
        label: r,
        count: users.filter((u) => u.role === r).length,
      })),
      topArticles: [...knowledgeBase]
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5),
      topDocs: [...documents].sort((a, b) => b.downloads - a.downloads).slice(0, 5),
    };
  }, []);

  const sigedSegments: Segment[] = [
    {
      label: "Ingresado",
      value: sigedRecords.filter((r) => r.status === "Ingresado").length,
      color: C.info,
    },
    {
      label: "En proceso",
      value: sigedRecords.filter((r) => r.status === "En proceso").length,
      color: C.warn,
    },
    {
      label: "Observado",
      value: sigedRecords.filter((r) => r.status === "Observado").length,
      color: C.bad,
    },
    {
      label: "Finalizado",
      value: sigedRecords.filter((r) => r.status === "Finalizado").length,
      color: C.ok,
    },
  ];

  const maxCat = Math.max(...stats.byCategory.map((c) => c.count), 1);
  const maxRole = Math.max(...stats.usersByRole.map((r) => r.count), 1);
  const activePct = Math.round((stats.activeUsers / users.length) * 100);

  return (
    <AdminScreen>
      <PageHeader
        title="Reportes y Analíticas"
        description="Métricas detalladas del sistema y del contenido."
      >
        {PERIODS.map((p) => (
          <FilterChip
            key={p}
            label={p}
            active={period === p}
            onPress={() => setPeriod(p)}
          />
        ))}
      </PageHeader>

      <StatGrid>
        <StatCard
          label="Vistas totales"
          value={stats.totalViews}
          hint="en artículos"
          icon="eye-outline"
          tone="info"
        />
        <StatCard
          label="Descargas"
          value={stats.totalDownloads}
          hint="de documentos"
          icon="download-outline"
          tone="ok"
        />
        <StatCard
          label="Expedientes"
          value={sigedRecords.length}
          hint="gestionados"
          icon="documents-outline"
          tone="warn"
        />
        <StatCard
          label="Artículos activos"
          value={stats.activeArticles}
          hint={`de ${knowledgeBase.length} en base`}
          icon="bulb-outline"
          tone="brand"
        />
      </StatGrid>

      <SectionTitle>Gráficos</SectionTitle>

      <Card padded>
        <Text style={[Type.cardTitle, { color: C.ink }]}>Estado de expedientes</Text>
        <Text style={[styles.cardSub, { color: C.muted }]}>
          Distribución actual por etapa del trámite
        </Text>
        <View style={{ marginTop: Spacing[4] }}>
          <DonutChart segments={sigedSegments} />
        </View>
      </Card>

      <Card padded style={{ marginTop: Spacing[3] }}>
        <Text style={[Type.cardTitle, { color: C.ink }]}>Expedientes por área</Text>
        <View style={{ marginTop: Spacing[4] }}>
          <VBars data={stats.byDept} />
        </View>
      </Card>

      <Card padded style={{ marginTop: Spacing[3], gap: Spacing[3] }}>
        <Text style={[Type.cardTitle, { color: C.ink }]}>Artículos por categoría</Text>
        {stats.byCategory.map((c) => (
          <HBarRow
            key={c.label}
            label={c.label}
            value={c.count}
            max={maxCat}
            color={C.brand}
          />
        ))}
      </Card>

      <Card padded style={{ marginTop: Spacing[3], gap: Spacing[3] }}>
        <Text style={[Type.cardTitle, { color: C.ink }]}>Usuarios por rol</Text>
        {stats.usersByRole.map((r) => (
          <HBarRow
            key={r.label}
            label={r.label}
            value={r.count}
            max={maxRole}
            color={C.info}
          />
        ))}
      </Card>

      <Card padded style={{ marginTop: Spacing[3] }}>
        <Text style={[Type.cardTitle, { color: C.ink }]}>
          Distribución de usuarios
        </Text>
        <View style={[styles.splitBar, { backgroundColor: C.mist }]}>
          <View style={{ width: `${activePct}%`, backgroundColor: C.ok }} />
          <View style={{ width: `${100 - activePct}%`, backgroundColor: C.line }} />
        </View>
        <View style={styles.splitLegend}>
          <View style={styles.splitCell}>
            <View style={[styles.legendDot, { backgroundColor: C.ok }]} />
            <View>
              <CountUp
                value={stats.activeUsers}
                style={[styles.splitValue, { color: C.ink }]}
              />
              <Text style={[styles.splitLabel, { color: C.muted }]}>
                Activos · {activePct}%
              </Text>
            </View>
          </View>
          <View style={styles.splitCell}>
            <View style={[styles.legendDot, { backgroundColor: C.line }]} />
            <View>
              <CountUp
                value={stats.inactiveUsers}
                style={[styles.splitValue, { color: C.ink }]}
              />
              <Text style={[styles.splitLabel, { color: C.muted }]}>
                Inactivos · {100 - activePct}%
              </Text>
            </View>
          </View>
        </View>
      </Card>

      <SectionTitle>Lo más solicitado</SectionTitle>

      <Card padded style={{ gap: Spacing[2] }}>
        <Text style={[Type.cardTitle, { color: C.ink }]}>
          Preguntas más frecuentes
        </Text>
        {stats.topArticles.map((a, i) => (
          <RankRow
            key={a.id}
            index={i}
            title={a.question}
            subtitle={`${a.category} · ${a.views} vistas`}
            value={a.views}
          />
        ))}
      </Card>

      <Card padded style={{ marginTop: Spacing[3], gap: Spacing[2] }}>
        <Text style={[Type.cardTitle, { color: C.ink }]}>
          Documentos más descargados
        </Text>
        {stats.topDocs.map((d, i) => (
          <RankRow
            key={d.id}
            index={i}
            title={d.title}
            subtitle={`${d.category} · ${d.format} · ${d.fileSize}`}
            value={d.downloads}
          />
        ))}
      </Card>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  cardSub: {
    ...Type.meta,
    marginTop: 2,
  },
  donutCenter: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing[10],
  },
  donutBig: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: Typography.bold,
  },
  donutRule: {
    width: 32,
    height: 2,
    borderRadius: Radius.full,
    marginTop: Spacing[2],
  },
  donutLabel: {
    ...Type.metaStrong,
    marginTop: 6,
    textAlign: "center",
  },
  donutHint: {
    ...Type.meta,
    marginTop: 2,
    textAlign: "center",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing[3],
    marginTop: Spacing[4],
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
  },
  legendText: {
    fontSize: Typography.sm,
  },
  vbars: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: Spacing[2],
    height: 190,
  },
  vbarCol: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },
  vbarValue: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    marginBottom: Spacing[1],
  },
  vbarTrack: {
    width: "100%",
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  vbarLabel: {
    ...Type.meta,
    marginTop: 6,
    textAlign: "center",
  },
  hbarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
  },
  hbarLabel: {
    width: 92,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  hbarTrack: {
    flex: 1,
    height: 16,
    borderRadius: Radius.full,
    overflow: "hidden",
  },
  hbarValue: {
    width: 26,
    textAlign: "right",
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
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
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
  },
  splitLabel: {
    ...Type.meta,
    marginTop: 2,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    paddingVertical: 6,
  },
  rankBadgeText: {
    ...Type.metaStrong,
    width: 18,
  },
  rankTitle: {
    ...Type.bodyStrong,
  },
  rankSub: {
    ...Type.meta,
    marginTop: 1,
  },
  rankValue: {
    ...Type.metaStrong,
  },
});
