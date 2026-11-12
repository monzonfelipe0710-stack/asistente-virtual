import { Redirect, useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, View, useWindowDimensions } from "react-native";

import { DialogoCerrarSesion } from "@/components/menu/DialogoCerrarSesion";
import { EncabezadoFlotante } from "@/components/menu/Encabezado";
import {
  cerrarMenu,
  MenuLateral,
  type ItemDeMenu,
  type SeccionDeMenu,
} from "@/components/menu/MenuLateral";
import { opcionesDelMenu } from "@/components/menu/opcionesDelMenu";
import { PieAdmin } from "@/components/menu/PieAdmin";
import { VentanaAccesibilidad } from "@/components/menu/VentanaAccesibilidad";
import { Btn } from "@/components/ui/Btn";
import { PantallaAviso } from "@/components/ui/PantallaAviso";
import { useColors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { usePermisos } from "@/hooks/usePermisos";
import type { Permission } from "@/lib/permisos";

/** Una pantalla del panel: el archivo, su título, su grupo del menú y el permiso que pide. */
const PANTALLAS: {
  pantalla: string;
  titulo: string;
  icono: ItemDeMenu["icono"];
  grupo: string;
  permiso: Permission;
}[] = [
  { pantalla: "index", titulo: "Resumen", icono: "home", grupo: "Principal", permiso: "dashboard" },
  { pantalla: "solicitudes", titulo: "Solicitudes", icono: "checkCircle", grupo: "Principal", permiso: "solicitudes" },
  { pantalla: "mesa-de-entrada", titulo: "Mesa de Entradas", icono: "box", grupo: "Principal", permiso: "mesa_entrada" },
  { pantalla: "tramites", titulo: "Trámites", icono: "files", grupo: "Principal", permiso: "tramites" },
  { pantalla: "usuarios", titulo: "Usuarios", icono: "users", grupo: "Gestión", permiso: "usuarios" },
  { pantalla: "documentos", titulo: "Documentos", icono: "folder", grupo: "Gestión", permiso: "documentos" },
  { pantalla: "calificaciones", titulo: "Calificaciones", icono: "checkDouble", grupo: "Sistema", permiso: "calificaciones" },
  { pantalla: "reportes", titulo: "Reportes", icono: "chart", grupo: "Sistema", permiso: "reportes" },
];

type PantallaDelPanel = (typeof PANTALLAS)[number];

function obtenerGrupos(pantallas: PantallaDelPanel[]) {
  const grupos: string[] = [];
  for (const pantalla of pantallas) {
    if (!grupos.includes(pantalla.grupo)) {
      grupos.push(pantalla.grupo);
    }
  }
  return grupos;
}

function armarSecciones(pantallas: PantallaDelPanel[]) {
  const secciones: SeccionDeMenu[] = [];
  for (const grupo of obtenerGrupos(pantallas)) {
    const items: ItemDeMenu[] = [];
    for (const pantalla of pantallas) {
      if (pantalla.grupo === grupo) {
        items.push({ pantalla: pantalla.pantalla, titulo: pantalla.titulo, icono: pantalla.icono });
      }
    }
    secciones.push({ titulo: grupo, items });
  }
  return secciones;
}

function PantallaCargando() {
  const C = useColors();
  return (
    <View style={[styles.cargando, { backgroundColor: C.canvas }]}>
      <ActivityIndicator color={C.accent} />
    </View>
  );
}

function AccesoRestringido({
  confirmando,
  onPedirConfirmacion,
  onCancelar,
}: {
  confirmando: boolean;
  onPedirConfirmacion: () => void;
  onCancelar: () => void;
}) {
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <PantallaAviso
      icono="lock"
      titulo="Acceso restringido"
      texto="Tu cuenta de Ciudadano no tiene permiso para entrar al Acceso Interno."
    >
      <Btn label="Volver al asistente" variant="secondary" onPress={() => router.replace("/")} />
      <Btn label="Cerrar sesión" variant="ghost" onPress={onPedirConfirmacion} />
      <DialogoCerrarSesion open={confirmando} onClose={onCancelar} onConfirmar={logout} />
    </PantallaAviso>
  );
}

/**
 * Entrada al panel. Sin sesión lleva al login; con una cuenta que no es de
 * personal muestra el acceso restringido; con una de personal, abre el menú.
 * Una pantalla sin permiso no existe para el navegador.
 */
export default function LayoutAdmin() {
  const C = useColors();
  const { width } = useWindowDimensions();
  const { user, isStaff, loading } = useAuth();
  const { can } = usePermisos();
  const [accesibilidadAbierta, setAccesibilidadAbierta] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  // La sesión se lee de forma asíncrona: sin esto, en el primer cuadro se vería
  // el login incluso teniendo una sesión válida.
  if (loading) return <PantallaCargando />;

  if (!user) return <Redirect href="/login" />;

  if (user.debeCambiarPassword) return <Redirect href="/cambiar-password" />;

  if (!isStaff) {
    return (
      <AccesoRestringido
        confirmando={confirmando}
        onPedirConfirmacion={() => setConfirmando(true)}
        onCancelar={() => setConfirmando(false)}
      />
    );
  }

  const permitidas = PANTALLAS.filter((p) => can(p.permiso));

  const secciones = armarSecciones(permitidas);

  return (
    <>
      <Drawer
        drawerContent={(drawer) => (
          <MenuLateral
            drawer={drawer}
            nombre="Acceso interno"
            descripcion="Subsecretaría de Recursos Humanos"
            secciones={[
              ...secciones,
              {
                titulo: "Preferencias",
                items: [
                  {
                    titulo: "Accesibilidad",
                    icono: "access",
                    onPress: () => cerrarMenu(drawer, () => setAccesibilidadAbierta(true)),
                  },
                ],
              },
            ]}
          >
            <PieAdmin drawer={drawer} />
          </MenuLateral>
        )}
        screenOptions={{
          ...opcionesDelMenu(C, width),
          headerTransparent: true,
          header: () => <EncabezadoFlotante />,
        }}
      >
        {PANTALLAS.map((p) => (
          <Drawer.Protected key={p.pantalla} guard={can(p.permiso)}>
            <Drawer.Screen name={p.pantalla} options={{ title: `ChatAP · ${p.titulo}` }} />
          </Drawer.Protected>
        ))}
      </Drawer>
      <VentanaAccesibilidad open={accesibilidadAbierta} onClose={() => setAccesibilidadAbierta(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  cargando: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
