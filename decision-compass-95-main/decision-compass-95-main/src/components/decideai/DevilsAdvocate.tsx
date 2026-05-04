import { useEffect, useState } from "react";

export interface DevilsAdvocateData {
  verdict: string;
  reasoning: string;
  confidence: number;
  blindspot: string;
}

export const DevilsAdvocate = ({ data }: { data: DevilsAdvocateData }) => {
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(data.confidence), 400);
    return () => clearTimeout(t);
  }, [data.confidence]);

  return (
    <div className="devils-card animate-fade-up" style={{ animationDelay: "0.14s" }}>
      <div className="devils-card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: "hsl(0 72% 65%)", color: "#0a0a14" }}>D</span>
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: "hsl(0 72% 65%)" }}>
                Devil's Advocate
              </div>
              <div className="text-sm text-muted-foreground">Contrarian analysis · Against your comfort zone</div>
            </div>
          </div>
          <span className="text-[9px] uppercase tracking-[0.15em] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
            style={{ background: "hsl(0 72% 55% / 0.10)", color: "hsl(0 72% 65%)", border: "1px solid hsl(0 72% 55% / 0.25)" }}>
            Contrarian Lens
          </span>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Verdict */}
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Contrarian Verdict</div>
          <p className="text-lg font-bold text-foreground leading-snug">{data.verdict}</p>
        </div>

        {/* Reasoning */}
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">What You're Avoiding</div>
          <p className="text-[15px] text-foreground/85 leading-relaxed">{data.reasoning}</p>
        </div>

        {/* Confidence */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Contrarian Confidence</div>
            <span className="text-sm font-bold" style={{ color: "hsl(0 72% 65%)" }}>{data.confidence}%</span>
          </div>
          <div className="devils-confidence-bar">
            <div className="devils-confidence-fill" style={{ width: `${barWidth}%` }} />
          </div>
        </div>

        {/* Blindspot */}
        <div className="devils-blindspot">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm font-bold text-red-400/80">RE</span>
            <div className="text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: "hsl(0 72% 65%)" }}>
              Your Blindspot
            </div>
          </div>
          <p className="text-sm text-foreground/90 font-medium leading-relaxed italic">{data.blindspot}</p>
        </div>
      </div>
    </div>
  );
};
