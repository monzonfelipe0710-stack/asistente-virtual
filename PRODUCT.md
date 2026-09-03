# ChatAP — Product Context

## Product
ChatAP ("Asistente Virtual de la Administración Pública") is a virtual assistant chatbot for the **Subsecretaría de Recursos Humanos** (Human Resources Sub-Secretariat) of the Province of **Formosa, Argentina**. It speaks Argentine Spanish.

It has two distinct surfaces in one web app:

1. **Citizen chatbot** (routes `/` and `/contacto`) — a chat window where citizens ask about trámites (procedures), documentación, licencias (leave), haberes (payroll) and other HR services. Includes a procedurally-animated "blob" bot avatar with speech recognition (`es-AR`) and typewriter responses.

2. **Admin "Acceso Interno" panel** (route `/admin`) — an internal management dashboard for civil servants with role-based permissions (Administrador / Supervisor / Agente), covering user management, Mesa de Entradas (document intake desk), knowledge-base management, SIGED integration, document library, chatbot settings, and reports/analytics.

## Platform
- Web app (Vite + React 19 + Tailwind CSS v4).
- Bilingual content in Argentine Spanish ("Consultá", "trámites", "haberes").
- Mocked data sources for all records (users, knowledge, SIGED, documents, Mesa de Entradas, activity, messages).

## Who it is for
- **General citizens** of the Province of Formosa querying public HR services (fast, simple, reassuring).
- **Internal admin staff** (Administrador, Supervisor, Agente) managing records through the Mesa de Entradas / SIGED workflow (precise, scannable, efficient).

## Mode
- **Citizen chatbot:** a blend of *Operate* (accomplish a task: find an answer) and *Experience* (the animated blob leads the interface).
- **Admin panel:** clear *Operate* mode — the visitor completes a task. Scanability and native expectations outrank expression. Brand lives in precise details.

## Positioning / voices
- **Citizen-facing:** warm, trustworthy, governmental but friendly. The assistant helps, never confuses.
- **Admin panel:** calm, work-focused, professional. No hype, no decorative excess. Data density with clear hierarchy.

## What honesty allows
- It is a virtual assistant prototype with mocked data; it answers from a curated base of HR knowledge. It does not make legal claims.
- The blob avatar is a signature piece (procedurally animated) — preserve it.

## Anti-references (what to avoid)
- Purple gradients / rainbow palettes.
- Glassmorphism heavy frosted panels (only light backdrop-blur is acceptable on the sticky header).
- "Boost your productivity" marketing copy; empty-state fluff.
- Emoji-everywhere UI, animated bouncing CTAs.
