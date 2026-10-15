# PROMPT MAESTRO PARA OPENCODE — CHATAP FRONTEND

## Objetivo
Trabajá sobre el repositorio actual de ChatAP para llevar el frontend a un nivel de calidad visual y funcional sobresaliente, priorizando a personas mayores y usuarios con poca experiencia digital. El resultado debe sentirse institucional, moderno, claro, humano, rápido, accesible y consistente; no una plantilla genérica de SaaS.

## Contexto del proyecto
- Aplicación: ChatAP, asistente virtual orientado a la ciudadanía y a trámites/consultas de la administración pública de Formosa.
- Rama de trabajo indicada: `dev-felipe`. Confirmá la rama actual antes de modificar.
- La identidad visual definida en `DESIGN.md` es la fuente de verdad para marca, colores, temas y dirección estética.
- La skill `chatap-frontend` incluida debajo es la guía permanente y obligatoria.
- El PDF de requerimientos y el README describen el alcance del proyecto; contrastá toda funcionalidad con el código real.
- No supongas que integraciones con SIGED, respuestas en vivo, autenticación real, seguimiento de expedientes o datos institucionales están conectados si el código no lo demuestra.

## Modo de trabajo: autonomía con control de calidad
No te detengas a pedir aprobación por cada decisión visual o técnica de bajo riesgo. Inspeccioná, planificá, implementá y verificá de forma autónoma. Si algo puede romper contratos de API, autenticación, permisos, datos, rutas o funcionalidades existentes, preservalo y documentá el riesgo antes de cambiarlo. No hagas cambios destructivos ni inventes credenciales/datos reales.

### Fase 1 — Reconocimiento y línea base
1. Leé `AGENTS.md` si existe, `README.md`, `DESIGN.md`, `package.json`, configuración de Vite, router, estilos globales, componentes compartidos, páginas ciudadanas, chat, login/registro, perfil y administración.
2. Confirmá rama, estado de Git y cambios existentes. No sobrescribas ni descartes cambios ajenos.
3. Identificá scripts reales disponibles (`lint`, `build`, `test`, etc.). Ejecutá primero las verificaciones posibles y anotá fallas preexistentes.
4. Dibujá el flujo real de navegación y detectá componentes duplicados, estilos conflictivos, errores de consola evidentes, enlaces rotos y estados incompletos.
5. No te limites a producir un informe: después del diagnóstico, continuá con la implementación dentro del alcance definido, salvo bloqueo real.

### Fase 2 — Plan y ejecución por lotes
Trabajá en este orden, terminando y verificando cada lote antes de seguir:

**Lote A — Accesibilidad y base visual**
- Normalizá tokens para colores, tipografía, espaciado, radios, sombras, bordes, focus y movimiento, respetando `DESIGN.md`.
- Priorizá legibilidad: cuerpo ideal de 18px; texto funcional y formularios no menor de 16px salvo excepciones justificadas; jerarquía tipográfica clara.
- Asegurá contraste suficiente, estados hover/focus/active/disabled/error/loading y foco visible.
- Objetivos táctiles de 44–48px como mínimo práctico, con separación entre controles.
- Verificá zoom al 200%, reflow y uso por teclado; evitá depender solo del color.
- Mantené el diseño responsive para móvil, tablet y escritorio.

**Lote B — Inicio y navegación**
- Hacé evidente qué es ChatAP, para qué sirve, cómo empezar, qué consultas admite y cuándo se necesita iniciar sesión.
- Usá títulos concretos, textos breves y acciones primarias inequívocas.
- Mejorá navegación, orientación, estado activo, encabezados, pie y menú móvil.
- No agregues promesas o métricas no verificadas.

**Lote C — Chat ciudadano**
- Priorizá lectura de mensajes, escritura, respuestas sugeridas, envío, adjuntos/descargas y micrófono si existe.
- Etiquetá claramente los controles con texto o nombres accesibles; no uses iconos ambiguos sin etiqueta accesible.
- Mejorá estados vacío, cargando, enviando, respuesta, error, reintento y conexión.
- Evitá auto-scroll agresivo: desplazá al final al llegar un mensaje solo si el usuario ya estaba cerca del final; no lo fuerces mientras lee mensajes antiguos.
- Conservá el texto escrito ante fallas recuperables.
- Asegurá anuncios accesibles de nuevos mensajes sin releer todo el historial.
- No simules integraciones reales ni cambies contratos del servicio de chat sin evidencia y necesidad.

