# Direccion visual ChatAP

> Documento interno de decisiones. No contiene implementacion.
> Estado: aprobado para guiar la siguiente etapa de rediseno.

## 0. Tesis visual

ChatAP no sera una landing que contiene un chat. Sera un producto conversacional con una identidad editorial continua.

La referencia aporta un lenguaje, no una apariencia para copiar:

- el espacio negativo organiza la lectura;
- la tipografia establece la jerarquia;
- la composicion cambia entre bloques;
- el scroll transforma la escena;
- el movimiento acompana una accion o una transicion;
- los elementos visuales tienen una funcion concreta.

La adaptacion a ChatAP debe sentirse institucional, contemporanea y precisa. No debe parecer un portfolio, una startup, un dashboard SaaS ni una pagina generada con bloques repetidos.

## 1. Sistema tipografico

### Decision

Mantener PP Neue Montreal y PP Neue Montreal Text como familia principal. Usar la familia display para titulos, navegacion de seccion y numeracion; usar la familia Text para lectura, conversaciones y formularios.

### Por que

La familia ya existe localmente, expresa el caracter editorial de la referencia y evita depender de una fuente externa. Su contraste entre display y text permite jerarquia sin recurrir a efectos, gradientes ni pesos excesivos.

### Reglas

- Una sola familia, dos roles.
- No mas de tres niveles visuales dentro de una pantalla.
- Titulos con presencia por escala, ancho, ritmo y espacio, no por sombras o efectos.
- Texto conversacional entre 15px y 18px, con ancho de lectura controlado.
- Microetiquetas en mono solamente para estados, metadatos y contexto tecnico.
- Evitar mayusculas en frases de lectura y CTAs conversacionales.
- Pesos permitidos: 400 para lectura, 500 para controles, 600 para titulos de bloque y 700-800 solo para display.
- Line-height: 0.88-0.98 para display, 1.05-1.18 para titulos, 1.45-1.65 para cuerpo y 1.2-1.35 para metadatos.
- Letter-spacing: entre -0.06em y -0.02em en display; 0 en lectura; 0.12em-0.18em solo en etiquetas mono.
- Un titulo no debe compartir peso, tamano y color con el texto que lo explica.

## 2. Escala tipografica

| Rol | Desktop | Mobile | Uso |
|---|---:|---:|---|
| Display principal | clamp(3.8rem, 9vw, 8rem) | clamp(3rem, 17vw, 5.4rem) | Portada y estados de seccion |
| Titulo de superficie | clamp(2.4rem, 5vw, 5rem) | clamp(2rem, 11vw, 3.6rem) | Secciones y paneles principales |
| Titulo de bloque | 1.25rem-2rem | 1.15rem-1.55rem | Servicios, procedimientos, contexto |
| Cuerpo | 1rem-1.125rem | 0.95rem-1rem | Explicacion y respuestas |
| Meta | 0.6rem-0.72rem | 0.58rem-0.68rem | Estado, fecha, rol, origen |

Los valores son rangos de composicion, no una invitacion a usar todos los tamanos en la misma pantalla.

## 3. Grid

### Decision

Usar una reticula editorial de 12 columnas en desktop, 8 en tablet y 4 en mobile. No todas las secciones deben ocupar la misma cantidad de columnas.

### Por que

La referencia obtiene identidad por alineaciones y desequilibrio controlado. Una reticula fija permite que texto, avatar, chat y contexto compartan ejes sin convertir cada contenido en una card.

### Reglas

- Desktop: max-width entre 80rem y 90rem, gutters fluidos.
- Tablet: composiciones de 8 columnas, reduciendo cruces pero manteniendo asimetria.
- Mobile: una columna principal con subgrupos de 2 columnas solo para datos compactos.
- El chat usa una columna de conversacion y una columna contextual solo en desktop amplio.
- No usar grids repetitivos de tarjetas como estructura predeterminada.

### Composicion obligatoria por superficie

