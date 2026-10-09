# ChatAP — Asistente Virtual

Proyecto final de Práctica Profesional III. Asistente virtual para trámites de la Subsecretaría de Recursos Humanos de la Provincia de Formosa. Expo + React Native, corre en Android y iOS desde el mismo código.

## Desarrollo

```bash
npm install
npx expo start
```

Presioná `a` (Android), `i` (iOS) o `w` (web) en la terminal, o escaneá el QR con Expo Go.

## Estructura

Expo Router: **un archivo dentro de `src/app` es una ruta**. Ahí solo van pantallas y layouts; todo lo demás vive en las otras carpetas.

```
src/
  app/
    _layout.tsx             Raíz: fuentes, sesión, avisos y las tres zonas de abajo
    +not-found.tsx          Pantalla 404
    +html.tsx               HTML base de la versión web
    (ciudadano)/            Grupo con menú lateral (no aparece en la URL)
      _layout.tsx           Drawer: Asistente, Descargas, Accesos
      index.tsx             /            El chat
      descargas.tsx         /descargas
      accesos.tsx           /accesos
    (publico)/              Grupo sin layout propio
      login.tsx             /login       Con sesión abierta redirige
      restablecer.tsx       /restablecer
    admin/
      _layout.tsx           Guard de entrada + Drawer del panel + permisos por pantalla
      index.tsx             /admin       Panel general
      mesa-de-entrada.tsx · solicitudes.tsx · usuarios.tsx · conocimiento.tsx
      documentos.tsx · siged.tsx · configuracion.tsx · reportes.tsx
  components/
    avatar/                 ChatBotAvatar (se dibuja con el motor de src/bloub)
    chat/                   Piezas del chat
    menu/                   Menú lateral compartido y encabezado
    reportes/               Gráficos de la pantalla de reportes
    admin/                  Formulario de usuarios
    ui/                     Piezas reutilizables: Btn, Fields, Select, Tabs, Modal, Toast…
  context/                  Sesión (AuthContext) y permisos del panel (AdminContext)
  data/                     Datos simulados (todavía no hay backend)
  hooks/                    useChat, useSortable, useKeyboardHeight
  lib/                      Sesión guardada, correo, almacenamiento
  constants/theme.ts        Colores, tipografía, espaciado y radios
  bloub/                    Motor que anima la mascota
```

### Quién entra adónde

| Zona | Quién | Qué pasa si no corresponde |
| --- | --- | --- |
| `(ciudadano)` | Cualquiera | — |
| `login` | Sin sesión | Con sesión redirige: personal al panel, el resto al chat |
| `admin` | Personal (Superadmin o Administrador) | Sin sesión redirige a `/login`; con una cuenta de Ciudadano muestra "Acceso restringido" |
| Cada pantalla de `admin` | Según el permiso del rol | La pantalla no existe para quien no tiene permiso |

## Convenciones

- **Solo rutas en `src/app`.** Un componente o un hook ahí se convertiría en una ruta (`Boton.tsx` pasaría a ser `/Boton`).
- **Un componente por archivo, con export nombrado.** Los archivos de `src/app` son la excepción: llevan `export default`, que Expo Router exige.
- **Imports con `@/`.** `@/components/ui/Btn` en vez de `../../components/ui/Btn`. Dentro de la misma carpeta se usa `./`.
- **Permisos en el layout, no en cada pantalla.** `src/app/admin/_layout.tsx` decide qué pantallas existen para cada rol.
- **Dependencias con `npx expo install`**, no con `npm install`, para que la versión coincida con el SDK de Expo Go.

## Cuentas de prueba

Los datos son simulados y se guardan en el dispositivo. Para entrar al panel usá la cuenta Superadmin que se crea sola la primera vez; su correo y su clave están en `src/context/AuthContext.tsx`. Cualquier otra cuenta que registres entra como Ciudadano hasta que un Superadmin apruebe su solicitud en **Solicitudes**.

## Diseño

Neutros sin tinte y un solo azul. Geist en tres pesos (400, 500, 600) y Geist Mono para números y fechas. Base de 4 pt, margen lateral de 20. Los valores están en `src/constants/theme.ts`; los componentes no escriben colores a mano.

## Verificación

```bash
npm run lint
npm run typecheck
```
