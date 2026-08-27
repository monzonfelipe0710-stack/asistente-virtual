import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import ChatWindow from "../components/ciudadano/ChatWindow";
import DownloadSection from "../components/ciudadano/DownloadSection";
import ExternalAccess from "../components/ciudadano/ExternalAccess";

export default function CiudadanoPage() {
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-10 border-b border-line pb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-3">
            Asistente Virtual
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-wide text-ink leading-none m-0">
            De la Administración Pública
          </h1>
          <p className="text-sm text-muted mt-4 max-w-2xl">
            Consultá sobre trámites, documentación y servicios de la Subsecretaría de Recursos Humanos.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="h-[600px]">
              <ChatWindow />
            </div>
          </div>

          <div className="space-y-8">
            <DownloadSection />
            <ExternalAccess />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