- Portada: titulo alineado al eje izquierdo, avatar desplazado hacia el eje derecho y metadatos en una regla inferior. El primer viewport no debe centrar todos los elementos ni mostrar una fila de cards.
- Orientacion: encabezado en una columna estrecha y contenido explicativo en una columna mas ancha; los pasos se presentan como una secuencia vertical numerada, no como tres tarjetas equivalentes.
- Capacidades: filas o bloques de ancho desigual, con al menos una pieza dominante y una pieza secundaria. La alternancia debe crear ritmo, no simetria automatica.
- FAQ: superficie de lectura clara, lista alineada a un eje lateral y mucho espacio libre alrededor; no usar panel centrado con sombra.
- Acceso y principios: bloques divididos por reglas, con un item dominante por fila y metadatos secundarios.
- Contacto: titular grande en un eje y acciones/contacto en otro; no centrar el CTA final.

### Uso del espacio negativo

- El espacio libre debe separar niveles de lectura o preparar el cambio de composicion siguiente.
- Reservar entre 20% y 35% del area visible para espacio negativo en hero y cierres editoriales.
- No llenar un hueco con iconos, decoracion, gradientes, cards o texto auxiliar.
- En el chat, el espacio negativo se reduce deliberadamente: la prioridad es continuidad de lectura y respuesta rapida.
- En mobile, conservar al menos un margen lateral de 20px y una pausa vertical de 48px entre composiciones distintas.

## 4. Spacing

### Decision

El espacio vertical sera amplio y variable segun la funcion del bloque.

### Por que

La referencia usa el vacio como parte de la jerarquia. En ChatAP el espacio debe separar orientacion, conversacion y acciones, reduciendo ansiedad visual durante un tramite.

### Tokens conceptuales

- micro: 0.35rem-0.75rem;
- control: 0.75rem-1.25rem;
- bloque: 2rem-4rem;
- seccion: clamp(5rem, 10vw, 10rem);
- chat: 1rem-1.5rem entre mensajes relacionados;
- lectura: max-width entre 34rem y 48rem.

No compensar una mala jerarquia agregando padding indiscriminado.

## 5. Bordes

### Decision

Bordes finos, visibles y funcionales. Preferir reglas horizontales y verticales sobre contenedores completamente cerrados.

### Por que

Las lineas de la referencia estructuran la pagina sin convertir cada contenido en una caja. En ChatAP tambien deben comunicar separacion, foco, estado y pertenencia.

### Reglas

- 1px para estructura.
- 2px solo para foco visible o estado critico.
- Nada de bordes dobles ni marcos decorativos.
- En mensajes, el borde distingue origen y estado, no adorna.

## 6. Radios

### Decision

Radios pequenos y consistentes: 0-6px en estructura editorial, 6-10px en controles, circular solo para avatar, indicadores y acciones claramente circulares.

### Por que

El exceso de redondeo lleva el producto hacia un SaaS generico. ChatAP necesita calidez, pero tambien precision institucional.

No usar pills para navegacion, filtros o respuestas rapidas salvo que representen una etiqueta de estado.

## 7. Colores

### Decision

Conservar el sistema Azul de Estado, pero organizarlo por superficies y estados:

- fondo principal: navy profundo o negro editorial segun superficie;
- papel de lectura: cool paper claro;
- texto principal: ink claro u oscuro;
- texto secundario: muted;
- acento: azul institucional, usado con moderacion;
- success: verde institucional;
- warning: ambar sobrio;
- error: rojo sobrio;
- lineas: mezcla de ink con baja opacidad.

### Por que

La institucionalidad debe venir de la consistencia, no de una paleta saturada. El azul debe indicar accion o estado, nunca decorar cada bloque.

No usar gradientes como identidad principal. Se permiten cambios de superficie muy leves cuando marcan una transicion de composicion, no como ornamento.

## 8. Jerarquia

Cada pantalla tendra:

1. un elemento dominante;
2. un elemento secundario que explica o contextualiza;
3. acciones y metadatos de soporte.

### Aplicacion

- Landing: el mensaje de ChatAP domina; el avatar prueba presencia; la navegacion queda en segundo plano.
- Chat: la conversacion domina; el estado del asistente contextualiza; acciones y documentos quedan subordinados.
- Perfil: la identidad y el estado de cuenta dominan; las secciones son soporte.
- Contacto: el motivo de contacto domina; canales y formulario son rutas de resolucion.
- Admin: la tarea activa domina; sidebar y metadatos orientan sin competir.

