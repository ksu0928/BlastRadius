import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Brain, ChevronLeft, Lock, PlayCircle, RefreshCw, Sparkles, Target, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { NeuralBg } from "@/components/decideai/NeuralBg";
import { Loading } from "@/components/decideai/Loading";
import { Report, type ReportData } from "@/components/decideai/Report";
import { MOCK_REPORT, SAMPLE_ANSWERS, SAMPLE_SITUATION } from "@/components/decideai/mockData";

type Stage = "landing" | "input" | "interview" | "loadingReport" | "report" | "error";
interface Question { id: number; text: string; dimension: string; intent?: string; follow_up_hint?: string; }

const SCENARIOS: Record<string, string> = {
  "Job Switch": "I'm a Senior Engineer at TCS (₹14L CTC, 4 years). I have an offer from Razorpay at ₹26L but it requires relocating to Bangalore from Pune where my family lives. I enjoy my current team but feel stagnant.",
  "MBA vs Job": "I got into IIM Ahmedabad (₹25L fees for 2 years). At the same time, I have a ₹22L offer from Microsoft India as SDE-2. I have 3 years of experience and I'm not sure if an MBA will actually accelerate my tech career.",
  "Startup vs MNC": "I'm 25, working at Infosys (₹10L). A YC-backed startup in Bangalore is offering ₹15L + 0.3% equity with 20 people. They just raised their seed round. Infosys is stable but I feel like I'm wasting my potential.",
  "Relocation Decision": "I have an offer from Amazon in Seattle ($150K USD) but I'd have to leave my role at Flipkart (₹32L CTC) and move away from family in India. My parents are aging and I'm the only child.",
};

const DIMENSIONS = ["Financial Impact", "Career Growth", "Risk Level", "Personal Values", "Market Trends", "Long-term Fit"];

