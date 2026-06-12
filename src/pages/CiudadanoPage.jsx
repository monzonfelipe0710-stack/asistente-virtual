import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import ChatWindow from "../components/ciudadano/ChatWindow";
import DownloadSection from "../components/ciudadano/DownloadSection";
import ExternalAccess from "../components/ciudadano/ExternalAccess";

export default function CiudadanoPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100/50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 animate-page-enter">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center shadow-sm animate-bounce-in">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div className="animate-slide-right">
              <h1 className="text-xl sm:text-2xl font-semibold text-primary m-0 tracking-tight">
                Asistente Virtual &mdash; ChatAP
              </h1>
              <p className="text-sm text-slate-400 m-0 mt-0.5 font-medium">
                Consultá sobre trámites, documentación y servicios de la Subsecretaría de Recursos Humanos
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 stagger-children">
          <div className="lg:col-span-2">
            <div className="h-[600px] lg:h-[650px]">
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