## 9. Navegacion

### Decision

Usar variantes coherentes, no un navbar identico:

- Landing: navegacion discreta, integrada al primer bloque y con transicion de superficie.
- Chat: barra minima, identidad del asistente, nueva conversacion y perfil; sin menus editoriales que distraigan.
- Perfil: navegacion de cuenta y retorno al asistente.
- Contacto: retorno contextual, soporte y acceso.
- Admin: sidebar persistente y header operativo.

### Por que

Cada superficie tiene una tarea distinta. Una navegacion comun puede compartir tokens y reglas, pero no debe imponer el mismo peso visual en todos los contextos.

### Comportamiento por variante

- Landing: posicion inicial discreta dentro del primer bloque; al avanzar mas de 24px se fija sobre el borde superior y reduce su altura mediante `transform`, sin crear una segunda barra. Al desplazarse hacia arriba reaparece. Sus enlaces navegan entre anclas y el CTA principal lleva al chat.
- Chat: no usar navegacion editorial flotante. Mantener una barra de 56px-64px con identidad del asistente, estado textual, nueva conversacion y perfil. Debe permanecer visible mientras solo el area de mensajes hace scroll.
- Perfil: barra de retorno con una accion principal "Volver al asistente" y navegacion de cuenta secundaria. No ocultar la accion de retorno durante scroll.
- Contacto: cabecera contextual con ruta de retorno, titulo de soporte y estado de atencion. No mostrar enlaces de landing que compitan con el formulario.
- Admin: sidebar persistente de 240px-280px en desktop, rail colapsado de 64px-72px, y header operativo de 56px-64px. En mobile se convierte en drawer; nunca se superpone al contenido sin fondo de bloqueo.
- Todos los estados activos deben usar una unica senal: regla, color o peso. No combinar subrayado, pill, sombra y escala para indicar lo mismo.

## 10. Chat

### Decision

El chat sera una interfaz propia, no una seccion decorada.

Composicion desktop:

- columna principal amplia para la conversacion;
- rail contextual estrecho solo cuando haya documento, organismo, wizard o expediente activo;
- composer fijo y discreto;
- avatar integrado en el encabezado de estado y en respuestas relevantes.

Composicion mobile:

- conversacion a ancho completo;
- contexto convertido en drawer o bloque expandible;
- composer siempre accesible;
- respuestas rapidas como indice editorial de acciones, no como cards decorativas.

Los mensajes conservaran memoria, historial, wizards, voz, escritura progresiva y acciones actuales. Solo cambia la lectura visual y la ergonomia.

### Medidas y densidad

- Desktop amplio: shell del chat entre 72rem y 90rem; conversacion de 42rem-52rem; rail contextual de 18rem-22rem; separacion entre columnas de 3rem-5rem.
- Laptop: shell con padding lateral de 32px-48px; conversacion de 36rem-44rem; el rail desaparece si obliga a reducir el texto por debajo de 34rem.
- Tablet: una columna de 100%; el contexto se abre como bloque debajo de la respuesta activa.
- Mobile: padding lateral de 16px-20px; mensajes con max-width de 88%; composer de 56px minimo; el ultimo mensaje debe quedar por encima del teclado virtual.
- La densidad normal es de 1 mensaje por bloque de lectura, con 16px-24px entre mensajes distintos y 8px-12px entre un mensaje y sus acciones.

### Jerarquia del mensaje

- El texto es el elemento dominante.
- La meta "Asistente/Vos + hora" queda debajo, en mono tenue, nunca encima del texto.
- Las acciones aparecen solo cuando la respuesta las necesita y se alinean debajo sin envolver el mensaje en otra card.
- Un mensaje del usuario se diferencia por alineacion y tono de superficie, no por una burbuja saturada.
- Un mensaje del asistente puede incluir una regla lateral azul y el avatar solo en el inicio de una respuesta o cambio de estado, no en cada linea.
- El composer debe ser una linea de trabajo continua: input amplio, microfono y envio funcionales, sin panel elevado ni grupo de botones pill.
- Las respuestas rapidas deben ser texto numerado o filas de accion con descripcion breve; maximo cuatro visibles antes de expandir.

