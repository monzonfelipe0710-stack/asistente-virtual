import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-paper border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 no-underline">
          <div className="w-9 h-9 bg-ink flex items-center justify-center">
            <span className="text-paper font-bold text-sm tracking-wide">AP</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-wider text-ink uppercase">
              ChatAP
            </span>
            <span className="text-[10px] text-muted uppercase tracking-wide mt-0.5">
              Subsec. de Recursos Humanos
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            to="/admin"
            className="text-xs font-semibold uppercase tracking-wide text-ink hover:text-brand transition-colors no-underline"
          >
            Acceso Interno
          </Link>
          <a
            href="https://miportal.formosa.gob.ar"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 border border-ink text-ink text-xs font-semibold uppercase tracking-wide hover:bg-ink hover:text-paper transition-colors no-underline"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            MiPortal
          </a>
        </div>
      </div>
    </nav>
  );
}
