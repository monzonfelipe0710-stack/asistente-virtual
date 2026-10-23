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
                    {item.isAction ? (
                      <button
                        type="button"
                        onClick={() => setShowTeamModal(true)}
                        className="text-sm text-left p-0 bg-transparent border-0 cursor-pointer text-muted hover:text-brand-deep dark:hover:text-brand transition-colors no-underline font-neue-text inline-flex items-center gap-1.5 group"
                      >
                        <span>{item.label}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-brand/10 text-brand font-semibold group-hover:bg-brand group-hover:text-white transition-colors">
                          IPF · RRHH
                        </span>
                      </button>
                    ) : item.to ? (
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
            className="relative w-full max-w-2xl bg-paper border border-line rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del modal */}
            <div className="flex items-start justify-between gap-4 mb-8">
              <div className="text-center">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 text-brand text-xs font-mono font-bold uppercase tracking-[0.1em] mb-3">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Equipo de desarrollo
                </span>
                <h3 id="team-modal-title" className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight font-neue mt-2 leading-tight">
                  El equipo detrás de ChatAP
                </h3>
                <p className="mt-3 text-sm text-muted font-neue-text max-w-md mx-auto">
                  Una colaboración entre la gestión pública y la educación tecnológica de Formosa.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTeamModal(false)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-muted hover:text-ink hover:bg-mist transition-colors border border-line shrink-0 cursor-pointer"
                aria-label="Cerrar modal"
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Instituciones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tarjeta RRHH */}
                <article className="p-6 rounded-2xl border border-line bg-mist/50 transition-all hover:border-brand/30 hover:bg-brand/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h4 className="text-base font-bold text-ink leading-tight m-0">Subsecretaría de Recursos Humanos</h4>
                      <span className="text-[11px] text-muted font-mono uppercase tracking-[0.05em]">Poder Ejecutivo Provincial</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted font-neue-text leading-relaxed m-0">
                    Liderazgo funcional, definición de circuitos administrativos, homologación de trámites de haberes (SUAF), licencias reglamentarias y supervisión de normativas públicas oficiales.
                  </p>
                  <span className="inline-block mt-4 text-[11px] font-medium text-brand">Gestión y marco institucional</span>
                </article>

                {/* Tarjeta IPF */}
                <article className="p-6 rounded-2xl border border-line bg-mist/50 transition-all hover:border-brand/30 hover:bg-brand/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-deep/10 text-brand-deep flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 16l4-16M6 9a2 2 0 01-2-2V4a2 2 0 012-2h12a2 2 0 012 2v3a2 2 0 01-2 2h-2.5m-7.5 0l4 8M15 13l4 8M9 13l-4 8m0 0h.01M12 13h.01" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h4 className="text-base font-bold text-ink leading-tight m-0">Instituto Politécnico Formosa</h4>
                      <span className="text-[11px] text-muted font-mono uppercase tracking-[0.05em]">Polo Científico y Tecnológico</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted font-neue-text leading-relaxed m-0">
                    Arquitectura de software, ingeniería de prompts, integración de modelos de IA, desarrollo de interfaces reactivas y optimización de la experiencia ciudadana.
                  </p>
                  <span className="inline-block mt-4 text-[11px] font-medium text-brand-deep">Desarrollo tecnológico e IA</span>
                </article>
              </div>

              {/* Pilares del proyecto */}
              <div className="p-5 rounded-2xl bg-brand/5 border border-brand/20">
                <h5 className="text-xs font-bold text-brand uppercase tracking-wider mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pilares del proyecto
                </h5>
                <ul className="m-0 p-0 list-none space-y-3">
                  <li className="flex items-start gap-3 p-3 rounded-xl bg-paper border border-line/50">
                    <span className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0 text-lg">✦</span>
                    <div>
                      <p className="text-sm font-semibold text-ink m-0 mb-1">Atención 24/7 sin intermediarios</p>
                      <p className="text-xs text-muted font-neue-text m-0">Respuestas inmediatas a cualquier hora, sin filas ni traslados físicos.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 p-3 rounded-xl bg-paper border border-line/50">
                    <span className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0 text-lg">✦</span>
                    <div>
                      <p className="text-sm font-semibold text-ink m-0 mb-1">Lenguaje claro y accesible</p>
                      <p className="text-xs text-muted font-neue-text m-0">Diseñado para toda la comunidad, con empatía y sin tecnicismos innecesarios.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 p-3 rounded-xl bg-paper border border-line/50">
                    <span className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0 text-lg">✦</span>
                    <div>
                      <p className="text-sm font-semibold text-ink m-0 mb-1">Interoperabilidad provincial</p>
                      <p className="text-xs text-muted font-neue-text m-0">Integración con SIGED, MiPortal y sistemas de la Administración Pública.</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Botón de cierre */}
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowTeamModal(false)}
                  className="inline-flex items-center min-h-11 px-8 rounded-xl bg-ink text-paper font-semibold text-sm hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