**Lote D — Formularios y autenticación**
- Diferenciá claramente iniciar sesión, registrarse y recuperar acceso.
- Usá etiquetas persistentes, instrucciones claras, errores específicos junto al campo y estados de envío.
- Conservá datos válidos cuando un campo falla.
- No alteres reglas de autenticación, persistencia, roles o permisos como parte de una mejora visual.
- Señalá por separado cualquier problema de seguridad preexistente; no lo ocultes con cambios de interfaz.

**Lote E — Componentes compartidos, perfil y administración**
- Unificá botones, campos, tarjetas, alertas, modales, toasts, menús y estados de carga.
- Revisá foco inicial, contención del foco, cierre con Escape cuando corresponda, retorno del foco y nombre accesible de los controles de cierre.
- Revisá tabs, sidebar, estado activo, accesibilidad de menús y navegación por teclado.
- Evitá que los cambios para ciudadanía degraden el panel administrativo; aplicá el mismo sistema visual sin quitar densidad útil al uso experto.

**Lote F — Animación y rendimiento**
- Animaciones breves y con propósito, normalmente entre 150 y 350 ms.
- Preferí transiciones de opacidad/transformación; evitá animaciones de layout costosas y movimiento permanente.
- Respetá `prefers-reduced-motion` en toda la aplicación.
- Conservá la personalidad visual del avatar, pero sin competir con el contenido ni distraer.
- Optimizá `requestAnimationFrame`, listeners y efectos: no mantengas bucles activos si no hay animación visible que procesar.
- Evitá nuevas dependencias salvo que aporten valor claro y compatible con el proyecto.

### Fase 3 — Criterios de implementación
- Usá las tecnologías, convenciones y dependencias ya presentes.
- Preferí cambios pequeños, coherentes y reutilizables; evitá reescribir todo por preferencia personal.
- No dupliques tokens ni agregues CSS de parche sin integrar el sistema existente.
- No rompas nombres de rutas, contratos API, persistencia, roles, flujos de datos o comportamiento existente.
- No agregues texto de marketing no verificable, botones decorativos, acciones sin funcionamiento ni enlaces falsos.
- No elimines funciones existentes solo porque sea más fácil rediseñar.
- No uses emojis como sustituto de iconografía de interfaz.
- No afirmes cumplimiento WCAG sin pruebas; describí qué verificaste realmente.
- Si una herramienta de navegador está disponible, revisá las vistas principales en tamaños móvil y escritorio. Si no está disponible, no inventes una inspección visual: ejecutá las pruebas disponibles y explicá la limitación.

### Fase 4 — Verificación continua
Después de cada lote:
1. Ejecutá el lint y build disponibles.
2. Ejecutá tests existentes relevantes.
3. Corregí regresiones introducidas por tus cambios.
4. Revisá los cambios con `git diff` para detectar modificaciones accidentales, código muerto, duplicación o cambios fuera de alcance.
5. Si una verificación falla por un problema preexistente, compará con la línea base y no lo atribuyas falsamente al trabajo nuevo.

Al final, ejecutá nuevamente todas las verificaciones disponibles. No marques una prueba como exitosa si no la ejecutaste.

### Definición de terminado
La tarea no se considera terminada solo porque “se ve mejor”. Debe:
- mantener los flujos y contratos funcionales existentes;
- tener jerarquía visual consistente con `DESIGN.md`;
- ser legible y manejable para personas mayores;
- contar con navegación por teclado y foco visible;
- presentar estados claros de éxito, espera, error y recuperación;
- respetar movimiento reducido;
- responder en móvil y escritorio;
- no introducir errores de lint/build nuevos;
- incluir un resumen de archivos modificados, decisiones importantes, pruebas ejecutadas y limitaciones pendientes.

## Entrega final obligatoria
Al finalizar, informá:
1. Qué cambiaste, organizado por áreas.
2. Qué archivos tocaste y por qué.
3. Qué comandos ejecutaste y el resultado real de cada uno.
4. Qué no pudiste verificar y por qué.
5. Riesgos o problemas preexistentes que dejaste intactos.
6. Próximas mejoras sugeridas, priorizadas por impacto.
No digas “todo está perfecto” ni “100% accesible” sin evidencia.

