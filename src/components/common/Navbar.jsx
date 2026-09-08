import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const preloadAdmin = () => {
  import("../../pages/AdminLayout");
  import("../admin/Dashboard");
};

const NAV_LINKS = [
  { id: "inicio", to: "/", label: "Inicio" },
  { id: "servicios", to: "/chat", label: "CHATAP" },
  { id: "capacidades", to: "/contacto", label: "Servicios" },
  { id: "servicios", to: "/chat", label: "Trámites" },
  { id: "confianza", to: "/contacto", label: "Ayuda" },
  { id: "charla", to: "/contacto", label: "Contacto" },
];

function Wordmark() {
  return (
    <span className="font-neue text-base font-extrabold tracking-tight text-ink uppercase no-underline">
      ChatAP<span className="text-brand">.</span>
    </span>
  );
}

function ProfileMenu({ user, isStaff, userRole, isSuperadmin, logout }) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef(null);
  const logoutTimer = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(false));
    return () => cancelAnimationFrame(id);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    function onPointerDownOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDownOutside);
    document.addEventListener("touchstart", onPointerDownOutside);
    return () => {
      document.removeEventListener("mousedown", onPointerDownOutside);
      document.removeEventListener("touchstart", onPointerDownOutside);
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
    };
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const firstName = (user?.name || "").split(" ")[0];

  function handleLogout() {
    if (loggingOut) return;
    setOpen(false);
    setLoggingOut(true);
    logoutTimer.current = setTimeout(() => {
      logout();
      navigate("/");
    }, 550);
  }

  return (
    <>
      <div className="relative block" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menú de perfil"
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex items-center gap-2 rounded-full border border-line bg-paper px-2 py-1.5 transition-colors hover:bg-mist cursor-pointer"
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-brand text-[#171717] text-[11px] font-bold uppercase">
            {user.name ? user.name[0] : "?"}
          </span>
          <span className="hidden lg:block text-xs font-semibold text-ink max-w-[9rem] truncate">
            {firstName}
          </span>
          <svg
            className={`w-4 h-4 text-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-60 border border-line bg-paper overflow-hidden animate-fade-up"
            style={{ boxShadow: "0 18px 40px -20px rgba(23, 23, 23, 0.3)" }}
          >
            <div className="px-4 py-3 border-b border-line bg-mist">
              <p className="text-sm font-semibold text-ink m-0 truncate">{user.name}</p>
              <p className="text-xs text-muted m-0 mt-0.5 truncate">{user.email}</p>
              {userRole && (
                <span className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border ${
                  isSuperadmin ? "bg-ink text-paper border-ink" : userRole === "Administrador" ? "bg-brand/10 text-brand border-brand/30" : "bg-mist text-muted border-line"
                }`}>
                  {userRole}
                </span>
              )}
            </div>

            <div className="py-1">
              <Link
                to="/perfil"
                onClick={() => setOpen(false)}
                role="menuitem"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-mist transition-colors no-underline"
              >
                <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Mi perfil
              </Link>

              <a
                href="https://www.formosa.gob.ar/miportal/login"
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-mist transition-colors no-underline"
              >
                <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                MiPortal
              </a>

              {isStaff && (
                <Link
                  to="/admin"
                  onMouseEnter={preloadAdmin}
                  onFocus={preloadAdmin}
                  onClick={() => setOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-mist transition-colors no-underline"
                >
                  <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                  Panel de Administración
                </Link>
              )}
            </div>

            <div className="border-t border-line py-1">
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-bad hover:bg-bad/10 transition-colors text-left cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
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
          role="status"
          aria-label="Cerrando sesión"
        >
          <div className="flex flex-col items-center gap-3 animate-scale-in">
            <span
              className="block w-10 h-10 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--color-line)", borderTopColor: "var(--color-brand-deep)" }}
              aria-hidden="true"
            />
            <p className="text-sm text-muted m-0 font-medium">Cerrando sesión…</p>
          </div>
        </div>
      )}
    </>
  );
}

