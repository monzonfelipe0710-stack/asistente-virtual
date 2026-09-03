# DESIGN.md — ChatAP

> Google Stitch format. The single source of truth for ChatAP's visual system,
> read by DESIGN.md-aware agents and tools.

## Overview

ChatAP is a governmental virtual assistant with two surfaces: a citizen-facing
chatbot (Persuade + Experience) and an internal admin panel (Operate). The
system is built on a calm, blue-branded token system with dark/light theming.
The signature element is a procedurally-animated blob avatar driven by the
`--bot-body` / `--bot-eye` CSS variables.

## Colors

### Brand — likely (blue, governmental)
- Primary `#007BC6` (light) / `#38A8E0` (dark)
- Primary-dark `#0071AE` / `#2A93C9`
- Primary-deep `#005A92` / `#1F7FB8`
- Primary-light `#E6F2FA` / `#10212E`
- Primary-lighter `#F2F8FC` / `#0C1922`

### Surface
- Paper `#FFFFFF` (light) / `#0B0E14` (dark) — main background
- Mist `#F5F5F5` / `#14181F` — subtle surface / hover
- Soft `#FAFAFA` / `#0F131A` — tertiary surface
- Line `#E1E1E1` / `#232A35` — borders / dividers

### Text
- Ink `#222222` / `#E7E9EE` — primary text
- Muted `#555555` / `#9AA6B6` — secondary text
- Faint `#777777` / `#6B7480` — tertiary / disabled text

### Semantic
- Ok (success) `#2E7D32` / `#4CAF50`
- Warn `#B7791F` / `#D9933A`
- Bad (danger) `#C62828` / `#EF5350`
- Info `#007BC6` / `#38A8E0`

### Sidebar (chrome)
- Background `#F8F9FB` / `#0D1017`
- Border `#E4E7EC` / `#1C2030`
- Hover `#ECEDF0` / `#151A24`
- Text `#5F6368` / `#8B919E`
- Text-hover `#202124` / `#E1E3E8`
- Section-text `#9AA0A6` / `#4E5565`
- Active-bg `var(--color-brand)` 
- Active-text `#FFFFFF`

### Bot avatar
- Body `#0A0A0C` (light) / `#E7E9EE` (dark)
- Eye `#FFFFFF` (light) / `#0A0A0C` (dark)

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
- Micro labels: `font-semibold uppercase tracking-widest` (section headers, table headers)
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

- `rounded-md` (6px) — segmented controls, small pills
- `rounded-lg` (8px) — buttons, nav items, badges
- `rounded-xl` (12px) — inputs, stat icons, cards-in-lists
- `rounded-2xl` (16px) — cards, modals
- `rounded-full` — pills, avatars, dots
- Chat bubbles corner tweaks: `rounded-tl-sm` / `rounded-tr-sm`

## Components

### Button
- **Primary** — `bg-brand-deep text-paper hover:bg-brand-dark hover:-translate-y-0.5 shadow-sm hover:shadow`, `px-4 py-2.5`, `rounded-xl`, `font-semibold`, `transition-all duration-200`
- **Ghost** — `bg-transparent text-muted border border-line hover:text-ink hover:bg-mist`
- **Danger** — `bg-bad text-paper hover:opacity-90`
- **Dense/legacy** — `text-xs font-bold uppercase tracking-wide`, square corners (used in some admin grids)

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
