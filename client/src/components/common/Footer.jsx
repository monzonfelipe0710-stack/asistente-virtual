import { Link } from "react-router-dom";

const TRAMITES = [
  { label: "Recibos de haberes", to: "/contacto?motivo=haberes" },
  { label: "Licencias e inasistencias", to: "/contacto?motivo=licencias" },
  { label: "Expedientes SIGED", to: "/contacto?motivo=siged" },
  { label: "Mesa de entradas digital", to: "/contacto?motivo=acceso" },
];

const INSTITUCIONAL = [
  { label: "Recursos Humanos", to: "/" },
  { label: "Gobierno de Formosa", href: "https://www.formosa.gob.ar/" },
  { label: "Portal del Empleado", href: "https://www.formosa.gob.ar/miportal/login" },
  { label: "Politécnico Formosa", href: "https://ipf.formosa.gob.ar/" },
];

const SOPORTE = [
  { label: "Mesa de ayuda", to: "/contacto" },
  { label: "Preguntas frecuentes", to: "/#preguntas" },
  { label: "Términos y condiciones", to: "/terminos" },
  { label: "Privacidad", to: "/privacidad" },
];

const SOCIAL_LINKS = [
  {
    name: "Sitio Oficial Formosa",
    href: "https://www.formosa.gob.ar/",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="w-full bg-paper/95 border-t border-line relative z-10">
      {/* Zona superior: Contenido principal en cuadrícula centrado */}
      <div className="ed-max section-bleed py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12">
          
          {/* Columna Izquierda: Brand, síntesis y redes sociales */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-8">
            <div>
              <Link to="/" className="inline-flex items-center gap-2.5 text-ink no-underline group" aria-label="Inicio ChatAP">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white font-extrabold text-xs shadow-xs font-neue">
                  AP
                </span>
                <span className="flex flex-col leading-none">
                  <span className="text-base font-extrabold tracking-tight text-ink uppercase font-neue">
                    ChatAP<span className="text-brand">.</span>
                  </span>
                  <span className="mt-1 text-[8px] font-mono font-semibold uppercase tracking-[0.24em] text-faint">
                    Subsecretaría de Recursos Humanos · Formosa
                  </span>
                </span>
              </Link>

              <p className="mt-4 text-sm leading-relaxed text-muted font-neue-text max-w-sm m-0">
                Orientación sobre trámites y servicios de la Subsecretaría de Recursos Humanos, con información clara y en un lenguaje cercano.
              </p>
            </div>

            {/* Botones de redes sociales */}
            <div className="flex items-center gap-2">
              {SOCIAL_LINKS.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.name}
                  className="w-11 h-11 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-mist/70 border border-transparent hover:border-line transition-all duration-150 no-underline"
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Columnas Derechas: 3 secciones temáticas */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-8">
            {/* Columna 1 · Trámites */}
            <div>
              <h4 className="text-xs font-bold font-mono uppercase tracking-[0.2em] text-ink m-0 mb-4">
                Trámites
              </h4>
              <ul className="m-0 p-0 list-none flex flex-col gap-2.5">
                {TRAMITES.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      className="text-sm text-muted hover:text-brand-deep dark:hover:text-brand transition-colors no-underline font-neue-text"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Columna 2 · Institucional */}
            <div>
              <h4 className="text-xs font-bold font-mono uppercase tracking-[0.2em] text-ink m-0 mb-4">
                Institucional
              </h4>
              <ul className="m-0 p-0 list-none flex flex-col gap-2.5">
                {INSTITUCIONAL.map((item) => (
                  <li key={item.label}>
                    {item.to ? (
                      <Link
                        to={item.to}
                        className="text-sm text-muted hover:text-brand-deep dark:hover:text-brand transition-colors no-underline font-neue-text"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs sm:text-sm text-muted hover:text-brand-deep dark:hover:text-brand transition-colors no-underline font-neue-text inline-flex items-center gap-1"
                      >
                        <span>{item.label}</span>
                        <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Columna 3 · Soporte */}
            <address className="not-italic">
              <h4 className="text-xs font-bold font-mono uppercase tracking-[0.2em] text-ink m-0 mb-4">
                Soporte
              </h4>
              <ul className="m-0 p-0 list-none flex flex-col gap-2.5">
                {SOPORTE.map((item) => (
                  <li key={item.label}>
                    {item.to ? (
                      <Link
                        to={item.to}
                        className="text-sm text-muted hover:text-brand-deep dark:hover:text-brand transition-colors no-underline font-neue-text"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted hover:text-brand-deep dark:hover:text-brand transition-colors no-underline font-neue-text"
                      >
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </address>
          </div>

        </div>
      </div>

      {/* Barra inferior del footer */}
      <div className="border-t border-line w-full bg-paper/95">
        <div className="ed-max section-bleed py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="m-0 text-xs text-muted font-neue-text text-center sm:text-left">
            &copy; {new Date().getFullYear()} ChatAP · Desarrollado en articulación conjunta por la Subsecretaría de Recursos Humanos y el Instituto Politécnico Formosa · Gobierno de Formosa.
          </p>
          <div className="flex items-center gap-5 text-xs text-muted font-neue-text">
            <Link to="/terminos" className="hover:text-ink transition-colors no-underline">
              Términos y Condiciones
            </Link>
            <span className="text-line" aria-hidden="true">·</span>
            <Link to="/privacidad" className="hover:text-ink transition-colors no-underline">
              Privacidad
            </Link>
            <span className="text-line" aria-hidden="true">·</span>
            <Link to="/contacto" className="hover:text-ink transition-colors no-underline">
              Accesibilidad
            </Link>
          </div>
        </div>
      </div>

    </footer>
  );
}
