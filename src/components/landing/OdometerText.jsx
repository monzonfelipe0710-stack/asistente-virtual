const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export default function OdometerText({ text }) {
  const chars = Array.from(String(text));

  return (
    <span className="odometer" aria-hidden="true">
      {chars.map((ch, i) => {
        if (ch === " " || ch === "\u00a0") {
          return <span key={i} className="inline-block w-[0.35em]" />;
        }
        const extras = [0, 1, 2, 3].map((k) => GLYPHS[(i * 11 + k * 17) % GLYPHS.length]);
        return (
          <span
            key={`${ch}-${i}`}
            className="odometer-slot"
            style={{ "--odometer-i": i }}
          >
            <span className="invisible">{ch}</span>
            <span className="odometer-reel">
              <span>{ch}</span>
              {extras.map((g, k) => (
                <span key={k}>{g}</span>
              ))}
              <span>{ch}</span>
            </span>
          </span>
        );
      })}
    </span>
  );
}
