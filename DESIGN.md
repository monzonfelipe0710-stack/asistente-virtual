# DESIGN.md — ChatAP

> Google Stitch format. The single source of truth for ChatAP's visual system,
> read by DESIGN.md-aware agents and tools.

## Overview

ChatAP is a governmental virtual assistant with two surfaces: a citizen-facing
chatbot (Persuade + Experience) and an internal admin panel (Operate). The
system is built on a deep-navy, institutional-blue token system with dark/light
theming. The signature element is a procedurally-animated blob avatar driven by
the `--bot-body` / `--bot-eye` CSS variables.

## Identity — "Azul de Estado"

Unique identity built on three chromatic ideas that distinguish ChatAP from any
generic SaaS blue:

1. **Navy chrome (`#070e20`‑`#0a1124`)** — the dominant surface. Panels,
   terminal windows, the navbar pill, admin sidebar and dark sections run on
   deep ocean-navy instead of near-black grey, giving the whole product a
   state-rigor feel ("azul oscuro").
2. **Key accent (`--color-brand`)** — a single charged electrical blue
   (`#2f6bff` light / `#4d7dff` dark) used *sparingly*: CTAs, active nav,
   caret, focus rings, section numbers and the avatar glow. Nothing else is
   colored.
3. **Cool paper (`--color-paper #edf1f9`)** — the light theme is a blue-grey
   off-white (not warm cream) so every surface reads cool, calm and official.

The orange "specimen" identity was retired. The product now runs on a
**friendly & rounded** expression of the navy system: rounded corners
(`--radius-control: 10px`, `--radius-card: 14px`), soft elevation shadows,
calm display typography (no oversized editorial type), and plain-language
section copy. Decorative layers (terminal windows, dot grids, orbit rings,
marquees, watermark numerals, word-by-word reveals) were removed from the
landing; the blob avatar remains the signature element. Mono micro-labels and
wide uppercase tracking were softened across the app.

## Colors

### Brand — Azul de Estado
- Primary `#2F6BFF` (light) / `#4D7DFF` (dark)
- Primary-dark `#2657D8` / `#3A68F2`
- Primary-deep `#1C44B6` / `#2A55D6`
- Primary-light `#E1E9FF` / `#13264E`
- Primary-lighter `#F2F6FF` / `#0C1A38`

### Surface
- Paper `#EDF1F9` (light) / `#0A1124` (dark) — main background
- Mist `#E3E9F6` / `#111B34` — subtle surface / hover
- Soft `#D8E1F2` / `#0C1530` — tertiary surface
- Line `rgba(15,23,48,.14)` / `rgba(234,240,250,.14)` — borders / dividers

### Text
- Ink `#0F1730` / `#EAF0FA` — primary text
- Muted `#4A5676` / `#A2AEC7` — secondary text
- Faint `#8490AE` / `#6A7590` — tertiary / disabled text

### Chrome (bands, navbar, terminal, sidebar)
- Band `#070E20` (deepest navy) / Band-fg `#EAF0FA`
- Terminal header `#050B1A`
- Sidebar bg `#070E20`, hover `#101B35`, active `var(--color-brand-deep)`

### Semantic
- Ok (success) `#1FA45C` / `#2FBF71`
- Warn `#E29C2C` / `#EEB253`
- Bad (danger) `#E24A4F` / `#F26067`
- Info `#2F6BFF` / `#4D7DFF`

### Sidebar (chrome)
- Background `#070E20`
- Border `rgba(234,240,250,0.12)`
- Hover `#101B35`
- Text `#98A3BE`
- Text-hover `#EDF2FC`
- Section-text `#5B667F`
- Active-bg `var(--color-brand-deep)`
- Active-text `#FFFFFF`

### Bot avatar
- Body `#0F1730` (light) / `#EAF0FA` (dark)
- Eye `#EDF1F9` (light) / `#0A1124` (dark)

## Typography

- **Family:** Tailwind v4 default system stack — `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, ...`. No webfont is loaded (CSP blocks external fonts).
- **Base:** `body { @apply font-sans text-ink bg-paper antialiased; }`

### Sizes (Tailwind scale)
- `text-[9px]` / `text-[10px]` / `text-[11px]` — micro labels, badges, meta
- `text-xs` (12px) — dense UI, table meta, descriptions
- `text-sm` (14px) — default body, inputs, buttons
- `text-base` (16px) — body emphasis
- `text-lg` (18px) — card titles / section
- `text-xl` (20px) — page subtitles
- `text-2xl` (24px) — stat values, page headings
- `text-3xl` (30px) — hero stat values

### Weight / case
- Micro labels: `font-semibold uppercase tracking-widest` (section/table headers; global tracking softened to 0.05em)
- Buttons / CTAs: `font-semibold`
- Numeric/stat values: `font-bold`

## Spacing

Tailwind v4 default scale. Common rhythmic units:
- `px-3 py-2.5` — inputs & buttons (comfortable)
- `px-4 py-3` — table cells / card padding
- `p-4` / `p-5` — card body
- `gap-2` / `gap-3` / `gap-4` — component gaps
- `space-y-1` / `space-y-2` — stacked lists / nav groups
- `py-4` — header/section vertical rhythm

## Elevation / Shadows

- `shadow-sm` — default cards
- `shadow-md` — cards on hover (via `.card-interactive`)
- `shadow-lg` / `shadow-xl` / `shadow-2xl` — modals, dropdowns, overlays
- Tooltip: `0 4px 12px rgba(0,0,0,0.15)`

## Radius

