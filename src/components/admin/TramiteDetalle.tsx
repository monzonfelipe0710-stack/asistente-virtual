import * as DocumentPicker from "expo-document-picker";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, StyleSheet, View } from "react-native";

import { Radius, Spacing, Type, useColors } from "@/constants/theme";
import {
  eliminarDocumento,
  pedirDocumentos,
  pedirTramite,
  pedirUrlDeDescarga,
  subirDocumento,
  type ArchivoElegido,
  type DocumentoApi,
  type TramiteDetalleApi,
} from "@/lib/backend";
import { formatDate } from "@/utils/date";
import { formatFileSize } from "@/utils/file";
import { Badge } from "@/components/ui/Badge";
import { Btn } from "@/components/ui/Btn";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { KeyValue } from "@/components/ui/KeyValue";
import { Modal } from "@/components/ui/Modal";
import { Text } from "@/components/ui/Text";
import { useToast } from "@/components/ui/Toast";

const MAX_ARCHIVO = 10 * 1024 * 1024;
const TIPOS_PERMITIDOS = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const EXTENSIONES_PERMITIDAS = ["pdf", "docx"];

export function formatearCosto(costo: string | null, vacio = "—") {
  if (costo == null || costo === "") return vacio;
  const n = Number(costo);
  if (!Number.isFinite(n)) return vacio;
  return `$ ${n.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`;
}

function extensionDe(nombre: string) {
  const partes = nombre.split(".");
  return partes.length > 1 ? partes.pop()!.toLowerCase() : "";
}

