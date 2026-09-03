export default function QuickReplies({ onSelect }) {
  const options = [
    {
      label: "¿Cómo sigo mi expediente?",
      query: "¿Cómo puedo seguir mi expediente?",
      description: "Consultá el estado de tu trámite",
      icon: "M9 12h6m-6 4h4m-7 4h12a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z",
    },
    {
      label: "¿Cómo pido una licencia?",
      query: "¿Cómo solicito una licencia?",
      description: "Conocé los pasos y requisitos",
      icon: "M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z",
    },
    {
      label: "¿Dónde veo mi recibo?",
      query: "¿Dónde puedo ver mi recibo de sueldo?",
      description: "Accedé a tus recibos de haberes",
      icon: "M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2zm3 5h6m-6 4h6m-6 4h3",
    },
    {
      label: "¿Dónde atienden?",
      query: "¿Dónde puedo hacer una consulta presencial?",
      description: "Encontrá oficinas y horarios",
      icon: "M12 21s7-5.5 7-12a7 7 0 10-14 0c0 6.5 7 12 7 12zm0-9a3 3 0 100-6 3 3 0 000 6z",
    },
  ];

  return (
    <div className="quick-replies">
      <p className="quick-replies-title">Preguntas frecuentes</p>
      <div className="quick-replies-grid">
      {options.map((opt) => (
        <button
          key={opt.label}
          type="button"
          onClick={() => onSelect(opt.query)}
          className="quick-reply-card"
        >
          <span className="quick-reply-icon" aria-hidden="true">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d={opt.icon} />
            </svg>
          </span>
          <span className="quick-reply-copy">
            <span className="quick-reply-label">{opt.label}</span>
            <span className="quick-reply-description">{opt.description}</span>
          </span>
          <svg className="quick-reply-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      ))}
      </div>
    </div>
  );
}
