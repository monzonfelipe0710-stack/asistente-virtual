import { Link } from "react-router-dom";
import Logo from "./Logo";

const COLS = [
  {
    title: "Plataforma",
    links: [
      { label: "Chatear con ChatAP", to: "/chat" },
      { label: "Soporte y turnos", to: "/contacto" },
      { label: "Mi perfil", to: "/perfil" },
      { label: "Ingresar", to: "/login" },
    ],
  },
  {
    title: "Servicios",
    links: [
      { label: "Certificados y constancias", to: "/contacto" },
      { label: "Consulta de expedientes", to: "/contacto" },
      { label: "Asesoramiento", to: "/contacto" },
    ],
  },
  {
    title: "Institución",
    links: [
      { label: "Gobierno de Formosa", to: "/contacto" },
      { label: "Subsecretaría de Recursos Humanos", to: "/contacto" },
      { label: "Términos de uso", to: "/contacto" },
      { label: "Privacidad", to: "/contacto" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-mist/50">
      <div className="ed-max section-bleed py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-12">
          <div>
            <Logo />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted m-0">
              El asistente virtual de la administración pública de la Provincia de
              Formosa. Información oficial, en un solo lugar, las 24 horas.
            </p>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-faint m-0">
              Subsecretaría de
              <span className="display-break" />
              Recursos Humanos
            </p>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.24em] text-faint m-0">
                {col.title}
              </h3>
              <ul className="mt-6 space-y-3 m-0 p-0 list-none">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="text-[15px] font-medium text-muted hover:text-ink transition-colors no-underline"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-line/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-xs text-faint m-0">
            &copy; {new Date().getFullYear()} Gobierno de la Provincia de Formosa.
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-faint m-0">
            ChatAP · Administración Pública
          </p>
        </div>
      </div>
    </footer>
  );
}