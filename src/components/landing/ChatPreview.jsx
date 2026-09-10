import { useState } from "react";
import ChatBotAvatar from "../ChatBotAvatar";
import StatusIndicator from "./StatusIndicator";

const SCENARIOS = [
  {
    id: "recibo",
    label: "Recibo de Haberes",
    userMsg: "Necesito mi recibo de sueldo de este mes",
    botMsg: "Localicé tu liquidación correspondiente al período actual. El documento cuenta con firma digital y verificación criptográfica oficial:",
    attachment: {
      type: "pdf",
      title: "Recibo_Haberes_Periodo_Actual.pdf",
      size: "248 KB · Oficial",
      hash: "SHA-256: 4f8a...91b2 (Verificado)",
    },
    actionLabel: "Descargar PDF Firmado",
  },
  {
    id: "siged",
    label: "Expediente SIGED",
    userMsg: "¿En qué estado está el expediente EXP-2026-0812-RH?",
    botMsg: "Expediente localizado en el Sistema Integrado de Gestión de Expedientes (SIGED). Trazabilidad al instante:",
    attachment: {
      type: "stepper",
      steps: [
        { label: "Mesa General de Entradas", status: "done", date: "09:15 hs" },
        { label: "Dirección de Personal", status: "active", date: "En despacho" },
        { label: "Firma de Resolución", status: "pending", date: "Pendiente" },
      ],
    },
    actionLabel: "Ver Historial Completo",
  },
  {
    id: "licencia",
    label: "Licencia Médica",
    userMsg: "Tengo reposo médico, ¿cómo presento el certificado?",
    botMsg: "Podés adjuntar el certificado médico expedido por profesional matriculado dentro de las 24 hs hábiles. Te dejo el acceso directo:",
    attachment: {
      type: "chips",
      chips: ["Subir Certificado Digital", "Descargar Formulario F-12", "Consultar Junta Médica"],
    },
    actionLabel: "Iniciar Trámite de Licencia",
  },
];

export default function ChatPreview({ className = "", avatarSize = 56 }) {
  const [activeTab, setActiveTab] = useState("recibo");
  const scenario = SCENARIOS.find((s) => s.id === activeTab) || SCENARIOS[0];

  return (
    <div className={`flex flex-col bg-[#0f0f0f] text-white border border-[#f3f1e9]/12 overflow-hidden shadow-2xl ${className}`}>
      <div className="flex border-b border-white/10 bg-[#161616] overflow-x-auto no-scrollbar">
        {SCENARIOS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap border-r border-white/10 ${
                isActive
                  ? "bg-[#0f0f0f] text-brand border-t-2 border-t-brand font-bold"
                  : "text-[#f3f1e9]/50 hover:text-[#f3f1e9] hover:bg-white/[0.02]"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-brand" : "bg-white/20"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5 bg-[#141414]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border border-white/15 bg-white/5 flex items-center justify-center overflow-visible">
              <ChatBotAvatar size={avatarSize} reaction="idle" followMouse={false} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#18bc42] border-2 border-[#141414]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-neue text-xs font-bold uppercase tracking-wider text-[#f3f1e9]">
                ChatAP · Núcleo Inteligente
              </span>
              <span className="px-1.5 py-0.2 font-mono text-[8px] uppercase tracking-widest bg-brand/20 text-brand border border-brand/40">
                IA Oficial
              </span>
            </div>
            <p className="m-0 font-mono text-[9px] uppercase tracking-wider text-[#f3f1e9]/40">
              Subsecretaría de Recursos Humanos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 h-3 px-2 py-1 bg-white/5 border border-white/10 rounded" title="Canal de voz activo">
            <span className="w-1 h-2 bg-brand rounded-full animate-pulse" />
            <span className="w-1 h-3 bg-brand rounded-full animate-pulse delay-100" />
            <span className="w-1 h-1.5 bg-brand rounded-full animate-pulse delay-200" />
          </div>
          <StatusIndicator label="En línea" tone="ok" light />
        </div>
      </div>

      <div className="flex flex-col gap-4 p-5 min-h-[22rem] bg-[#0c0c0c]">
        <div className="flex justify-end animate-fade-in">
          <div className="max-w-[85%] sm:max-w-[75%] px-4 py-3 bg-brand text-[#171717] font-medium text-sm rounded-2xl rounded-tr-sm border border-brand shadow-lg">
            <p className="m-0 leading-relaxed font-neue-text">{scenario.userMsg}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 max-w-[95%] sm:max-w-[85%] animate-fade-up">
          <div className="w-6 h-6 rounded-full bg-brand/10 border border-brand/30 flex items-center justify-center shrink-0 mt-1">
            <span className="font-mono text-[10px] text-brand font-bold">AP</span>
          </div>
          <div className="flex-1">
            <div className="p-4 bg-[#181818] border border-white/10 rounded-2xl rounded-tl-sm text-sm text-[#f3f1e9] leading-relaxed font-neue-text">
              <p className="m-0">{scenario.botMsg}</p>

              {scenario.attachment.type === "pdf" && (
                <div className="mt-3.5 p-3 bg-[#111] border border-brand/30 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-brand/20 text-brand flex items-center justify-center font-mono font-bold text-xs border border-brand/30">
                      PDF
                    </span>
                    <div>
                      <p className="m-0 font-mono text-xs text-[#f3f1e9] font-bold">
                        {scenario.attachment.title}
                      </p>
                      <p className="m-0 font-mono text-[9px] text-[#f3f1e9]/40 mt-0.5">
                        {scenario.attachment.size}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-wider px-2.5 py-1 bg-brand/10 text-brand border border-brand/30 rounded-full">
                    Firma Válida
                  </span>
                </div>
              )}

              {scenario.attachment.type === "stepper" && (
                <div className="mt-3.5 p-3.5 bg-[#111] border border-white/10 rounded-xl space-y-2 font-mono text-xs">
                  {scenario.attachment.steps.map((step, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 py-1 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          step.status === "done" ? "bg-[#18bc42]" : step.status === "active" ? "bg-brand animate-ping" : "bg-white/20"
                        }`} />
                        <span className={step.status === "active" ? "text-brand font-bold" : "text-[#f3f1e9]/80"}>
                          {step.label}
                        </span>
                      </div>
                      <span className="text-[9px] text-[#f3f1e9]/40">{step.date}</span>
                    </div>
                  ))}
                </div>
              )}

              {scenario.attachment.type === "chips" && (
                <div className="mt-3.5 flex flex-wrap gap-2">
                  {scenario.attachment.chips.map((chip, idx) => (
                    <span key={idx} className="px-3 py-1 font-mono text-[10px] bg-white/5 hover:bg-brand/20 border border-white/15 hover:border-brand/40 text-[#f3f1e9]/80 rounded-full transition-colors cursor-pointer">
                      {chip} →
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-2.5 flex items-center gap-3">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#f3f1e9]/40">
                Respuesta Oficial Verificada
              </span>
              <span className="text-brand font-mono text-[10px] font-bold">
                ✓ 0.6s
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 p-3.5 bg-[#141414] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 px-4 py-2.5 bg-[#0c0c0c] border border-white/10 rounded-full text-xs font-mono text-[#f3f1e9]/50">
          <span className="text-brand">›</span>
          <span className="truncate">Escribí tu consulta sobre trámites, sueldos o SIGED...</span>
        </div>
        <span className="terminal-caret" aria-hidden="true" />
      </div>
    </div>
  );
}
