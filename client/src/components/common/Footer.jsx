export default function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/90 py-6 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center sm:px-6 lg:flex-row lg:px-8 lg:text-left">
        <p className="text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Subsecretaría de Recursos Humanos &mdash; Provincia de Formosa
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
          <a href="#" className="transition hover:text-slate-700">Términos de uso</a>
          <a href="#" className="transition hover:text-slate-700">Privacidad</a>
          <a href="#" className="transition hover:text-slate-700">Contacto</a>
        </div>
      </div>
    </footer>
  );
}
