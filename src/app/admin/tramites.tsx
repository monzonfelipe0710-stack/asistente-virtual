import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Spacing, Type, useColors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useTramites } from "@/hooks/useTramites";
import { usePagination } from "@/hooks/usePagination";
import { subirDocumento, type TramiteApi, type TramiteDatos, type TramiteDetalleApi } from "@/lib/backend";
import { formatDate } from "@/utils/date";
import { TramiteDetalle, formatearCosto } from "@/components/admin/TramiteDetalle";
import { TramiteFormModal, type ArchivoAdjunto } from "@/components/admin/TramiteFormModal";
import { Badge } from "@/components/ui/Badge";
import { Btn } from "@/components/ui/Btn";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Row } from "@/components/ui/Row";
import { Screen } from "@/components/ui/Screen";
import { SearchInput } from "@/components/ui/SearchInput";
import { SkeletonList } from "@/components/ui/SkeletonList";
import { Tabs } from "@/components/ui/Tabs";
import { Text } from "@/components/ui/Text";
import { Toggle } from "@/components/ui/Toggle";
import { useToast } from "@/components/ui/Toast";

type Filtro = "todos" | "aceptados" | "sinAceptar";

export default function Tramites() {
  const C = useColors();
  const push = useToast();
  const { user } = useAuth();
  const {
    tramites,
    sectores,
    puedeRegistrar,
    esSuperusuario,
    cargando,
    error,
    recargar,
    registrar,
    actualizar,
    eliminar,
  } = useTramites();

  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [soloMios, setSoloMios] = useState(!esSuperusuario);
  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState<TramiteDetalleApi | null>(null);
  const [verId, setVerId] = useState<number | null>(null);
  const [versionDetalle, setVersionDetalle] = useState(0);
  const [borrando, setBorrando] = useState<{ id: number; nombre: string } | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  const filtrados = useMemo(() => {
    let lista = tramites;
    if (soloMios && user) lista = lista.filter((t) => String(t.encargado.id) === user.id);
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
  }, [tramites, soloMios, filtro, busqueda, user]);

  const { page, totalPages, paginatedItems, setPage } = usePagination(filtrados, 8);
  const aceptados = tramites.filter((t) => t.publicado).length;
  const tramiteVisto = tramites.find((t) => t.id === verId);
  const puedeGestionarVisto =
    !esSuperusuario && !!tramiteVisto && sectores.some((s) => s.id === tramiteVisto.sectorId);

  function abrirNuevo() {
    setEditando(null);
    setFormAbierto(true);
  }

  async function guardar(datos: TramiteDatos, archivos: ArchivoAdjunto[]) {
    let tramiteId: number;
    if (editando) {
      await actualizar(editando.id, datos);
      tramiteId = editando.id;
    } else {
      tramiteId = (await registrar(datos)).id;
    }

    const fallidos: string[] = [];
    for (const archivo of archivos) {
      try {
        await subirDocumento(tramiteId, archivo);
      } catch {
        fallidos.push(archivo.name);
      }
    }

    const accion = editando ? "Trámite actualizado" : "Trámite creado";
    push(
      fallidos.length
        ? `${accion}, pero no se pudieron subir: ${fallidos.join(", ")}`
        : archivos.length
          ? `${accion} con ${archivos.length} ${archivos.length === 1 ? "archivo" : "archivos"}`
          : accion
    );
    setFormAbierto(false);
    setEditando(null);
    setVersionDetalle((v) => v + 1);
  }

  async function confirmarBorrado() {
    const objetivo = borrando;
    setBorrando(null);
    if (!objetivo) return;
    setTrabajando(true);
    try {
      await eliminar(objetivo.id);
      push("Trámite eliminado");
      setVerId(null);
    } catch (e) {
      push(e instanceof Error ? e.message : "No se pudo eliminar el trámite.");
    } finally {
      setTrabajando(false);
    }
  }

  function textoVacio() {
    if (busqueda.trim()) return "No hay trámites que coincidan con la búsqueda.";
    if (filtro !== "todos")
      return `No hay trámites ${filtro === "aceptados" ? "aceptados" : "sin aceptar"}.`;
    return "Todavía no creaste trámites. Empezá con “Registrar ingreso”.";
  }

  return (
    <Screen>
      <PageHeader
        title="Trámites"
        description="Creá y editá los trámites de tu sector. El Administrador los acepta y solo los aceptados aparecen en el chat."
      >
        {puedeRegistrar && <Btn label="Registrar ingreso" icon="plus" onPress={abrirNuevo} disabled={cargando} />}
      </PageHeader>

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
            { id: "sinAceptar" as const, label: "Sin aceptar", count: tramites.length - aceptados },
          ]}
          value={filtro}
          onChange={(f) => {
            setFiltro(f);
            setPage(1);
          }}
        />
      </View>

      <View style={styles.barra}>
        <Text style={[Type.meta, { color: C.ink2, flex: 1 }]}>{filtrados.length} trámites</Text>
        {!esSuperusuario && (
          <Pressable
            onPress={() => {
              setSoloMios((v) => !v);
              setPage(1);
            }}
            accessibilityRole="switch"
            accessibilityState={{ checked: soloMios }}
            style={styles.soloMios}
          >
            <Text style={[Type.meta, { color: C.ink2 }]}>Solo míos</Text>
            <Toggle value={soloMios} />
          </Pressable>
        )}
      </View>

      <View>
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
                  {!!t.descripcion && (
                    <Text style={[Type.meta, { color: C.ink2 }]} numberOfLines={1}>
                      {t.descripcion}
                    </Text>
                  )}
                  <Text style={[Type.meta, { color: C.ink2 }]} numberOfLines={1}>
                    {[t.sector.nombre, !soloMios ? t.encargado.nombre : null, formatearCosto(t.costo)]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                  <View style={styles.etiquetas}>
                    <Badge label={t.publicado ? "Aceptado" : "Sin aceptar"} tone={t.publicado ? "ok" : "muted"} />
                    <Text style={[Type.meta, { color: C.ink3 }]}>{formatDate(t.updatedAt)}</Text>
                  </View>
                </View>
                <Icon name="chevronRight" size={20} color={C.ink2} />
              </View>
            </Row>
          ))}

        {!cargando && !error && filtrados.length === 0 && <EmptyState title="Sin trámites" detalle={textoVacio()} />}

        {!cargando && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
      </View>

      {verId !== null && !formAbierto && borrando === null && (
        <TramiteDetalle
          tramiteId={verId}
          version={versionDetalle}
          puedeGestionar={puedeGestionarVisto}
          trabajando={trabajando}
          onClose={() => setVerId(null)}
          onEditar={(t) => {
            setEditando(t);
            setFormAbierto(true);
          }}
          onEliminar={(t) => setBorrando({ id: t.id, nombre: t.nombre })}
        />
      )}

      {formAbierto && (
        <TramiteFormModal
          tramite={editando}
          sectores={sectores}
          onClose={() => {
            setFormAbierto(false);
            setEditando(null);
          }}
          onSave={guardar}
        />
      )}

      <Modal
        open={borrando !== null}
        title="Eliminar trámite"
        onClose={() => setBorrando(null)}
        footer={[
          <Btn key="cancelar" label="Cancelar" variant="secondary" onPress={() => setBorrando(null)} />,
          <Btn key="eliminar" label="Eliminar" variant="dangerFill" onPress={confirmarBorrado} />,
        ]}
      >
        <Text style={[Type.body, { color: C.ink2 }]}>
          ¿Seguro que querés eliminar este trámite? Se borran también sus documentos y no se puede deshacer.
        </Text>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    marginTop: Spacing[3],
  },
  soloMios: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
  },
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