const Index = () => {
  const [stage, setStage] = useState<Stage>("landing");
  const [situation, setSituation] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [report, setReport] = useState<ReportData | null>(null);
  const [errMsg, setErrMsg] = useState("");
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [analysisStartTime, setAnalysisStartTime] = useState<number | null>(null);
  const [analysisDuration, setAnalysisDuration] = useState<number | null>(null);
  const [retryFn, setRetryFn] = useState<(() => void) | null>(null);

  /* ---------- API CALLS ---------- */
  const startAnalysis = async () => {
    if (situation.trim().length < 50) {
      toast.error("Please describe your situation in more detail (at least 50 characters).");
      return;
    }
    setLoadingQuestions(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-questions", { body: { situation } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const qs: Question[] = (data?.questions || []).slice(0, 5);
      if (qs.length < 5) throw new Error("Couldn't generate enough questions. Please try again.");
      setQuestions(qs);
      setAnswers([]);
      setQIdx(0);
      setCurrentAnswer("");
      setStage("interview");
    } catch (e: any) {
      toast.error(e.message || "Failed to start analysis");
      setErrMsg(e.message || "Failed to generate questions");
      setRetryFn(() => startAnalysis);
      setStage("error");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const submitAnswer = async () => {
    if (currentAnswer.trim().length < 20) return;
    const updated = [...answers, currentAnswer.trim()];
    setAnswers(updated);
    setCurrentAnswer("");
    if (qIdx < questions.length - 1) {
      setQIdx(qIdx + 1);
    } else {
      await generateReport(updated);
    }
  };

  const generateReport = async (allAnswers: string[]) => {
    setStage("loadingReport");
    setAnalysisStartTime(Date.now());
    const minDelay = new Promise((r) => setTimeout(r, 3500));
    try {
      const qa = questions.map((q, i) => ({ question: q.text, dimension: q.dimension, answer: allAnswers[i] }));
      const [{ data, error }] = await Promise.all([
        supabase.functions.invoke("generate-report", { body: { situation, qa } }),
        minDelay,
      ]);
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setReport(data as ReportData);
      setStage("report");
    } catch (e: any) {
      setErrMsg(e.message || "Something went wrong generating the report");
      setRetryFn(() => () => generateReport(allAnswers));
      setStage("error");
    }
  };

  // Calculate duration when report is ready
  useEffect(() => {
    if (stage === "report" && analysisStartTime) {
      setAnalysisDuration((Date.now() - analysisStartTime) / 1000);
    }
  }, [stage, analysisStartTime]);

  /* ---------- DEMO MODE ---------- */
  const runDemo = async () => {
    setSituation(SAMPLE_SITUATION);
    setQuestions([
      { id: 1, text: "Google's ₹28L is locked in. What's your honest 18-month revenue projection for the startup if you stay full-time?", dimension: "Financial Impact", intent: "Surface whether the user has modeled the startup revenue path or is guessing.", follow_up_hint: "Have you validated that projection with your pilot customers?" },
      { id: 2, text: "If the startup fails in 6 months, how long would it realistically take you to land another Google-level offer?", dimension: "Risk Level", intent: "Gauge actual downside risk tolerance and recovery timeline.", follow_up_hint: "What's your worst-case scenario and can your savings cover it?" },
      { id: 3, text: "What specific skills will Google give you in year one that running the startup cannot?", dimension: "Career Growth", intent: "Test whether Google is valued for real skill gaps or just brand prestige.", follow_up_hint: "Could you get those skills another way — courses, mentors, open source?" },
      { id: 4, text: "At 30, which version of you feels more like you — the Googler or the founder?", dimension: "Personal Values", intent: "Surface identity alignment to determine intrinsic motivation direction.", follow_up_hint: "If money were equal, which path would you choose?" },
      { id: 5, text: "Your co-founder — if you leave, what happens to her and to that relationship?", dimension: "Long-term Fit", intent: "Reveal the weight of relational and moral obligations.", follow_up_hint: "Have you had the direct conversation about this possibility?" },
    ]);
    setAnswers(SAMPLE_ANSWERS);
    setQIdx(4);
    setAnalysisStartTime(Date.now());
    setStage("loadingReport");
    await new Promise((r) => setTimeout(r, 3500));
    setAnalysisDuration(4.2);
    setReport(MOCK_REPORT as ReportData);
    setStage("report");
  };

  const reset = () => {
    setStage("landing"); setSituation(""); setQuestions([]); setAnswers([]); setQIdx(0);
    setCurrentAnswer(""); setReport(null); setAnalysisStartTime(null); setAnalysisDuration(null); setRetryFn(null);
  };

  /* ---------- RENDER ---------- */
  if (stage === "landing") return <Landing onStart={() => setStage("input")} onDemo={runDemo} />;
  if (stage === "input") return <InputScreen value={situation} onChange={setSituation} onSubmit={startAnalysis} loading={loadingQuestions} onBack={() => setStage("landing")} />;
  if (stage === "interview") return (
    <Interview
      situation={situation}
      questions={questions}
      qIdx={qIdx}
      answers={answers}
      currentAnswer={currentAnswer}
      setCurrentAnswer={setCurrentAnswer}
      onSubmit={submitAnswer}
    />
  );
  if (stage === "loadingReport") return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loading label="Synthesizing your decision intelligence" />
    </div>
  );
  if (stage === "report" && report) return <Report data={report} onRestart={reset} analysisDuration={analysisDuration ?? undefined} />;
  if (stage === "error") return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="surface-card-glow p-8 max-w-md text-center animate-fade-up">
        <div className="text-5xl mb-4">!</div>
        <div className="text-2xl font-bold mb-2">Something went wrong</div>
        <p className="text-muted-foreground mb-6">{errMsg || "An unexpected error occurred. Please try again."}</p>
        <div className="flex gap-3 justify-center">
          {retryFn && (
            <button onClick={() => { setStage("loadingReport"); retryFn(); }} className="btn-primary">
              <RefreshCw size={18} /> Retry
            </button>
          )}
          <button onClick={reset} className="btn-outline">Start Over</button>
        </div>
      </div>
    </div>
  );
  return null;
};

