import { useState, useEffect, useRef } from "react";
import { useToast } from "../common/Toast";
import { CardSkeleton } from "./Skeleton";

function AutoTextarea({ value, onChange, className, placeholder, minRows = 2 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, [value]);
  return <textarea ref={ref} value={value} onChange={(e) => { onChange(e); }} className={className} placeholder={placeholder} rows={minRows} style={{ overflow: "hidden", resize: "none" }} />;
}

export default function ChatbotSettings() {
  const addToast = useToast();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState({
    name: "ChatAP",
    welcomeMessage: "¡Hola! Soy ChatAP, el asistente virtual de la Subsecretaría de Recursos Humanos. Estoy aquí para ayudarte con tus consultas sobre licencias, haberes, trámites y más. ¿En qué puedo ayudarte hoy?",
    secondaryMessage: "Podés preguntarme sobre licencias, recibos de haberes, trámites, o escribir 'menú' para ver todas las opciones disponibles.",
    maxHistory: 50,
    autoResponse: true,
    workingHours: "24/7",
    department: "Subsecretaría de Recursos Humanos",
  });

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  function handleSave(e) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    addToast("Configuración guardada correctamente", "success");
  }

  if (loading) return <div className="animate-fade-in"><div className="animate-shimmer h-8 w-48 rounded-lg mb-4" /><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><CardSkeleton lines={4} /><CardSkeleton lines={4} /></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-primary m-0 tracking-tight">Configuración del Chatbot</h1>
          <p className="text-xs text-slate-400 m-0 mt-0.5 font-medium">Personalizá el comportamiento y los mensajes del asistente virtual</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg ${settings.autoResponse ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${settings.autoResponse ? "bg-emerald-500" : "bg-slate-300"}`} />
            {settings.autoResponse ? "Respuestas automáticas activas" : "Respuestas automáticas desactivadas"}
          </span>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 stagger-children">
          <div className="card card-border p-4">
            <h2 className="text-sm font-semibold text-primary m-0 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              Mensajes del Chatbot
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Nombre del asistente</label>
                <input value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Mensaje de bienvenida</label>
                <AutoTextarea value={settings.welcomeMessage} onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Mensaje secundario</label>
                <AutoTextarea value={settings.secondaryMessage} onChange={(e) => setSettings({ ...settings, secondaryMessage: e.target.value })} className="input-field" />
              </div>
            </div>
          </div>

          <div className="card card-border p-4">
            <h2 className="text-sm font-semibold text-primary m-0 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Comportamiento
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600 m-0">Respuestas automáticas</p>
                  <p className="text-[10px] text-slate-400 m-0">El chatbot responde automáticamente basado en la base de conocimiento</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={settings.autoResponse} onChange={(e) => setSettings({ ...settings, autoResponse: e.target.checked })} className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-accent after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                </label>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Horario de atención</label>
                <select value={settings.workingHours} onChange={(e) => setSettings({ ...settings, workingHours: e.target.value })} className="input-field">
                  <option value="24/7">24/7 — Todos los días</option>
                  <option value="08:00-18:00">08:00 — 18:00 hs</option>
                  <option value="08:00-20:00">08:00 — 20:00 hs</option>
                  <option value="09:00-17:00">09:00 — 17:00 hs</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Dependencia</label>
                <input value={settings.department} onChange={(e) => setSettings({ ...settings, department: e.target.value })} className="input-field" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Guardar configuración
          </button>
          {saved && <span className="text-xs text-emerald-600 font-medium animate-fade-in flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Cambios guardados</span>}
        </div>
      </form>
    </div>
  );
}
