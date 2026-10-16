import { Component } from "react";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error("ChatAP runtime error", error, info);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen grid place-items-center bg-paper px-6 py-12 text-ink">
        <section className="w-full max-w-lg rounded-3xl border border-line bg-paper p-8 text-center shadow-lg">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-bad/10 text-bad" aria-hidden="true">
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 9v4m0 4h.01M10.3 3.84 2.9 17a2 2 0 0 0 1.75 3h14.7a2 2 0 0 0 1.75-3L13.7 3.84a2 2 0 0 0-3.4 0Z" />
            </svg>
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted">ChatAP</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Algo salió mal</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
            La aplicación encontró un error inesperado. Podés intentar continuar o recargar la página.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={this.handleRetry} className="btn-ghost">
              Intentar de nuevo
            </button>
            <button type="button" onClick={this.handleReload} className="btn-primary">
              Recargar aplicación
            </button>
          </div>
        </section>
      </main>
    );
  }
}
