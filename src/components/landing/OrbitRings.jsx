import { useId } from "react";

const DEFAULT_PHRASE = "CHATAP · ASISTENTE VIRTUAL · FORMOSA · ";

export default function OrbitRings({
  phrase = DEFAULT_PHRASE,
  rings = 7,
  className = "",
}) {
  const uid = useId().replace(/:/g, "");

  return (
    <div className={`orbit-stage ${className}`} aria-hidden="true">
      {Array.from({ length: rings }, (_, i) => {
        const r = 12 + i * 11.5;
        const pathId = `${uid}-r${i}`;
        const copies = Math.max(2, 8 - i);
        const d = `M 50,50 m -${r},0 a ${r},${r} 0 1,1 ${r * 2},0 a ${r},${r} 0 1,1 -${r * 2},0`;
        return (
          <svg
            key={i}
            className="orbit-ring"
            viewBox="0 0 100 100"
            style={{
              animationDuration: `${28 + i * 9}s`,
              animationDirection: i % 2 === 0 ? "normal" : "reverse",
            }}
          >
            <defs>
              <path id={pathId} d={d} />
            </defs>
            <text>
              <textPath href={`#${pathId}`} startOffset="0%">
                {phrase.repeat(copies)}
              </textPath>
            </text>
          </svg>
        );
      })}
    </div>
  );
}