Friendly & rounded. Tokens coerce every `rounded-*` utility into one language:
- `--radius-sm 4px` · `--radius-md 6px` · `--radius-lg 8px` — small pills, nav
- `--radius-xl 12px` — inputs, buttons, stat icons
- `--radius-2xl 16px` — cards, modals
- `--radius-3xl 20px` — panels
- `--radius-control 10px` (inputs/segmented) · `--radius-card 14px` (cards) · `rounded-full` for pills, avatars, dots

## Components

### Button
- **Primary** — `bg-brand-deep text-paper hover:bg-brand-dark hover:-translate-y-0.5 shadow-sm hover:shadow`, `px-4 py-2.5`, `rounded-xl`, `font-semibold`, `transition-all duration-200`
- **Ghost** — `bg-transparent text-muted border border-line hover:text-ink hover:bg-mist`
- **Danger** — `bg-bad text-paper hover:opacity-90`
- All `.btn-*` use `rounded-xl` (`rounded-full` when used as pill CTAs), `font-semibold`, sentence case — no uppercase/wide-tracking labels

### Input (`input-field`)
`w-full px-4 py-2.5 text-sm bg-paper border border-line rounded-xl outline-none placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand/15`

### Card
- `.card` — `bg-paper border border-line rounded-2xl shadow-sm`
- `.card-interactive` — adds `hover:-translate-y-0.5 hover:shadow-md`
- `.card-border` — `border border-line rounded-2xl` (no fill/shadow)

### Badge / StatusPill
- Base: `inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full`
- Semantics: Ingresado=info, En proceso=warn, Observado=bad, Finalizado=ok (with `bg-<tone>/10 text-<tone>`)
- Live states use `.dot-ping` on the leading dot

### StatCard
- `p-5`, icon tile `w-11 h-11 rounded-xl`, value `text-3xl font-bold` with `CountUp` animation
- Tones via `bg-<tone>/10 text-<tone>`

### Table
- Header: `bg-mist text-xs uppercase tracking-wider`, sortable via `.sort-header`
- Rows: `divide-y divide-line`, hover `hover:bg-mist`, new rows flash via `.row-new`

### Sidebar
- Collapsible rail: `width: var(--sidebar-width, 272px)` ↔ `var(--sidebar-collapsed-width, 64px)`, transition `cubic-bezier(0.25,0.1,0.25,1)`
- Active item: `bg var(--sidebar-active-bg)` + 3px white left indicator bar
- Collapsed items show `sidebar-tooltip` on hover

### Modal
- Overlay `bg-black/30 backdrop-blur-sm`
- Panel `.card` with `animate-scale-in` / `animate-scale-out` (exit 220ms)

### Toast
- Position `fixed bottom-4 right-4 z-50`, auto-dismiss 3500ms
- Types success/error/info/warning

## Motion

### Easing
- **Preferred:** `cubic-bezier(0.22, 1, 0.36, 1)` (expressive ease-out) — used by counter, bar-fill, bounce-in
- **Utility / structural:** `cubic-bezier(0.25, 0.1, 0.25, 1)` (sidebar expand/collapse)
- **No bounce/elastic** for UI chrome; only the bot avatar's playful `rx-bounce` etc.

### Keyframe utilities
- `.animate-fade-up`, `.animate-fade-in`, `.animate-scale-in/out`, `.animate-slide-up/down`
- `.animate-page-enter` (page load), `.animate-list-item`, `.stagger-children` (delays 0.04–0.32s)
- `.animate-shimmer` (skeleton, 1.4s), `.animate-pulse-soft`, `.animate-pulse-dot`, `.dot-ping`
- `.animate-counter`, `.bar-fill-animate` (`--bar-target` for width)
- `.animate-sidebar-expand-text` / `.animate-sidebar-collapse-text`
- `.animate-theme-transition` (theme switch fade)
- Mic: `.mic-eq` (equalizer bars, 0.9s, 0.15s stagger), `.mic-ripple`
- Avatar: `.animate-speak`, `.rx-tilt/bounce/squash/stretch`

### Timing conventions
- Micro-interactions 150–250ms; page/list entries 300–500ms; skeleton 1.4s loop
- Respect `prefers-reduced-motion` via `useReducedMotion()` / `matchMedia`

## Do's & Don'ts

### Do
- Use semantic tokens (`bg-paper`, `text-ink`, `border-line`, `bg-brand/10 text-brand`) — they adapt to dark mode automatically.
- Use `.btn-primary` / `.btn-ghost` / `.btn-danger` and `.input-field` for consistency.
- Keep the blob avatar as the signature element; let it lead the citizen experience.
- Use `CountUp` for stats, `.stagger-children` for card grids.
- Keep tables scannable: uppercase micro headers, divide-y rows, hover states.
- Respect author role gating for admin nav (`can(perm)`).

### Don't
- Don't use raw Tailwind default palette colors (`red-500`, `amber-500`, `blue-50`, `emerald-*`, `purple-*`) for semantics — use the semantic tokens (`ok/warn/bad/info`).
- Don't mix flat "legacy" square buttons with modern rounded `.btn-*` on the same page.
- Don't introduce bounce/elastic easing into chrome transitions.
- Don't invent classes not defined in `index.css` (`animate-slide-right`, `stagger-1`…`stagger-6` are undefined; the real one is `.stagger-children`).
- Don't use bare `#` placeholder links (Footer).
- Don't add webfonts unless CSP `font-src` is relaxed.

## Sidebar tokens (for reference)
- `--sidebar-width: 272px`, `--sidebar-collapsed-width: 64px`
