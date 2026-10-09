import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { DonutChart, HBarRow, RankRow, VBars, type Segment } from "@/components/reportes/Graficos";
import { Text } from "@/components/ui/Text";
import { Radius, Spacing, Type, Weight, useColors } from "@/constants/theme";
import { documents } from "@/data/mockDocuments";
import { knowledgeBase, knowledgeCategories } from "@/data/mockKnowledge";
import { sigedRecords } from "@/data/mockSiged";
import { departments, users } from "@/data/mockUsers";
import { Segmented } from "@/components/ui/Choices";
import { Screen, PageHeader, SectionTitle } from "@/components/ui/Screen";
import { CountUp, StatCard, StatGrid } from "@/components/ui/Stats";

const PERIODS = ["7 días", "30 días", "90 días"] as const;

export default function Reportes() {
  const C = useColors();
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
    <Screen>
      <PageHeader
        title="Reportes"
        description="Métricas del sistema y del contenido."
      >
        <View style={{ flex: 1 }}>
          <Segmented value={period} options={PERIODS} onChange={setPeriod} />
        </View>
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

      <View style={styles.block}>
        <Text style={[Type.cardTitle, { color: C.ink }]}>Estado de expedientes</Text>
        <Text style={[styles.cardSub, { color: C.ink2 }]}>
          Distribución actual por etapa del trámite
        </Text>
        <View style={{ marginTop: Spacing[4] }}>
          <DonutChart segments={sigedSegments} />
        </View>
      </View>

      <View style={[styles.block, styles.blockNext]}>
        <Text style={[Type.cardTitle, { color: C.ink }]}>Expedientes por área</Text>
        <View style={{ marginTop: Spacing[4] }}>
          <VBars data={stats.byDept} />
        </View>
      </View>

      <View style={[styles.block, styles.blockNext, { gap: Spacing[3] }]}>
        <Text style={[Type.cardTitle, { color: C.ink }]}>Artículos por categoría</Text>
        {stats.byCategory.map((c) => (
          <HBarRow
            key={c.label}
            label={c.label}
            value={c.count}
            max={maxCat}
            color={C.accent}
          />
        ))}
      </View>

      <View style={[styles.block, styles.blockNext, { gap: Spacing[3] }]}>
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
      </View>

      <View style={[styles.block, styles.blockNext]}>
        <Text style={[Type.cardTitle, { color: C.ink }]}>
          Distribución de usuarios
        </Text>
        <View style={[styles.splitBar, { backgroundColor: C.surface }]}>
          <View style={{ width: `${activePct}%`, backgroundColor: C.ok }} />
          <View style={{ width: `${100 - activePct}%`, backgroundColor: C.border }} />
        </View>
        <View style={styles.splitLegend}>
          <View style={styles.splitCell}>
            <View style={[styles.legendDot, { backgroundColor: C.ok }]} />
            <View>
              <CountUp
                value={stats.activeUsers}
                style={[styles.splitValue, { color: C.ink }]}
              />
              <Text style={[styles.splitLabel, { color: C.ink2 }]}>
                Activos · {activePct}%
              </Text>
            </View>
          </View>
          <View style={styles.splitCell}>
            <View style={[styles.legendDot, { backgroundColor: C.border }]} />
            <View>
              <CountUp
                value={stats.inactiveUsers}
                style={[styles.splitValue, { color: C.ink }]}
              />
              <Text style={[styles.splitLabel, { color: C.ink2 }]}>
                Inactivos · {100 - activePct}%
              </Text>
            </View>
          </View>
        </View>
      </View>

      <SectionTitle>Lo más solicitado</SectionTitle>

      <View style={[styles.block, { gap: Spacing[2] }]}>
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
      </View>

      <View style={[styles.block, styles.blockNext, { gap: Spacing[2] }]}>
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
      </View>
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
