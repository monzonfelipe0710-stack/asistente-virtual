import { useState } from "react";
import { Link } from "react-router-dom";

const preloadAdmin = () => {
  import("../../pages/AdminLayout");
  import("../admin/Dashboard");
};

export default function Navbar() {
  const [dark, setDark] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    if (next) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* noop */
    }
  }

  return (
    <nav className="bg-paper border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 no-underline">
          <div className="w-10 h-10 rounded-lg bg-brand-deep flex items-center justify-center shadow-sm">
            <span className="text-paper font-bold text-sm tracking-tight">AP</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight text-ink uppercase">
              ChatAP
            </span>
            <span className="navbar-badge text-[9px] text-muted uppercase tracking-widest mt-1">
              Subsec. de Recursos Humanos
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Cambiar tema claro/oscuro"
            className="navbar-action w-10 h-10 flex items-center justify-center rounded-xl border border-line text-muted hover:text-ink hover:bg-mist hover:border-muted transition-all"
          >
            {dark ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v2m0 14v2m9-9h-2M5 12H3m16.95 6.95l-1.41-1.41M6.46 6.46L5.05 5.05m12.49 0l-1.41 1.41M6.46 17.54l-1.41 1.41M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>
          <Link
            to="/admin"
            onMouseEnter={preloadAdmin}
            onFocus={preloadAdmin}
            className="navbar-action flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl transition-all no-underline border border-line text-muted hover:bg-mist hover:border-brand hover:text-brand-deep"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
            Acceso Interno
          </Link>
          <a
            href="https://www.formosa.gob.ar/miportal/login"
            target="_blank"
            rel="noopener noreferrer"
            className="navbar-action inline-flex items-center gap-2 px-4 py-2 border border-line text-muted text-xs font-medium rounded-xl hover:bg-mist hover:border-brand hover:text-brand-deep transition-all no-underline"
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
