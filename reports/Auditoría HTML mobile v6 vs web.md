# ChatAP_Mobile_v6.dc.html vs web `dev-felipe`: diferencias medidas

**Alcance.** Compara los valores que el HTML declara (paleta en las líneas 764-769, tamaños, pesos, radios, sombras) contra `reports/Especificación visual frontend Felipe.md`. No se renderizó: falta `support.js`, que el HTML carga con `<script src="./support.js">`, así que nada de lo visual está verificado a ojo. Todo sale de leer el código del archivo. No se modificó el HTML ni se subió nada.

## 1. Lo que coincide con la web

| Aspecto | Web | HTML v6 |
|---|---|---|
| Tema inicial | oscuro (`index.html:25-40`) | `theme: dark` por defecto |
| Azul de acento claro | `#2F6BFF` | `accent #2F6BFF` |
| Azul de acento oscuro | `#4D7DFF` | `accent #4D7DFF` |
| Azul profundo (botón primario claro) | `#1C44B6` | `primary #1C44B6` |
| Hover del primario (claro) | — | `#17399A` |
| Foco de teclado | anillo azul | `outline 2px #2F6BFF` y halo `0 0 0 4px` en `--ring` |
| Botones y controles en píldora | `9999px` | `999px` (13 usos), junto a 16 px (31), 12 px (27), 8 px (27), 20 px (8) |
| Tarjetas | 20 px | `border-radius:20px` (8 usos) |
| Sombras | casi ninguna | solo anillo de foco y 2 sombras puntuales |
| Área táctil | botones web de 32-36 px (defecto) | alturas de 44 px (31 usos), 48 (14), 52 (13), 56 (3) |
| Avatar del bot: ojos | verticales, color inverso al cuerpo | `bot` / `boteye` invertidos entre temas |

## 2. Lo que difiere de la web

| Aspecto | Web (informe) | HTML v6 | Impacto |
|---|---|---|---|
| Familia tipográfica | PP Neue Montreal + Text | **Geist** 400/500/600 y **Geist Mono** 500 | Cambia el aspecto de todo el texto |
| Pesos | 400, 500, 600, 700, 900 | solo **400, 500, 600** | No existe el Black 900 de los títulos de la web |
| MAYÚSCULAS en botones | sí: 12 px, 700, tracking 0.1em | **0** usos de `text-transform:uppercase` | Los botones se ven distintos |
| Tracking | 0.1em en botones; 0.16-0.24em en micro-etiquetas | `.08em` (10 usos), `.06em` (2); el resto negativo | Etiquetas más apretadas |
| Tamaños de texto | mensajes 14.4, botones 12, micro-etiquetas 9-10 | 13 px (96 usos), 14 (50), 15 (44), 16 (38) | Todo entre 13 y 16; nada de 9-12 salvo 5 usos de 12 |
| Fondo oscuro | paper `#070E20` (navy) | canvas **`#000000`** | Negro puro en vez de azul marino |
| Superficies oscuras | mist `#0D1730`, soft `#132247` | surface `#141414`, surface2 `#1F1F1F`, bubble `#262626` | Grises neutros en vez de navy |
| Bordes oscuros | ink `#EAF0FA` al 12% | `#2A2A2A` | Gris sólido |
| Texto oscuro | ink `#EAF0FA` | `#EDEDED`; secundario `#A1A1A1`, terciario `#808080` | Sin tinte azul |
| Fondo claro | paper `#F0F4F9` | canvas **`#FFFFFF`** | Blanco puro en vez de azul muy claro |
| Superficies claras | mist `#E2EAF4`, soft `#D5E2F1` | surface `#F4F5F7`, surface2 `#EAECF0`, bubble `#F0F1F3` | Grises neutros |
| Texto claro | ink `#0F1730`; muted `#4A5578` | `#0E1116`; `#596070`, `#666D7A` | Casi igual, sin tinte azul |
| Primario oscuro | `#2F55C0` con texto `#070E20` (contraste 2.91) | `#3A6AE0` con texto `#FFFFFF`; hover `#3260D0` | Cambio deliberado: corrige el contraste |
| Avatar del bot | cuerpo `#0F1730` claro / `#EAF0FA` oscuro | `#121A3A` claro / `#FFFFFF` oscuro | Cuerpo oscuro y blanco puro en vez del tono de la web |
| Estados | ok `#18bc42`, warn `#efc21e`, bad `#d82f2f` iguales en ambos temas | ok `#16A34A` / `#4ADE80`, danger `#D93636` / `#FF6B6B` | Distintos y con variante por tema |

## 3. Sobre los archivos "Organic"

El HTML tiene **0 referencias** a Organic, Caprasimo o Figtree, y no enlaza `styles.css`. Organic es otra identidad:

| | Organic | ChatAP web | HTML v6 |
|---|---|---|---|
| Fondo | crema `#f5ead8` | `#070E20` / `#F0F4F9` | `#000000` / `#FFFFFF` |
| Acento | terracota `#c67139` | azul `#2F6BFF` / `#4D7DFF` | azul `#2F6BFF` / `#4D7DFF` |
| Títulos | Caprasimo | PP Neue Montreal | Geist |
| Cuerpo | Figtree | PP Neue Montreal Text | Geist |
| Botones | píldora, 14 px, fuente de títulos | píldora, 12 px, 700, mayúsculas | píldora, 13-16 px, 500-600 |

Si Organic se aplicara al HTML, la regla `.oxlintrc` adjunta (`_adherence.oxlintrc.json`) marcaría como advertencia los hex, los valores en `px` y las fuentes distintas de Caprasimo y Figtree que aparezcan como literales de JavaScript, como los de la paleta `P` (líneas 764-769). No se ejecutó el linter, así que no hay conteo. Esa regla es de Organic, no de ChatAP.

`thumbnail.html` no llegó en los adjuntos; solo se pegó el texto del readme.

## 4. Decisiones pendientes (cambian el resultado)

1. **¿Réplica exacta o reinterpretación?** El encabezado del HTML dice "Auditoría final y azul ChatAP" y corrige 13 fallos propios; la tabla 2 muestra que es una reinterpretación (neutros y Geist), no una réplica de la web. Para igualar la web habría que cambiar paleta, fuente y botones. Si las diferencias son intencionales, hay que dejarlas anotadas.
2. **¿Geist o PP Neue Montreal?** Geist evita el problema de licencia del informe. Si se queda, el informe debe documentar la sustitución.
3. **¿Organic se usa o no?** Con los datos actuales no hay forma de saberlo: contradice el azul de ChatAP.
