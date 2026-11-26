import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Radius, Spacing, Type, useColors } from "@/compartido/constantes/theme";
import {
  cambiarModeloDeChat,
  mensajeDeError,
  pedirAuditoriaDeModelos,
  pedirModelosDeChat,
  type CambioDeModeloApi,
  type ModeloDeChatApi,
  type ModelosDeChatApi,
} from "@/compartido/lib/backend";
import { formatDate } from "@/compartido/utils/date";
import { Badge } from "@/compartido/ui/Badge";
import { Btn } from "@/compartido/ui/Btn";
import { EmptyState } from "@/compartido/ui/EmptyState";
import { Field } from "@/compartido/ui/Field";
import { Input } from "@/compartido/ui/Input";
import { Modal } from "@/compartido/ui/Modal";
import { PageHeader } from "@/compartido/ui/PageHeader";
import { Row } from "@/compartido/ui/Row";
import { Screen } from "@/compartido/ui/Screen";
import { SectionTitle } from "@/compartido/ui/SectionTitle";
import { SkeletonList } from "@/compartido/ui/SkeletonList";
import { Text } from "@/compartido/ui/Text";
import { useToast } from "@/compartido/ui/Toast";
import { BloqueError } from "@/funcionalidades/admin/componentes/BloqueError";

const MOTIVO_MINIMO = 5;
const MOTIVO_MAXIMO = 500;

function nombreDelModelo(datos: ModelosDeChatApi, id: string | null) {
  if (!id) return "—";
  return datos.modelos.find((m) => m.id === id)?.nombre ?? id;
}

function textoDeCosto(modelo: ModeloDeChatApi) {
  const costo = modelo.costoPor1000?.medido ?? modelo.costoPor1000?.estimado;
  if (costo === null || costo === undefined) return "Costo sin medir";
  return `USD ${costo.toFixed(2)} cada 1000 consultas`;
}

function textoDeOrigen(origen: ModelosDeChatApi["origen"]) {
  if (origen === "entorno") return "No se pudo leer la configuración: responde el modelo por defecto del servidor.";
  if (origen === "forzado") return "El servidor tiene un modelo forzado para pruebas.";
  return null;
}

function EstadoActual({ datos }: { datos: ModelosDeChatApi }) {
  const C = useColors();
  const aviso = textoDeOrigen(datos.origen);
  const distintoAlElegido = datos.enUso !== datos.activo;
  const actualizado = datos.actualizadoEn
    ? `Cambiado el ${formatDate(datos.actualizadoEn)}${datos.actualizadoPor ? ` por ${datos.actualizadoPor.nombre}` : ""}`
    : null;

  return (
    <View style={[styles.estado, { backgroundColor: C.surface, borderColor: C.border }]}>
      <Text style={[Type.meta, { color: C.ink2 }]}>Responde en el chat</Text>
      <Text style={[Type.cardTitle, { color: C.ink }]}>{nombreDelModelo(datos, datos.enUso)}</Text>
      {distintoAlElegido && (
        <Text style={[Type.meta, { color: C.warn }]}>
          El elegido es {nombreDelModelo(datos, datos.activo)}, pero no se puede usar ahora y responde el modelo por
          defecto.
        </Text>
      )}
      {!!aviso && <Text style={[Type.meta, { color: C.warn }]}>{aviso}</Text>}
      {!!actualizado && <Text style={[Type.meta, { color: C.ink3 }]}>{actualizado}</Text>}
    </View>
  );
}

function FilaModelo({
  modelo,
  trabajando,
  onActivar,
}: {
  modelo: ModeloDeChatApi;
  trabajando: boolean;
  onActivar: () => void;
}) {
  const C = useColors();
  return (
    <Row style={{ paddingVertical: 14 }}>
      <View style={styles.cuerpo}>
        <Text style={[Type.rowTitle, { color: C.ink }]}>{modelo.nombre}</Text>
        <Text style={[Type.meta, { color: C.ink2 }]}>
          {modelo.proveedor} · {textoDeCosto(modelo)}
        </Text>
        <View style={styles.etiquetas}>
          {modelo.activo && <Badge label="Activo" tone="ok" />}
          {modelo.esPorDefecto && <Badge label="Por defecto" tone="info" />}
          {modelo.avisos.map((aviso) => (
            <Badge key={aviso} label={aviso} tone="warn" />
          ))}
        </View>
        {!modelo.seleccionable && !modelo.activo && !!modelo.motivoNoSeleccionable && (
          <Text style={[Type.meta, { color: C.ink3 }]}>{modelo.motivoNoSeleccionable}</Text>
        )}
        {modelo.seleccionable && (
          <View style={styles.acciones}>
            <Btn label="Activar" variant="secondary" size="md" onPress={onActivar} disabled={trabajando} />
          </View>
        )}
      </View>
    </Row>
  );
}

