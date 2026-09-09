import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const preloadAdmin = () => {
  import("../../pages/AdminLayout");
  import("../admin/Dashboard");
};

const NAV_LINKS = [
  { id: "que-es",     label: "Qué es",    to: "/",        hash: true },
  { id: "servicios",  label: "Servicios", to: "/",        hash: true },
  { id: "capacidades",label: "ChatAP",    to: "/chat",    hash: false },
  { id: "confianza",  label: "Confianza", to: "/",        hash: true },
];

/* ─── Profile dropdown ─────────────────────────────────────────────── */
function ProfileMenu({ user, isStaff, userRole, logout }) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function handleLogout() {
    if (loggingOut) return;
    setOpen(false);
    setLoggingOut(true);
    setTimeout(() => { logout(); navigate("/"); }, 550);
  }

  const firstName = (user?.name || "").split(" ")[0];

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menú de perfil"
          aria-haspopup="menu"
          aria-expanded={open}
          className="nav-profile-btn"
        >
          <span className="nav-profile-avatar">{user.name?.[0] ?? "?"}</span>
          <span className="hidden lg:block text-xs font-medium text-[#f3f1e9] max-w-[9rem] truncate">
            {firstName}
          </span>
          <svg
            className={`w-3.5 h-3.5 text-[#f3f1e9]/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div role="menu" className="nav-dropdown animate-fade-up">
            <div className="px-4 py-3 border-b border-[#f3f1e9]/10">
              <p className="text-sm font-medium text-[#f3f1e9] m-0 truncate">{user.name}</p>
              <p className="text-xs text-[#f3f1e9]/45 m-0 mt-0.5 truncate">{user.email}</p>
              {userRole && (
                <span className="inline-block mt-2 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest border border-[#f3f1e9]/15 text-[#f3f1e9]/60">
                  {userRole}
                </span>
              )}
            </div>
            <div className="py-1">
              {[
                { to: "/perfil", label: "Mi perfil" },
              ].map((l) => (
                <Link
                  key={l.to} to={l.to}
                  onClick={() => setOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#f3f1e9]/75 hover:text-[#f3f1e9] hover:bg-[#f3f1e9]/5 transition-colors no-underline"
                >
                  {l.label}
                </Link>
              ))}
              <a
                href="https://www.formosa.gob.ar/miportal/login"
                target="_blank" rel="noopener noreferrer"
                role="menuitem" onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#f3f1e9]/75 hover:text-[#f3f1e9] hover:bg-[#f3f1e9]/5 transition-colors no-underline"
              >
                MiPortal
              </a>
              {isStaff && (
                <Link
                  to="/admin"
                  onMouseEnter={preloadAdmin} onFocus={preloadAdmin}
                  onClick={() => setOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#f3f1e9]/75 hover:text-[#f3f1e9] hover:bg-[#f3f1e9]/5 transition-colors no-underline"
                >
                  Panel Admin
                </Link>
              )}
            </div>
            <div className="border-t border-[#f3f1e9]/10 py-1">
              <button
                type="button" role="menuitem" onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-bad hover:bg-bad/10 transition-colors text-left cursor-pointer"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>

      {loggingOut && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center animate-fade-in"
          style={{ backgroundColor: "var(--color-paper)" }}
          role="status" aria-label="Cerrando sesión"
        >
          <div className="flex flex-col items-center gap-3 animate-scale-in">
            <span
              className="block w-10 h-10 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--color-line)", borderTopColor: "var(--color-brand)" }}
              aria-hidden="true"
            />
            <p className="text-sm text-muted m-0 font-medium">Cerrando sesión…</p>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Mobile drawer ────────────────────────────────────────────────── */
function MobileDrawer({ onClose, isAuthenticated }) {
  return (
    <nav
      aria-label="Navegación móvil"
      className="nav-drawer animate-slide-down"
    >
      <div className="flex flex-col gap-0.5 p-2">
        {NAV_LINKS.map((l) => (
          <Link
            key={l.id} to={l.to}
            onClick={onClose}
            className="flex items-center justify-between px-4 py-3 text-sm font-mono font-medium uppercase tracking-wider text-[#f3f1e9]/80 hover:text-[#f3f1e9] hover:bg-[#f3f1e9]/5 transition-colors no-underline"
          >
            {l.label}
            <span className="text-[#f3f1e9]/30 text-xs">→</span>
          </Link>
        ))}
        {!isAuthenticated && (
          <div className="border-t border-[#f3f1e9]/10 mt-1 pt-1">
            <Link
              to="/login" onClick={onClose}
              className="flex items-center justify-between px-4 py-3 text-sm font-mono font-bold uppercase tracking-wider text-[#171717] bg-brand no-underline"
            >
              Ingresar
              <span className="text-[#171717]/60 text-xs">→</span>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

/* ─── Main Navbar ──────────────────────────────────────────────────── */
export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  const { user, isAuthenticated, isStaff, userRole, logout } = useAuth();
  const location = useLocation();
  const isHome = location.pathname === "/";

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch { /* noop */ }
  }

  return (
    <header className="nav-shell">
      <div className="nav-pill">
        {/* Brand */}
        <Link to="/" aria-label="ChatAP — inicio" className="nav-brand no-underline">
          <span className="nav-brand-mark" aria-hidden="true">AP</span>
          <span className="nav-brand-name">ChatAP</span>
        </Link>

        {/* Desktop links */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Navegación principal">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.id}
              to={l.hash && isHome ? `#${l.id}` : l.to}
              onClick={(e) => {
                if (l.hash && isHome) {
                  e.preventDefault();
                  document.getElementById(l.id)?.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className={`nav-link ${location.pathname === l.to && !l.hash ? "nav-link--active" : ""}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Cambiar tema"
            className="nav-icon-btn"
          >
            {dark ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v2m0 14v2m9-9h-2M5 12H3m16.95 6.95l-1.41-1.41M6.46 6.46L5.05 5.05m12.49 0l-1.41 1.41M6.46 17.54l-1.41 1.41M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>

          {isAuthenticated && user ? (
            <ProfileMenu user={user} isStaff={isStaff} userRole={userRole} logout={logout} />
          ) : (
            <Link to="/login" className="nav-cta hidden sm:inline-flex">
              Ingresar
            </Link>
          )}

          {/* Hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            className="nav-icon-btn lg:hidden"
          >
            {menuOpen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <MobileDrawer
          onClose={() => setMenuOpen(false)}
          isAuthenticated={isAuthenticated}
        />
      )}
    </header>
  );
}
