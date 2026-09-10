import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NAV_LINKS = [
  { id: "inicio", label: "Inicio", to: "/", hash: true },
  { id: "chatap", label: "ChatAP", to: "/", hash: true },
  { id: "soporte", label: "Soporte", to: "/", hash: true },
];

const preloadAdmin = () => {
  import("../../pages/AdminLayout");
  import("../admin/Dashboard");
};

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
    if (!open) return undefined;
    const close = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [open]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function handleLogout() {
    if (loggingOut) return;
    setOpen(false);
    setLoggingOut(true);
    setTimeout(() => {
      logout();
      navigate("/");
    }, 550);
  }

  const firstName = (user?.name || "").split(" ")[0];

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Abrir perfil"
          aria-haspopup="menu"
          aria-expanded={open}
          className="nav-profile-btn"
        >
          <span className="nav-profile-avatar">{user?.name?.[0] ?? "?"}</span>
          <span className="hidden lg:block text-xs font-medium max-w-[9rem] truncate">{firstName}</span>
          <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div role="menu" className="nav-dropdown animate-fade-up">
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-sm font-medium text-white m-0 truncate">{user?.name}</p>
              <p className="text-xs text-white/45 m-0 mt-0.5 truncate">{user?.email}</p>
              {userRole && (
                <span className="inline-block mt-2 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest border border-white/15 text-white/60">
                  {userRole}
                </span>
              )}
            </div>
            <div className="py-1">
              <Link to="/perfil" onClick={() => setOpen(false)} role="menuitem" className="flex items-center px-4 py-2.5 text-sm text-white/75 hover:text-white hover:bg-white/5 transition-colors no-underline">
                Mi perfil
              </Link>
              <a href="https://www.formosa.gob.ar/miportal/login" target="_blank" rel="noopener noreferrer" role="menuitem" onClick={() => setOpen(false)} className="flex items-center px-4 py-2.5 text-sm text-white/75 hover:text-white hover:bg-white/5 transition-colors no-underline">
                MiPortal
              </a>
              {isStaff && (
                <Link to="/admin" onMouseEnter={preloadAdmin} onFocus={preloadAdmin} onClick={() => setOpen(false)} role="menuitem" className="flex items-center px-4 py-2.5 text-sm text-white/75 hover:text-white hover:bg-white/5 transition-colors no-underline">
                  Panel Admin
                </Link>
              )}
            </div>
            <div className="border-t border-white/10 py-1">
              <button type="button" role="menuitem" onClick={handleLogout} className="w-full px-4 py-2.5 text-sm text-bad hover:bg-bad/10 transition-colors text-left cursor-pointer">
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>

      {loggingOut && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center animate-fade-in" style={{ backgroundColor: "var(--color-paper)" }} role="status" aria-label="Cerrando sesión">
          <div className="flex flex-col items-center gap-3 animate-scale-in">
            <span className="block w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: "var(--color-line)", borderTopColor: "var(--color-brand)" }} aria-hidden="true" />
            <p className="text-sm text-muted m-0 font-medium">Cerrando sesión…</p>
          </div>
        </div>
      )}
    </>
  );
}

function MobileDrawer({ onClose, isAuthenticated }) {
  return (
    <nav aria-label="Navegación móvil" className="nav-drawer animate-slide-down">
      <div className="flex flex-col gap-0.5 p-2">
        {NAV_LINKS.map((item) => (
          <Link key={item.id} to={`${item.to}#${item.id}`} onClick={onClose} className="flex items-center justify-between px-4 py-3 text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 transition-colors no-underline">
            {item.label}
            <span className="text-white/30">→</span>
          </Link>
        ))}
        {!isAuthenticated && (
          <Link to="/login" onClick={onClose} className="flex items-center justify-between px-4 py-3 mt-1 text-sm font-semibold bg-brand text-ink no-underline">
            Ingresar
            <span>→</span>
          </Link>
        )}
      </div>
    </nav>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated, isStaff, userRole, logout } = useAuth();
  const location = useLocation();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navigateHomeSection = (event, item) => {
    if (!item.hash || !isHome) return;
    event.preventDefault();
    document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="nav-shell">
      <div className={`nav-pill${scrolled ? " nav-pill--scrolled" : ""}`}>
        <Link to="/" aria-label="ChatAP inicio" className="nav-brand no-underline">
          <span className="nav-brand-mark" aria-hidden="true">AP</span>
          <span className="nav-brand-name">ChatAP</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1" aria-label="Navegación principal">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.id}
              to={item.hash ? `${item.to}#${item.id}` : item.to}
              onClick={(event) => navigateHomeSection(event, item)}
              className={`nav-link ${item.id === "inicio" && isHome && location.hash === "#inicio" ? "nav-link--active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <ProfileMenu user={user} isStaff={isStaff} userRole={userRole} logout={logout} />
          ) : (
            <Link to="/login" className="nav-cta hidden sm:inline-flex">Ingresar</Link>
          )}

          <button type="button" onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuOpen} className="nav-icon-btn lg:hidden">
            {menuOpen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" /></svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && <MobileDrawer onClose={() => setMenuOpen(false)} isAuthenticated={isAuthenticated} />}
    </header>
  );
}
