import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { DonutChart, type Segment } from "@/components/reportes/DonutChart";
import { HBarRow } from "@/components/reportes/HBarRow";
import { RankRow } from "@/components/reportes/RankRow";
import { VBars } from "@/components/reportes/VBars";
import { Text } from "@/components/ui/Text";
import { Radius, Spacing, Type, Weight, useColors } from "@/constants/theme";
import type { MockDocument } from "@/data/mockDocuments";
import { knowledgeCategories, type KnowledgeEntry } from "@/data/mockKnowledge";
import type { SigedRecord } from "@/data/mockSiged";
import { departments } from "@/data/departments";
import { useCuentas } from "@/hooks/useCuentas";
import { rolesDePersonal } from "@/lib/auth";
import { Screen } from "@/components/ui/Screen";
import { AvisoDeEjemplo } from "@/components/ui/AvisoDeEjemplo";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { CountUp } from "@/components/ui/CountUp";
import { StatCard } from "@/components/ui/StatCard";
import { StatGrid } from "@/components/ui/StatGrid";

export default function Reportes() {
  const C = useColors();
  const { cuentas } = useCuentas();
  const [documents] = useState<MockDocument[]>([]);
  const [knowledgeBase] = useState<KnowledgeEntry[]>([]);
  const [sigedRecords] = useState<SigedRecord[]>([]);

  const stats = useMemo(() => {
    const activeUsers = cuentas.filter((u) => (u.status ?? "Activo") === "Activo").length;
    const activeArticles = knowledgeBase.filter((k) => k.active).length;
    const totalViews = knowledgeBase.reduce((s, k) => s + (k.views || 0), 0);
    const totalDownloads = documents.reduce((s, d) => s + d.downloads, 0);

    return {
      activeUsers,
      activeArticles,
      totalViews,
      totalDownloads,
      inactiveUsers: cuentas.length - activeUsers,
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
      usersByRole: rolesDePersonal.map((r) => ({
        label: r,
        count: cuentas.filter((u) => u.role === r).length,
      })),
      topArticles: [...knowledgeBase]
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5),
      topDocs: [...documents].sort((a, b) => b.downloads - a.downloads).slice(0, 5),
    };
  }, [cuentas, documents, knowledgeBase, sigedRecords]);

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
  const activePct = cuentas.length ? Math.round((stats.activeUsers / cuentas.length) * 100) : 0;

  return (
    <Screen>
      <PageHeader
        title="Reportes"
        description="Métricas del sistema y del contenido."
      />

      <AvisoDeEjemplo texto="Datos de ejemplo, salvo usuarios por rol." />

      <StatGrid>
        <StatCard
          label="Vistas totales"
          value={stats.totalViews}
          hint="en artículos"
          icon="eye"
          tone="info"
        />
        <StatCard
          label="Descargas"
          value={stats.totalDownloads}
          hint="de documentos"
          icon="download"
          tone="ok"
        />
        <StatCard
          label="Expedientes"
          value={sigedRecords.length}
          hint="gestionados"
          icon="files"
          tone="warn"
        />
        <StatCard
          label="Artículos activos"
          value={stats.activeArticles}
          hint={`de ${knowledgeBase.length} en base`}
          icon="bulb"
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
                Suspendidos · {100 - activePct}%
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
