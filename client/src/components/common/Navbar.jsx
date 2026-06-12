import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div className="w-9 h-9 bg-blue-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AP</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-800 leading-tight">
                ChatAP
              </span>
              <span className="text-[10px] text-slate-500 leading-tight">
                Subsec. de Recursos Humanos
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              to="/admin"
              className="text-xs text-slate-600 hover:text-blue-700 transition-colors no-underline"
            >
              Acceso Interno
            </Link>
            <span className="text-xs text-slate-300">|</span>
            <a
              href="https://miportal.formosa.gob.ar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-800 text-xs rounded-md hover:bg-blue-100 transition-colors no-underline"
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
