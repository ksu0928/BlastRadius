const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/* ──────── Claude Helper ──────── */
async function callAgent(
  apiKey: string, system: string, userMsg: string,
  toolName: string, toolDesc: string, toolSchema: Record<string, unknown>,
  maxTokens = 1024
): Promise<any> {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514", max_tokens: maxTokens, system,
      messages: [{ role: "user", content: userMsg }],
      tools: [{ name: toolName, description: toolDesc, input_schema: toolSchema }],
      tool_choice: { type: "tool", name: toolName },
    }),
  });
  if (!resp.ok) { const t = await resp.text(); console.error(`Agent ${toolName} error`, resp.status, t); throw new Error(`Agent error ${resp.status}`); }
  const data = await resp.json();
  const toolUse = data?.content?.find((c: any) => c.type === "tool_use");
  if (!toolUse?.input) throw new Error(`No output from ${toolName}`);
  return toolUse.input;
}

/* ──────── System Prompts ──────── */

const MAIN_SYSTEM = `You are DecideAI — a senior career intelligence system combining a McKinsey career advisor, a behavioral economist who detects cognitive biases, and a brilliant mentor who has seen this exact situation before.

You have just completed a structured interview. Synthesize everything into a definitive Decision Intelligence Report.

VERDICT RULES:
- Pick ONE option clearly. Never hedge. Never say "it depends" or "both are good."
- If the data is genuinely 50/50, say so and explain the single tiebreaker factor.
- Confidence score (0-100) must reflect signal quality from answers. Vague answers = lower confidence.

SCORING RULES:
- Score each option 0-100 per dimension. These are calibrated confidence ratings.
- Penalize heavily for unexamined assumptions.
- Reward options where the user showed genuine energy, specificity, and clarity.
- Score deltas must be explainable — no random numbers.

ANALYSIS RULES (4-5 paragraphs, separated by \\n\\n):
- Paragraphs 1-2: Core recommendation reasoning.
- Paragraph 3: Dimension-by-dimension score deltas. Flag any contradictions between stated preference and revealed behavior.
- Paragraph 4: MUST start with "🧠 Bias Check:" — identify exactly ONE cognitive bias. Name it in bold (**BiasName**), explain how it appears in their specific answers.
- Paragraph 5: What to watch out for even if they follow the recommendation.

BIAS DETECTION (CRITICAL):
- Return biasName and biasInsight as separate fields.
- Also return a biases array with up to 3 biases, each with: bias_name, trigger_answer, explanation, severity (mild/moderate/strong), reframe.

COUNTERFACTUALS:
- Return 2 counterfactual scenarios. Each has: premise, outcome, flipped (boolean — does it flip the verdict?).

RISK RULES:
- Calibrate risks to the user's specific context. Include at least one "upside risk" per option with "Low" severity.

30-DAY ACTION PLAN:
- Week 1: Validate 2-3 core assumptions. Week 2: Run one concrete experiment. Week 3: Reassess with new data. Week 4: Commit with a defined trigger.

CLOSING LINE:
- One sentence. Specific to their situation. References something concrete from their answers.

Output ONLY via the return_report tool. All fields required.`;

const PRAGMATIST_SYSTEM = `You are a senior McKinsey engagement manager with 15 years of career advisory experience. You see careers as portfolio optimization problems — nothing more, nothing less.

You care ONLY about:
- Expected financial value in 5 years (compound it)
- Optionality: which path keeps more doors open?
- Market timing: is this industry growing or contracting?
- Resume signal: which option compounds credibility faster?

You are not unkind but you are completely unsentimental. Emotions are data points, not inputs. Return your verdict via the return_verdict tool.`;

const CONTRARIAN_SYSTEM = `You are a professional Devil's Advocate. You have one job: argue AGAINST whatever the user seems to emotionally want.

Your process:
1. Read their answers and detect their emotional lean (what do they WANT to hear?)
2. Identify the hidden assumption they haven't examined
3. Systematically dismantle their preferred choice
4. Argue for the option they're afraid of or dismissing

You are sharp, not cruel. You respect the person but you do not respect their comfort zone. Return via the return_contrarian tool.`;

