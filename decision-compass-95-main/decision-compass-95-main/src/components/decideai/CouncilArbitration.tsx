import { useEffect, useState } from "react";

export interface ArbitrationData {
  finalVerdict: string;
  consensusScore: number;
  majorityVote: "optionA" | "optionB" | "split";
  agentSummaries: { pragmatist: string; contrarian: string; philosopher: string };
  tensionPoint: string;
  tiebreaker: string;
  chamberVerdict: string;
}

const voteLabel = (v: string) => v === "optionA" ? "Option A" : v === "optionB" ? "Option B" : "Split";

export const CouncilArbitration = ({ data }: { data: ArbitrationData }) => {
  const [meter, setMeter] = useState(0);
  useEffect(() => { const t = setTimeout(() => setMeter(data.consensusScore), 300); return () => clearTimeout(t); }, [data.consensusScore]);

  const agents = [
    { key: "pragmatist", label: "Pragmatist", icon: "P", color: "hsl(45 70% 60%)", summary: data.agentSummaries.pragmatist },
    { key: "contrarian", label: "Contrarian", icon: "C", color: "hsl(0 72% 65%)", summary: data.agentSummaries.contrarian },
    { key: "philosopher", label: "Philosopher", icon: "Ph", color: "hsl(270 60% 70%)", summary: data.agentSummaries.philosopher },
  ];

  return (
    <div className="council-card animate-fade-up">
      {/* Chamber Verdict */}
      <div className="council-chamber">
        <div className="text-[10px] uppercase tracking-[0.25em] font-semibold text-white/50 mb-3">The Council Has Spoken</div>
        <p className="text-xl md:text-2xl font-bold text-white leading-snug max-w-3xl mx-auto">{data.chamberVerdict}</p>
      </div>

      <div className="p-6 space-y-5">
        {/* Final Verdict */}
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Final Verdict</div>
          <p className="text-lg font-semibold text-foreground">{data.finalVerdict}</p>
        </div>

        {/* Agent Vote Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {agents.map((a) => (
            <div key={a.key} className="council-agent-card">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: a.color, color: "#0a0a14" }}>{a.icon}</span>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: a.color }}>{a.label}</span>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">{a.summary}</p>
            </div>
          ))}
        </div>

        {/* Consensus + Vote */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Consensus</div>
              <span className="text-sm font-bold text-foreground">{data.consensusScore}%</span>
            </div>
            <div className="council-consensus-bar"><div className="council-consensus-fill" style={{ width: `${meter}%` }} /></div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Majority Vote</div>
            <span className="text-sm font-bold text-foreground">{voteLabel(data.majorityVote)}</span>
          </div>
        </div>

        {/* Tension + Tiebreaker */}
        <div className="council-tension">
          <div className="text-[10px] uppercase tracking-[0.15em] font-semibold text-primary mb-1.5">Point of Tension</div>
          <p className="text-sm text-foreground/85 leading-relaxed">{data.tensionPoint}</p>
        </div>
        <div className="council-tension">
          <div className="text-[10px] uppercase tracking-[0.15em] font-semibold text-primary mb-1.5">Tiebreaker</div>
          <p className="text-sm text-foreground/85 leading-relaxed">{data.tiebreaker}</p>
        </div>
      </div>
    </div>
  );
};
