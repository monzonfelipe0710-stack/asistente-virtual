import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200/60 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400 font-medium">
            &copy; {new Date().getFullYear()} Subsecretaría de Recursos Humanos &mdash; Provincia de Formosa
          </p>
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <Link to="/contacto" className="hover:text-slate-600 transition-colors no-underline font-medium">
              Contacto
            </Link>
            <a href="#" className="hover:text-slate-600 transition-colors no-underline font-medium">
              Términos de uso
            </a>
            <a href="#" className="hover:text-slate-600 transition-colors no-underline font-medium">
              Privacidad
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