---

# SKILL PERMANENTE: CHATAP FRONTEND

La siguiente sección debe guardarse también como `.opencode/skills/chatap-frontend/SKILL.md` para que OpenCode la reutilice en futuras sesiones.

---
name: chatap-frontend
description: Mejora y mantiene el frontend de ChatAP con diseño institucional cuidado, accesibilidad real para personas mayores, UX clara, responsive, animaciones útiles y calidad de producción. Usar siempre que OpenCode trabaje en la interfaz, estilos, componentes, navegación, formularios, chat o paneles.
---

# ChatAP Frontend — Skill de producto, UX, accesibilidad y motion

## Misión

Llevar el frontend de ChatAP a una calidad visual y funcional excepcional sin sacrificar claridad, accesibilidad ni confianza institucional. El producto se usa para consultar trámites de la Administración Pública de Formosa; debe ser fácil para una persona mayor, una persona con poca experiencia digital o alguien que usa un teléfono, y a la vez sentirse moderno, refinado y vivo.

No perseguir “10/10” mediante efectos llamativos o reescrituras masivas. La calidad se demuestra con tareas fáciles de completar, jerarquía visual coherente, estados robustos, accesibilidad comprobable, rendimiento y ausencia de regresiones.

## Alcance y contexto del repositorio

- Trabajar en la rama `dev-felipe`, salvo que el usuario indique otra.
- Stack detectado: React 19, Vite 8, Tailwind CSS 4, React Router 7, Zustand, Axios y `pdfjs-dist`.
- La aplicación tiene landing pública, chat ciudadano, autenticación/registro/recuperación, perfil según rol y panel administrativo.
- Hay servicios que consumen API y también flujos de demo que persisten en `localStorage`. No asumir que toda la app es exclusivamente mock ni que toda integración está terminada: inspeccionar el código actual antes de cambiarlo.
- Puntos de entrada: `src/main.jsx`, `src/App.jsx`, `src/router/AppRouter.jsx`, `src/router/routes.jsx`.
- Tokens globales y utilidades: `src/index.css`.
- Landing: `src/pages/HomePage.jsx` y `src/pages/HomePage.css`.
- Chat: `src/pages/CiudadanoPage.jsx`, `src/components/ciudadano/ChatWindow.jsx`, `MessageBubble.jsx`, `QuickReplies.jsx`.
- Navegación: `src/components/common/Navbar.jsx`, `src/components/admin/AdminSidebar.jsx`.
- Avatar y reacciones: `src/components/ChatBotAvatar.jsx` y `src/bloub/`.
- Identidad visual: `DESIGN.md` del repositorio. Leerlo antes de proponer cambios de diseño.

## Precedencia de diseño

1. Requisitos explícitos del usuario y del producto.
2. `DESIGN.md` y los tokens existentes del repositorio.
3. Esta skill, en particular sus requisitos de accesibilidad, claridad y calidad.
4. Convenciones generales de diseño.

No imponer una plantilla SaaS genérica ni copiar otra marca. La identidad actual de ChatAP es “Azul de Estado”: azul institucional, navy profundo, superficies frías y temas claro/oscuro. Preservar esa identidad y refinarla. No cambiar toda la paleta, tipografía, radios o arquitectura sin inspeccionar primero el sistema existente y explicar el beneficio.

## Principios no negociables

### 1. Diseñar para personas mayores sin infantilizar

- Usar español claro, concreto y cotidiano, preferentemente el voseo natural de Argentina cuando corresponda.
- Una acción principal evidente por pantalla o bloque. Evitar varias llamadas a la acción que compitan.
- Navegación predecible; mantener etiquetas estables y nombres reconocibles. No esconder funciones importantes detrás de iconos sin texto.
- Explicar qué pasará antes de acciones importantes; permitir cancelar, volver y corregir.
- Formularios con etiquetas visibles, ejemplos útiles, validación junto al campo y mensajes de error que indiquen cómo resolver el problema.
- Evitar temporizadores que presionen al usuario, desaparición rápida de mensajes importantes, carruseles automáticos, gestos como única forma de operar y controles que dependan de hover.
- No infantilizar con diminutivos, exceso de color, emojis decorativos o animaciones de caricatura en cada interacción.
- La guía de bienvenida debe poder omitirse, retomarse o cerrarse; no bloquear repetidamente el acceso al objetivo principal.