function DesktopNav() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  function goToAnchor(e, id) {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <nav className="hidden lg:flex items-center gap-0.5" aria-label="Navegación principal">
      {NAV_LINKS.map((l) => {
        if (isHome) {
          return (
            <a
              key={l.label}
              href={`#${l.id}`}
              onClick={(e) => goToAnchor(e, l.id)}
              className="nav-tab no-underline"
            >
              {l.label}
            </a>
          );
        }
        const isActive = location.pathname === l.to;
        return (
          <Link key={l.label} to={l.to} className={`nav-tab no-underline ${isActive ? "is-active" : ""}`}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

function MobileMenu({ onNavigate, isAuthenticated }) {
  const location = useLocation();
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  function goToAnchor(e, id) {
    e.preventDefault();
    onNavigate();
    const target = document.getElementById(id);
    if (target) {
      if (reduce || typeof target.scrollIntoView !== "function") {
        target.scrollIntoView();
      } else {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  }

  return (
    <nav
      aria-label="Navegación móvil"
      className="absolute left-3 right-3 top-[calc(100%+8px)] z-50 border border-line bg-paper p-3 animate-fade-up"
      style={{ boxShadow: "0 18px 40px -20px rgba(23, 23, 23, 0.3)" }}
    >
      <ul className="m-0 p-0 list-none flex flex-col">
        {NAV_LINKS.map((l) => {
          const isHome = location.pathname === "/";
          if (isHome) {
            return (
              <li key={l.label}>
                <a
                  href={`#${l.id}`}
                  onClick={(e) => goToAnchor(e, l.id)}
                  className="flex items-center justify-between px-3 py-3 text-sm font-semibold uppercase tracking-wider text-ink no-underline hover:bg-mist"
                >
                  {l.label}
                  <span className="fig-num" aria-hidden="true">→</span>
                </a>
              </li>
            );
          }
          return (
            <li key={l.label}>
              <Link
                to={l.to}
                onClick={onNavigate}
                className="flex items-center justify-between px-3 py-3 text-sm font-semibold uppercase tracking-wider text-ink no-underline hover:bg-mist"
              >
                {l.label}
                <span className="fig-num" aria-hidden="true">→</span>
              </Link>
            </li>
          );
        })}
        {!isAuthenticated && (
          <li className="border-t border-line mt-2 pt-2">
            <Link
              to="/login"
              onClick={onNavigate}
              className="flex items-center justify-between px-3 py-3 text-sm font-bold uppercase tracking-wider text-[#171717] bg-brand no-underline hover:opacity-90"
            >
              Ingresar
              <span className="fig-num text-[#171717]/60" aria-hidden="true">→</span>
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default function Navbar() {
  const [dark, setDark] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated, isStaff, userRole, isSuperadmin, logout } = useAuth();

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
    <header className="sticky top-3 z-50 px-3 sm:px-4">
      <div className="relative mx-auto max-w-6xl">
        <div className="relative flex items-center justify-between gap-2 border border-line bg-paper/85 backdrop-blur-md px-3 py-2 sm:px-4 rounded-none"
          style={{ boxShadow: "0 10px 34px -18px rgba(23, 23, 23, 0.25)" }}
        >
          <Link to="/" aria-label="ChatAP — inicio" className="flex items-center no-underline shrink-0">
            <Wordmark />
          </Link>

          <DesktopNav />

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Cambiar tema claro/oscuro"
              className="w-9 h-9 flex items-center justify-center border border-line text-muted hover:text-ink hover:bg-mist transition-colors cursor-pointer"
            >
              {dark ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v2m0 14v2m9-9h-2M5 12H3m16.95 6.95l-1.41-1.41M6.46 6.46L5.05 5.05m12.49 0l-1.41 1.41M6.46 17.54l-1.41 1.41M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
            </button>

            {isAuthenticated && user ? (
              <ProfileMenu user={user} isStaff={isStaff} userRole={userRole} isSuperadmin={isSuperadmin} logout={logout} />
            ) : (
              <Link to="/login" className="hidden md:inline-flex btn-primary no-underline px-4! py-2! text-[0.65rem]!">
                Ingresar
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
              className="lg:hidden w-9 h-9 flex items-center justify-center border border-line text-ink hover:bg-mist transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && <MobileMenu onNavigate={() => setMenuOpen(false)} isAuthenticated={isAuthenticated} />}
      </div>
    </header>
  );
}