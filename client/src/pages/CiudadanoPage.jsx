import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import ChatWindow from "../components/ciudadano/ChatWindow";
import DownloadSection from "../components/ciudadano/DownloadSection";
import ExternalAccess from "../components/ciudadano/ExternalAccess";

export default function CiudadanoPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 m-0">
            Asistente Virtual &mdash; ChatAP
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Consultá sobre trámites, documentación y servicios de la Subsecretaría de Recursos Humanos
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="h-[600px]">
              <ChatWindow />
            </div>
          </div>

          <div className="space-y-6">
            <DownloadSection />
            <ExternalAccess />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
