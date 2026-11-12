export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Subsecretaría de Recursos Humanos &mdash; Provincia de Formosa
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <a href="#" className="hover:text-slate-600 transition-colors no-underline">
              Términos de uso
            </a>
            <a href="#" className="hover:text-slate-600 transition-colors no-underline">
              Privacidad
            </a>
            <a href="#" className="hover:text-slate-600 transition-colors no-underline">
              Contacto
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
