import * as DocumentPicker from "expo-document-picker";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Radius, Spacing, Type, useColors } from "@/compartido/constantes/theme";
import { useAuth } from "@/compartido/sesion/AuthContext";
import {
  mensajeDeError,
  pedirMesas,
  type ArchivoElegido,
  type MesaApi,
  type RequisitoDatos,
  type SectorApi,
  type TramiteDatos,
  type TramiteDetalleApi,
} from "@/compartido/lib/backend";
import { readJSON, writeJSON } from "@/compartido/lib/storage";
import { formatFileSize } from "@/compartido/utils/file";
import { Btn } from "@/compartido/ui/Btn";
import { Field } from "@/compartido/ui/Field";
import { Icon } from "@/compartido/ui/Icon";
import { Input } from "@/compartido/ui/Input";
import { Modal } from "@/compartido/ui/Modal";
import { Select } from "@/compartido/ui/Select";
import { Text } from "@/compartido/ui/Text";
import { Toggle } from "@/compartido/ui/Toggle";

const PREFIJO_BORRADOR = "chatap.admin.tramite-draft.";
const MAX_REQUISITOS = 30;
const MAX_ARCHIVO = 10 * 1024 * 1024;
const TIPOS_PERMITIDOS = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export type ArchivoAdjunto = ArchivoElegido & { size?: number };

function extensionValida(nombre: string) {
  const extension = nombre.split(".").pop()?.toLowerCase();
  return extension === "pdf" || extension === "docx";
}

interface RequisitoForm {
  descripcion: string;
  dondeSeConsigue: string;
  costo: string;
}

interface FormState {
  nombre: string;
  descripcion: string;
  costo: string;
  sector: string;
  requisitos: RequisitoForm[];
  mesaIds: number[];
}

const FORM_VACIO: FormState = { nombre: "", descripcion: "", costo: "", sector: "", requisitos: [], mesaIds: [] };

function numeroValido(texto: string) {
  const limpio = texto.trim();
  return limpio === "" || (Number.isFinite(Number(limpio)) && Number(limpio) >= 0);
}

function requisitoTieneContenido(requisito: RequisitoForm) {
  if (requisito.descripcion.trim()) return true;
  if (requisito.dondeSeConsigue.trim()) return true;
  if (requisito.costo.trim()) return true;
  return false;
}

function tieneContenido(f: FormState) {
  if (f.nombre.trim()) return true;
  if (f.descripcion.trim()) return true;
  if (f.costo.trim()) return true;
  if (f.sector) return true;
  return f.requisitos.some(requisitoTieneContenido);
}

function costoATexto(costo: string | null) {
  if (costo != null) return String(costo);
  return "";
}

function desdeTramite(tramite: TramiteDetalleApi): FormState {
  return {
    nombre: tramite.nombre,
    descripcion: tramite.descripcion,
    costo: costoATexto(tramite.costo),
    sector: tramite.sector.nombre,
    requisitos: tramite.requisitos.map((r) => ({
      descripcion: r.descripcion,
      dondeSeConsigue: r.dondeSeConsigue ?? "",
      costo: costoATexto(r.costo),
    })),
    mesaIds: tramite.mesas.map((m) => m.mesaId),
  };
}

function formDesdeBorrador(guardado: FormState): FormState {
  const requisitos = (guardado.requisitos ?? []).slice(0, MAX_REQUISITOS);
  return { ...FORM_VACIO, ...guardado, requisitos };
}

function estadoDeBorrador(guardadoConExito: boolean, form: FormState): "idle" | "guardado" | "error" {
  if (!guardadoConExito) return "error";
  if (tieneContenido(form)) return "guardado";
  return "idle";
}

function armarOpcionesDeSector(sectores: SectorApi[], sectorElegido: string) {
  const nombres = sectores.map((s) => s.nombre);
  const sectorConocido = sectores.some((s) => s.nombre === sectorElegido);
  if (sectorConocido || !sectorElegido) return nombres;
  return [sectorElegido, ...nombres];
}

function separarArchivos(assets: DocumentPicker.DocumentPickerAsset[]) {
  const validos: ArchivoAdjunto[] = [];
  const rechazados: string[] = [];
  for (const asset of assets) {
    const excedeTamano = asset.size != null && asset.size > MAX_ARCHIVO;
    if (!extensionValida(asset.name) || excedeTamano) {
      rechazados.push(asset.name);
    } else {
      validos.push({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? "application/octet-stream",
        size: asset.size ?? undefined,
      });
    }
  }
  return { validos, rechazados };
}

function mensajeDeRechazados(rechazados: string[]) {
  if (rechazados.length === 0) return "";
  return `No se agregaron (solo PDF o DOCX de hasta 10 MB): ${rechazados.join(", ")}`;
}

