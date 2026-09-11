import { Link } from "react-router-dom";

const QUICK = [
  { label: "Chatear",   to: "/chat" },
  { label: "Soporte",   to: "/contacto" },
  { label: "Mi perfil", to: "/perfil" },
  { label: "Ingresar",  to: "/login" },
];

const INFO = [
  { label: "Inicio",     to: "/" },
  { label: "Asistente",  to: "/chat" },
  { label: "Contacto",   to: "/contacto" },
  { label: "Mi perfil",  to: "/perfil" },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-paper border-t border-line/50">
      <div className="ed-max section-bleed relative z-10 py-16 md:py-24">

        {/* Top grid */}
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-[1fr_auto_auto] sm:items-start">
          {/* Brand + copy */}
          <div className="max-w-xs">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center bg-ink text-paper font-extrabold text-xs font-neue" aria-hidden="true">
                AP
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-sm font-extrabold tracking-tight text-ink uppercase font-neue">
                  ChatAP<span className="text-brand">.</span>
                </span>
                <span className="mt-1 text-[8px] font-mono font-semibold uppercase tracking-[0.24em] text-faint">
                  Recursos Humanos · Formosa
                </span>
              </span>
            </div>
            <p className="mt-5 m-0 text-sm leading-relaxed text-muted font-neue-text">
              La Administración Pública respondiendo a cada persona, en lenguaje
              claro y a toda hora. Sin filas, sin horarios.
            </p>
          </div>

          {/* Nav — Secciones */}
          <nav aria-label="Secciones">
            <p className="m-0 mb-4 text-[9px] font-mono font-semibold uppercase tracking-[0.24em] text-faint">
              Secciones
            </p>
            <ul className="m-0 p-0 list-none flex flex-col gap-2.5">
              {INFO.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-sm text-muted hover:text-ink transition-colors no-underline font-neue-text"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Nav — Accesos */}
          <nav aria-label="Accesos rápidos">
            <p className="m-0 mb-4 text-[9px] font-mono font-semibold uppercase tracking-[0.24em] text-faint">
              Accesos
            </p>
            <ul className="m-0 p-0 list-none flex flex-col gap-2.5">
              {QUICK.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-sm text-muted hover:text-ink transition-colors no-underline font-neue-text"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col gap-3 border-t border-line/50 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="m-0 text-xs text-faint font-neue-text">
            &copy; {new Date().getFullYear()} Gobierno de la Provincia de Formosa ·
            Subsecretaría de Recursos Humanos
          </p>
          <p className="m-0 text-[9px] font-mono uppercase tracking-[0.24em] text-faint">
            info :: oficial · ChatAP v1.0
          </p>
        </div>
      </div>

      {/* Giant ghost watermark — overflow hidden prevents horizontal scroll */}
      <div className="overflow-hidden" aria-hidden="true">
        <p
          className="pointer-events-none select-none relative -bottom-[0.15em] left-0 right-0 m-0 text-center font-neue font-black leading-none tracking-[-0.06em] text-[17vw] text-ink/[0.06]"
        >
          CHATAP
        </p>
      </div>
    </footer>
  );
}
