const MARK = { x: 552, y: 196, r: 26 };

function Portico({ accent = 0 }) {
  const arches = [100, 190, 280, 370, 460, 550, 640];
  return (
    <g stroke="currentColor" strokeWidth={1.6} fill="none" strokeLinecap="round">
      <g opacity={0.35}>
        <line x1="40" y1="560" x2="760" y2="560" />
        <line x1="40" y1="520" x2="760" y2="520" />
        <line x1="40" y1="560" x2="40" y2="596" />
        <line x1="210" y1="560" x2="210" y2="596" />
        <line x1="380" y1="560" x2="380" y2="596" />
        <line x1="550" y1="560" x2="550" y2="596" />
        <line x1="720" y1="560" x2="720" y2="596" />
      </g>
      <g opacity={0.9}>
        <line x1="60" y1="150" x2="740" y2="150" />
        <line x1="60" y1="185" x2="740" y2="185" />
        {arches.map((x) => (
          <g key={x}>
            <path d={`M ${x} 185 A 45 45 0 0 1 ${x + 90} 185`} />
            <line x1={x + 5} y1="185" x2={x + 5} y2="520" />
            <line x1={x + 85} y1="185" x2={x + 85} y2="520" />
          </g>
        ))}
      </g>
      {accent > 0 && (
        <>
          <circle cx={MARK.x} cy={MARK.y} r={MARK.r} opacity={0.9} />
          <circle cx={MARK.x} cy={MARK.y} r={MARK.r - 8} opacity={0.55} />
          <path d={`M ${MARK.x} ${MARK.y - 26} v 52 M ${MARK.x - 26} ${MARK.y} h 52`}
            strokeWidth={0.8}
            opacity={0.5}
          />
        </>
      )}
    </g>
  );
}

function Bubble({ accent = 0 }) {
  return (
    <g stroke="currentColor" strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <g opacity={0.9}>
        <path d="M 96 260 H 616 a 40 40 0 0 1 40 40 v 84 a 40 40 0 0 1 -40 40 H 268 l -60 44 v -44 h -72 a 40 40 0 0 1 -40 -40 v -84 a 40 40 0 0 1 40 -40 z" />
        <g opacity={0.5}>
          <line x1="170" y1="330" x2="300" y2="330" />
          <line x1="170" y1="366" x2="430" y2="366" />
          <line x1="170" y1="402" x2="250" y2="402" />
        </g>
      </g>
      <g opacity={0.85}>
        <path d="M 430 288 a 34 34 0 1 1 -1 0" strokeWidth={1} />
        <circle cx="452" cy="272" r="7.5" fill="currentColor" stroke="none" />
        <path d="M 560 300 l 14 -10 v 20 z" fill="currentColor" stroke="none" opacity={0.8} />
      </g>
      {accent > 0 && (
        <g opacity={0.6}>
          <circle cx={MARK.x} cy={MARK.y} r={MARK.r} />
          <circle cx={MARK.x} cy={MARK.y} r={MARK.r - 8} opacity={0.6} />
        </g>
      )}
    </g>
  );
}

function Docs({ accent = 0 }) {
  return (
    <g stroke="currentColor" strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <g opacity={0.9}>
        <path d="M 220 120 h 360 v 320 q 0 20 -20 20 H 240 q -20 0 -20 -20 z" />
        <path d="M 220 120 v 40 h 40 q 0 -40 -40 -40" />
        <g opacity={0.5}>
          <line x1="300" y1="220" x2="500" y2="220" />
          <line x1="300" y1="264" x2="520" y2="264" />
          <line x1="300" y1="308" x2="450" y2="308" />
          <line x1="300" y1="352" x2="500" y2="352" />
        </g>
      </g>
      <g opacity={0.38}>
        <path d="M 250 360 h 300 v 60 q 0 20 -20 20 H 270 q -20 0 -20 -20 z" />
        <path d="M 250 360 v 24 h 36 q 0 -24 -36 -24" />
      </g>
      {accent > 0 && (
        <g opacity={0.7}>
          <circle cx={MARK.x} cy={MARK.y} r={MARK.r} />
          <circle cx={MARK.x} cy={MARK.y} r={MARK.r - 8} opacity={0.6} />
          <path d={`M ${MARK.x} ${MARK.y - 26} v 52 M ${MARK.x - 26} ${MARK.y} h 52`}
            strokeWidth={0.8}
            opacity={0.5}
          />
        </g>
      )}
    </g>
  );
}

function Grid({ accent = 0 }) {
  const blocks = [
    [90, 150, 150, 110], [286, 150, 150, 110], [482, 150, 150, 110],
    [90, 300, 150, 110], [286, 300, 150, 110], [482, 300, 150, 110],
    [678, 150, 150, 110], [678, 300, 150, 110],
  ];
  return (
    <g stroke="currentColor" strokeWidth={1.4} fill="none" strokeLinecap="round">
      <g opacity={0.85}>
        {blocks.map(([x, y, w, h]) => (
          <g key={`${x}-${y}`}>
            <rect x={x} y={y} width={w} height={h} />
            <rect x={x + 12} y={y + 12} width={w - 24} height={h - 24} opacity={0.4} />
          </g>
        ))}
        <path d="M 66 60 H 836 Q 852 86 826 96 L 438 548 Q 414 560 398 548 H 66 Q 48 540 56 524 L 434 90 Q 440 60 470 60 z" opacity={0.5} />
      </g>
      {accent > 0 && (
        <circle cx={MARK.x} cy={MARK.y} r={MARK.r} opacity={0.7} />
      )}
    </g>
  );
}

const KINDS = { portico: Portico, bubble: Bubble, docs: Docs, grid: Grid };

export default function ImageStage({
  kind = "portico",
  accent = false,
  aspect = "aspect-[4/3] md:aspect-[3/2]",
  tint = "text-ink",
  className = "",
  label = null,
  children = null,
}) {
  const Comp = KINDS[kind] || Portico;
  return (
    <figure className={`relative overflow-hidden ${aspect} ${className}`}>
      <svg
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
        className={`absolute inset-0 h-full w-full ${tint}`}
        aria-hidden="true"
      >
        <Comp accent={accent ? 1 : 0} />
      </svg>
      {children}
      {label ? (
        <figcaption className="absolute left-6 bottom-5 m-0 text-[11px] font-bold uppercase tracking-[0.22em] text-muted">
          {label}
        </figcaption>
      ) : null}
    </figure>
  );
}