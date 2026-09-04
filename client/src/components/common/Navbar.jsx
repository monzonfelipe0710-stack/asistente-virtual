import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const preloadAdmin = () => {
  import("../../pages/AdminLayout");
  import("../admin/Dashboard");
};

function ProfileMenu({ user, isStaff, userRole, isSuperadmin, logout }) {
  const [open, setOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef(null);
  const logoutTimer = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Si se navega (ej: click en "Acceso Interno"), cerrar el menú.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    function onPointerDownOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
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
      if (e.key === "Escape") {
        setOpen(false);
        setShowProfile(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const firstName = (user?.name || "").split(" ")[0];

  function handleLogout() {
    if (loggingOut) return;
    setOpen(false);
    setShowProfile(false);
    setLoggingOut(true);
    logoutTimer.current = setTimeout(() => {
      logout();
      navigate("/");
    }, 550);
  }

  function handleItem(action) {
    setOpen(false);
    action();
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
          className="flex items-center gap-2 rounded-xl border border-line bg-paper px-2 py-1.5 transition-colors hover:bg-mist cursor-pointer"
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-deep text-paper text-[11px] font-bold uppercase">
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
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 rounded-xl border border-line bg-paper shadow-lg overflow-hidden animate-fade-up"
          >
            <div className="px-4 py-3 border-b border-line bg-mist">
              <p className="text-sm font-semibold text-ink m-0 truncate">{user.name}</p>
              <p className="text-xs text-muted m-0 mt-0.5 truncate">{user.email}</p>
              {userRole && (
                <span className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full ${isSuperadmin ? "bg-ink text-paper" : userRole === "Administrador" ? "bg-brand-deep/10 text-brand-deep" : "bg-mist text-muted"}`}>
                  {userRole}
                </span>
              )}
            </div>

            <div className="py-1">
              <button
                type="button"
                role="menuitem"
                onClick={() => handleItem(() => setShowProfile(true))}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-mist transition-colors text-left cursor-pointer"
              >
                <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Mi perfil
              </button>

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
                  Acceso Interno
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

      {showProfile && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={() => setShowProfile(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Mi perfil"
        >
          <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
          <div
            className="relative w-full max-w-sm rounded-2xl border border-line bg-paper p-6 shadow-xl animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-5">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-deep text-paper text-lg font-bold uppercase">
                {user.name ? user.name[0] : "?"}
              </span>
              <div>
                <p className="text-base font-semibold text-ink m-0 leading-tight">{user.name}</p>
                <p className="text-xs text-muted m-0">Mi perfil</p>
              </div>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Nombre</dt>
                <dd className="text-ink font-medium text-right">{user.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Correo</dt>
                <dd className="text-ink font-medium text-right break-all">{user.email}</dd>
              </div>
              {userRole && (
                <div className="flex justify-between">
                  <dt className="text-muted">Rol</dt>
                  <dd className="text-ink font-medium">{userRole}</dd>
                </div>
              )}
            </dl>
            <button
              type="button"
              onClick={() => setShowProfile(false)}
              className="mt-6 w-full py-2.5 rounded-xl border border-line text-sm font-semibold text-muted hover:bg-mist hover:text-ink transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

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

export default function Navbar() {
  const [dark, setDark] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
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
          {isAuthenticated && user ? (
            <ProfileMenu user={user} isStaff={isStaff} userRole={userRole} isSuperadmin={isSuperadmin} logout={logout} />
          ) : (
            <Link
              to="/login"
              className="navbar-action inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-deep text-paper text-xs font-semibold hover:bg-brand-dark no-underline"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Iniciar sesión
            </Link>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Cambiar tema claro/oscuro"
            className="navbar-action w-10 h-10 flex items-center justify-center rounded-xl border border-line text-muted hover:text-ink hover:bg-mist hover:border-muted"
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
        </div>
      </div>
    </nav>
  );
}