/* ============================================================
   LANDING
============================================================ */
const Landing = ({ onStart, onDemo }: { onStart: () => void; onDemo: () => void }) => (
  <div className="relative min-h-screen overflow-hidden bg-background">
    <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
    <div className="absolute inset-0"><NeuralBg /></div>
    <div className="relative">
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="DecideAI" className="h-8 w-auto" />
          <span className="font-bold text-lg tracking-tight">DecideAI</span>
        </div>
        <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-2"><Lock size={12} /> Privacy First · Zero Data Stored</div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-16 md:pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground mb-6 animate-fade-up" style={{ background: "rgba(255,255,255,0.03)" }}>
          <Sparkles size={12} className="text-primary" /> Agentic Career Decision Intelligence
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.05] animate-fade-up">
          Stop Guessing.<br /><span className="text-gradient">Start Deciding.</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mt-6 max-w-2xl mx-auto animate-fade-up">
          The world's first behavioral economics engine for career decisions. Detects cognitive biases. Delivers verdicts.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10 animate-fade-up">
          <button onClick={onStart} className="btn-primary text-base">Analyze My Career Move <ArrowRight size={18} /></button>
          <button onClick={onDemo} className="btn-outline text-base"><PlayCircle size={18} /> Watch Demo</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-20">
          {[
            { icon: Brain, title: "Bias Detection", desc: "Identifies cognitive biases like FOMO, sunk cost, and loss aversion hiding in your reasoning — then adjusts the recommendation." },
            { icon: Target, title: "6-Dimension Scoring", desc: "Calibrated scoring across Financial Impact, Career Growth, Risk Level, Personal Values, Market Trends, and Long-term Fit." },
            { icon: Zap, title: "Opinionated Verdicts", desc: "No hedging, no 'it depends.' DecideAI picks one option and defends it with McKinsey-level conviction and a 30-day action plan." },
          ].map((f, i) => (
            <div key={i} className="surface-card p-6 text-left animate-fade-up" style={{ animationDelay: `${i * 0.12}s` }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: "hsl(239 84% 67% / 0.15)" }}><f.icon size={20} className="text-primary" /></div>
              <div className="font-semibold text-lg mb-2">{f.title}</div>
              <div className="text-sm text-muted-foreground leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Market stat banner */}
        <div className="mt-16 surface-card p-5 max-w-2xl mx-auto text-center animate-fade-up">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="text-2xl font-bold text-gradient">74%</span> of professionals regret their last major career move. <span className="text-foreground font-medium">DecideAI exists to change that.</span>
          </p>
        </div>

        <div className="mt-6 inline-flex items-center gap-2 text-xs text-muted-foreground"><Lock size={12} /> Session-only. Zero data stored.</div>

        {/* Scalability roadmap */}
        <div className="mt-14 max-w-xl mx-auto text-center animate-fade-up">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground/60 font-semibold mb-3">Built to Scale</div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground/70">
            <div className="surface-card p-2.5">Phase 1: Session-based privacy-first analysis <span className="text-primary font-medium">(current)</span></div>
            <div className="surface-card p-2.5">Phase 2: Optional accounts with decision history tracking</div>
            <div className="surface-card p-2.5">Phase 3: Team/Manager mode for organizational decisions</div>
            <div className="surface-card p-2.5">Phase 4: API for HR platforms (Darwinbox, Keka, Workday)</div>
          </div>
        </div>
      </main>
    </div>
  </div>
);

/* ============================================================
   INPUT
============================================================ */
const InputScreen = ({ value, onChange, onSubmit, loading, onBack }: any) => {
  const [active, setActive] = useState<string | null>(null);
  const pickScenario = (k: string) => {
    setActive(k);
    onChange(SCENARIOS[k]);
  };
  const fillSample = () => { setActive(null); onChange(SAMPLE_SITUATION); };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={18} />
          <img src="/logo.png" alt="DecideAI" className="h-8 w-auto" />
          <span className="font-bold text-foreground">DecideAI</span>
        </button>
      </header>
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-[680px]">
          <div className="text-center mb-8 animate-fade-up">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">What's the decision on your mind?</h1>
            <p className="text-muted-foreground mt-3">The more context you give, the sharper the analysis.</p>
          </div>

          <div className="surface-card-glow p-6 animate-fade-up">
            <textarea
              className="input-field min-h-[200px] resize-y text-[15px] leading-relaxed"
              placeholder="Describe your career dilemma in detail — the options, the stakes, what's making this hard..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
            <div className="flex flex-wrap gap-2 mt-4">
              {Object.keys(SCENARIOS).map((k) => (
                <button key={k} onClick={() => pickScenario(k)} className={`chip ${active === k ? "chip-active" : ""}`}>{k}</button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button onClick={fillSample} className="btn-outline text-sm flex-1">Try Sample Scenario</button>
              <button onClick={onSubmit} disabled={loading || value.trim().length < 50} className="btn-primary flex-1">
                {loading ? "Preparing your interview…" : <><span>Start Analysis</span> <ArrowRight size={18} /></>}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 px-1">
            <div className="text-xs text-muted-foreground">{value.length} / 50 min characters</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1"><Lock size={10} /> Session-only. Zero data stored.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   INTERVIEW
============================================================ */
const Interview = ({ situation, questions, qIdx, answers, currentAnswer, setCurrentAnswer, onSubmit }: {
  situation: string; questions: Question[]; qIdx: number; answers: string[];
  currentAnswer: string; setCurrentAnswer: (v: string) => void; onSubmit: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const q = questions[qIdx];
  const progress = ((qIdx) / questions.length) * 100;

  // Map which dimensions have been answered, which is current
  const answeredDimensions = useMemo(() => {
    const answered = new Set<string>();
    for (let i = 0; i < qIdx; i++) {
      answered.add(questions[i].dimension);
    }
    return answered;
  }, [qIdx, questions]);

  const currentDimension = q?.dimension;

  const stepStates = useMemo(() => {
    const steps = ["Context Captured", "Gathering Insights", "Weighing Options", "Detecting Biases", "Synthesizing Verdict"];
    return steps.map((label, i) => ({
      label,
      state: i === 0 ? "done" as const : (i === 1 && qIdx < 3) ? "active" as const : (i === 1 && qIdx >= 3) ? "done" as const : (i === 2 && qIdx >= 3) ? "active" as const : "pending" as const,
    }));
  }, [qIdx]);

  return (
    <div className="min-h-screen bg-background">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50" style={{ background: "hsl(var(--border))" }}>
        <div className="h-full transition-all duration-500" style={{ width: `${progress + (currentAnswer.length > 0 ? (1 / questions.length) * 100 * Math.min(1, currentAnswer.length / 100) : 0)}%`, background: "var(--gradient-primary)" }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <header className="mb-8 flex items-center gap-2.5">
          <img src="/logo.png" alt="DecideAI" className="h-8 w-auto" />
          <span className="font-bold tracking-tight">DecideAI</span>
          <span className="text-xs text-muted-foreground ml-2">· Interview Mode</span>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-[35fr_65fr] gap-6">
          {/* LEFT SIDEBAR */}
          <aside className="space-y-4 md:sticky md:top-6 self-start">
            {/* Situation card */}
            <div className="surface-card p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Decision Context</div>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {expanded ? situation : situation.length > 160 ? situation.slice(0, 160) + "…" : situation}
              </p>
              {situation.length > 160 && (
                <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary mt-2 hover:underline">
                  {expanded ? "Collapse" : "Read more"}
                </button>
              )}
            </div>

            {/* Progress tracker */}
            <div className="surface-card p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Analysis Progress</div>
              <ul className="space-y-2.5">
                {stepStates.map((s, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all duration-500 ${s.state === "done" ? "bg-emerald-500 text-background" : s.state === "active" ? "text-primary-foreground animate-pulse-slow" : "bg-muted text-muted-foreground"}`} style={s.state === "active" ? { background: "var(--gradient-primary)" } : {}}>
                      {s.state === "done" ? "" : i + 1}
                    </span>
                    <span className={`transition-colors ${s.state === "pending" ? "text-muted-foreground" : "text-foreground"}`}>{s.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Dimension pills — active highlights */}
            <div className="surface-card p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Dimensions Being Analyzed</div>
              <div className="flex flex-wrap gap-2">
                {DIMENSIONS.map((d) => {
                  const isDone = answeredDimensions.has(d);
                  const isActive = d === currentDimension;
                  return (
                    <span
                      key={d}
                      className={`dim-pill ${isActive ? "dim-active" : isDone ? "dim-done" : ""}`}
                    >
                      {isDone && ""}{d}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-2 mt-2">
              <Lock size={12} /> Your data never leaves your session
            </div>
          </aside>

          {/* RIGHT PANEL */}
          <main>
            <div key={qIdx} className="animate-slide-in">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-primary px-3 py-1.5 rounded-full border border-primary/30" style={{ background: "hsl(239 84% 67% / 0.12)" }}>
                <Brain size={14} /> Question {qIdx + 1} of {questions.length} · {q?.dimension}
              </div>
              <div className="my-6 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
              <h2 className="text-[22px] md:text-[26px] font-bold text-foreground leading-snug">{q?.text}</h2>
              {q?.follow_up_hint && currentAnswer.trim().length >= 20 && currentAnswer.trim().length < 50 && (
                <div className="mt-3 text-sm text-primary/80 italic animate-fade-up">Go deeper: {q.follow_up_hint}</div>
              )}
              <textarea
                className="input-field mt-6 min-h-[200px] resize-y text-[15px] leading-relaxed"
                placeholder="Take your time. The more candid you are, the better the analysis."
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                autoFocus
              />
              <div className="flex items-center justify-between mt-4">
                <div className="text-xs text-muted-foreground">
                  {currentAnswer.length < 20 ? `${20 - currentAnswer.length} more characters to continue` : "Ready when you are."}
                </div>
                <button onClick={onSubmit} disabled={currentAnswer.trim().length < 20} className="btn-primary">
                  {qIdx === questions.length - 1 ? "Generate Report" : "Next"} <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Index;
