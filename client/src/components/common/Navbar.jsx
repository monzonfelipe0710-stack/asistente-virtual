import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 no-underline group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center shadow-sm transition-transform duration-200 group-hover:scale-105">
              <span className="text-white font-bold text-sm">AP</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-primary leading-tight tracking-tight">
                ChatAP
              </span>
              <span className="text-[10px] text-slate-400 leading-tight font-medium">
                Subsec. de Recursos Humanos
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/contacto"
              className="text-xs font-medium text-slate-500 hover:text-primary transition-colors no-underline px-2 py-1"
            >
              Contacto
            </Link>
            <span className="text-slate-200 text-xs">|</span>
            <Link
              to="/admin"
              className="text-xs font-medium text-slate-500 hover:text-primary transition-colors no-underline px-2 py-1"
            >
              Acceso Interno
            </Link>
            <div className="h-5 w-px bg-slate-200 mx-1" />
            <a
              href="https://www.formosa.gob.ar/miportal"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-primary to-primary-light text-white text-xs font-medium rounded-lg hover:from-primary-light hover:to-primary-lighter transition-all duration-200 shadow-sm hover:shadow-md no-underline"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              MiPortal
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
