import { useEffect, useState } from "react";

export interface PhilosopherVerdictData {
  verdict: string;
  reasoning: string;
  confidence: number;
  regretRisk: string;
}

export const PhilosopherVerdict = ({ data }: { data: PhilosopherVerdictData }) => {
  const [barWidth, setBarWidth] = useState(0);
  useEffect(() => { const t = setTimeout(() => setBarWidth(data.confidence), 500); return () => clearTimeout(t); }, [data.confidence]);

  return (
    <div className="philosopher-card animate-fade-up" style={{ animationDelay: "0.2s" }}>
      <div className="philosopher-card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "hsl(270 60% 70%)", color: "#0a0a14" }}>Ph</span>
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: "hsl(270 60% 70%)" }}>Regret Minimization</div>
              <div className="text-sm text-muted-foreground">Bezos Framework · Deathbed lens</div>
            </div>
          </div>
          <span className="text-[9px] uppercase tracking-[0.15em] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
            style={{ background: "hsl(270 60% 55% / 0.10)", color: "hsl(270 60% 70%)", border: "1px solid hsl(270 60% 55% / 0.25)" }}>
            Philosopher Lens
          </span>
        </div>
      </div>
      <div className="p-6 space-y-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Verdict</div>
          <p className="text-lg font-bold text-foreground leading-snug">{data.verdict}</p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Identity &amp; Regret Analysis</div>
          <p className="text-[15px] text-foreground/85 leading-relaxed">{data.reasoning}</p>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Conviction Score</div>
            <span className="text-sm font-bold" style={{ color: "hsl(270 60% 70%)" }}>{data.confidence}%</span>
          </div>
          <div className="philosopher-confidence-bar"><div className="philosopher-confidence-fill" style={{ width: `${barWidth}%` }} /></div>
        </div>
        <div className="philosopher-regret">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold" style={{ color: "hsl(270 60% 70%)" }}>RR</span>
            <div className="text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: "hsl(270 60% 70%)" }}>Regret Risk</div>
          </div>
          <p className="text-sm text-foreground/90 font-medium leading-relaxed italic">{data.regretRisk}</p>
        </div>
      </div>
    </div>
  );
};
