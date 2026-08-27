export default function Footer() {
  return (
    <footer className="bg-paper border-t border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-xs text-muted m-0">
            &copy; {new Date().getFullYear()} Subsecretaría de Recursos Humanos &mdash; Provincia de Formosa
          </p>
          <div className="flex items-center gap-6 text-xs font-semibold uppercase tracking-wide">
            <a href="#" className="text-muted hover:text-ink transition-colors no-underline">
              Términos de uso
            </a>
            <a href="#" className="text-muted hover:text-ink transition-colors no-underline">
              Privacidad
            </a>
            <a href="#" className="text-muted hover:text-ink transition-colors no-underline">
              Contacto
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