## 11. Avatar

### Decision

Separar estado funcional de reaccion visual.

```text
IDLE        asistente disponible, movimiento minimo
LISTENING   captura de voz activa, estado claro y estable
THINKING    procesa una consulta, gesto concentrado
RESPONDING  respuesta en escritura progresiva
SUCCESS     confirmacion breve al terminar correctamente
ERROR       preocupacion visual estable y accion de recuperacion
```

Las reacciones existentes pueden enriquecer un estado, pero no sustituirlo. No se elegira una reaccion al azar durante una tarea activa.

### Contrato de prioridad

1. Estado funcional activo: siempre gana y bloquea reacciones idle.
2. Error o bloqueo: conserva el estado hasta que el usuario corrija o reinicie.
3. Listening, thinking y responding: no cambian de pose por mouse, scroll ni idle.
4. Success: dura 600ms-1200ms y vuelve a idle.
5. Idle: puede usar como maximo una reaccion cada 8-12 segundos y nunca dos reacciones iguales consecutivas.

### Animacion por estado

- IDLE: respiracion o movimiento interno de baja amplitud, 0.5%-2%, ciclo de 4s-8s.
- LISTENING: ojos y contorno orientados al usuario; pulso de opacidad o escala de 1.0 a 1.04 cada 1.2s; no rebote.
- THINKING: mirada desviada o pose concentrada estable durante el procesamiento; sin aleatoriedad.
- RESPONDING: micro movimiento sincronizado con la escritura, maximo una variacion cada 700ms.
- SUCCESS: una unica confirmacion breve; escala 1.0 a 1.04 y retorno con easing de salida.
- ERROR: pose estable, contraste semantico y posibilidad de reintento; no repetir sacudidas.

### Por que

El avatar es la firma de ChatAP y tambien un indicador de sistema. Si su movimiento no comunica estado, se convierte en decoracion y reduce confianza.

## 12. Estados

Cada estado debe tener tres capas coherentes:

- visual: color, contraste o borde;
- textual: etiqueta o mensaje claro;
- avatar: expresion o pose correspondiente.

La prioridad sera:

1. error o bloqueo;
2. escucha o procesamiento;
3. respuesta;
4. exito;
5. idle.

Un estado funcional nunca sera reemplazado por una animacion de hover o una reaccion automatica.

## 13. Scroll

### Landing

El scroll debe cambiar la composicion, no solo revelar elementos:

- 0%-18% del hero: el titular permanece en su eje izquierdo; el avatar se desplaza verticalmente entre 0px y 24px y reduce su escala de 1 a 0.94; la navegacion reduce altura mediante `transform: scaleY()` u opacity, nunca mediante animacion de `height`.
- 18%-35%: el titular pierde protagonismo con opacity de 1 a 0.72; el avatar se mantiene visible hasta que el siguiente bloque cruza el 20% del viewport. No hacer zoom de pagina completa.
- Entrada de orientacion: el encabezado queda temporalmente sticky durante una altura de entre 90vh y 120vh; la columna de pasos se desplaza verticalmente a razon de una pieza por cada 22%-28% de progreso del bloque.
- Capacidades: no usar sticky. Cada fila entra desde su eje natural con `translateX` de 16px-32px y opacity; la fila dominante aparece primero y las secundarias despues, sin cascada uniforme.
- Transicion a FAQ: cambiar de superficie oscura a clara en un corte de seccion, no en un crossfade largo. La regla superior de FAQ debe coincidir con el eje de lectura de capacidades.
- FAQ: la lista permanece estatica; solo se expande el item activado. No mover toda la lista ni aplicar parallax al texto.
- Contacto: el titular se mantiene en su columna mientras el bloque de acciones aparece desde abajo con 20px-28px de desplazamiento. El CTA final no debe saltar de posicion.
- Movimiento horizontal permitido: solo filas de capacidades o una etiqueta contextual, entre 16px y 32px, una vez por entrada. No usar un carrusel ni una seccion horizontal de varias pantallas.
- Movimiento vertical permitido: avatar, encabezados sticky y entradas de contenido. No animar `top`, `left`, `width` ni `height` si puede resolverse con transform.
- Elementos que deben permanecer: el eje tipografico del hero, la regla de navegacion, el input del chat y el texto principal de una respuesta activa.
- Transiciones prohibidas: zoom continuo, parallax de alta amplitud, scroll hijacking, rebotes, rotaciones decorativas, cambios de color constantes y fade-in identico por seccion.

