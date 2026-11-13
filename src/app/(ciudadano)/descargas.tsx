import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from "react-native";

import { TarjetaDeDocumento } from "@/funcionalidades/descargas/TarjetaDeDocumento";
import { PantallaConEncabezadoFlotante } from "@/funcionalidades/menu/Encabezado";
import { EmptyState } from "@/compartido/ui/EmptyState";
import { Icon } from "@/compartido/ui/Icon";
import { Screen } from "@/compartido/ui/Screen";
import { SkeletonList } from "@/compartido/ui/SkeletonList";
import { Text } from "@/compartido/ui/Text";
import { useToast } from "@/compartido/ui/Toast";
import { Radius, Spacing, Type, useColors } from "@/compartido/constantes/theme";
import {
  mensajeDeError,
  pedirDocumentos,
  pedirTramitesPublicados,
  pedirUrlDeDescarga,
  type DocumentoApi,
  type TramitePublicadoApi,
} from "@/compartido/lib/backend";

function CabeceraDelTramite({
  tramite,
  abierto,
  cargando,
  onPress,
}: {
  tramite: TramitePublicadoApi;
  abierto: boolean;
  cargando: boolean;
  onPress: () => void;
}) {
  const C = useColors();
  const nombreDelIcono = abierto ? "chevronDown" : "chevronRight";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ expanded: abierto }}
      style={({ pressed }) => [
        styles.cabecera,
        { backgroundColor: pressed ? C.surface2 : C.surface },
      ]}
    >
      <Text style={[Type.rowTitle, { color: C.ink, flex: 1 }]} numberOfLines={2}>
        {tramite.nombre}
      </Text>
      {cargando ? (
        <ActivityIndicator color={C.accent} />
      ) : (
        <Icon name={nombreDelIcono} size={20} color={C.ink2} />
      )}
    </Pressable>
  );
}

function ListaDeDocumentos({
  documentos,
  onDescargar,
}: {
  documentos: DocumentoApi[];
  onDescargar: (documento: DocumentoApi) => void;
}) {
  const C = useColors();

  return (
    <View style={styles.documentos}>
      {documentos.map((documento) => (
        <TarjetaDeDocumento
          key={documento.id}
          documento={documento}
          onPress={() => onDescargar(documento)}
        />
      ))}
      {documentos.length === 0 && (
        <Text style={[Type.meta, { color: C.ink2 }]}>Este trámite no tiene documentos.</Text>
      )}
    </View>
  );
}

function TramiteConDocumentos({ tramite }: { tramite: TramitePublicadoApi }) {
  const push = useToast();
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [documentos, setDocumentos] = useState<DocumentoApi[] | null>(null);

  async function cargarDocumentos() {
    setCargando(true);
    try {
      const documentosDelTramite = await pedirDocumentos(tramite.id);
      setDocumentos(documentosDelTramite);
    } catch (e) {
      push(mensajeDeError(e, "No se pudieron cargar los documentos."));
      setAbierto(false);
    } finally {
      setCargando(false);
    }
  }

  async function alternar() {
    const siguiente = !abierto;
    setAbierto(siguiente);
    if (!siguiente) return;
    if (documentos !== null) return;
    await cargarDocumentos();
  }

  async function descargar(documento: DocumentoApi) {
    try {
      const { url } = await pedirUrlDeDescarga(tramite.id, documento.id);
      if (url) await Linking.openURL(url);
    } catch (e) {
      push(mensajeDeError(e, "No se pudo abrir el documento."));
    }
  }

  return (
    <View>
      <CabeceraDelTramite
        tramite={tramite}
        abierto={abierto}
        cargando={cargando}
        onPress={alternar}
      />

      {abierto && documentos !== null && (
        <ListaDeDocumentos documentos={documentos} onDescargar={descargar} />
      )}
    </View>
  );
}

export default function Descargas() {
  const C = useColors();
  const [tramites, setTramites] = useState<TramitePublicadoApi[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    pedirTramitesPublicados()
      .then((lista) => {
        if (activo) setTramites(lista);
      })
      .catch((e) => {
        if (activo) setError(mensajeDeError(e, "No se pudieron cargar los trámites."));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const sinTramites = !cargando && !error && tramites.length === 0;

  return (
    <PantallaConEncabezadoFlotante titulo="Descargas">

      <Screen>
        <Text style={[Type.lead, { color: C.ink2, marginBottom: Spacing[2] }]}>
          Formularios y notas para tus trámites.
        </Text>

        {cargando && <SkeletonList />}

        {!!error && <Text style={[Type.meta, { color: C.danger }]}>{error}</Text>}

        <View style={styles.lista}>
          {tramites.map((tramite) => (
            <TramiteConDocumentos key={tramite.id} tramite={tramite} />
          ))}
        </View>

        {sinTramites && (
          <EmptyState title="Sin trámites" detalle="Todavía no hay trámites publicados." />
        )}
      </Screen>
    </PantallaConEncabezadoFlotante>
  );
}

const styles = StyleSheet.create({
  lista: {
    gap: Spacing[2],
    marginTop: Spacing[4],
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    paddingHorizontal: Spacing[4],
    paddingVertical: 14,
    borderRadius: Radius.xl,
  },
  documentos: {
    gap: Spacing[2],
    marginTop: Spacing[2],
    paddingLeft: Spacing[3],
  },
});
