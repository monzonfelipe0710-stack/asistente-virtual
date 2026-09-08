import { Link } from "react-router-dom";

const QUICK = [
  { label: "Chatear", to: "/chat" },
  { label: "Soporte", to: "/contacto" },
  { label: "Mi perfil", to: "/perfil" },
  { label: "Ingresar", to: "/login" },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line">
      <div className="ed-max section-bleed relative z-10 py-16 md:py-24">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="m-0 text-[11px] font-mono uppercase tracking-[0.22em] text-faint">
              ChatAP · Asistente Virtual
            </p>
            <p className="mt-4 max-w-sm m-0 text-[15px] leading-relaxed text-muted font-neue-text">
              La Administración Pública respondiendo a cada persona, en lenguaje
              claro y a toda hora. Sin filas, sin horarios.
            </p>
          </div>

          <nav aria-label="Enlaces rápidos">
            <ul className="m-0 p-0 list-none flex flex-wrap gap-x-8 gap-y-3">
              {QUICK.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="nav-tab no-underline inline-flex"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-line/70 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="m-0 text-xs text-faint font-neue-text">
            &copy; {new Date().getFullYear()} Gobierno de la Provincia de Formosa ·
            Subsecretaría de Recursos Humanos
          </p>
          <p className="m-0 text-[10px] font-mono uppercase tracking-[0.24em] text-faint">
            info :: oficial
          </p>
        </div>
      </div>

      <p
        aria-hidden="true"
        className="pointer-events-none select-none absolute -bottom-[0.32em] left-0 right-0 m-0 text-center font-neue font-black leading-none tracking-tighter text-[17vw]"
        style={{ color: "transparent", WebkitTextStroke: "1px color-mix(in srgb, var(--color-ink) 8%, transparent)" }}
      >
        CHATAP
      </p>
    </footer>
  );
}