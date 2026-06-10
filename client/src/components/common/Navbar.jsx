import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)] backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 no-underline">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-blue-800 via-blue-700 to-indigo-700 shadow-lg shadow-blue-200">
            <span className="text-sm font-black tracking-[0.2em] text-white">AP</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-slate-900">ChatAP</span>
            <span className="text-[11px] text-slate-500">Asistente digital · Subsecretaría de Recursos Humanos</span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100 md:inline-flex">En línea</span>
          <Link
            to="/admin"
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
          >
            Acceso interno
          </Link>
          <a
            href="https://miportal.formosa.gob.ar/"
            target="_self"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-800 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-900"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            MiPortal
          </a>
        </div>
      </div>
    </nav>
  );
}
