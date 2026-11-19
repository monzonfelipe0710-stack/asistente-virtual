import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Spacing, Type, useColors } from "@/compartido/constantes/theme";
import { useMesas } from "@/funcionalidades/admin/hooks/useMesas";
import { usePagination } from "@/funcionalidades/admin/hooks/usePagination";
import { mensajeDeError, pedirSectores, type MesaApi, type SectorApi } from "@/compartido/lib/backend";
import { Btn } from "@/compartido/ui/Btn";
import { EmptyState } from "@/compartido/ui/EmptyState";
import { Field } from "@/compartido/ui/Field";
import { Input } from "@/compartido/ui/Input";
import { Modal } from "@/compartido/ui/Modal";
import { PageHeader } from "@/compartido/ui/PageHeader";
import { Pagination } from "@/compartido/ui/Pagination";
import { Row } from "@/compartido/ui/Row";
import { Screen } from "@/compartido/ui/Screen";
import { SearchInput } from "@/compartido/ui/SearchInput";
import { Select } from "@/compartido/ui/Select";
import { Toggle } from "@/compartido/ui/Toggle";
import { SkeletonList } from "@/compartido/ui/SkeletonList";
import { Text } from "@/compartido/ui/Text";
import { useToast } from "@/compartido/ui/Toast";
import { BloqueError } from "@/funcionalidades/admin/componentes/BloqueError";

function filtrarMesas(mesas: MesaApi[], busqueda: string) {
  const q = busqueda.trim().toLowerCase();
  if (!q) return mesas;
  return mesas.filter((m) => {
    if (m.nombre.toLowerCase().includes(q)) return true;
    if ((m.direccion ?? "").toLowerCase().includes(q)) return true;
    if ((m.localidad ?? "").toLowerCase().includes(q)) return true;
    return false;
  });
}

function unirConSeparador(valores: (string | null | undefined)[]) {
  const presentes: string[] = [];
  for (const valor of valores) {
    if (valor) presentes.push(valor);
  }
  return presentes.join(" · ");
}

function textoRecortadoOValorVacio(texto: string, valorVacio: "" | undefined) {
  const recortado = texto.trim();
  if (recortado) return recortado;
  return valorVacio;
}

function textoVacio(busqueda: string) {
  if (busqueda.trim()) return "No hay mesas que coincidan con la búsqueda.";
  return "Todavía no hay mesas de entrada creadas.";
}