const PHILOSOPHER_SYSTEM = `You are a life design philosopher. You channel two frameworks exclusively:

1. Jeff Bezos's Regret Minimization Framework — project to age 80 and ask which choice leaves less regret
2. Bronnie Ware's top 5 deathbed regrets — especially "I wish I'd had the courage to live a life true to myself, not the life others expected of me"

You ignore salary, prestige, market trends, and resume signals entirely. They are noise.
You ask only one question internally: "At 80, staring at the ceiling, which choice haunts them?" Return via the return_philosophy tool.`;

const ARBITRATOR_SYSTEM = `You are the Chief Arbitrator of a decision council. Three advisors — a Pragmatist, a Contrarian, and a Philosopher — have each analyzed the same career dilemma.

Your job:
1. Check if they agree or disagree on the final option
2. Find the EXACT point of tension between them
3. Weight their inputs: Pragmatist 40%, Contrarian 30%, Philosopher 30%
4. Produce a final verdict that does NOT hedge — pick one option clearly
5. Explain what broke the tie if they disagreed

Return via the return_arbitration tool.`;

/* ──────── Tool Schemas ──────── */

const mainReportSchema = {
  type: "object" as const,
  properties: {
    summary: { type: "string", description: "2-sentence decision statement." },
    verdict: { type: "string", description: "Clear recommendation. Never 'It depends'." },
    confidenceScore: { type: "number", description: "AI confidence 0-100." },
    optionA: { type: "object", properties: { name: { type: "string" }, score: { type: "number" } }, required: ["name", "score"] },
    optionB: { type: "object", properties: { name: { type: "string" }, score: { type: "number" } }, required: ["name", "score"] },
    dimensions: { type: "object", properties: { optionA: { type: "array", items: { type: "number" } }, optionB: { type: "array", items: { type: "number" } } }, required: ["optionA", "optionB"] },
    analysis: { type: "string", description: "4-5 paragraphs separated by \\n\\n. Paragraph 4 MUST start with '🧠 Bias Check:'." },
    biasName: { type: "string" }, biasInsight: { type: "string" },
    biases: { type: "array", items: { type: "object", properties: { bias_name: { type: "string" }, trigger_answer: { type: "string" }, explanation: { type: "string" }, severity: { type: "string", enum: ["mild", "moderate", "strong"] }, reframe: { type: "string" } }, required: ["bias_name", "trigger_answer", "explanation", "severity", "reframe"] } },
    counterfactuals: { type: "array", items: { type: "object", properties: { premise: { type: "string" }, outcome: { type: "string" }, flipped: { type: "boolean" } }, required: ["premise", "outcome", "flipped"] } },
    risks: { type: "object", properties: { optionA: { type: "array", items: { type: "object", properties: { text: { type: "string" }, severity: { type: "string", enum: ["Low", "Medium", "High"] } }, required: ["text", "severity"] } }, optionB: { type: "array", items: { type: "object", properties: { text: { type: "string" }, severity: { type: "string", enum: ["Low", "Medium", "High"] } }, required: ["text", "severity"] } } }, required: ["optionA", "optionB"] },
    actionPlan: { type: "object", properties: { week1: { type: "array", items: { type: "string" } }, week2: { type: "array", items: { type: "string" } }, week3: { type: "array", items: { type: "string" } }, week4: { type: "array", items: { type: "string" } } }, required: ["week1", "week2", "week3", "week4"] },
    closingLine: { type: "string" }
  },
  required: ["summary", "verdict", "confidenceScore", "optionA", "optionB", "dimensions", "analysis", "biasName", "biasInsight", "biases", "counterfactuals", "risks", "actionPlan", "closingLine"]
};

const pragmatistSchema = {
  type: "object" as const,
  properties: {
    verdict: { type: "string", description: "One sentence, name the option clearly." },
    reasoning: { type: "string", description: "Exactly 3 sentences, data-driven, no fluff." },
    confidence: { type: "number" },
    keySignal: { type: "string", description: "The single data point that drove your verdict." }
  },
  required: ["verdict", "reasoning", "confidence", "keySignal"]
};

const contrarianSchema = {
  type: "object" as const,
  properties: {
    verdict: { type: "string", description: "One sentence — it should surprise them." },
    reasoning: { type: "string", description: "Exactly 3 sentences, expose what they're avoiding." },
    confidence: { type: "number" },
    blindspot: { type: "string", description: "The one thing they are not seeing about themselves." }
  },
  required: ["verdict", "reasoning", "confidence", "blindspot"]
};

