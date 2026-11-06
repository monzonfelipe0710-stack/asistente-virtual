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

async function subirArchivos(tramiteId: number, archivos: ArchivoAdjunto[]) {
  const fallidos: string[] = [];
  for (const archivo of archivos) {
    try {
      await subirDocumento(tramiteId, archivo);
    } catch {
      fallidos.push(archivo.name);
    }
  }
  return fallidos;
}

function armarMensajeGuardado(accion: string, archivos: ArchivoAdjunto[], fallidos: string[]) {
  if (fallidos.length > 0) {
    return `${accion}, pero no se pudieron subir: ${fallidos.join(", ")}`;
  }
  if (archivos.length > 0) {
    const palabra = archivos.length === 1 ? "archivo" : "archivos";
    return `${accion} con ${archivos.length} ${palabra}`;
  }
  return accion;
}

function textoVacio(busqueda: string, filtro: Filtro) {
  if (busqueda.trim()) return "No hay trámites que coincidan con la búsqueda.";
  if (filtro === "aceptados") return "No hay trámites aceptados.";
  if (filtro === "sinAceptar") return "No hay trámites sin aceptar.";
  return "Todavía no creaste trámites. Empezá con “Registrar ingreso”.";
}

function armarDetalleDeFila(tramite: TramiteApi, soloMios: boolean) {
  const candidatos = [
    tramite.sector.nombre,
    soloMios ? null : tramite.encargado.nombre,
    formatearCosto(tramite.costo),
  ];
  const partes: string[] = [];
  for (const candidato of candidatos) {
    if (candidato) partes.push(candidato);
  }
  return partes.join(" · ");
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

function FilaTramite({
  tramite,
  soloMios,
  onPress,
}: {
  tramite: TramiteApi;
  soloMios: boolean;
  onPress: () => void;
}) {
  const C = useColors();
  return (
    <Row onPress={onPress} accessibilityLabel={`Ver ${tramite.nombre}`} style={{ paddingVertical: 14 }}>
      <View style={styles.linea}>
        <View style={styles.cuerpo}>
          <Text style={[Type.rowTitle, { color: C.ink }]} numberOfLines={2}>
            {tramite.nombre}
          </Text>
          {!!tramite.descripcion && (
            <Text style={[Type.meta, { color: C.ink2 }]} numberOfLines={1}>
              {tramite.descripcion}
            </Text>
          )}
          <Text style={[Type.meta, { color: C.ink2 }]} numberOfLines={1}>
            {armarDetalleDeFila(tramite, soloMios)}
          </Text>
          <View style={styles.etiquetas}>
            <Badge
              label={tramite.publicado ? "Aceptado" : "Sin aceptar"}
              tone={tramite.publicado ? "ok" : "muted"}
            />
            <Text style={[Type.meta, { color: C.ink3 }]}>{formatDate(tramite.updatedAt)}</Text>
          </View>
        </View>
        <Icon name="chevronRight" size={20} color={C.ink2} />
      </View>
    </Row>
  );
}

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
    if (soloMios && user) {
      lista = lista.filter((t) => String(t.encargado.id) === user.id);
    }
    lista = filtrarPorEstado(lista, filtro);
    lista = filtrarPorBusqueda(lista, busqueda);
    return ordenarPorActualizacion(lista);
  }, [tramites, soloMios, filtro, busqueda, user]);

  const { page, totalPages, paginatedItems, setPage } = usePagination(filtrados, 8);
  const aceptados = tramites.filter((t) => t.publicado).length;
  const tramiteVisto = tramites.find((t) => t.id === verId);
  const puedeGestionarVisto =
    !esSuperusuario && !!tramiteVisto && sectores.some((s) => s.id === tramiteVisto.sectorId);

  function cambiarBusqueda(texto: string) {
    setBusqueda(texto);
    setPage(1);
  }

  function cambiarFiltro(nuevoFiltro: Filtro) {
    setFiltro(nuevoFiltro);
    setPage(1);
  }

  function alternarSoloMios() {
    setSoloMios((v) => !v);
    setPage(1);
  }

  function abrirNuevo() {
    setEditando(null);
    setFormAbierto(true);
  }

  function cerrarFormulario() {
    setFormAbierto(false);
    setEditando(null);
  }

  async function guardar(datos: TramiteDatos, archivos: ArchivoAdjunto[]) {
    let tramiteId: number;
    if (editando) {
      await actualizar(editando.id, datos);
      tramiteId = editando.id;
    } else {
      tramiteId = (await registrar(datos)).id;
    }

    const fallidos = await subirArchivos(tramiteId, archivos);

    const accion = editando ? "Trámite actualizado" : "Trámite creado";
    push(armarMensajeGuardado(accion, archivos, fallidos));
    cerrarFormulario();
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

  return (
    <Screen>
      <PageHeader
        title="Trámites"
        description="Creá y editá los trámites de tu sector. El Administrador los acepta y solo los aceptados aparecen en el chat."
      >
        {puedeRegistrar && <Btn label="Registrar ingreso" icon="plus" onPress={abrirNuevo} disabled={cargando} />}
      </PageHeader>

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
            { id: "sinAceptar" as const, label: "Sin aceptar", count: tramites.length - aceptados },
          ]}
          value={filtro}
          onChange={cambiarFiltro}
        />
      </View>

      <View style={styles.barra}>
        <Text style={[Type.meta, { color: C.ink2, flex: 1 }]}>{filtrados.length} trámites</Text>
        {!esSuperusuario && (
          <Pressable
            onPress={alternarSoloMios}
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
            <FilaTramite key={t.id} tramite={t} soloMios={soloMios} onPress={() => setVerId(t.id)} />
          ))}

        {!cargando && !error && filtrados.length === 0 && (
          <EmptyState title="Sin trámites" detalle={textoVacio(busqueda, filtro)} />
        )}

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
          onClose={cerrarFormulario}
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