function validarDatosPrincipales(form: FormState, tieneSector: boolean, nuevos: Record<string, string>) {
  const nombre = form.nombre.trim();
  const descripcion = form.descripcion.trim();

  if (nombre.length < 3) nuevos.nombre = "Mínimo 3 caracteres";
  else if (nombre.length > 300) nuevos.nombre = "Máximo 300 caracteres";
  if (descripcion.length < 5) nuevos.descripcion = "Mínimo 5 caracteres";
  else if (descripcion.length > 10000) nuevos.descripcion = "Máximo 10000 caracteres";
  if (!numeroValido(form.costo)) nuevos.costo = "Ingresá un número mayor o igual a 0";
  if (!tieneSector) nuevos.sector = "Elegí un sector";
}

function validarRequisitos(requisitos: RequisitoForm[], nuevos: Record<string, string>) {
  requisitos.forEach((r, i) => {
    const d = r.descripcion.trim();
    if (!d) nuevos[`descripcion${i}`] = "Describí el requisito";
    else if (d.length > 1000) nuevos[`descripcion${i}`] = "Máximo 1000 caracteres";
    if (r.dondeSeConsigue.trim().length > 500) nuevos[`donde${i}`] = "Máximo 500 caracteres";
    if (!numeroValido(r.costo)) nuevos[`costo${i}`] = "Ingresá un número mayor o igual a 0";
  });
}

function armarRequisitosDatos(requisitos: RequisitoForm[]) {
  return requisitos.map((r) => {
    const requisito: RequisitoDatos = { descripcion: r.descripcion.trim() };
    if (r.dondeSeConsigue.trim()) requisito.dondeSeConsigue = r.dondeSeConsigue.trim();
    if (r.costo.trim() !== "") requisito.costo = Number(r.costo);
    return requisito;
  });
}

function armarDatos(form: FormState, sectorId: number, mesaIds: number[]) {
  const datos: Partial<TramiteDatos> = {
    nombre: form.nombre.trim(),
    descripcion: form.descripcion.trim(),
  };
  if (form.costo.trim() !== "") datos.costo = Number(form.costo);
  else datos.costo = null;
  datos.sectorId = sectorId;
  datos.requisitos = armarRequisitosDatos(form.requisitos);
  datos.mesaIds = mesaIds;
  return datos as TramiteDatos;
}

