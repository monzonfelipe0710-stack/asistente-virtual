import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import GooeyNav from "./GooeyNav";

const preloadAdmin = () => {
  import("../../pages/AdminLayout");
  import("../admin/Dashboard");
};

const NAV_LINKS = [
  { id: "inicio",  label: "Inicio",  to: "/" },
  { id: "chatap",  label: "ChatAP",  to: "/chat" },
  { id: "soporte", label: "Soporte", to: "/contacto" },
];

function isPathActive(pathname, target) {
  if (target === "/") {
    return pathname === "/";
  }
  return pathname === target || pathname.startsWith(target + "/");
}

function ProfileMenu({ user, isStaff, userRole, logout }) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [prevPath, setPrevPath] = useState(location.pathname);
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function handleLogout() {
    if (loggingOut) return;
    setOpen(false);
    setLoggingOut(true);
    setTimeout(() => {
      logout();
      navigate("/");
    }, 550);
  }

  const firstName = (user?.name || "").split(" ")[0] || "Perfil";

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
          <span className="nav-profile-avatar" aria-hidden="true">
            {user.name?.[0] ?? "?"}
          </span>
          <span className="hidden sm:inline-block text-xs font-medium text-white/90 max-w-[5.5rem] truncate">
            {firstName}
          </span>
          <svg
            className={`w-3 h-3 text-white/50 transition-transform duration-200 ${open ? "rotate-180 text-white" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div role="menu" className="nav-dropdown animate-fade-up">
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-xs font-semibold text-white m-0 truncate">{user.name}</p>
              <p className="text-[11px] text-white/50 m-0 mt-0.5 truncate">{user.email}</p>
              {userRole && (
                <span className="inline-block mt-2 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest rounded bg-brand/15 text-brand border border-brand/25">
                  {userRole}
                </span>
              )}
            </div>
            <div className="py-1.5">
              <Link
                to="/perfil"
                onClick={() => setOpen(false)}
                role="menuitem"
                className="flex items-center gap-2.5 px-4 py-2 text-xs text-white/80 hover:text-white hover:bg-white/5 transition-colors no-underline"
              >
                <svg className="w-3.5 h-3.5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Mi perfil</span>
              </Link>
              <a
                href="https://www.formosa.gob.ar/miportal/login"
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs text-white/80 hover:text-white hover:bg-white/5 transition-colors no-underline"
              >
                <svg className="w-3.5 h-3.5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>MiPortal</span>
              </a>
              {isStaff && (
                <Link
                  to="/admin"
                  onMouseEnter={preloadAdmin}
                  onFocus={preloadAdmin}
                  onClick={() => setOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-white/80 hover:text-white hover:bg-white/5 transition-colors no-underline"
                >
                  <svg className="w-3.5 h-3.5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Panel Admin</span>
                </Link>
              )}
            </div>
            <div className="border-t border-white/10 py-1">
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-red-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Cerrar sesión</span>
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

function MobileDrawer({ onClose, isAuthenticated, user, isStaff, logout, currentPath }) {
  return (
    <nav
      aria-label="Navegación móvil"
      className="nav-drawer animate-fade-up"
    >
      <div className="flex flex-col gap-1 p-2">
        {NAV_LINKS.map((l) => {
          const active = isPathActive(currentPath, l.to);
          return (
            <Link
              key={l.id}
              to={l.to}
              onClick={onClose}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium tracking-wide transition-colors no-underline ${
                active
                  ? "bg-white/10 text-white font-semibold"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2">
                {active && <span className="w-1.5 h-1.5 rounded-full bg-brand" />}
                <span>{l.label}</span>
              </div>
              <svg className="w-3.5 h-3.5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          );
        })}

        {isAuthenticated && user ? (
          <div className="mt-2 pt-2 border-t border-white/10 flex flex-col gap-1">
            <div className="px-3.5 py-1.5 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-brand-deep text-white text-[10px] font-bold flex items-center justify-center ring-1 ring-white/20">
                {user.name?.[0] ?? "?"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white m-0 truncate">{user.name}</p>
                <p className="text-[10px] text-white/50 m-0 truncate">{user.email}</p>
              </div>
            </div>

            <Link
              to="/perfil"
              onClick={onClose}
              className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-white/75 hover:text-white hover:bg-white/5 transition-colors no-underline"
            >
              <span>Mi perfil</span>
              <svg className="w-3.5 h-3.5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <a
              href="https://www.formosa.gob.ar/miportal/login"
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-white/75 hover:text-white hover:bg-white/5 transition-colors no-underline"
            >
              <span>MiPortal</span>
              <svg className="w-3.5 h-3.5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            {isStaff && (
              <Link
                to="/admin"
                onClick={onClose}
                className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-white/75 hover:text-white hover:bg-white/5 transition-colors no-underline"
              >
                <span>Panel Admin</span>
                <svg className="w-3.5 h-3.5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                logout();
              }}
              className="w-full mt-1 flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
            >
              <span>Cerrar sesión</span>
              <svg className="w-3.5 h-3.5 text-red-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="border-t border-white/10 mt-1 pt-2">
            <Link
              to="/login"
              onClick={onClose}
              className="flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-xl text-white bg-brand hover:bg-brand-dark transition-colors no-underline shadow-xs"
            >
              Ingresar
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  const { user, isAuthenticated, isStaff, userRole, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef(null);

  const activeNavIndex = useMemo(() => {
    if (location.pathname === "/") return 0;
    if (location.pathname.startsWith("/chat")) return 1;
    if (location.pathname.startsWith("/contacto")) return 2;
    return -1;
  }, [location.pathname]);

  useEffect(() => {
    let lastScrolled = window.scrollY > 24;
    const onScroll = () => {
      const isScrolled = window.scrollY > 24;
      if (isScrolled !== lastScrolled) {
        lastScrolled = isScrolled;
        setScrolled(isScrolled);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [prevPath, setPrevPath] = useState(location.pathname);
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);

    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* noop */
    }
  }

  return (
    <header className="nav-shell" ref={navRef}>
      <div className={`nav-pill${scrolled ? " nav-pill--scrolled" : ""}`}>
        {/* ── Izquierda: Identidad ChatAP ── */}
        <Link to="/" aria-label="ChatAP inicio" className="nav-brand no-underline">
          <span className="nav-brand-mark" aria-hidden="true">AP</span>
          <span className="nav-brand-name">
            ChatAP<span className="nav-brand-dot">.</span>
          </span>
        </Link>

        <span className="nav-divider hidden md:block" aria-hidden="true" />

        {/* ── Centro: Navegación Principal con GooeyNav (React Bits) ── */}
        <div className="hidden md:flex items-center" aria-label="Navegación principal">
          <GooeyNav
            items={NAV_LINKS.map((l) => ({ label: l.label, href: l.to }))}
            initialActiveIndex={activeNavIndex}
            onItemClick={(item) => navigate(item.href)}
            particleCount={15}
            particleDistances={[90, 10]}
            particleR={100}
            animationTime={600}
            timeVariance={300}
            colors={[1, 2, 3, 1, 2, 3, 1, 4]}
          />
        </div>

        <span className="nav-divider hidden md:block" aria-hidden="true" />

        {/* ── Derecha: Controles y Perfil/Auth ── */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            className="nav-icon-btn group"
            title={dark ? "Modo claro" : "Modo oscuro"}
          >
            <span className="relative flex items-center justify-center w-full h-full transition-transform duration-300 group-active:scale-90">
              {dark ? (
                <svg
                  className="w-3.5 h-3.5 text-amber-300 transition-transform duration-500 rotate-0 group-hover:rotate-45"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v2m0 14v2m9-9h-2M5 12H3m16.95 6.95l-1.41-1.41M6.46 6.46L5.05 5.05m12.49 0l-1.41 1.41M6.46 17.54l-1.41 1.41M12 8a4 4 0 100 8 4 4 0 000-8z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-3.5 h-3.5 text-white/75 transition-transform duration-500 rotate-0 group-hover:-rotate-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                  />
                </svg>
              )}
            </span>
          </button>

          {isAuthenticated && user ? (
            <ProfileMenu user={user} isStaff={isStaff} userRole={userRole} logout={logout} />
          ) : (
            <Link to="/login" className="nav-cta">
              Ingresar
            </Link>
          )}

          {/* Botón menú mobile */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            className="nav-icon-btn md:hidden"
          >
            {menuOpen ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Popover flotante para móviles */}
      {menuOpen && (
        <MobileDrawer
          onClose={() => setMenuOpen(false)}
          isAuthenticated={isAuthenticated}
          user={user}
          isStaff={isStaff}
          userRole={userRole}
          logout={logout}
          currentPath={location.pathname}
        />
      )}
    </header>
  );
}