### 2. Legibilidad y tamaño

- Texto de lectura habitual: objetivo de 18px; nunca bajar de 16px para contenido principal de usuario. Excepciones puntuales para metadatos secundarios, que deben seguir siendo legibles y tener contraste suficiente.
- Interlineado aproximado de 1.5–1.7 para párrafos y longitud de línea cómoda (aprox. 45–80 caracteres).
- Encabezados con jerarquía clara; no usar texto minúsculo, mayúsculas sostenidas ni tracking amplio en contenido de lectura.
- Controles táctiles de al menos 44×44 CSS px como objetivo de producto; preferir 48×48 para acciones primarias y móviles.
- No depender solo del color para mostrar errores, estado activo, éxito o advertencias.
- Comprobar contraste WCAG 2.2 AA como mínimo: 4.5:1 para texto normal y 3:1 para texto grande y componentes gráficos relevantes.
- Permitir zoom de navegador al 200% y reflow en ancho de 320 CSS px sin pérdida de funciones ni scroll horizontal innecesario.

### 3. Accesibilidad desde el diseño

- Usar HTML semántico, un `h1` principal por página, encabezados ordenados, landmarks y botones/enlaces nativos.
- Todos los inputs tienen una etiqueta visible asociada; placeholders nunca reemplazan etiquetas.
- Cada botón de solo icono tiene nombre accesible. Los SVG decorativos llevan `aria-hidden="true"`.
- Mantener foco visible de alto contraste; no quitar outlines sin reemplazo.
- Orden de tabulación lógico; toda función debe poder usarse con teclado.
- Modales: nombre accesible, foco inicial adecuado, foco contenido, cierre con Escape cuando proceda, restauración del foco al cerrar y fondo no interactivo mientras están abiertos.
- Mensajes de error y resultados asíncronos se comunican a tecnologías de asistencia con `aria-live`/`role="status"` cuando sea apropiado, sin leer toda la pantalla repetidamente.
- Para el chat, distinguir claramente mensajes del ciudadano y del asistente; anunciar nuevas respuestas sin mover el foco de forma inesperada. No forzar scroll si la persona está leyendo mensajes anteriores.
- Evitar `title` como único mecanismo de explicación.
- Probar estados de teclado y lector de pantalla cuando sea posible. No afirmar conformidad WCAG completa sin auditoría.

### 4. Movimiento con propósito

Las animaciones deben comunicar causalidad, estado, continuidad o feedback. Deben mejorar la comprensión, no competir con el contenido.

- Preferir transiciones breves y suaves, normalmente 150–250ms para controles y 200–350ms para entradas de contenido.
- Animar principalmente `transform` y `opacity`; evitar animar propiedades que causen reflow continuo.
- Usar movimiento más lento y discreto en onboarding; el usuario debe poder leer a su ritmo.
- Respetar siempre `prefers-reduced-motion: reduce`: eliminar movimiento no esencial, partículas, seguimiento del cursor, parallax, loops y transiciones de ruta que no sean necesarias. El contenido y el estado deben seguir funcionando.
- Evitar autoplay persistente, parpadeos, rebotes repetidos, elementos que persiguen el cursor y efectos globales en cada clic.
- El avatar es un elemento distintivo de ChatAP: conservarlo, pero reducir sus reacciones cuando distraigan, haya movimiento reducido o el usuario esté leyendo/escribiendo.
- Toda animación debe tener limpieza correcta de timers, listeners, observers y `requestAnimationFrame`; no dejar bucles activos si no hay trabajo.
- No usar animación para ocultar latencia ni demorar acciones reales. La UI debe responder de inmediato y mostrar estados de carga solo cuando aporten información.

### 5. Sistema visual consistente