export function TramiteFormModal({
  tramite = null,
  sectores,
  onClose,
  onSave,
}: {
  tramite?: TramiteDetalleApi | null;
  sectores: SectorApi[];
  onClose: () => void;
  onSave: (datos: TramiteDatos, archivos: ArchivoAdjunto[]) => Promise<void>;
}) {
  const C = useColors();
  const { user } = useAuth();
  const esEdicion = tramite !== null;
  const claveBorrador = !esEdicion && user ? `${PREFIJO_BORRADOR}${user.id}` : null;

  const [form, setForm] = useState<FormState>(tramite ? desdeTramite(tramite) : FORM_VACIO);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [estadoBorrador, setEstadoBorrador] = useState<"idle" | "guardado" | "error">("idle");
  const [habiaBorrador, setHabiaBorrador] = useState(false);
  const [archivos, setArchivos] = useState<ArchivoAdjunto[]>([]);
  const [mesas, setMesas] = useState<MesaApi[]>([]);
  const borradorLeido = useRef(!claveBorrador);

  useEffect(() => {
    let activo = true;
    pedirMesas()
      .then((lista) => {
        if (activo) setMesas(lista);
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, []);

  const sectorActual = sectores.find((s) => s.nombre === form.sector);
  const mesasDelSector = mesas.filter((m) => m.esGeneral || (!!sectorActual && m.sectorId === sectorActual.id));

  function alternarMesa(id: number) {
    setForm((f) => ({
      ...f,
      mesaIds: f.mesaIds.includes(id) ? f.mesaIds.filter((x) => x !== id) : [...f.mesaIds, id],
    }));
  }

  async function elegirArchivos() {
    const res = await DocumentPicker.getDocumentAsync({
      type: TIPOS_PERMITIDOS,
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (res.canceled) return;
    const { validos, rechazados } = separarArchivos(res.assets);
    setArchivos((lista) => [...lista, ...validos]);
    setErrores((e) => ({ ...e, archivos: mensajeDeRechazados(rechazados) }));
  }

  function quitarArchivo(indice: number) {
    setArchivos((lista) => lista.filter((_, idx) => idx !== indice));
  }

  const opcionesDeSector = armarOpcionesDeSector(sectores, form.sector);

  useEffect(() => {
    if (!claveBorrador) return;
    readJSON<FormState | null>(claveBorrador, null).then((guardado) => {
      if (guardado && typeof guardado === "object" && tieneContenido({ ...FORM_VACIO, ...guardado })) {
        setForm(formDesdeBorrador(guardado));
        setHabiaBorrador(true);
        setEstadoBorrador("guardado");
      }
      borradorLeido.current = true;
    });
  }, [claveBorrador]);

  useEffect(() => {
    if (!claveBorrador || !borradorLeido.current) return;
    const id = setTimeout(() => {
      const contenidoAGuardar = tieneContenido(form) ? form : null;
      writeJSON(claveBorrador, contenidoAGuardar).then((ok) => setEstadoBorrador(estadoDeBorrador(ok, form)));
    }, 500);
    return () => clearTimeout(id);
  }, [claveBorrador, form]);

  function cambiar(cambios: Partial<FormState>) {
    setForm((f) => ({ ...f, ...cambios }));
  }

  function cambiarRequisito(indice: number, cambios: Partial<RequisitoForm>) {
    setForm((f) => ({
      ...f,
      requisitos: f.requisitos.map((r, i) => (i === indice ? { ...r, ...cambios } : r)),
    }));
  }

  function agregarRequisito() {
    cambiar({ requisitos: [...form.requisitos, { descripcion: "", dondeSeConsigue: "", costo: "" }] });
  }

  function quitarRequisito(indice: number) {
    cambiar({ requisitos: form.requisitos.filter((_, idx) => idx !== indice) });
  }

  function descartarBorrador() {
    setForm(FORM_VACIO);
    setErrores({});
    setHabiaBorrador(false);
    setEstadoBorrador("idle");
    if (claveBorrador) writeJSON(claveBorrador, null);
  }

  function mesasAEnviar() {
    if (mesas.length === 0) return form.mesaIds;
    return form.mesaIds.filter((id) => mesasDelSector.some((m) => m.id === id));
  }

  async function enviar() {
    const nuevos: Record<string, string> = {};
    const sectorElegido = sectores.find((s) => s.nombre === form.sector);

    validarDatosPrincipales(form, !!sectorElegido, nuevos);
    validarRequisitos(form.requisitos, nuevos);

    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0 || !sectorElegido) return;
    const adjuntos = archivos;

    setGuardando(true);
    try {
      await onSave(armarDatos(form, sectorElegido.id, mesasAEnviar()), adjuntos);
      if (claveBorrador) await writeJSON(claveBorrador, null);
    } catch (e) {
      setErrores({ general: mensajeDeError(e, "No se pudo guardar el trámite.") });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal
      open
      title={esEdicion ? "Editar trámite" : "Registrar ingreso"}
      onClose={onClose}
      footer={[
        <Btn key="cancelar" label="Cancelar" variant="secondary" onPress={onClose} disabled={guardando} />,
        <Btn
          key="guardar"
          label={esEdicion ? "Guardar cambios" : "Crear trámite"}
          onPress={enviar}
          loading={guardando}
        />,
      ]}
    >
      <Text style={[Type.meta, { color: C.ink2 }]}>
        El trámite se crea sin publicar. El encargado se toma de tu cuenta.
      </Text>
      {!!errores.general && <Text style={[Type.meta, { color: C.danger }]}>{errores.general}</Text>}
      {!esEdicion && estadoBorrador !== "idle" && (
        <Text style={[Type.meta, { color: estadoBorrador === "error" ? C.danger : C.ink3 }]}>
          {estadoBorrador === "error"
            ? "No se pudo guardar el borrador en este dispositivo."
            : "Borrador guardado en este dispositivo."}
        </Text>
      )}

      <Field label="Nombre" error={errores.nombre}>
        <Input value={form.nombre} onChangeText={(nombre) => cambiar({ nombre })} placeholder="Ej: Jubilación ordinaria" />
      </Field>

      <Field label="Descripción" error={errores.descripcion}>
        <Input
          value={form.descripcion}
          onChangeText={(descripcion) => cambiar({ descripcion })}
          placeholder="Explicá en qué consiste el trámite..."
          multiline
          style={{ minHeight: 96, textAlignVertical: "top" }}
        />
      </Field>

      <Field label="Sector" error={errores.sector}>
        <Select
          value={form.sector}
          options={opcionesDeSector}
          onChange={(sector) => cambiar({ sector })}
          placeholder="Seleccioná un sector…"
        />
      </Field>
      {sectores.length === 0 && (
        <Text style={[Type.meta, { color: C.warn }]}>No se pudieron cargar tus sectores.</Text>
      )}

      <Field label="Costo (opcional)" error={errores.costo}>
        <Input
          value={form.costo}
          onChangeText={(costo) => cambiar({ costo })}
          placeholder="Ej: 1500.50"
          keyboardType="decimal-pad"
        />
      </Field>

      <Field label="Mesas de entrada donde se presenta">
        <View>
          {mesasDelSector.map((mesa) => (
            <Pressable
              key={mesa.id}
              onPress={() => alternarMesa(mesa.id)}
              accessibilityRole="switch"
              accessibilityState={{ checked: form.mesaIds.includes(mesa.id) }}
              style={styles.filaMesa}
            >
              <Text style={[Type.rowTitle, { color: C.ink, flex: 1 }]} numberOfLines={2}>
                {mesa.nombre}
              </Text>
              <Toggle value={form.mesaIds.includes(mesa.id)} />
            </Pressable>
          ))}
          {mesasDelSector.length === 0 && (
            <Text style={[Type.meta, { color: C.ink2 }]}>
              {sectorActual ? "No hay mesas para este sector." : "Elegí un sector para ver sus mesas."}
            </Text>
          )}
        </View>
      </Field>

      <View style={styles.encabezadoRequisitos}>
        <Text style={[Type.label, { color: C.ink, flex: 1 }]}>Requisitos</Text>
        <Btn
          label="Agregar requisito"
          variant="ghost"
          size="md"
          icon="plus"
          disabled={form.requisitos.length >= MAX_REQUISITOS}
          onPress={agregarRequisito}
        />
      </View>
      {form.requisitos.length === 0 && (
        <Text style={[Type.meta, { color: C.ink2 }]}>Sin requisitos. Podés agregarlos ahora o más tarde.</Text>
      )}

      {form.requisitos.map((r, i) => (
        <View key={i} style={[styles.requisito, { borderColor: C.border, backgroundColor: C.surface }]}>
          <View style={styles.filaTitulo}>
            <Text style={[Type.meta, { color: C.ink2, flex: 1 }]}>Requisito {i + 1}</Text>
            <Pressable
              onPress={() => quitarRequisito(i)}
              accessibilityRole="button"
              accessibilityLabel="Quitar requisito"
              hitSlop={8}
            >
              <Icon name="close" size={18} color={C.bad} />
            </Pressable>
          </View>
          <Field label="Descripción" error={errores[`descripcion${i}`]}>
            <Input
              value={r.descripcion}
              onChangeText={(descripcion) => cambiarRequisito(i, { descripcion })}
              placeholder="Descripción del requisito"
            />
          </Field>
          <Field label="Dónde se consigue (opcional)" error={errores[`donde${i}`]}>
            <Input
              value={r.dondeSeConsigue}
              onChangeText={(dondeSeConsigue) => cambiarRequisito(i, { dondeSeConsigue })}
              placeholder="Ej: Registro Civil"
            />
          </Field>
          <Field label="Costo (opcional)" error={errores[`costo${i}`]}>
            <Input
              value={r.costo}
              onChangeText={(costo) => cambiarRequisito(i, { costo })}
              placeholder="0"
              keyboardType="decimal-pad"
            />
          </Field>
        </View>
      ))}

      <Field label="Archivos del trámite (PDF/DOCX, hasta 10 MB)" error={errores.archivos}>
        <View style={{ gap: Spacing[2] }}>
          {archivos.map((archivo, i) => (
            <View key={`${archivo.uri}-${i}`} style={[styles.archivo, { backgroundColor: C.surface }]}>
              <Icon name="file" size={16} color={C.ink2} />
              <Text style={[Type.meta, { color: C.ink, flex: 1 }]} numberOfLines={1}>
                {archivo.name}
              </Text>
              <Text style={[Type.meta, { color: C.ink3 }]}>{formatFileSize(archivo.size)}</Text>
              <Pressable
                onPress={() => quitarArchivo(i)}
                accessibilityRole="button"
                accessibilityLabel={`Quitar ${archivo.name}`}
                hitSlop={8}
              >
                <Icon name="close" size={16} color={C.bad} />
              </Pressable>
            </View>
          ))}
          <Btn
            label="Adjuntar archivo"
            variant="secondary"
            size="md"
            icon="paperclip"
            onPress={elegirArchivos}
            disabled={guardando}
          />
        </View>
      </Field>

      {!esEdicion && habiaBorrador && (
        <Btn
          label="Descartar borrador"
          variant="ghost"
          size="md"
          onPress={descartarBorrador}
          disabled={guardando || !tieneContenido(form)}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  filaMesa: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    minHeight: 48,
  },
  encabezadoRequisitos: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
  },
  requisito: {
    gap: Spacing[3],
    padding: Spacing[3],
    borderWidth: 1,
    borderRadius: Radius.lg,
  },
  filaTitulo: {
    flexDirection: "row",
    alignItems: "center",
  },
  archivo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    minHeight: 48,
    paddingHorizontal: Spacing[4],
    borderRadius: Radius.lg,
  },
});
