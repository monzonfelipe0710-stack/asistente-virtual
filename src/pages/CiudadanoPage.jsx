import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import ChatWindow from "../components/ciudadano/ChatWindow";
import DownloadSection from "../components/ciudadano/DownloadSection";
import ExternalAccess from "../components/ciudadano/ExternalAccess";

export default function CiudadanoPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <section className="glass-card p-6 sm:p-8 mb-6 overflow-hidden relative">
          <div className="absolute -top-16 right-0 h-32 w-32 rounded-full bg-blue-100/80 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-blue-700 font-semibold">Portal ciudadano</p>
              <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-slate-900 leading-tight">
                Tu asistente virtual para trámites y consultas institucionales.
              </h1>
              <p className="mt-4 text-slate-600 max-w-2xl text-sm sm:text-base">
                Consultá información, encontrá formularios y accedé a los servicios de la Subsecretaría de Recursos Humanos en un solo lugar.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-600">
                <span className="rounded-full bg-blue-50 px-3 py-1.5">Respuesta rápida</span>
                <span className="rounded-full bg-emerald-50 px-3 py-1.5">Accesos directos</span>
                <span className="rounded-full bg-amber-50 px-3 py-1.5">Documentación actualizada</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {[
                { label: "Consultas atendidas", value: "24/7", tone: "bg-blue-50 text-blue-800" },
                { label: "Trámites guiados", value: "18", tone: "bg-emerald-50 text-emerald-700" },
                { label: "Formularios", value: "12", tone: "bg-amber-50 text-amber-700" },
                { label: "Atención digital", value: "Online", tone: "bg-indigo-50 text-indigo-700" },
              ].map((item) => (
                <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</p>
                  <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${item.tone}`}>Activo</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
          <div className="h-[640px]">
            <ChatWindow />
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
