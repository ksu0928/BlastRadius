import { useEffect, useState } from "react";

interface Props { score: number; name: string; color: "primary" | "accent" | "muted"; recommended?: boolean; }

export const ScoreRing = ({ score, name, color, recommended }: Props) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const dur = 1400;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(score * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const r = 70, c = 2 * Math.PI * r;
  const dash = (val / 100) * c;
  const stroke = color === "primary" ? "hsl(var(--primary))" : color === "accent" ? "hsl(var(--accent))" : "hsl(215 20% 45%)";

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={180} height={180} className="-rotate-90">
          <circle cx={90} cy={90} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={10} />
          <circle cx={90} cy={90} r={r} fill="none" stroke={stroke} strokeWidth={10} strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`} style={{ transition: "stroke-dasharray 0.1s linear", filter: `drop-shadow(0 0 8px ${stroke})` }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-foreground">{val}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      <div className="mt-4 text-center">
        <div className="font-semibold text-foreground">{name}</div>
        {recommended && <div className="text-xs mt-1 text-primary font-medium">Recommended</div>}
      </div>
    </div>
  );
};