- Reutilizar tokens de `src/index.css`; evitar colores, sombras, radios y espaciados arbitrarios nuevos.
- Preservar temas claro y oscuro. Revisar contraste de ambos; no asumir que una clase `dark:` basta.
- Mantener un sistema de espaciado consistente basado en múltiplos de 4/8px.
- Definir patrones compartidos para botones, campos, tarjetas, alertas, estados vacíos, skeletons, modales, tablas y navegación.
- Preferir fondos tranquilos, jerarquía tipográfica fuerte, espacio en blanco y acentos azules selectivos.
- Usar iconos SVG coherentes; no usar emojis como sustituto de iconografía.
- Evitar efectos de vidrio, blur, gradientes, sombras, partículas y ornamentos por defecto. Solo conservarlos si cumplen una función y no perjudican legibilidad o rendimiento.
- No introducir fuentes externas sin revisar CSP, disponibilidad, peso y fallback. Respetar las fuentes locales y el sistema tipográfico actual salvo decisión justificada.
- No usar tablas como diseño móvil sin adaptación; no ocultar información esencial en pantallas pequeñas.

## Procedimiento obligatorio antes de cambiar código

1. Confirmar la rama actual y el estado de Git; nunca sobrescribir trabajo sin guardar.
2. Leer `DESIGN.md`, `package.json`, `src/index.css` y los componentes relevantes.
3. Ejecutar los comandos existentes para obtener línea base:
   - `npm run lint`
   - `npm run build`
   Registrar errores previos por separado de los nuevos.
4. Identificar el flujo de usuario, el problema concreto, la causa y los archivos mínimos que deben cambiar.
5. Revisar los patrones existentes antes de crear un componente, hook, token o dependencia nuevos.
6. Si hay herramientas de navegador disponibles, probar antes y después las vistas desktop y mobile. Si no se dispone de navegador, no afirmar que se verificó visualmente; dejar constancia de lo que sí se probó.
7. Entregar cambios en iteraciones pequeñas y comprobables. No reescribir páginas completas ni reemplazar la arquitectura solo por preferencia estética.

## Orden recomendado de trabajo

Priorizar en este orden, salvo que los hallazgos reales cambien la prioridad:

1. **Usabilidad crítica:** navegación comprensible, formularios, chat y tareas ciudadanas principales.
2. **Accesibilidad:** tamaños, contraste, teclado, foco, labels, lectores de pantalla, zoom y movimiento reducido.
3. **Responsive y robustez:** móvil, tablet, desktop, pantallas pequeñas, estados de carga/error/vacío y textos largos.
4. **Consistencia visual:** tokens, tipografía, espaciado, componentes reutilizables y temas.
5. **Motion y pulido:** microinteracciones, transiciones de página, avatar y detalles decorativos.
6. **Optimización:** bundle, renders, imágenes, listeners, observers y animaciones continuas.

## Checklist por superficie

### Landing (`HomePage`)

- El primer pantallazo explica qué es ChatAP, para quién sirve y cuál es la acción principal.
- CTA principal claro y suficientemente grande; la consulta puede iniciarse sin registrarse si así lo permite el flujo actual.
- Las promesas de la página deben coincidir con la implementación real. No afirmar “en vivo”, “verificado”, “menos de 3 segundos”, “oficial” o integraciones existentes sin confirmarlo en código/producto.
- Evitar scroll decorativo excesivo y secciones repetitivas. Cada sección debe responder una pregunta del ciudadano.
- Logo, navegación, contraste y CTA comprobados en mobile.
- FAQ accesible por teclado y con estado expandido comunicado.
- Animaciones de scroll no deben esconder contenido si JS falla ni afectar reduced-motion.

### Chat ciudadano

- El campo para escribir tiene etiqueta/instrucción visible, tamaño de texto legible y botón de envío claramente identificable.
- El botón de micrófono explica su función y su estado; el dictado no es obligatorio y existe alternativa por texto.
- Enviar con Enter funciona de manera predecible; permitir saltos de línea si el diseño lo requiere y explicar los atajos.
- Evitar que el texto se envíe dos veces; deshabilitar o controlar el envío mientras una petición está en curso cuando corresponda.
- Mostrar “pensando”, error de red, límite de consultas, reintento y respuesta vacía con mensajes claros y sin perder la pregunta.
- Los chips de preguntas sugeridas deben ser descriptivos, grandes y no ser la única vía para iniciar.
- El scroll automático solo sigue el final si el usuario ya estaba cerca del final; no arrebatar el scroll cuando está leyendo arriba.
- El efecto de tipeo no debe retrasar demasiado respuestas largas ni dificultar el uso de lector de pantalla. Considerar mostrar el texto completo a tecnologías de asistencia.
- Descargas y enlaces deben indicar qué se descarga/abre y funcionar con teclado.
- No afirmar que un trámite fue enviado, registrado o consultado realmente si la respuesta procede de datos de demo.

