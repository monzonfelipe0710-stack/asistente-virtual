import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from "react-native";

import { TarjetaDeDocumento } from "@/components/descargas/TarjetaDeDocumento";
import { Encabezado } from "@/components/menu/Encabezado";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Screen } from "@/components/ui/Screen";
import { SkeletonList } from "@/components/ui/SkeletonList";
import { Text } from "@/components/ui/Text";
import { useToast } from "@/components/ui/Toast";
import { Radius, Spacing, Type, useColors } from "@/constants/theme";
import {
  pedirDocumentos,
  pedirTramitesPublicados,
  pedirUrlDeDescarga,
  type DocumentoApi,
  type TramitePublicadoApi,
} from "@/lib/backend";

function TramiteConDocumentos({ tramite }: { tramite: TramitePublicadoApi }) {
  const C = useColors();
  const push = useToast();
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [documentos, setDocumentos] = useState<DocumentoApi[] | null>(null);

  async function alternar() {
    const siguiente = !abierto;
    setAbierto(siguiente);
    if (!siguiente || documentos !== null) return;
    setCargando(true);
    try {
      setDocumentos(await pedirDocumentos(tramite.id));
    } catch (e) {
      push(e instanceof Error ? e.message : "No se pudieron cargar los documentos.");
      setAbierto(false);
    } finally {
      setCargando(false);
    }
  }

  async function descargar(documento: DocumentoApi) {
    try {
      const { url } = await pedirUrlDeDescarga(tramite.id, documento.id);
      if (url) await Linking.openURL(url);
    } catch (e) {
      push(e instanceof Error ? e.message : "No se pudo abrir el documento.");
    }
  }

  return (
    <View>
      <Pressable
        onPress={alternar}
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
          <Icon name={abierto ? "chevronDown" : "chevronRight"} size={20} color={C.ink2} />
        )}
      </Pressable>

      {abierto && documentos !== null && (
        <View style={styles.documentos}>
          {documentos.map((documento) => (
            <TarjetaDeDocumento
              key={documento.id}
              documento={documento}
              onPress={() => descargar(documento)}
            />
          ))}
          {documentos.length === 0 && (
            <Text style={[Type.meta, { color: C.ink2 }]}>Este trámite no tiene documentos.</Text>
          )}
        </View>
      )}
    </View>
  );
}

/** Ruta "/descargas": formularios y notas de cada trámite publicado. */
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
        if (activo) setError(e instanceof Error ? e.message : "No se pudieron cargar los trámites.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  return (
    <View style={[styles.pantalla, { backgroundColor: C.canvas }]}>
      <Encabezado titulo="Descargas" />

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

        {!cargando && !error && tramites.length === 0 && (
          <EmptyState title="Sin trámites" detalle="Todavía no hay trámites publicados." />
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
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
