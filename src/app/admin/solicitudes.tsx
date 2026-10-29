import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Spacing, Type, useColors } from "@/constants/theme";
import { usePagination } from "@/hooks/usePagination";
import { useTramites } from "@/hooks/useTramites";
import type { TramiteApi } from "@/lib/backend";
import { formatDate } from "@/utils/date";
import { TramiteDetalle, formatearCosto } from "@/components/admin/TramiteDetalle";
import { Badge } from "@/components/ui/Badge";
import { Btn } from "@/components/ui/Btn";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Row } from "@/components/ui/Row";
import { Screen } from "@/components/ui/Screen";
import { SearchInput } from "@/components/ui/SearchInput";
import { SkeletonList } from "@/components/ui/SkeletonList";
import { Tabs } from "@/components/ui/Tabs";
import { Text } from "@/components/ui/Text";
import { useToast } from "@/components/ui/Toast";

type Filtro = "todos" | "aceptados" | "rechazados";

export default function Solicitudes() {
  const C = useColors();
  const push = useToast();
  const { tramites, cargando, error, recargar, cambiarPublicacion } = useTramites();

  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [verId, setVerId] = useState<number | null>(null);
  const [versionDetalle, setVersionDetalle] = useState(0);
  const [trabajando, setTrabajando] = useState(false);

  const aceptados = tramites.filter((t) => t.publicado).length;

  const filtrados = useMemo(() => {
    let lista = tramites;
    if (filtro !== "todos") lista = lista.filter((t) => (filtro === "aceptados" ? t.publicado : !t.publicado));
    const q = busqueda.trim().toLowerCase();
    if (q) {
      lista = lista.filter(
        (t) =>
          t.nombre.toLowerCase().includes(q) ||
          t.sector.nombre.toLowerCase().includes(q) ||
          t.encargado.nombre.toLowerCase().includes(q)
      );
    }
    return [...lista].sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  }, [tramites, filtro, busqueda]);

  const { page, totalPages, paginatedItems, setPage } = usePagination(filtrados, 8);

  async function revisar(t: { id: number }, aceptar: boolean) {
    setTrabajando(true);
    try {
      await cambiarPublicacion(t.id, aceptar);
      push(aceptar ? "Trámite aceptado" : "Trámite rechazado");
      setVersionDetalle((v) => v + 1);
    } catch (e) {
      push(e instanceof Error ? e.message : "No se pudo guardar la revisión.");
    } finally {
      setTrabajando(false);
    }
  }

  function textoVacio() {
    if (busqueda.trim()) return "No hay trámites que coincidan con la búsqueda.";
    if (filtro === "aceptados") return "No hay trámites aceptados.";
    if (filtro === "rechazados") return "No hay trámites rechazados.";
    return "Todavía no hay trámites propuestos por los empleados.";
  }

  return (
    <Screen>
      <PageHeader
        title="Solicitudes"
        description="Revisá los trámites que proponen los empleados. Solo los aceptados aparecen en el chat."
      />

      {!!error && (
        <View style={{ marginBottom: Spacing[3], gap: Spacing[2] }}>
          <Text style={[Type.meta, { color: C.danger }]}>{error}</Text>
          <Btn label="Reintentar" variant="secondary" size="md" onPress={recargar} />
        </View>
      )}

      <SearchInput
        value={busqueda}
        onChangeText={(texto) => {
          setBusqueda(texto);
          setPage(1);
        }}
        placeholder="Buscar por nombre, sector o encargado…"
        autoCapitalize="none"
      />

      <View style={{ marginTop: Spacing[3] }}>
        <Tabs
          items={[
            { id: "todos" as const, label: "Todos", count: tramites.length },
            { id: "aceptados" as const, label: "Aceptados", count: aceptados },
            { id: "rechazados" as const, label: "Rechazados", count: tramites.length - aceptados },
          ]}
          value={filtro}
          onChange={(f) => {
            setFiltro(f);
            setPage(1);
          }}
        />
      </View>

      <View style={{ marginTop: Spacing[3] }}>
        {cargando && <SkeletonList />}

        {!cargando &&
          paginatedItems.map((t: TramiteApi) => (
            <Row
              key={t.id}
              onPress={() => setVerId(t.id)}
              accessibilityLabel={`Ver ${t.nombre}`}
              style={{ paddingVertical: 14 }}
            >
              <View style={styles.linea}>
                <View style={styles.cuerpo}>
                  <Text style={[Type.rowTitle, { color: C.ink }]} numberOfLines={2}>
                    {t.nombre}
                  </Text>
                  <Text style={[Type.meta, { color: C.ink2 }]} numberOfLines={1}>
                    {[t.sector.nombre, t.encargado.nombre, formatearCosto(t.costo)].join(" · ")}
                  </Text>
                  <View style={styles.etiquetas}>
                    <Badge label={t.publicado ? "Aceptado" : "Rechazado"} tone={t.publicado ? "ok" : "bad"} />
                    <Text style={[Type.meta, { color: C.ink3 }]}>{formatDate(t.updatedAt)}</Text>
                  </View>
                  <View style={styles.etiquetas}>
                    <Btn
                      label="Rechazar"
                      variant="danger"
                      size="md"
                      onPress={() => revisar(t, false)}
                      disabled={trabajando || !t.publicado}
                    />
                    <Btn
                      label="Aceptar"
                      size="md"
                      onPress={() => revisar(t, true)}
                      disabled={trabajando || t.publicado}
                    />
                  </View>
                </View>
                <Icon name="chevronRight" size={20} color={C.ink2} />
              </View>
            </Row>
          ))}

        {!cargando && !error && filtrados.length === 0 && <EmptyState title="Sin trámites" detalle={textoVacio()} />}

        {!cargando && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
      </View>

      {verId !== null && (
        <TramiteDetalle
          tramiteId={verId}
          version={versionDetalle}
          puedeGestionar={false}
          trabajando={trabajando}
          onClose={() => setVerId(null)}
          onAceptar={(t) => revisar(t, true)}
          onRechazar={(t) => revisar(t, false)}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  linea: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[4],
  },
  cuerpo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  etiquetas: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing[2],
    marginTop: 4,
  },
});