export function TramiteDetalle({
  tramiteId,
  version,
  puedeGestionar,
  trabajando,
  onClose,
  onEditar,
  onEliminar,
  onAceptar,
  onRechazar,
}: {
  tramiteId: number;
  version: number;
  puedeGestionar: boolean;
  trabajando: boolean;
  onClose: () => void;
  onEditar?: (tramite: TramiteDetalleApi) => void;
  onEliminar?: (tramite: TramiteDetalleApi) => void;
  onAceptar?: (tramite: TramiteDetalleApi) => void;
  onRechazar?: (tramite: TramiteDetalleApi) => void;
}) {
  const C = useColors();
  const push = useToast();

  const [tramite, setTramite] = useState<TramiteDetalleApi | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoApi[]>([]);
  const [error, setError] = useState("");
  const [archivo, setArchivo] = useState<(ArchivoElegido & { size?: number }) | null>(null);
  const [nombreDocumento, setNombreDocumento] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [borrandoDocumento, setBorrandoDocumento] = useState<DocumentoApi | null>(null);

  const cargarDocumentos = useCallback(async () => {
    setDocumentos(await pedirDocumentos(tramiteId));
  }, [tramiteId]);

  useEffect(() => {
    let activo = true;
    setError("");
    Promise.all([pedirTramite(tramiteId), pedirDocumentos(tramiteId)])
      .then(([t, docs]) => {
        if (!activo) return;
        setTramite(t);
        setDocumentos(docs);
      })
      .catch((e) => {
        if (activo) setError(e instanceof Error ? e.message : "No se encontró el trámite.");
      });
    return () => {
      activo = false;
    };
  }, [tramiteId, version]);

  async function elegirArchivo() {
    const res = await DocumentPicker.getDocumentAsync({
      type: TIPOS_PERMITIDOS,
      copyToCacheDirectory: true,
    });
    if (res.canceled) return;
    const a = res.assets[0];
    setArchivo({
      uri: a.uri,
      name: a.name,
      mimeType: a.mimeType ?? "application/octet-stream",
      size: a.size ?? undefined,
    });
  }

  async function subir() {
    if (!archivo) {
      push("Elegí un archivo PDF o DOCX");
      return;
    }
    if (!EXTENSIONES_PERMITIDAS.includes(extensionDe(archivo.name))) {
      push("Solo se permiten archivos PDF o DOCX");
      return;
    }
    if (archivo.size != null && archivo.size > MAX_ARCHIVO) {
      push("El archivo supera los 10 MB");
      return;
    }
    setSubiendo(true);
    try {
      await subirDocumento(tramiteId, archivo, nombreDocumento.trim() || undefined);
      push("Documento subido");
      setArchivo(null);
      setNombreDocumento("");
      await cargarDocumentos();
    } catch (e) {
      push(e instanceof Error ? e.message : "No se pudo subir el documento.");
    } finally {
      setSubiendo(false);
    }
  }

  async function descargar(doc: DocumentoApi) {
    try {
      const { url } = await pedirUrlDeDescarga(tramiteId, doc.id);
      if (url) await Linking.openURL(url);
    } catch (e) {
      push(e instanceof Error ? e.message : "No se pudo descargar el documento.");
    }
  }

  async function confirmarBorradoDocumento() {
    const doc = borrandoDocumento;
    setBorrandoDocumento(null);
    if (!doc) return;
    try {
      await eliminarDocumento(tramiteId, doc.id);
      push("Documento eliminado");
      setDocumentos((lista) => lista.filter((d) => d.id !== doc.id));
    } catch (e) {
      push(e instanceof Error ? e.message : "No se pudo eliminar el documento.");
    }
  }

  return (
    <>
      <Modal
        open={borrandoDocumento === null}
        title={tramite?.nombre ?? "Trámite"}
        onClose={onClose}
        footer={
          puedeGestionar && tramite
            ? <Btn label="Editar" onPress={() => onEditar?.(tramite)} disabled={trabajando} />
            : tramite && onAceptar && onRechazar
              ? [
                  <Btn
                    key="rechazar"
                    label="Rechazar"
                    variant="danger"
                    onPress={() => onRechazar(tramite)}
                    disabled={trabajando || !tramite.publicado}
                  />,
                  <Btn
                    key="aceptar"
                    label="Aceptar"
                    onPress={() => onAceptar(tramite)}
                    disabled={trabajando || tramite.publicado}
                  />,
                ]
              : <Btn label="Cerrar" variant="secondary" onPress={onClose} />
        }
      >
        {!tramite && !error && <ActivityIndicator color={C.accent} />}
        {!!error && <Text style={[Type.meta, { color: C.danger }]}>{error}</Text>}

        {!!tramite && (
          <>
            <View style={styles.etiquetas}>
              <Badge label={tramite.publicado ? "Aceptado" : "Sin aceptar"} tone={tramite.publicado ? "ok" : "muted"} />
              <Badge label={tramite.sector.nombre} tone="brand" />
            </View>
            <Text style={[Type.body, { color: C.ink2 }]}>{tramite.descripcion}</Text>

            <Text style={[Type.label, { color: C.ink }]}>Información</Text>
            <View>
              <KeyValue label="Encargado" value={tramite.encargado.nombre} />
              <KeyValue label="Sector" value={tramite.sector.nombre} />
              <KeyValue label="Costo" value={formatearCosto(tramite.costo, "Sin costo")} />
              <KeyValue label="Creado" value={formatDate(tramite.createdAt)} />
              <KeyValue label="Actualizado" value={formatDate(tramite.updatedAt)} last />
            </View>

            <Text style={[Type.label, { color: C.ink }]}>Requisitos</Text>
            {tramite.requisitos.length === 0 && (
              <Text style={[Type.meta, { color: C.ink2 }]}>Sin requisitos cargados.</Text>
            )}
            {tramite.requisitos.map((r) => (
              <View key={r.id} style={[styles.caja, { borderColor: C.border, backgroundColor: C.surface }]}>
                <Text style={[Type.body, { color: C.ink }]}>{r.descripcion}</Text>
                <Text style={[Type.meta, { color: C.ink2 }]}>
                  {r.dondeSeConsigue ? `Dónde: ${r.dondeSeConsigue}` : "Sin indicación de dónde conseguirlo"}
                  {r.costo != null && r.costo !== "" ? ` · Costo: ${formatearCosto(r.costo)}` : ""}
                </Text>
              </View>
            ))}

            <Text style={[Type.label, { color: C.ink }]}>Mesas de entrada</Text>
            {tramite.mesas.length === 0 ? (
              <Text style={[Type.meta, { color: C.ink2 }]}>Sin mesas asignadas.</Text>
            ) : (
              tramite.mesas.map((m) => (
                <Text key={m.mesaId} style={[Type.body, { color: C.ink2 }]}>
                  {m.mesa?.nombre ?? `Mesa #${m.mesaId}`}
                </Text>
              ))
            )}

            <Text style={[Type.label, { color: C.ink }]}>Documentos ({documentos.length})</Text>
            {puedeGestionar && (
              <View style={[styles.caja, { borderColor: C.border }]}>
                <Field label="Nombre (opcional)">
                  <Input
                    value={nombreDocumento}
                    onChangeText={setNombreDocumento}
                    placeholder="Ej: Formulario oficial"
                  />
                </Field>
                <Field label="Archivo (PDF/DOCX, hasta 10 MB)">
                  <Btn
                    label={archivo ? archivo.name : "Elegir archivo"}
                    variant="secondary"
                    size="md"
                    icon="paperclip"
                    onPress={elegirArchivo}
                  />
                </Field>
                {!!archivo?.size && (
                  <Text style={[Type.meta, { color: C.ink3 }]}>{formatFileSize(archivo.size)}</Text>
                )}
                <Btn label={subiendo ? "Subiendo…" : "Subir"} size="md" onPress={subir} loading={subiendo} />
              </View>
            )}
            {documentos.length === 0 && (
              <Text style={[Type.meta, { color: C.ink2 }]}>Todavía no hay documentos.</Text>
            )}
            {documentos.map((doc) => (
              <View key={doc.id} style={[styles.documento, { borderBottomColor: C.border }]}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[Type.body, { color: C.ink }]} numberOfLines={1}>
                    {doc.nombre}
                  </Text>
                  <Text style={[Type.meta, { color: C.ink2 }]}>
                    {extensionDe(doc.nombre).toUpperCase() || "Archivo"} · {formatDate(doc.createdAt)}
                  </Text>
                </View>
                <View style={styles.acciones}>
                  <Btn label="Descargar" variant="ghost" size="md" onPress={() => descargar(doc)} />
                  {puedeGestionar && (
                    <Btn label="Eliminar" variant="danger" size="md" onPress={() => setBorrandoDocumento(doc)} />
                  )}
                </View>
              </View>
            ))}

            {puedeGestionar && onEliminar && (
              <Btn
                label="Eliminar trámite"
                variant="danger"
                size="md"
                onPress={() => onEliminar(tramite)}
                disabled={trabajando}
              />
            )}
          </>
        )}
      </Modal>

      <Modal
        open={borrandoDocumento !== null}
        title="Eliminar documento"
        onClose={() => setBorrandoDocumento(null)}
        footer={[
          <Btn key="cancelar" label="Cancelar" variant="secondary" onPress={() => setBorrandoDocumento(null)} />,
          <Btn key="eliminar" label="Eliminar" variant="dangerFill" onPress={confirmarBorradoDocumento} />,
        ]}
      >
        <Text style={[Type.body, { color: C.ink2 }]}>
          ¿Seguro que querés eliminar “{borrandoDocumento?.nombre}”?
        </Text>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  etiquetas: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing[2],
  },
  caja: {
    gap: Spacing[2],
    padding: Spacing[3],
    borderWidth: 1,
    borderRadius: Radius.lg,
  },
  documento: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
  },
  acciones: {
    flexDirection: "row",
    gap: Spacing[1],
  },
});
