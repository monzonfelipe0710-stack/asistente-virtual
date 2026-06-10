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
        <section className="glass-card relative mb-6 overflow-hidden p-6 sm:p-8 animate-[fadeIn_0.35s_ease-out]">
          <div className="absolute -top-16 right-0 h-32 w-32 rounded-full bg-blue-100/80 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-indigo-100/60 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1.05fr_0.95fr] items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-blue-700 font-semibold">Portal ciudadano</p>
              <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-slate-900 leading-tight">
                Tu asistente virtual para resolver trámites y consultas sin perder tiempo.
              </h1>
              <p className="mt-4 text-slate-600 max-w-2xl text-sm sm:text-base">
                Centralizá información, encontrá formularios y accedé a los servicios de la Subsecretaría de Recursos Humanos con una experiencia más clara y profesional.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-600">
                <span className="glass-chip">Respuesta rápida</span>
                <span className="glass-chip">Accesos directos</span>
                <span className="glass-chip">Documentación actualizada</span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { title: "Trámites", text: "Guía paso a paso para consultas frecuentes." },
                  { title: "Formularios", text: "Descargas rápidas y categorizadas por necesidad." },
                  { title: "Soporte", text: "Canales de ayuda y acceso institucional directo." },
                ].map((item) => (
                  <article key={item.title} className="soft-ring p-4">
                    <p className="text-[11px] uppercase tracking-[0.25em] text-blue-700">{item.title}</p>
                    <p className="mt-2 text-sm text-slate-600">{item.text}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {[
                { label: "Consultas atendidas", value: "24/7", tone: "bg-blue-50 text-blue-800" },
                { label: "Trámites guiados", value: "18", tone: "bg-emerald-50 text-emerald-700" },
                { label: "Formularios", value: "12", tone: "bg-amber-50 text-amber-700" },
                { label: "Atención digital", value: "Online", tone: "bg-indigo-50 text-indigo-700" },
              ].map((item, index) => (
                <article
                  key={item.label}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</p>
                  <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${item.tone}`}>Activo</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
          <div className="h-160">
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
