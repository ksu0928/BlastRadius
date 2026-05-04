import { useEffect, useState } from "react";

export interface McKinseyVerdictData {
  verdict: string;
  reasoning: string;
  confidence: number;
  keySignal: string;
}

export const McKinseyVerdict = ({ data }: { data: McKinseyVerdictData }) => {
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(data.confidence), 300);
    return () => clearTimeout(t);
  }, [data.confidence]);

  return (
    <div className="mckinsey-card animate-fade-up" style={{ animationDelay: "0.08s" }}>
      <div className="mckinsey-card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: "hsl(45 70% 60%)", color: "#0a0a14" }}>M</span>
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: "hsl(45 70% 60%)" }}>
                Strategic Advisory Lens
              </div>
              <div className="text-sm text-muted-foreground">Cold-eyed financial analysis · No sentiment</div>
            </div>
          </div>
          <span className="text-[9px] uppercase tracking-[0.15em] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
            style={{ background: "hsl(45 50% 50% / 0.10)", color: "hsl(45 70% 60%)", border: "1px solid hsl(45 50% 50% / 0.25)" }}>
            McKinsey Framework
          </span>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Verdict */}
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Verdict</div>
          <p className="text-lg font-bold text-foreground leading-snug">{data.verdict}</p>
        </div>

        {/* Reasoning */}
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Data-Driven Reasoning</div>
          <p className="text-[15px] text-foreground/85 leading-relaxed">{data.reasoning}</p>
        </div>

        {/* Confidence */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Advisory Confidence</div>
            <span className="text-sm font-bold" style={{ color: "hsl(45 70% 60%)" }}>{data.confidence}%</span>
          </div>
          <div className="mckinsey-confidence-bar">
            <div className="mckinsey-confidence-fill" style={{ width: `${barWidth}%` }} />
          </div>
        </div>

        {/* Key Signal */}
        <div className="mckinsey-signal">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm font-bold" style={{ color: "hsl(45 70% 60%)" }}>KEY</span>
            <div className="text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: "hsl(45 70% 60%)" }}>
              Key Signal
            </div>
          </div>
          <p className="text-sm text-foreground/90 font-medium leading-relaxed">{data.keySignal}</p>
        </div>
      </div>
    </div>
  );
};
