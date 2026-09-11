import { useState } from "react";
import { Link } from "react-router-dom";

const TRAMITES = [
  { label: "Recibos de haberes", to: "/contacto?motivo=haberes" },
  { label: "Licencias e inasistencias", to: "/contacto?motivo=licencias" },
  { label: "Expedientes SIGED", to: "/contacto?motivo=siged" },
  { label: "Mesa de entradas digital", to: "/contacto?motivo=acceso" },
];

const INSTITUCIONAL = [
  { label: "Equipo de desarrollo", isAction: true },
  { label: "Recursos Humanos", to: "/" },
  { label: "Gobierno de Formosa", href: "https://www.formosa.gob.ar/" },
  { label: "Portal del Empleado", href: "https://www.formosa.gob.ar/miportal/login" },
  { label: "Politécnico Formosa", href: "https://ipf.formosa.gob.ar/" },
];

const SOPORTE = [
  { label: "Mesa de ayuda", to: "/contacto" },
  { label: "WhatsApp oficial", href: "https://wa.me/5493704000000" },
  { label: "Línea gratuita 0800", href: "tel:08005551234" },
  { label: "Preguntas frecuentes", to: "/contacto" },
];

const SOCIAL_LINKS = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: "X (Twitter)",
    href: "https://x.com/",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    ),
  },
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
  const [showTeamModal, setShowTeamModal] = useState(false);

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
                    Recursos Humanos · Formosa
                  </span>
                </span>
              </Link>

              <p className="mt-4 text-sm leading-relaxed text-muted font-neue-text max-w-sm m-0">
                La Administración Pública respondiendo a cada persona, en lenguaje
                claro y a toda hora. Consultá trámites, haberes, licencias y expedientes sin filas.
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
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-mist/70 border border-transparent hover:border-line transition-all duration-150 no-underline"
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
                      className="text-xs sm:text-sm text-muted hover:text-brand-deep dark:hover:text-brand transition-colors no-underline font-neue-text"
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
                    {item.isAction ? (
                      <button
                        type="button"
                        onClick={() => setShowTeamModal(true)}
                        className="text-xs sm:text-sm text-left p-0 bg-transparent border-0 cursor-pointer text-muted hover:text-brand-deep dark:hover:text-brand transition-colors no-underline font-neue-text inline-flex items-center gap-1.5 group"
                      >
                        <span>{item.label}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-brand/10 text-brand font-semibold group-hover:bg-brand group-hover:text-white transition-colors">
                          IPF · RRHH
                        </span>
                      </button>
                    ) : item.to ? (
                      <Link
                        to={item.to}
                        className="text-xs sm:text-sm text-muted hover:text-brand-deep dark:hover:text-brand transition-colors no-underline font-neue-text"
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
            <div>
              <h4 className="text-xs font-bold font-mono uppercase tracking-[0.2em] text-ink m-0 mb-4">
                Soporte
              </h4>
              <ul className="m-0 p-0 list-none flex flex-col gap-2.5">
                {SOPORTE.map((item) => (
                  <li key={item.label}>
                    {item.to ? (
                      <Link
                        to={item.to}
                        className="text-xs sm:text-sm text-muted hover:text-brand-deep dark:hover:text-brand transition-colors no-underline font-neue-text"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs sm:text-sm text-muted hover:text-brand-deep dark:hover:text-brand transition-colors no-underline font-neue-text"
                      >
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </div>

      {/* Barra inferior característica de Footer 51 con patrón de rayas diagonales a todo lo ancho y al ras del fondo */}
      <div className="footer-striped-pattern border-t border-line w-full">
        <div className="ed-max section-bleed py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="m-0 text-xs text-muted font-neue-text text-center sm:text-left">
            &copy; {new Date().getFullYear()} ChatAP · Desarrollado en articulación conjunta por la Subsecretaría de Recursos Humanos y el Instituto Politécnico Formosa · Gobierno de Formosa.
          </p>
          <div className="flex items-center gap-5 text-xs text-muted font-neue-text">
            <Link to="/contacto" className="hover:text-ink transition-colors no-underline">
              Términos y Condiciones
            </Link>
            <span className="text-line" aria-hidden="true">·</span>
            <Link to="/contacto" className="hover:text-ink transition-colors no-underline">
              Privacidad
            </Link>
            <span className="text-line" aria-hidden="true">·</span>
            <Link to="/contacto" className="hover:text-ink transition-colors no-underline">
              Accesibilidad
            </Link>
          </div>
        </div>
      </div>

      {/* Modal interactivo: Equipo de desarrollo ChatAP */}
      {showTeamModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="team-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-md animate-fade-in"
          onClick={() => setShowTeamModal(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-paper border border-line rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del modal */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.24em] text-brand">
                  Innovación Pública · Formosa
                </span>
                <h3 id="team-modal-title" className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight font-neue mt-1">
                  El equipo que hizo posible ChatAP
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTeamModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-mist transition-colors border border-line shrink-0"
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-muted font-neue-text leading-relaxed mb-6">
              ChatAP nace de la articulación estratégica entre el sector de gestión pública y la educación tecnológica de vanguardia en la provincia, con la misión de acercar la Administración Pública a cada ciudadano y trabajador estatal las 24 horas del día.
            </p>

            {/* Tarjetas de las instituciones intervinientes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Tarjeta 1 · Recursos Humanos */}
              <div className="p-5 rounded-2xl bg-mist/50 border border-line flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-8 h-8 rounded-lg bg-brand/10 text-brand font-bold text-xs flex items-center justify-center font-neue">
                      RRHH
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-ink leading-tight m-0">
                        Subsecretaría de Recursos Humanos
                      </h4>
                      <span className="text-[10px] text-muted font-mono">Poder Ejecutivo Provincial</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted font-neue-text leading-normal m-0">
                    Liderazgo funcional, definición de circuitos administrativos, homologación de trámites de haberes (SUAF), licencias reglamentarias y supervisión de normativas públicas oficiales.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-line/60">
                  <span className="text-[11px] font-medium text-brand">Gestión y marco institucional</span>
                </div>
              </div>

              {/* Tarjeta 2 · Politécnico Formosa */}
              <div className="p-5 rounded-2xl bg-mist/50 border border-line flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-8 h-8 rounded-lg bg-brand-deep text-white font-bold text-xs flex items-center justify-center font-neue">
                      IPF
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-ink leading-tight m-0">
                        Instituto Politécnico Formosa
                      </h4>
                      <span className="text-[10px] text-muted font-mono">Polo Científico y Tecnológico</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted font-neue-text leading-normal m-0">
                    Arquitectura de software, ingeniería de prompts, integración de modelos de inteligencia artificial, desarrollo de interfaces reactivas y optimización de experiencia ciudadana.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-line/60">
                  <span className="text-[11px] font-medium text-brand">Desarrollo tecnológico e IA</span>
                </div>
              </div>
            </div>

            {/* Compromiso y pilares */}
            <div className="p-4 rounded-xl bg-brand/5 border border-brand/20 mb-6">
              <h5 className="text-xs font-bold text-brand uppercase tracking-wider mb-1">
                Pilares del proyecto
              </h5>
              <ul className="m-0 p-0 list-none space-y-1.5 text-xs text-ink/80 font-neue-text">
                <li className="flex items-center gap-2">
                  <span className="text-brand">✦</span> Atención 24/7 sin intermediarios ni traslados físicos.
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand">✦</span> Lenguaje claro, accesible y empático para toda la comunidad.
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand">✦</span> Interoperabilidad con SIGED, MiPortal y sistemas provinciales.
                </li>
              </ul>
            </div>

            {/* Botón de cierre */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowTeamModal(false)}
                className="px-5 py-2.5 rounded-xl bg-ink text-paper font-semibold text-xs hover:opacity-90 transition-opacity"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