### Chat

No aplicar parallax al contenido conversacional. El movimiento del chat sera local: scroll interno, escritura, foco, expansion de acciones y transicion de estado.

### Por que

El movimiento de la referencia funciona como composicion. Fuera de la landing, el movimiento debe explicar una interaccion concreta.

## 14. Animaciones

### Principios

- Animar principalmente transform y opacity.
- Duracion corta para controles, media para cambios de superficie.
- Sin rebotes en chrome, inputs, navbar o panel admin.
- Sin fade-in identico en cada seccion.
- Cada animacion debe responder a entrada, salida, foco, estado o scroll.
- Usar Motion para valores ligados al scroll y CSS para transiciones simples.
- Respetar reduced motion desde el nivel de configuracion y el CSS.

### Contrato tecnico de animacion

| Elemento | Trigger | Duracion | Easing | Propiedad | Proposito |
|---|---|---:|---|---|---|
| Hero/avatar | progreso del hero | ligado a scroll | spring suave | `transform`, `opacity` | cambiar la composicion inicial |
| Navbar landing | scroll hacia abajo/arriba | 180ms-260ms | `cubic-bezier(0.22,1,0.36,1)` | `transform`, `opacity` | reducir interferencia durante lectura |
| Encabezado sticky | entrada al bloque | ligado a scroll | lineal controlado | `transform` | mantener orientacion |
| Fila de capacidad | entra al viewport una vez | 350ms-500ms | `cubic-bezier(0.22,1,0.36,1)` | `transform`, `opacity` | establecer orden de lectura |
| Mensaje nuevo | se agrega al historial | 220ms-320ms | ease-out | `transform`, `opacity` | confirmar entrada sin llamar la atencion |
| Respuesta en escritura | typing activo | tiempo real | lineal | caret/opacity | comunicar procesamiento |
| Apertura de contexto | accion del usuario | 220ms-300ms | ease-out | `transform`, `opacity` | mostrar informacion secundaria |
| Estado success/error | evento funcional | 600ms-1200ms | ease-out | pose/opacity/transform | comunicar resultado |

No implementar una animacion si no se puede nombrar su trigger, su proposito y la propiedad que cambia.

### Mapa de movimiento

| Accion | Movimiento | Razon |
|---|---|---|
| Entrar en una seccion | desplazamiento corto desde su eje | establece orden de lectura |
| Cambiar de ruta | transicion de pagina breve | conserva continuidad |
| Escribir respuesta | caret y avatar responding | comunica actividad real |
| Procesar consulta | estado thinking estable | reduce incertidumbre |
| Enviar mensaje | entrada lateral minima | distingue origen |
| Abrir contexto | expansion controlada | muestra informacion bajo demanda |
| Scroll landing | transformacion de composicion | reproduce el ritmo de la referencia |

## 15. Responsive

### Desktop

La composicion puede usar dos columnas, rails contextuales y asimetrias amplias.

### Laptop

Se reduce el vacio lateral antes que la jerarquia. El chat conserva su protagonismo y el contexto se estrecha.

### Tablet

Se mantiene la secuencia editorial, pero las columnas pasan a bloques verticales relacionados. No se fuerza la reticula desktop.

### Mobile

El producto se vuelve una columna de lectura y accion:

- hero con titular compuesto y avatar integrado;
- chat a pantalla completa;
- contexto en drawer;
- acciones de una mano;
- no hay overflow horizontal;
- no se depende de hover;
- animaciones reducidas y con menor distancia.

### Composicion por dispositivo

