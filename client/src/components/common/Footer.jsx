import { Link } from "react-router-dom";

const INSTITUTIONAL_LINKS = [
  { label: "Gobierno de Formosa", href: "https://www.formosa.gob.ar/" },
  { label: "Portal del Empleado", href: "https://www.formosa.gob.ar/miportal/login" },
  { label: "Instituto Politécnico Formosa", href: "https://ipf.formosa.gob.ar/" },
];

export default function Footer() {
  return (
    <footer className="relative z-10 w-full border-t border-line bg-paper">
      <div className="ed-max section-bleed grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-16 lg:py-14">
        <div className="max-w-sm">
          <Link to="/" className="inline-flex items-center gap-3 text-ink no-underline" aria-label="Ir al inicio de ChatAP">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-xs font-extrabold text-white">AP</span>
            <span className="flex flex-col leading-none">
              <span className="text-base font-extrabold uppercase tracking-tight">ChatAP<span className="text-brand">.</span></span>
              <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted">Formosa</span>
            </span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Un espacio de orientación sobre trámites y servicios de la Administración Pública de Formosa.
          </p>
        </div>

        <nav aria-label="Enlaces de ChatAP">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-ink">ChatAP</h2>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            <li><Link to="/chat" className="text-sm text-muted no-underline transition-colors hover:text-brand">Iniciar consulta</Link></li>
            <li><Link to="/contacto" className="text-sm text-muted no-underline transition-colors hover:text-brand">Soporte y contacto</Link></li>
          </ul>
        </nav>

        <nav aria-label="Enlaces institucionales">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-ink">Institucional</h2>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {INSTITUTIONAL_LINKS.map((item) => (
              <li key={item.label}>
                <a href={item.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-muted no-underline transition-colors hover:text-brand">
                  {item.label}
                  <svg className="h-3 w-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-line">
        <div className="ed-max section-bleed flex flex-col items-center justify-between gap-3 py-4 text-center sm:flex-row sm:text-left">
          <p className="m-0 text-xs leading-relaxed text-muted">
            © {new Date().getFullYear()} ChatAP · Subsecretaría de Recursos Humanos · Gobierno de Formosa.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted">
            <Link to="/terminos" className="no-underline transition-colors hover:text-ink">Términos y condiciones</Link>
            <Link to="/privacidad" className="no-underline transition-colors hover:text-ink">Privacidad</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
