# ChatAP — Asistente Virtual

Proyecto final de Práctica Profesional III. Asistente virtual para trámites de la Subsecretaría de Recursos Humanos de la Provincia de Formosa. Expo + React Native, corre en Android y iOS desde el mismo código.

## Desarrollo

```bash
npm install
npx expo start
```

Presioná `a` (Android), `i` (iOS) o `w` (web) en la terminal, o escaneá el QR con Expo Go.

## Estructura

- `src/app/` — rutas (Expo Router, basado en archivos). `/` es la vista ciudadano, `/admin/*` el panel admin.
- `src/components/{admin,ciudadano,common}/` — componentes de UI.
- `src/context/AppDataContext.tsx` — estado global del panel admin.
- `src/data/` — datos simulados (mock), todavía no hay backend real.
- `src/constants/` — tokens de diseño (colores, espaciados) y mapas de color de badges.

## Verificación

```bash
npm run lint
npm run typecheck
```
