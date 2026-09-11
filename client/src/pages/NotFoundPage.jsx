import { useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import ASCIIText from "../components/common/ASCIIText";
import useTheme from "../hooks/useTheme";

const POPULAR_SHORTCUTS = [
  { label: "Haberes y Sueldos", to: "/chat", query: "¿Cómo consultar mi recibo de sueldo?" },
  { label: "Licencias Oficiales", to: "/chat", query: "¿Cómo tramitar una licencia médica?" },
  { label: "Mesa de Entrada SIGED", to: "/chat", query: "¿Cómo consultar el estado de un expediente?" },
  { label: "Soporte y Contacto", to: "/contacto" },
];

export default function NotFoundPage() {
  const theme = useTheme();

  const asciiGradient = useMemo(() => (
    theme === "dark"
      ? "linear-gradient(135deg, #93C5FD 0%, #60A5FA 45%, #38BDF8 85%, #FFFFFF 100%)"
      : "linear-gradient(135deg, #1C44B6 0%, #2563EB 45%, #0284C7 85%, #3B82F6 100%)"
  ), [theme]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-paper text-ink relative overflow-hidden">
      {/* Luz ambiental de fondo sutil */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[42rem] h-[22rem] bg-brand/10 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      <Navbar />

      <main id="contenido" className="flex-1 flex flex-col items-center justify-center px-4 pt-28 pb-16 text-center z-10">
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
          
          {/* Badge de estado institucional */}
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1 text-xs font-mono font-bold uppercase tracking-wider text-brand mb-2 select-none">
            <span className="h-2 w-2 rounded-full bg-brand animate-pulse" aria-hidden="true" />
            Error 404 · Ruta no encontrada
          </span>

          {/* Escenario 3D interactivo con ASCIIText de React Bits */}
          <div className="w-full h-56 sm:h-72 md:h-80 relative flex items-center justify-center my-1 select-none">
            <ASCIIText
              text="404"
              enableWaves
              asciiFontSize={8}
              textFontSize={190}
              textColor="#ffffff"
              planeBaseHeight={8}
              textGradient={asciiGradient}
            />
          </div>

          {/* Información y orientación clara para el ciudadano */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-ink mt-1 mb-3 font-neue">
            La página que buscás no existe o fue movida
          </h1>

          <p className="text-sm sm:text-base text-muted max-w-lg mx-auto leading-relaxed m-0 font-neue-text">
            El trámite, documento o enlace al que intentás acceder no está disponible.
            Podés regresar al portal de inicio o consultar de inmediato a nuestro asistente virtual.
          </p>

          {/* Botones principales de acción */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 mt-8">
            <Link
              to="/"
              className="btn-primary no-underline text-xs sm:text-sm px-6 py-3 shadow-lg shadow-brand/20 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Volver al inicio</span>
            </Link>

            <Link
              to="/chat"
              className="btn-ghost no-underline text-ink border-line hover:bg-mist/60 text-xs sm:text-sm px-6 py-3 flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Preguntarle a ChatAP</span>
            </Link>
          </div>

          {/* Atajos a gestiones y consultas frecuentes */}
          <div className="mt-10 pt-6 border-t border-line/40 w-full flex flex-col items-center gap-3">
            <span className="text-[11px] font-mono font-medium uppercase tracking-widest text-muted/70 select-none">
              O accedé a trámites frecuentes
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {POPULAR_SHORTCUTS.map((s) => (
                <Link
                  key={s.label}
                  to={s.to}
                  state={s.query ? { initialQuery: s.query } : undefined}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line/70 bg-paper hover:bg-mist/50 text-xs text-muted hover:text-ink transition-colors no-underline"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-brand/60" aria-hidden="true" />
                  <span>{s.label}</span>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
