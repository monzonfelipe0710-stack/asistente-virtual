import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "motion/react";
import { useAuth } from "../../context/AuthContext";

const preloadAdmin = () => {
  import("../../pages/AdminLayout");
  import("../admin/Dashboard");
};

const NAV_LINKS = [
  { id: "que-es",      label: "Cómo funciona", to: "/",     hash: true  },
  { id: "servicios",   label: "Servicios",     to: "/",     hash: true  },
  { id: "capacidades", label: "ChatAP",        to: "/chat", hash: false },
  { id: "confianza",   label: "Acceso",        to: "/",     hash: true  },
];

/* ─── Profile dropdown ─────────────────────────────────────────────── */
function ProfileMenu({ user, isStaff, userRole, logout }) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [location.pathname]);

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
    setTimeout(() => { logout(); navigate("/"); }, 500);
  }

  const firstName = (user?.name || "").split(" ")[0];
  const menuItem =
    "flex items-center gap-3 px-4 py-2.5 text-sm text-ink/80 hover:text-ink hover:bg-mist transition-colors no-underline";

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menú de perfil"
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex cursor-pointer items-center gap-2 rounded-full border border-line bg-paper py-1 pl-1 pr-3 transition-colors hover:bg-mist"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-deep text-sm font-semibold text-white"
            aria-hidden="true"
          >
            {user.name?.[0] ?? "?"}
          </span>
          <span className="hidden max-w-[8rem] truncate text-sm font-medium text-ink lg:block">
            {firstName}
          </span>
          <motion.svg
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="h-3.5 w-3.5 text-faint"
            fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              role="menu"
              className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right overflow-hidden rounded-2xl border border-line bg-paper shadow-hover"
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="border-b border-line px-4 py-3">
                <p className="m-0 truncate text-sm font-semibold text-ink">{user.name}</p>
                <p className="m-0 mt-0.5 truncate text-xs text-muted">{user.email}</p>
                {userRole && (
                  <span className="badge mt-2 bg-primary-lighter text-brand-deep">
                    {userRole}
                  </span>
                )}
              </div>
              <div className="py-1">
                {[{ to: "/perfil", label: "Mi perfil" }].map((l) => (
                  <Link
                    key={l.to} to={l.to}
                    onClick={() => setOpen(false)}
                    role="menuitem"
                    className={menuItem}
                  >
                    {l.label}
                  </Link>
                ))}
                <a
                  href="https://www.formosa.gob.ar/miportal/login"
                  target="_blank" rel="noopener noreferrer"
                  role="menuitem" onClick={() => setOpen(false)}
                  className={menuItem}
                >
                  MiPortal
                </a>
                {isStaff && (
                  <Link
                    to="/admin"
                    onMouseEnter={preloadAdmin} onFocus={preloadAdmin}
                    onClick={() => setOpen(false)}
                    role="menuitem"
                    className={menuItem}
                  >
                    Panel Admin
                  </Link>
                )}
              </div>
              <div className="border-t border-line py-1">
                <button
                  type="button" role="menuitem" onClick={handleLogout}
                  className="w-full cursor-pointer bg-transparent px-4 py-2.5 text-left text-sm text-bad transition-colors hover:bg-bad/10"
                >
                  Cerrar sesión
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {loggingOut && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-paper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="status" aria-label="Cerrando sesión"
          >
            <div className="flex flex-col items-center gap-3">
              <motion.span
                className="block h-10 w-10 rounded-full border-2"
                style={{ borderColor: "rgba(15,23,48,0.15)", borderTopColor: "#1c44b6" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                aria-hidden="true"
              />
              <p className="m-0 text-sm font-medium text-muted">Cerrando sesión…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Mobile drawer ────────────────────────────────────────────── */
function MobileDrawer({ onClose, isAuthenticated }) {
  return (
    <motion.nav
      aria-label="Navegación móvil"
      className="mx-4 mt-2 overflow-hidden rounded-2xl border border-line bg-paper shadow-hover lg:hidden"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex flex-col py-1">
        {NAV_LINKS.map((l) => (
          <Link
            key={l.id}
            to={l.to}
            onClick={onClose}
            className="flex items-center justify-between px-5 py-3 text-sm font-medium text-ink/80 no-underline transition-colors hover:bg-mist hover:text-ink"
          >
            {l.label}
            <span className="text-faint">→</span>
          </Link>
        ))}
        {!isAuthenticated && (
          <Link
            to="/login" onClick={onClose}
            className="mt-1 flex items-center justify-between border-t border-line px-5 py-3 text-sm font-semibold text-brand-deep no-underline hover:bg-mist"
          >
            Ingresar
            <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </motion.nav>
  );
}

/* ─── Main Navbar ──────────────────────────────────────────────── */
export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();
  const { user, isAuthenticated, isStaff, userRole, logout } = useAuth();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const navSurface = isHome
    ? "landing"
    : location.pathname === "/chat"
      ? "chat"
      : location.pathname === "/perfil"
        ? "profile"
        : location.pathname === "/contacto" || location.pathname === "/soporte"
          ? "contact"
          : "account";

  useMotionValueEvent(scrollY, "change", (current) => {
    const previous = scrollY.getPrevious();
    if (current < 24 || previous === undefined) {
      setHidden(false);
      return;
    }
    setHidden(current > previous);
  });

  return (
    <motion.header
      className={`site-navbar site-navbar--${navSurface} sticky top-0 z-40 px-4 py-3 ${isHome ? "chatap-navbar" : ""}`}
      data-surface={navSurface}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: hidden ? -120 : 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-line bg-paper/85 px-3 py-2 shadow-soft backdrop-blur-md">
        {/* Brand */}
        <Link to="/" aria-label="ChatAP — inicio" className="no-underline">
          <span className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-deep text-sm font-bold text-white"
              aria-hidden="true"
            >
              AP
            </span>
            <span className="text-[17px] font-semibold tracking-tight text-ink">ChatAP</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegación principal">
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
              className="rounded-full px-3.5 py-1.5 text-sm font-medium text-muted no-underline transition-colors hover:bg-mist hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <ProfileMenu user={user} isStaff={isStaff} userRole={userRole} logout={logout} />
          ) : (
            <Link to="/login" className="btn-primary hidden rounded-full px-5 py-2 text-sm sm:inline-flex">
              Ingresar
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-line bg-paper text-ink transition-colors hover:bg-mist lg:hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              {menuOpen ? (
                <motion.svg
                  key="close"
                  className="h-5 w-5"
                  initial={{ rotate: -45, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 45, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </motion.svg>
              ) : (
                <motion.svg
                  key="open"
                  className="h-5 w-5"
                  initial={{ rotate: 45, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -45, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7h16M4 12h16M4 17h16" />
                </motion.svg>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <MobileDrawer
            onClose={() => setMenuOpen(false)}
            isAuthenticated={isAuthenticated}
          />
        )}
      </AnimatePresence>
    </motion.header>
  );
}