function FilaMesa({
  mesa,
  trabajando,
  onEditar,
  onEliminar,
}: {
  mesa: MesaApi;
  trabajando: boolean;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  const C = useColors();
  const textoDireccion = unirConSeparador([mesa.direccion, mesa.localidad]) || "Sin dirección";
  const textoSector = unirConSeparador([mesa.esGeneral ? "General" : mesa.sector?.nombre, mesa.horario]);

  return (
    <Row style={{ paddingVertical: 14 }}>
      <View style={styles.cuerpo}>
        <Text style={[Type.rowTitle, { color: C.ink }]} numberOfLines={2}>
          {mesa.nombre}
        </Text>
        <Text style={[Type.meta, { color: C.ink2 }]} numberOfLines={1}>
          {textoDireccion}
        </Text>
        <Text style={[Type.meta, { color: C.ink2 }]} numberOfLines={1}>
          {textoSector}
        </Text>
        <View style={styles.acciones}>
          <Btn label="Editar" variant="secondary" size="md" onPress={onEditar} disabled={trabajando} />
          <Btn label="Eliminar" variant="danger" size="md" onPress={onEliminar} disabled={trabajando} />
        </View>
      </View>
    </Row>
  );
}

export default function MesaDeEntrada() {
  const C = useColors();
  const push = useToast();
  const { mesas, cargando, error, recargar, crear, actualizar, eliminar } = useMesas();

  const [busqueda, setBusqueda] = useState("");
  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState<MesaApi | null>(null);
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [horario, setHorario] = useState("");
  const [esGeneral, setEsGeneral] = useState(true);
  const [sectorNombre, setSectorNombre] = useState("");
  const [sectores, setSectores] = useState<SectorApi[]>([]);
  const [errorForm, setErrorForm] = useState("");
  const [borrando, setBorrando] = useState<MesaApi | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  const filtradas = useMemo(() => {
    return filtrarMesas(mesas, busqueda);
  }, [mesas, busqueda]);

  const { page, totalPages, paginatedItems, setPage } = usePagination(filtradas, 8);

  useEffect(() => {
    let activo = true;
    pedirSectores()
      .then((lista) => {
        if (activo) setSectores(lista);
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, []);

  function cambiarBusqueda(texto: string) {
    setBusqueda(texto);
    setPage(1);
  }

  function abrirNueva() {
    setEditando(null);
    setNombre("");
    setDireccion("");
    setLocalidad("");
    setHorario("");
    setEsGeneral(true);
    setSectorNombre("");
    setErrorForm("");
    setFormAbierto(true);
  }

  function abrirEdicion(m: MesaApi) {
    setEditando(m);
    setNombre(m.nombre);
    setDireccion(m.direccion ?? "");
    setLocalidad(m.localidad ?? "");
    setHorario(m.horario ?? "");
    setEsGeneral(m.esGeneral);
    setSectorNombre(m.sector?.nombre ?? "");
    setErrorForm("");
    setFormAbierto(true);
  }

  function armarDatosMesa(sector: SectorApi | undefined) {
    const valorVacio = editando ? "" : undefined;
    return {
      nombre: nombre.trim(),
      direccion: textoRecortadoOValorVacio(direccion, valorVacio),
      localidad: textoRecortadoOValorVacio(localidad, valorVacio),
      horario: textoRecortadoOValorVacio(horario, valorVacio),
      esGeneral,
      sectorId: esGeneral ? null : sector?.id,
    };
  }

  async function guardar() {
    if (!nombre.trim()) {
      setErrorForm("El nombre de la mesa es obligatorio.");
      return;
    }
    const sector = sectores.find((s) => s.nombre === sectorNombre);
    if (!esGeneral && !sector) {
      setErrorForm("Elegí un sector o marcá la mesa como general.");
      return;
    }
    const datos = armarDatosMesa(sector);
    setTrabajando(true);
    try {
      if (editando) await actualizar(editando.id, datos);
      else await crear(datos);
      push(editando ? "Mesa actualizada" : "Mesa creada");
      setFormAbierto(false);
    } catch (e) {
      setErrorForm(mensajeDeError(e, "No se pudo guardar la mesa."));
    } finally {
      setTrabajando(false);
    }
  }

  async function confirmarBorrado() {
    const objetivo = borrando;
    setBorrando(null);
    if (!objetivo) return;
    setTrabajando(true);
    try {
      await eliminar(objetivo.id);
      push("Mesa eliminada");
    } catch (e) {
      push(mensajeDeError(e, "No se pudo eliminar la mesa."));
    } finally {
      setTrabajando(false);
    }
  }

  return (
    <Screen>
      <PageHeader title="Mesa de Entradas" description="Creá, buscá, editá y eliminá las mesas de entrada.">
        <Btn label="Crear mesa" icon="plus" onPress={abrirNueva} disabled={cargando} />
      </PageHeader>

      {!!error && <BloqueError mensaje={error} onReintentar={recargar} />}

      <SearchInput
        value={busqueda}
        onChangeText={cambiarBusqueda}
        placeholder="Buscar por nombre, dirección o localidad…"
        autoCapitalize="none"
      />

      <View style={{ marginTop: Spacing[3] }}>
        {cargando && <SkeletonList />}

        {!cargando &&
          paginatedItems.map((m) => (
            <FilaMesa
              key={m.id}
              mesa={m}
              trabajando={trabajando}
              onEditar={() => abrirEdicion(m)}
              onEliminar={() => setBorrando(m)}
            />
          ))}

        {!cargando && !error && filtradas.length === 0 && (
          <EmptyState title="Sin mesas" detalle={textoVacio(busqueda)} />
        )}

        {!cargando && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
      </View>

      <Modal
        open={formAbierto}
        title={editando ? "Editar mesa de entrada" : "Crear mesa de entrada"}
        onClose={() => setFormAbierto(false)}
        footer={[
          <Btn key="cancelar" label="Cancelar" variant="secondary" onPress={() => setFormAbierto(false)} />,
          <Btn key="guardar" label={editando ? "Guardar" : "Crear"} onPress={guardar} loading={trabajando} />,
        ]}
      >
        <Field label="Nombre">
          <Input value={nombre} onChangeText={setNombre} placeholder="Ej: Mesa de Licencias" />
        </Field>
        <Field label="Dirección (opcional)">
          <Input value={direccion} onChangeText={setDireccion} placeholder="Ej: Edificio central, planta baja" />
        </Field>
        <Field label="Localidad (opcional)">
          <Input value={localidad} onChangeText={setLocalidad} placeholder="Ej: Formosa" />
        </Field>
        <Field label="Horario (opcional)">
          <Input value={horario} onChangeText={setHorario} placeholder="Ej: Lunes a viernes de 7 a 13" />
        </Field>
        <Pressable
          onPress={() => setEsGeneral((v) => !v)}
          accessibilityRole="switch"
          accessibilityState={{ checked: esGeneral }}
          style={styles.filaSwitch}
        >
          <Text style={[Type.rowTitle, { color: C.ink, flex: 1 }]}>Mesa general (todos los sectores)</Text>
          <Toggle value={esGeneral} />
        </Pressable>
        {!esGeneral && (
          <Field label="Sector">
            <Select
              value={sectorNombre}
              options={sectores.map((s) => s.nombre)}
              onChange={setSectorNombre}
              placeholder="Elegí un sector"
            />
          </Field>
        )}
        {!!errorForm && <Text style={[Type.meta, { color: C.danger }]}>{errorForm}</Text>}
      </Modal>

      <Modal
        open={borrando !== null}
        title="Eliminar mesa"
        onClose={() => setBorrando(null)}
        footer={[
          <Btn key="cancelar" label="Cancelar" variant="secondary" onPress={() => setBorrando(null)} />,
          <Btn key="eliminar" label="Eliminar" variant="dangerFill" onPress={confirmarBorrado} />,
        ]}
      >
        <Text style={[Type.body, { color: C.ink2 }]}>
          ¿Seguro que querés eliminar “{borrando?.nombre}”? Los trámites asociados dejan de mostrar esta mesa.
        </Text>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cuerpo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  filaSwitch: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    minHeight: 48,
  },
  acciones: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing[2],
    marginTop: 4,
  },
});
