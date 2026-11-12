import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

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

function filtrarPorEstado(lista: TramiteApi[], filtro: Filtro) {
  if (filtro === "todos") return lista;
  if (filtro === "aceptados") return lista.filter((t) => t.publicado);
  return lista.filter((t) => !t.publicado);
}

function filtrarPorBusqueda(lista: TramiteApi[], busqueda: string) {
  const q = busqueda.trim().toLowerCase();
  if (!q) return lista;
  return lista.filter((t) => {
    if (t.nombre.toLowerCase().includes(q)) return true;
    if (t.sector.nombre.toLowerCase().includes(q)) return true;
    if (t.encargado.nombre.toLowerCase().includes(q)) return true;
    return false;
  });
}

function ordenarPorActualizacion(lista: TramiteApi[]) {
  const copia = [...lista];
  copia.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  return copia;
}

function textoVacio(busqueda: string, filtro: Filtro) {
  if (busqueda.trim()) return "No hay trámites que coincidan con la búsqueda.";
  if (filtro === "aceptados") return "No hay trámites aceptados.";
  if (filtro === "rechazados") return "No hay trámites rechazados.";
  return "Todavía no hay trámites propuestos por los empleados.";
}

function BloqueError({ mensaje, onReintentar }: { mensaje: string; onReintentar: () => void }) {
  const C = useColors();
  return (
    <View style={{ marginBottom: Spacing[3], gap: Spacing[2] }}>
      <Text style={[Type.meta, { color: C.danger }]}>{mensaje}</Text>
      <Btn label="Reintentar" variant="secondary" size="md" onPress={onReintentar} />
    </View>
  );
}

function FilaSolicitud({
  tramite,
  trabajando,
  onPress,
  onRechazar,
  onAceptar,
}: {
  tramite: TramiteApi;
  trabajando: boolean;
  onPress: () => void;
  onRechazar: () => void;
  onAceptar: () => void;
}) {
  const C = useColors();
  const detalle = [tramite.sector.nombre, tramite.encargado.nombre, formatearCosto(tramite.costo)].join(" · ");

  return (
    <Row style={{ paddingVertical: 14 }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Ver ${tramite.nombre}`}
        style={styles.linea}
      >
        <View style={styles.cuerpo}>
          <Text style={[Type.rowTitle, { color: C.ink }]} numberOfLines={2}>
            {tramite.nombre}
          </Text>
          <Text style={[Type.meta, { color: C.ink2 }]} numberOfLines={1}>
            {detalle}
          </Text>
          <View style={styles.etiquetas}>
            <Badge
              label={tramite.publicado ? "Aceptado" : "Rechazado"}
              tone={tramite.publicado ? "ok" : "bad"}
            />
            <Text style={[Type.meta, { color: C.ink3 }]}>{formatDate(tramite.updatedAt)}</Text>
          </View>
        </View>
        <Icon name="chevronRight" size={20} color={C.ink2} />
      </Pressable>
      <View style={styles.etiquetas}>
        <Btn
          label="Rechazar"
          variant="danger"
          size="md"
          onPress={onRechazar}
          disabled={trabajando || !tramite.publicado}
        />
        <Btn label="Aceptar" size="md" onPress={onAceptar} disabled={trabajando || tramite.publicado} />
      </View>
    </Row>
  );
}

export default function Solicitudes() {
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
    lista = filtrarPorEstado(lista, filtro);
    lista = filtrarPorBusqueda(lista, busqueda);
    return ordenarPorActualizacion(lista);
  }, [tramites, filtro, busqueda]);

  const { page, totalPages, paginatedItems, setPage } = usePagination(filtrados, 8);

  function cambiarBusqueda(texto: string) {
    setBusqueda(texto);
    setPage(1);
  }

  function cambiarFiltro(nuevoFiltro: Filtro) {
    setFiltro(nuevoFiltro);
    setPage(1);
  }

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

  return (
    <Screen>
      <PageHeader
        title="Solicitudes"
        description="Revisá los trámites que proponen los empleados. Solo los aceptados aparecen en el chat."
      />

      {!!error && <BloqueError mensaje={error} onReintentar={recargar} />}

      <SearchInput
        value={busqueda}
        onChangeText={cambiarBusqueda}
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
          onChange={cambiarFiltro}
        />
      </View>

      <View style={{ marginTop: Spacing[3] }}>
        {cargando && <SkeletonList />}

        {!cargando &&
          paginatedItems.map((t: TramiteApi) => (
            <FilaSolicitud
              key={t.id}
              tramite={t}
              trabajando={trabajando}
              onPress={() => setVerId(t.id)}
              onRechazar={() => revisar(t, false)}
              onAceptar={() => revisar(t, true)}
            />
          ))}

        {!cargando && !error && filtrados.length === 0 && (
          <EmptyState title="Sin trámites" detalle={textoVacio(busqueda, filtro)} />
        )}

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
