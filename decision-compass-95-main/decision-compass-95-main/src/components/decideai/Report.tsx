import { Brain, ChevronDown, ChevronUp, Copy, Download, Linkedin, Share2, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { RadarChart } from "./RadarChart";
import { ScoreRing } from "./ScoreRing";
import { McKinseyVerdict } from "./McKinseyVerdict";
import { DevilsAdvocate } from "./DevilsAdvocate";
import { PhilosopherVerdict } from "./PhilosopherVerdict";
import { CouncilArbitration } from "./CouncilArbitration";
import { useEffect, useState } from "react";

export interface BiasDetail {
  bias_name: string;
  trigger_answer: string;
  explanation: string;
  severity: "mild" | "moderate" | "strong";
  reframe: string;
}

export interface Counterfactual {
  premise: string;
  outcome: string;
  flipped: boolean;
}

export interface ReportData {
  summary: string;
  verdict: string;
  optionA: { name: string; score: number };
  optionB: { name: string; score: number };
  dimensions: { optionA: number[]; optionB: number[] };
  analysis: string;
  risks: { optionA: { text: string; severity: "Low" | "Medium" | "High" }[]; optionB: { text: string; severity: "Low" | "Medium" | "High" }[] };
  actionPlan: { week1: string[]; week2: string[]; week3: string[]; week4: string[] };
  closingLine: string;
  // Legacy single bias
  biasName: string;
  biasInsight: string;
  // New multi-bias
  biases?: BiasDetail[];
  // Counterfactuals
  counterfactuals?: Counterfactual[];
  confidenceScore: number;
  advisoryCouncil?: {
    pragmatist: { verdict: string; reasoning: string; confidence: number; keySignal: string };
    contrarian: { verdict: string; reasoning: string; confidence: number; blindspot: string };
    philosopher: { verdict: string; reasoning: string; confidence: number; regretRisk: string };
    arbitration: { finalVerdict: string; consensusScore: number; majorityVote: "optionA" | "optionB" | "split"; agentSummaries: { pragmatist: string; contrarian: string; philosopher: string }; tensionPoint: string; tiebreaker: string; chamberVerdict: string };
  };
}

const sevClass = (s: string) => s === "Low" ? "badge-sev-low" : s === "Medium" ? "badge-sev-medium" : "badge-sev-high";

const biasSevClass = (s: string) =>
  s === "mild" ? "bias-sev-mild" : s === "moderate" ? "bias-sev-moderate" : "bias-sev-strong";

const biasSevLabel = (s: string) =>
  s === "mild" ? "Mild" : s === "moderate" ? "Moderate" : "Strong";

const confidenceGradient = (score: number) => {
  if (score >= 75) return "linear-gradient(90deg, #10b981, #34d399)";
  if (score >= 50) return "linear-gradient(90deg, #f59e0b, #fbbf24)";
  return "linear-gradient(90deg, #ef4444, #f87171)";
};

const confidenceLabel = (score: number) => {
  if (score >= 80) return "High Confidence";
  if (score >= 60) return "Moderate Confidence";
  return "Low Confidence — consider gathering more data";
};

export const Report = ({ data, onRestart, analysisDuration }: { data: ReportData; onRestart: () => void; analysisDuration?: number }) => {
  const council = data.advisoryCouncil;
  const winner = data.optionA.score >= data.optionB.score ? "A" : "B";
  const [barWidth, setBarWidth] = useState(0);
  const [expandedBias, setExpandedBias] = useState<number | null>(0);
  const [showCounterfactual, setShowCounterfactual] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(data.confidenceScore), 200);
    return () => clearTimeout(t);
  }, [data.confidenceScore]);

  const confidenceColor =
    data.confidenceScore >= 75
      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
      : data.confidenceScore >= 50
      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
      : "bg-red-500/20 text-red-300 border-red-500/30";

  const biases = data.biases && data.biases.length > 0
    ? data.biases
    : [{ bias_name: data.biasName, trigger_answer: "", explanation: data.biasInsight, severity: "moderate" as const, reframe: "" }];

  const copyReport = async () => {
    const biasText = biases.map(b => `• ${b.bias_name} (${b.severity}): ${b.explanation}`).join("\n");
    const mckText = mckinseyVerdict ? `\n\n--- MCKINSEY STRATEGIC LENS ---\nVerdict: ${mckinseyVerdict.verdict}\n${mckinseyVerdict.reasoning}\nKey Signal: ${mckinseyVerdict.keySignal}\nConfidence: ${mckinseyVerdict.confidence}%` : "";
    const text = `DECIDEAI — DECISION INTELLIGENCE REPORT\n\nVERDICT: ${data.verdict}\nAI Confidence: ${data.confidenceScore}%\n\n${data.summary}\n\n--- ANALYSIS ---\n${data.analysis}\n\nCognitive Biases Detected:\n${biasText}${mckText}\n\n--- ${data.optionA.name} (${data.optionA.score}/100) ---\nRisks:\n${data.risks.optionA.map(r => `• [${r.severity}] ${r.text}`).join("\n")}\n\n--- ${data.optionB.name} (${data.optionB.score}/100) ---\nRisks:\n${data.risks.optionB.map(r => `• [${r.severity}] ${r.text}`).join("\n")}\n\n--- 30-DAY ACTION PLAN ---\nWeek 1:\n${data.actionPlan.week1.map(x => `• ${x}`).join("\n")}\nWeek 2:\n${data.actionPlan.week2.map(x => `• ${x}`).join("\n")}\nWeek 3:\n${data.actionPlan.week3.map(x => `• ${x}`).join("\n")}\nWeek 4:\n${data.actionPlan.week4.map(x => `• ${x}`).join("\n")}\n\n"${data.closingLine}"\n\n— Generated by DecideAI · Decision Intelligence`;
    await navigator.clipboard.writeText(text);
    toast.success("Full report copied to clipboard");
  };

  const shareLinkedIn = async () => {
    const mainBias = biases[0]?.bias_name || data.biasName;
    const text = `I just ran my career decision through DecideAI — an agentic decision intelligence engine.\n\nVerdict: ${data.verdict}\nConfidence: ${data.confidenceScore}/100\nMain bias detected: ${mainBias}\n\n${biases.length > 1 ? `Also flagged: ${biases.slice(1).map(b => b.bias_name).join(", ")}\n\n` : ""}"${data.closingLine}"\n\nTry it -> https://decideai.app\n\n#DecideAI #CareerDecisions #BehavioralEconomics #AI`;
    await navigator.clipboard.writeText(text);
    toast.success("LinkedIn post copied — paste it on LinkedIn!");
  };

  const shareReport = async () => {
    const text = `*DecideAI — Decision Intelligence Report*\n\nVerdict: ${data.verdict}\nAI Confidence: ${data.confidenceScore}%\n\n${data.optionA.name}: ${data.optionA.score}/100\n${data.optionB.name}: ${data.optionB.score}/100\n\nBiases Detected: ${biases.map(b => b.bias_name).join(", ")}\n\n"${data.closingLine}"\n\n— Generated by DecideAI`;
    await navigator.clipboard.writeText(text);
    toast.success("Shareable summary copied — paste to WhatsApp or LinkedIn!");
  };

  const weeks = [
    { label: "Week 1", subtitle: "Validate Assumptions", items: data.actionPlan.week1 },
    { label: "Week 2", subtitle: "Run Experiments", items: data.actionPlan.week2 },
    { label: "Week 3", subtitle: "Reassess with Data", items: data.actionPlan.week3 },
    { label: "Week 4", subtitle: "Commit or Pivot", items: data.actionPlan.week4 },
  ];

  const downloadPDF = () => {
    try {
      const jspdf = (window as any).jspdf;
      if (!jspdf) { toast.error("PDF library loading. Please try again."); return; }
      const { jsPDF } = jspdf;
      const doc = new jsPDF();
      let y = 20;
      const addText = (text: string, size: number, color: number[], maxW = 170) => {
        doc.setFontSize(size);
        doc.setTextColor(color[0], color[1], color[2]);
        const lines = doc.splitTextToSize(text, maxW);
        for (const line of lines) {
          if (y > 275) { doc.addPage(); y = 20; }
          doc.text(line, 20, y); y += size * 0.5 + 1;
        }
        y += 3;
      };
      addText("DecideAI — Decision Intelligence Report", 18, [99, 102, 241]);
      addText(`Generated ${new Date().toLocaleString()} | AI Confidence: ${data.confidenceScore}%`, 9, [100, 116, 139]);
      doc.setDrawColor(99, 102, 241); doc.line(20, y, 190, y); y += 8;
      addText("VERDICT", 14, [30, 41, 59]);
      addText(data.verdict, 11, [51, 65, 85]);
      addText(`${data.optionA.name}: ${data.optionA.score}/100  |  ${data.optionB.name}: ${data.optionB.score}/100`, 10, [71, 85, 105]);
      y += 4;
      addText("COGNITIVE BIASES DETECTED", 13, [245, 158, 11]);
      biases.forEach(b => { addText(`${b.bias_name} (${b.severity}): ${b.explanation}`, 9, [71, 85, 105]); });
      y += 4;
      addText("ANALYSIS", 14, [30, 41, 59]);
      addText(data.analysis.replace(/\n\n/g, "\n"), 9, [51, 65, 85]);
      y += 4;
      addText("RISK MATRIX", 14, [30, 41, 59]);
      addText(`${data.optionA.name}:`, 11, [51, 65, 85]);
      data.risks.optionA.forEach(r => addText(`• [${r.severity}] ${r.text}`, 9, [71, 85, 105]));
      y += 2;
      addText(`${data.optionB.name}:`, 11, [51, 65, 85]);
      data.risks.optionB.forEach(r => addText(`• [${r.severity}] ${r.text}`, 9, [71, 85, 105]));
      y += 4;
      addText("30-DAY ACTION PLAN", 14, [30, 41, 59]);
      weeks.forEach(w => { addText(`${w.label} — ${w.subtitle}:`, 11, [99, 102, 241]); w.items.forEach(it => addText(`• ${it}`, 9, [71, 85, 105])); });
      y += 6;
      if (mckinseyVerdict) {
        addText("MCKINSEY STRATEGIC LENS", 14, [180, 140, 50]);
        addText(`Verdict: ${mckinseyVerdict.verdict}`, 11, [51, 65, 85]);
        addText(mckinseyVerdict.reasoning, 9, [71, 85, 105]);
        addText(`Key Signal: ${mckinseyVerdict.keySignal}`, 9, [180, 140, 50]);
        addText(`Confidence: ${mckinseyVerdict.confidence}%`, 9, [100, 116, 139]);
        y += 4;
      }
      addText(`"${data.closingLine}"`, 11, [99, 102, 241]);
      addText("\nGenerated by DecideAI — Agentic Career Decision Intelligence", 8, [100, 116, 139]);
      doc.save("DecideAI-Report.pdf");
      toast.success("PDF downloaded!");
    } catch { toast.error("PDF generation failed. Try Copy instead."); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 animate-fade-up">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 no-print">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">DecideAI Report</div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mt-1">Your Decision Intelligence Report</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <p className="text-slate-500 text-xs tracking-wide">Generated by DecideAI · Powered by Claude · Session-only</p>
            {analysisDuration && (
              <span className="timer-badge">
                <Zap size={12} /> Analyzed in {analysisDuration.toFixed(1)}s
              </span>
            )}
          </div>
          <div className="text-sm text-muted-foreground mt-1">Generated {new Date().toLocaleString()}</div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={shareLinkedIn} className="btn-outline text-sm"><Linkedin size={16} /> LinkedIn</button>
          <button onClick={shareReport} className="btn-outline text-sm"><Share2 size={16} /> Share</button>
          <button onClick={copyReport} className="btn-outline text-sm"><Copy size={16} /> Copy</button>
          <button onClick={downloadPDF} className="btn-outline text-sm"><Download size={16} /> PDF</button>
          <button onClick={onRestart} className="btn-primary text-sm"><Sparkles size={16} /> New Decision</button>
        </div>
      </div>

      <div className="space-y-6">

        {/* ═══ SECTION 0: AI CONFIDENCE BAR ═══ */}
        <div className="surface-card p-6 animate-fade-up">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Analysis Confidence: {data.confidenceScore}%</div>
            <span className={`text-xs font-medium px-3 py-1 rounded-full border ${confidenceColor}`}>
              {confidenceLabel(data.confidenceScore)}
            </span>
          </div>
          <div className="confidence-bar">
            <div
              className="confidence-bar-fill"
              style={{ width: `${barWidth}%`, background: confidenceGradient(data.confidenceScore) }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-2">Based on response depth and signal clarity</div>
        </div>

        {/* ═══ SECTION 1: VERDICT HERO CARD WITH SCORE RINGS ═══ */}
        <div className="surface-card-glow p-8 animate-fade-up">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Decision Summary</div>
          <p className="text-xl md:text-2xl font-semibold text-foreground leading-relaxed">{data.summary}</p>

          <div className="mt-6 p-5 rounded-lg" style={{ border: "1.5px solid hsl(239 84% 67% / 0.4)", background: "hsl(239 84% 67% / 0.08)" }}>
            <div className="text-xs uppercase tracking-wider text-primary font-semibold mb-1">Based on your profile, we recommend:</div>
            <div className="text-2xl md:text-3xl font-bold text-foreground">{data.verdict}</div>
          </div>

          <div className="grid grid-cols-2 gap-8 mt-8">
            <ScoreRing score={data.optionA.score} name={data.optionA.name} color={winner === "A" ? "primary" : "muted"} recommended={winner === "A"} />
            <ScoreRing score={data.optionB.score} name={data.optionB.name} color={winner === "B" ? "primary" : "muted"} recommended={winner === "B"} />
          </div>
        </div>

        {/* ═══ SECTION 1.5: ADVISORY COUNCIL ═══ */}
        {council && (
          <div className="space-y-4 animate-fade-up">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl font-bold text-primary">III</span>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Decision Council</div>
                <div className="text-lg font-bold text-foreground">3 AI Advisors · 1 Arbitrated Verdict</div>
              </div>
            </div>
            <CouncilArbitration data={council.arbitration} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <McKinseyVerdict data={council.pragmatist} />
              <DevilsAdvocate data={council.contrarian} />
              <PhilosopherVerdict data={council.philosopher} />
            </div>
          </div>
        )}

        {/* ═══ SECTION 2: BIAS SPOTLIGHT — 3 EXPANDABLE CARDS ═══ */}
        <div className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-3 mb-4">
            <Brain size={28} className="text-amber-400" />
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-amber-400/80 font-semibold">Cognitive Biases Detected</div>
              <div className="text-lg font-bold text-foreground">{biases.length} bias{biases.length !== 1 ? "es" : ""} identified in your reasoning</div>
            </div>
          </div>
          <div className="space-y-3">
            {biases.map((bias, idx) => {
              const isExpanded = expandedBias === idx;
              return (
                <div
                  key={idx}
                  className="bias-card"
                  style={{ animationDelay: `${idx * 0.12}s` }}
                >
                  <button
                    onClick={() => setExpandedBias(isExpanded ? null : idx)}
                    className="w-full flex items-center justify-between gap-3 text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-6 h-6 rounded-full shrink-0 ${idx === 0 ? "bg-red-500" : idx === 1 ? "bg-amber-500" : "bg-yellow-400"}`} />
                      <div className="min-w-0">
                        <div className="font-bold text-lg text-foreground">{bias.bias_name}</div>
                        {bias.trigger_answer && (
                          <div className="text-xs text-amber-400/60 mt-0.5 truncate">Triggered by: "{bias.trigger_answer}"</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`${biasSevClass(bias.severity)}`}>{biasSevLabel(bias.severity)}</span>
                      {isExpanded ? <ChevronUp size={18} className="text-amber-400/60" /> : <ChevronDown size={18} className="text-amber-400/60" />}
                    </div>
                  </button>
                  <div className={`bias-card-body ${isExpanded ? "bias-card-body-open" : ""}`}>
                    <div className="pt-4 space-y-3">
                      <p className="text-slate-300 text-[15px] leading-relaxed">{bias.explanation}</p>
                      {bias.reframe && (
                        <div className="rounded-lg p-3" style={{ background: "hsl(239 84% 67% / 0.08)", border: "1px solid hsl(239 84% 67% / 0.25)" }}>
                          <div className="text-[10px] uppercase tracking-widest text-primary font-semibold mb-1">Cognitive Reframe</div>
                          <p className="text-sm text-foreground/90 italic">{bias.reframe}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-4 px-1">
            <p className="text-amber-500/50 text-xs italic">Awareness alone reduces bias influence by ~30%.</p>
            <span className="text-[10px] uppercase tracking-[0.15em] text-amber-400/60 font-semibold whitespace-nowrap">Behavioral Economics Layer</span>
          </div>
        </div>

        {/* ═══ SECTION 3: 6-DIMENSION RADAR CHART ═══ */}
        <div className="surface-card p-8 animate-fade-up">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-6">6-Dimension Analysis</div>
          <RadarChart
            axes={["Financial", "Career Growth", "Risk Profile", "Personal Fit", "Market Timing", "Long-term"]}
            optionA={{ name: data.optionA.name, values: data.dimensions.optionA }}
            optionB={{ name: data.optionB.name, values: data.dimensions.optionB }}
          />
        </div>

        {/* ═══ SECTION 4: WHAT IF? COUNTERFACTUAL ANALYSIS ═══ */}
        {data.counterfactuals && data.counterfactuals.length > 0 && (
          <div className="surface-card overflow-hidden animate-fade-up">
            <button
              onClick={() => setShowCounterfactual(!showCounterfactual)}
              className="w-full p-6 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Sparkles size={24} className="text-primary" />
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Counterfactual Analysis</div>
                  <div className="text-lg font-bold text-foreground">What If?</div>
                </div>
              </div>
              <div className={`transition-transform duration-300 ${showCounterfactual ? "rotate-180" : ""}`}>
                <ChevronDown size={20} className="text-primary" />
              </div>
            </button>
            <div className={`counterfactual-panel ${showCounterfactual ? "counterfactual-panel-open" : ""}`}>
              <div className="px-6 pb-6 space-y-3">
                {data.counterfactuals.map((cf, i) => (
                  <div key={i} className="counterfactual-card">
                    <div className="flex items-start gap-3">
                      <span className="text-sm font-bold shrink-0 mt-0.5 text-primary">{cf.flipped ? "FLIP" : "HOLD"}</span>
                      <div>
                        <div className="font-semibold text-foreground">
                          {cf.premise}…
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{cf.outcome}</p>
                        {cf.flipped && (
                          <span className="inline-block mt-2 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded" style={{ background: "hsl(0 84% 60% / 0.15)", color: "hsl(0 84% 60%)" }}>
                            Verdict Flips
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ SECTION 5: ANALYSIS ═══ */}
        <div className="surface-card p-8 animate-fade-up">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Why This Recommendation</div>
          <div className="space-y-4">
            {data.analysis.split(/\n\n+/).map((p, i) => {
              const isBiasCheck = p.startsWith("Bias Check") || p.toLowerCase().startsWith("bias check");
              if (isBiasCheck) {
                return (
                  <div key={i} className="rounded-lg p-5 mt-2" style={{ border: "1px solid rgba(245, 158, 11, 0.35)", background: "rgba(245, 158, 11, 0.08)" }}>
                    <div className="text-xs uppercase tracking-wider text-amber-400 font-semibold mb-2">Cognitive Bias Detection</div>
                    <p className="text-foreground/90 leading-relaxed text-[15px]">{p.replace(/^Bias Check:\s*/i, "")}</p>
                  </div>
                );
              }
              return <p key={i} className="text-foreground/90 leading-relaxed text-[15px]">{p}</p>;
            })}
          </div>
        </div>

        {/* ═══ SECTION 6: RISK MATRIX ═══ */}
        <div className="surface-card p-8 animate-fade-up">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-6">Risk Matrix</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(["optionA", "optionB"] as const).map((k) => (
              <div key={k}>
                <div className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  {data[k].name}
                  {((winner === "A" && k === "optionA") || (winner === "B" && k === "optionB")) && (
                    <span className="text-[10px] text-primary font-medium px-2 py-0.5 rounded-full" style={{ background: "hsl(239 84% 67% / 0.12)", border: "1px solid hsl(239 84% 67% / 0.3)" }}>Recommended</span>
                  )}
                </div>
                <div className="space-y-2">
                  {data.risks[k].map((r, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                      <span className={`${sevClass(r.severity)} shrink-0 mt-0.5`}>{r.severity}</span>
                      <span className="text-sm text-foreground/90 flex-1">{r.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ SECTION 7: 30-DAY ACTION PLAN ═══ */}
        <div className="surface-card p-8 animate-fade-up">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-6">30-Day Action Plan</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weeks.map((w, i) => (
              <div key={i} className="rounded-lg p-5" style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0" style={{ background: "var(--gradient-primary)", boxShadow: "0 0 12px hsl(239 84% 67% / 0.4)" }}>
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-primary text-sm">{w.label}</div>
                    <div className="text-xs text-muted-foreground">{w.subtitle}</div>
                  </div>
                </div>
                <ul className="space-y-1.5 ml-11">
                  {w.items.map((it, j) => <li key={j} className="text-foreground/90 text-[14px] leading-relaxed">• {it}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ SECTION 8: CLOSING LINE ═══ */}
        <div className="rounded-xl p-10 text-center animate-fade-up" style={{ background: "var(--gradient-primary)" }}>
          <div className="text-xs uppercase tracking-[0.2em] text-white/70 mb-3">One Line to Remember</div>
          <p className="font-serif-italic text-2xl md:text-3xl text-white leading-snug max-w-3xl mx-auto">"{data.closingLine}"</p>
        </div>

        {/* ─── Bottom Actions ─── */}
        <div className="flex justify-center gap-3 flex-wrap no-print">
          <button onClick={copyReport} className="btn-outline text-sm"><Copy size={16} /> Copy Report</button>
          <button onClick={downloadPDF} className="btn-outline text-sm"><Download size={16} /> Download PDF</button>
          <button onClick={shareLinkedIn} className="btn-outline text-sm"><Linkedin size={16} /> Share on LinkedIn</button>
        </div>

        <div className="text-center text-xs text-muted-foreground py-6 no-print">Privacy First — your data never left this session</div>
      </div>
    </div>
  );
};
