import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100/50">
      <div className="text-center animate-scale-in">
        <div className="text-7xl font-bold text-slate-200 m-0 tracking-tight">404</div>
        <div className="w-16 h-1 bg-gradient-to-r from-primary to-primary-light rounded-full mx-auto my-4 opacity-30" />
        <p className="text-base text-slate-400 mb-8 font-medium animate-list-item stagger-1">Página no encontrada</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl no-underline hover:bg-primary-light transition-all duration-200 shadow-sm hover:shadow-md animate-list-item stagger-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