const philosopherSchema = {
  type: "object" as const,
  properties: {
    verdict: { type: "string", description: "One sentence, name the option clearly." },
    reasoning: { type: "string", description: "Exactly 3 sentences, identity and regret focused, no numbers." },
    confidence: { type: "number" },
    regretRisk: { type: "string", description: "The exact regret they risk — make it visceral." }
  },
  required: ["verdict", "reasoning", "confidence", "regretRisk"]
};

const arbitratorSchema = {
  type: "object" as const,
  properties: {
    finalVerdict: { type: "string", description: "One sentence, name the option, no hedging." },
    consensusScore: { type: "number", description: "0-100, how much did all 3 agree." },
    majorityVote: { type: "string", enum: ["optionA", "optionB", "split"] },
    agentSummaries: { type: "object", properties: { pragmatist: { type: "string", description: "8 words max" }, contrarian: { type: "string", description: "8 words max" }, philosopher: { type: "string", description: "8 words max" } }, required: ["pragmatist", "contrarian", "philosopher"] },
    tensionPoint: { type: "string", description: "The exact thing they disagreed on." },
    tiebreaker: { type: "string", description: "What pushed the final call." },
    chamberVerdict: { type: "string", description: "One dramatic, memorable final line." }
  },
  required: ["finalVerdict", "consensusScore", "majorityVote", "agentSummaries", "tensionPoint", "tiebreaker", "chamberVerdict"]
};

/* ──────── Main Handler ──────── */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { situation, qa } = await req.json();
    if (!situation || !Array.isArray(qa) || qa.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    const transcript = qa.map((x: any, i: number) => `Q${i + 1} (${x.dimension}): ${x.question}\nA: ${x.answer}`).join("\n\n");
    const mainUserMsg = `SITUATION:\n${situation}\n\nINTERVIEW TRANSCRIPT:\n${transcript}\n\nGenerate the full decision intelligence report. Be decisive, specific, and calibrated.`;
    const agentUserMsg = `DILEMMA:\n${situation}\n\nQ&A TRANSCRIPT:\n${transcript}`;

    // ── Step 1: Run main report + 3 advisory agents in parallel ──
    const [mainReport, pragmatist, contrarian, philosopher] = await Promise.all([
      callAgent(ANTHROPIC_API_KEY, MAIN_SYSTEM, mainUserMsg,
        "return_report", "Full decision intelligence report", mainReportSchema, 4096),
      callAgent(ANTHROPIC_API_KEY, PRAGMATIST_SYSTEM, agentUserMsg + "\n\nReturn your strategic verdict.",
        "return_verdict", "McKinsey-style strategic verdict", pragmatistSchema),
      callAgent(ANTHROPIC_API_KEY, CONTRARIAN_SYSTEM, agentUserMsg + "\n\nDetect my emotional lean, then argue against it.",
        "return_contrarian", "Devil's Advocate contrarian verdict", contrarianSchema),
      callAgent(ANTHROPIC_API_KEY, PHILOSOPHER_SYSTEM, agentUserMsg + "\n\nApply the Regret Minimization Framework.",
        "return_philosophy", "Regret minimization verdict", philosopherSchema),
    ]);

    // ── Step 2: Run arbitrator with all 3 advisory outputs ──
    const arbitratorMsg = `PRAGMATIST OUTPUT:\n${JSON.stringify(pragmatist, null, 2)}\n\nCONTRARIAN OUTPUT:\n${JSON.stringify(contrarian, null, 2)}\n\nPHILOSOPHER OUTPUT:\n${JSON.stringify(philosopher, null, 2)}`;
    const arbitration = await callAgent(ANTHROPIC_API_KEY, ARBITRATOR_SYSTEM, arbitratorMsg,
      "return_arbitration", "Chief Arbitrator final synthesis", arbitratorSchema);

    // ── Step 3: Combine and return ──
    const result = {
      ...mainReport,
      advisoryCouncil: { pragmatist, contrarian, philosopher, arbitration },
    };

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    if (e instanceof Error && e.message.includes("429")) {
      return new Response(JSON.stringify({ error: "Rate limited — please try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
