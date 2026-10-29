import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Spacing, Type, useColors } from "@/constants/theme";
import { useMesas } from "@/hooks/useMesas";
import { usePagination } from "@/hooks/usePagination";
import { pedirSectores, type MesaApi, type SectorApi } from "@/lib/backend";
import { Btn } from "@/components/ui/Btn";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Row } from "@/components/ui/Row";
import { Screen } from "@/components/ui/Screen";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { SkeletonList } from "@/components/ui/SkeletonList";
import { Text } from "@/components/ui/Text";
import { useToast } from "@/components/ui/Toast";

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
    const q = busqueda.trim().toLowerCase();
    if (!q) return mesas;
    return mesas.filter(
      (m) =>
        m.nombre.toLowerCase().includes(q) ||
        (m.direccion ?? "").toLowerCase().includes(q) ||
        (m.localidad ?? "").toLowerCase().includes(q)
    );
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
    const vacio = editando ? "" : undefined;
    const datos = {
      nombre: nombre.trim(),
      direccion: direccion.trim() || vacio,
      localidad: localidad.trim() || vacio,
      horario: horario.trim() || vacio,
      esGeneral,
      sectorId: esGeneral ? null : sector?.id,
    };
    setTrabajando(true);
    try {
      if (editando) await actualizar(editando.id, datos);
      else await crear(datos);
      push(editando ? "Mesa actualizada" : "Mesa creada");
      setFormAbierto(false);
    } catch (e) {
      setErrorForm(e instanceof Error ? e.message : "No se pudo guardar la mesa.");
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
      push(e instanceof Error ? e.message : "No se pudo eliminar la mesa.");
    } finally {
      setTrabajando(false);
    }
  }

  return (
    <Screen>
      <PageHeader title="Mesa de Entradas" description="Creá, buscá, editá y eliminá las mesas de entrada.">
        <Btn label="Crear mesa" icon="plus" onPress={abrirNueva} disabled={cargando} />
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
        placeholder="Buscar por nombre, dirección o localidad…"
        autoCapitalize="none"
      />

      <View style={{ marginTop: Spacing[3] }}>
        {cargando && <SkeletonList />}

        {!cargando &&
          paginatedItems.map((m) => (
            <Row key={m.id} style={{ paddingVertical: 14 }}>
              <View style={styles.cuerpo}>
                <Text style={[Type.rowTitle, { color: C.ink }]} numberOfLines={2}>
                  {m.nombre}
                </Text>
                <Text style={[Type.meta, { color: C.ink2 }]} numberOfLines={1}>
                  {[m.direccion, m.localidad].filter(Boolean).join(" · ") || "Sin dirección"}
                </Text>
                <Text style={[Type.meta, { color: C.ink2 }]} numberOfLines={1}>
                  {[m.esGeneral ? "General" : m.sector?.nombre, m.horario].filter(Boolean).join(" · ")}
                </Text>
                <View style={styles.acciones}>
                  <Btn label="Editar" variant="secondary" size="md" onPress={() => abrirEdicion(m)} disabled={trabajando} />
                  <Btn label="Eliminar" variant="danger" size="md" onPress={() => setBorrando(m)} disabled={trabajando} />
                </View>
              </View>
            </Row>
          ))}

        {!cargando && !error && filtradas.length === 0 && (
          <EmptyState
            title="Sin mesas"
            detalle={busqueda.trim() ? "No hay mesas que coincidan con la búsqueda." : "Todavía no hay mesas de entrada creadas."}
          />
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