- Desktop (>=1280px): hero de dos ejes, chat con rail contextual opcional, navegacion horizontal discreta y bloques asimetricos.
- Laptop (1024px-1279px): hero conserva dos ejes pero reduce el espacio negativo; el rail contextual solo aparece si quedan al menos 34rem para conversar.
- Tablet (768px-1023px): hero pasa a una secuencia vertical con titulo arriba y avatar despues; landing usa una columna dominante y una columna auxiliar; chat no usa rail permanente.
- Mobile (<=767px): titulo, avatar y acciones forman una secuencia vertical; el titulo se alinea a la izquierda salvo el estado de bienvenida del chat; capacidades se convierten en filas, no cards; navbar se convierte en drawer; contexto y acciones secundarias son colapsables.
- Mobile pequeno (<=420px): reducir cantidad visible de metadatos, no el tamano del texto de lectura; mantener controles de al menos 44px; ocultar adornos de reticula y no ocultar acciones funcionales.
- En todos los tamaños: comprobar ancho de documento, foco por teclado, altura del composer con teclado virtual y que ningun texto dependa de hover.

## 16. Arquitectura incremental

No se implementara todo junto.

### Fase 1: tokens

Revisar variables, radios, bordes, superficies, tipografia y reglas de movimiento. No cambiar logica.

### Fase 2: layout y navegacion

Separar variantes de navegacion por superficie y establecer contenedores compartidos.

### Fase 3: ChatWindow

Cambiar solo composicion y clases. Mantener toda la resolucion conversacional, memoria, voz, wizard y persistencia.

### Fase 4: MessageBubble y QuickReplies

Convertir mensajes y sugerencias en unidades editoriales funcionales. Verificar teclado, foco y estados.

### Fase 5: Avatar y estados

Crear el contrato funcional de estados y conectar el controlador existente sin eliminar la infraestructura procedural.

### Fase 6: Landing y superficies secundarias

Aplicar el lenguaje ya validado a landing, perfil, contacto y autenticacion, sin copiar el mismo layout.

### Fase 7: Admin

Pulir la consola como herramienta operativa, no convertirla en una pagina editorial.

### Fase 8: QA

Despues de cada fase:

- `npm run lint`;
- `npm run build`;
- rutas y flujo funcional afectado;
- 320px, 768px y 1440px;
- overflow horizontal;
- teclado y foco;
- `prefers-reduced-motion`;
- estados de loading, empty y error.

## 17. No objetivos

No se agregaran en esta etapa:

- nuevas funcionalidades de backend;
- nuevos proveedores de IA;
- galerias fotograficas ajenas a ChatAP;
- scroll horizontal solo por estetica;
- un sistema de cards universal;
- un dashboard nuevo para ciudadanos;
- una mascota nueva;
- una reescritura del motor conversacional.

## 17.1 Antipatrones prohibidos

Aunque sean tecnicamente validos, no se aceptan:

- tres o mas cards iguales para explicar una seccion;
- una pagina completamente centrada por defecto;
- una hero con titulo grande sin funcion de orientacion;
- gradientes decorativos, blobs, ruido o glows sin relacion con un estado;
- glassmorphism o fondos translucidos como superficie principal;
- pills para navegacion, filtros, quick replies o CTAs que no sean estados;
- sombras para simular profundidad donde una regla o un cambio de superficie sea suficiente;
- iconos usados como relleno visual o antes de cada texto;
- fade-in aplicado de forma identica a todos los bloques;
- parallax en el chat o movimiento de mensajes que dificulte la lectura;
- cambio de reaccion aleatorio mientras el asistente procesa o responde;
- animaciones que cambien layout mediante `width`, `height`, `top` o `left` sin necesidad;
- scroll hijacking, carruseles automaticos o secciones horizontales sin contenido que lo justifique;
- copia literal de textos, branding, fotografias o composicion especifica de la referencia;
- un unico navbar visual para landing, chat, perfil, contacto y admin;
- esconder acciones funcionales para conservar una composicion "limpia".

## 18. Criterio de aprobacion visual

La fase se considera aprobada cuando:

- la interfaz se reconoce como ChatAP sin depender de un logo;
- el chat parece el producto y no una seccion de marketing;
- la referencia se percibe en ritmo, composicion y movimiento, no en copias literales;
- cada superficie tiene una jerarquia propia;
- no hay efectos decorativos sin funcion;
- el avatar comunica estado;
- desktop y mobile parecen composiciones deliberadas;
- el codigo conserva la logica existente y pasa las validaciones definidas.
