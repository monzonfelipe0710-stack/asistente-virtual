const ITEMS = [
  "Asistencia al ciudadano",
  "Trámites",
  "Información oficial",
  "24 horas",
  "Sin filas",
  "Transparencia",
  "Acompañamiento",
  "Servicios públicos",
];

function Tick() {
  return <span className="mx-6 inline-block text-brand" aria-hidden="true">✦</span>;
}

export default function Marquee() {
  return (
    <div
      className="band-dark marquee border-b border-line overflow-hidden select-none py-4"
      aria-hidden="true"
    >
      <div className="animate-ticker flex w-max items-center whitespace-nowrap">
        {[0, 1].map((half) => (
          <span
            key={half}
            className="flex items-center text-[11px] font-bold uppercase tracking-[0.24em] text-[#f3f1e9]"
          >
            {ITEMS.map((item) => (
              <span key={item} className="flex items-center">
                <span>{item}</span>
                <Tick />
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}