function FilaCambio({ cambio }: { cambio: CambioDeModeloApi }) {
  const C = useColors();
  const quien = cambio.usuario?.nombre ?? "Cuenta eliminada";
  return (
    <Row style={{ paddingVertical: 12 }}>
      <View style={styles.cuerpo}>
        <Text style={[Type.rowTitle, { color: C.ink }]}>
          {cambio.modeloAnterior ?? "—"} → {cambio.modeloNuevo}
        </Text>
        <Text style={[Type.body, { color: C.ink2 }]}>{cambio.motivo}</Text>
        <Text style={[Type.meta, { color: C.ink3 }]}>
          {formatDate(cambio.fecha)} · {quien}
        </Text>
      </View>
    </Row>
  );
}

export default function ModeloDelChat() {
  const C = useColors();
  const push = useToast();
  const [datos, setDatos] = useState<ModelosDeChatApi | null>(null);
  const [cambios, setCambios] = useState<CambioDeModeloApi[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const [eligiendo, setEligiendo] = useState<ModeloDeChatApi | null>(null);
  const [motivo, setMotivo] = useState("");
  const [errorMotivo, setErrorMotivo] = useState("");
  const [trabajando, setTrabajando] = useState(false);

  useEffect(() => {
    let activo = true;
    Promise.all([pedirModelosDeChat(), pedirAuditoriaDeModelos()])
      .then(([modelos, auditoria]) => {
        if (!activo) return;
        setDatos(modelos);
        setCambios(auditoria.cambios);
        setError("");
      })
      .catch((e) => {
        if (activo) setError(mensajeDeError(e, "No se pudieron cargar los modelos del chat."));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [version]);

  const recargar = useCallback(() => {
    setCargando(true);
    setVersion((v) => v + 1);
  }, []);

  function abrirCambio(modelo: ModeloDeChatApi) {
    setEligiendo(modelo);
    setMotivo("");
    setErrorMotivo("");
  }

  async function confirmarCambio() {
    if (!eligiendo) return;
    const texto = motivo.trim();
    if (texto.length < MOTIVO_MINIMO) {
      setErrorMotivo(`El motivo tiene que tener al menos ${MOTIVO_MINIMO} caracteres.`);
      return;
    }
    setTrabajando(true);
    try {
      setDatos(await cambiarModeloDeChat(eligiendo.id, texto));
      push(`Ahora responde ${eligiendo.nombre}`);
      setEligiendo(null);
      const auditoria = await pedirAuditoriaDeModelos();
      setCambios(auditoria.cambios);
    } catch (e) {
      setErrorMotivo(mensajeDeError(e, "No se pudo cambiar el modelo."));
    } finally {
      setTrabajando(false);
    }
  }

  return (
    <Screen>
      <PageHeader
        title="Modelo del chat"
        description="Elegí qué modelo responde en el asistente. Cada cambio queda registrado con su motivo."
      />

      {!!error && <BloqueError mensaje={error} onReintentar={recargar} />}

      {cargando && <SkeletonList />}

      {!cargando && datos && (
        <>
          <EstadoActual datos={datos} />

          <SectionTitle>Modelos disponibles</SectionTitle>
          {datos.modelos.map((m) => (
            <FilaModelo key={m.id} modelo={m} trabajando={trabajando} onActivar={() => abrirCambio(m)} />
          ))}

          <SectionTitle>Últimos cambios</SectionTitle>
          {cambios.length === 0 ? (
            <EmptyState title="Sin cambios" detalle="Todavía no se cambió el modelo del chat." />
          ) : (
            cambios.map((c) => <FilaCambio key={c.id} cambio={c} />)
          )}
        </>
      )}

      <Modal
        open={eligiendo !== null}
        title={`Activar ${eligiendo?.nombre ?? ""}`}
        onClose={() => setEligiendo(null)}
        footer={[
          <Btn key="cancelar" label="Cancelar" variant="secondary" onPress={() => setEligiendo(null)} />,
          <Btn key="activar" label="Activar" onPress={confirmarCambio} loading={trabajando} />,
        ]}
      >
        <Text style={[Type.body, { color: C.ink2 }]}>
          El cambio rige enseguida para todas las consultas del chat.
        </Text>
        <Field label="Motivo del cambio">
          <Input
            value={motivo}
            onChangeText={setMotivo}
            placeholder="Ej: Reemplazo del modelo anterior antes de su retiro"
            multiline
            maxLength={MOTIVO_MAXIMO}
            invalid={!!errorMotivo}
          />
        </Field>
        {!!errorMotivo && <Text style={[Type.meta, { color: C.danger }]}>{errorMotivo}</Text>}
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  estado: {
    gap: 4,
    padding: Spacing[4],
    borderRadius: Radius["2xl"],
    borderWidth: 1,
  },
  cuerpo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  etiquetas: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing[2],
    marginTop: 4,
  },
  acciones: {
    flexDirection: "row",
    marginTop: Spacing[2],
  },
});
