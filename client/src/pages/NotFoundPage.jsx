import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-soft to-mist/50">
      <div className="text-center animate-scale-in">
        <div className="text-7xl font-bold text-muted m-0 tracking-tight">404</div>
        <div className="w-16 h-1 bg-linear-to-r from-primary to-primary-light rounded-full mx-auto my-4 opacity-30" />
        <p className="text-base text-muted mb-8 font-medium">Página no encontrada</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-paper text-sm font-medium rounded-xl no-underline hover:bg-primary-light transition duration-200 shadow-sm hover:shadow-md"
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
