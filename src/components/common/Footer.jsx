import { Link } from "react-router-dom";

const QUICK = [
  { label: "Empezar",   to: "/chat" },
  { label: "Contacto",  to: "/contacto" },
  { label: "Mi perfil", to: "/perfil" },
  { label: "Ingresar",  to: "/login" },
];

export default function Footer() {
  return (
    <footer className="chatap-footer">
      <div className="ed-max section-bleed py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          {/* Brand + tagline */}
          <div className="max-w-sm">
            <Link to="/" aria-label="ChatAP — inicio" className="no-underline">
              <span className="flex items-center gap-2.5">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-deep text-sm font-bold text-white"
                  aria-hidden="true"
                >
                  AP
                </span>
                <span className="text-[17px] font-semibold tracking-tight text-ink">ChatAP</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              La Administración Pública respondiendo a cada persona, en lenguaje
              claro y a toda hora.
            </p>
          </div>

          {/* Quick nav */}
          <nav aria-label="Enlaces rápidos">
            <p className="m-0 text-sm font-semibold text-ink">Accesos</p>
            <ul className="m-0 mt-3 list-none space-y-2.5 p-0">
              {QUICK.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-sm text-muted no-underline transition-colors hover:text-brand-deep"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0 text-sm text-muted">
            © {new Date().getFullYear()} Gobierno de la Provincia de Formosa ·
            Subsecretaría de Recursos Humanos
          </p>
          <p className="m-0 text-sm text-faint">ChatAP v1.0 · información oficial</p>
        </div>
      </div>
    </footer>
  );
}