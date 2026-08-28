export default function QuickReplies({ onSelect }) {
  const options = [
    {
      label: "Consultar Expediente",
      query: "Quiero consultar un expediente",
    },
    {
      label: "Ver Trámites",
      query: "¿Cuáles son los trámites disponibles?",
    },
    {
      label: "Documentación",
      query: "Necesito documentación y formularios",
    },
    {
      label: "Hablar con un Operador",
      query: "Quiero hablar con un operador",
    },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {options.map((opt) => (
        <button
          key={opt.label}
          type="button"
          onClick={() => onSelect(opt.query)}
          className="px-4 py-2 bg-paper border border-brand-deep text-brand-deep text-xs font-semibold uppercase tracking-wide rounded-full cursor-pointer hover:bg-brand-deep hover:text-paper transition-colors duration-300"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