### Login, registro y recuperación

- Distinguir claramente iniciar sesión, crear cuenta, tipo de usuario y recuperación.
- Labels visibles, `autocomplete` correcto, errores por campo y foco en el primer error cuando sea seguro.
- Mostrar/ocultar contraseña con botón accesible y estado entendible.
- No borrar valores válidos después de errores evitables.
- Mensajes de éxito/error persistentes el tiempo suficiente y accesibles.
- Aclarar cuándo una acción es demo, está pendiente de backend o requiere aprobación. No diseñar la UI como si una función estuviera operativa cuando no lo está.

### Perfil y panel administrativo

- La navegación indica con claridad sección actual, ubicación y acción principal.
- Sidebar colapsada no debe dejar iconos ambiguos sin nombres accesibles; en móvil, convertirla en patrón usable con teclado.
- Tablas con encabezados, etiquetas, acciones visibles y comportamiento adaptable. Ofrecer búsqueda/filtros solo cuando ayudan a la tarea.
- Estados de vacío con explicación y siguiente paso; errores con recuperación.
- Confirmar acciones destructivas; explicar el impacto y ofrecer cancelación.
- No ocultar permisos o estados solo mediante color.
- Preservar las diferencias de rol y no debilitar controles de acceso existentes al tocar la UI.

## Reglas de implementación

- Mantener React idiomático y la estructura existente.
- Reutilizar componentes y tokens cuando corresponda; crear abstracciones solo cuando reduzcan duplicación real.
- Evitar `!important`, selectores globales frágiles, estilos inline repetidos y overrides en cascada sin documentación.
- No añadir librerías para resolver un efecto simple si CSS o herramientas existentes alcanzan.
- No modificar lógica de negocio, contratos de API, autenticación, permisos, datos mock ni persistencia por una tarea puramente visual.
- No tocar secretos, configuración de despliegue o variables de entorno salvo petición explícita.
- Limpiar efectos React y contemplar desmontaje, navegación rápida, doble render de StrictMode y errores de red.
- No añadir textos falsos de confianza social, métricas inventadas, testimonios ficticios ni insignias oficiales sin fuente.
- Si un requisito necesita backend o datos oficiales que no existen, dejarlo identificado; no simular éxito.

## Verificación y definición de terminado

Antes de considerar una tarea terminada:

- `npm run lint` y `npm run build` pasan, o los errores preexistentes quedan documentados con claridad.
- Se probaron los flujos afectados con mouse, teclado y viewport móvil; cuando sea posible, también lector de pantalla y zoom 200%.
- Se verificaron temas claro y oscuro.
- Se comprobó `prefers-reduced-motion`.
- No hay nuevos errores de consola, warnings de React, listeners/timers huérfanos ni saltos visuales evidentes.
- Todos los botones y enlaces hacen lo que su texto promete.
- Errores, carga, vacío, éxito y contenido largo tienen estados coherentes.
- No se rompieron rutas, roles, chat, descargas ni formularios ajenos al cambio.
- Se revisó el diff y se quitaron código muerto, logs y estilos temporales.
- El resumen final lista archivos tocados, decisiones importantes, pruebas ejecutadas, limitaciones conocidas y lo que queda pendiente.

## Criterio final

La mejor interfaz no es la que más se mueve ni la que parece más futurista. Es aquella en la que una persona entiende rápidamente dónde está, qué puede hacer, qué ocurrirá al tocar un botón y cómo recuperarse si se equivoca. ChatAP debe combinar esa seguridad con una identidad institucional moderna, cálida, elegante y técnicamente sólida.


---

# PRIMER MENSAJE PARA EJECUTAR

Leé este documento completo y aplicá la skill `chatap-frontend`. Primero inspeccioná el repositorio, la rama y el estado de Git; corré las verificaciones de línea base. Después implementá las mejoras en los lotes A–F en el orden indicado, con autonomía para decisiones de bajo riesgo. No te quedes solo en el diagnóstico ni esperes aprobación entre lotes. Preservá los cambios preexistentes y los contratos funcionales. Corré lint/build/tests después de cada lote y al final, corregí las regresiones que introduzcas y entregá el informe final solicitado. Si una integración o requisito no está demostrado por el código, no lo inventes: mantené el comportamiento real y documentá la limitación.
