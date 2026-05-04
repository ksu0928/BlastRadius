export const SAMPLE_SITUATION = `I'm a Senior SDE-3 at Flipkart (₹38L CTC, 5 years experience). I have two options: Amazon Seattle has offered me $160K TC with L5 role and relocation package. Meanwhile, I'm co-founding an AI startup with my college best friend — we're building an AI-powered supply chain optimization tool. Right now we're pre-revenue, I'd take ₹10L salary + 4% equity, and we've applied to YC S26 (interview in 3 weeks). Amazon's offer expires in 45 days. I'm 28, unmarried, parents are supportive but nervous about the startup path. I've been at Flipkart for 5 years and feel like this is a now-or-never moment for both paths.`;

export const SAMPLE_ANSWERS = [
  "Honestly, the $160K in Seattle is life-changing — after taxes and cost of living, I'd save about $40K/year. With the startup, I'd burn through my ₹18L savings in about 14 months at ₹10L salary. But if we get into YC, the $500K funding changes everything. I keep fixating on the Amazon number because it's guaranteed.",
  "If the startup fails in 12 months, I'd probably land a ₹45-50L role in 2-3 months — my Flipkart SDE-3 + startup founder story is actually strong. The real risk isn't career — it's the 14 months of low salary and the psychological toll of failure on my friendship with my co-founder.",
  "Amazon gives me distributed systems at massive scale — something I can't replicate at a 2-person startup. But honestly, I've been doing similar work at Flipkart for 3 years. The startup forces me to learn fundraising, sales, product thinking — skills that compound differently. I think I'm overvaluing the Amazon brand because it feels safe.",
  "The founder version, without hesitation. I've been daydreaming about this for 2 years. But every time I imagine telling my parents I turned down Amazon Seattle, I feel physically sick. They sacrificed everything for my engineering degree. The Amazon offer feels like proof their sacrifice paid off.",
  "My co-founder is the technical one — I'm the product and business guy. If I leave, the startup is dead. We've been building for 6 months and have 3 pilot customers. She says she'll understand but I know it would end our friendship. The YC interview is in 3 weeks — that's the real decision point, not the Amazon deadline."
];

export const LOADING_MESSAGES = [
  "Mapping your decision dimensions…",
  "Detecting cognitive biases in your reasoning…",
  "Running 6-dimensional analysis…",
  "Calibrating confidence scores…",
  "Generating counterfactual scenarios…",
  "Synthesizing your verdict…",
];

export const MOCK_REPORT = {
  summary: "You're choosing between Amazon Seattle's guaranteed $160K and a pre-revenue AI startup with a YC interview in 3 weeks. Your answers reveal deep founder identity alignment — but your reasoning is distorted by fixating on the immediate salary gap while underweighting the asymmetric equity upside.",
  verdict: "Apply to YC first. Defer Amazon offer by 60 days. Let the YC outcome be your decision trigger.",
  optionA: { name: "Co-found AI Startup", score: 84 },
  optionB: { name: "Join Amazon Seattle", score: 68 },
  dimensions: {
    optionA: [38, 90, 35, 95, 88, 86],
    optionB: [92, 65, 90, 42, 58, 55],
  },
  analysis: `Looking at your answers holistically, the startup path wins decisively on the dimensions you care about most — identity alignment, career growth velocity, and long-term fit. You described the founder version of yourself "without hesitation" and admitted you've been daydreaming about it for 2 years. That's not ambiguity — that's a signal buried under anxiety.\n\nThe financial math deserves cold-eyed analysis. Amazon's $160K TC yields ~$40K/year savings — impressive but not escape velocity. Your startup's 4% equity in a YC-backed company with pilot customers has expected value calculations that dwarf salary arithmetic. If the startup reaches Series A ($20M valuation), your 4% pre-dilution is worth ~$600K. If it reaches Series B, it's $2-4M. Amazon's total 4-year compensation: ~$640K. The asymmetry is stark — but only if YC works out.\n\nDimension by dimension: Financial Impact overwhelmingly favors Amazon (+54 delta) — guaranteed income vs. burn rate is real. Career Growth favors the startup (+25) because founding-level product + business skills at 28 compress a decade of corporate ladder into 18 months. Risk Profile favors Amazon (+55) on paper, but your ₹18L savings + strong re-employment prospects (₹45-50L in 2-3 months by your own estimate) compress the actual downside. Personal Fit is the widest gap (+53 for startup) — you said the founder version is you "without hesitation." Market Timing heavily favors the startup (+30) given AI supply-chain is a $12B TAM with early-mover advantage. Long-term Fit favors the startup (+31) because Amazon will always hire experienced engineers, but co-founder windows close.\n\nBias Check: Your reasoning shows classic **Hyperbolic Discounting** — you're massively overweighting the immediate, tangible salary difference ($160K vs ₹10L) while underweighting the long-term equity value that compounds over years. You said you "keep fixating on the Amazon number because it's guaranteed." That fixation is your bias talking. Hyperbolic discounting makes near-term rewards feel 3-5x more valuable than equivalent future rewards, even when the expected value math clearly favors patience. The YC interview in 3 weeks is a natural experiment — let it resolve before committing to the certain path.\n\nEven with the recommendation pointing toward the startup, watch for two things: first, the co-founder relationship is load-bearing — if you stay out of guilt rather than conviction, resentment will poison the partnership within 6 months. Second, if YC rejects you, re-run this analysis cold — without YC's signal, the startup's risk profile changes materially. Amazon isn't going anywhere; your co-founder window is closing.`,
  biases: [
    {
      bias_name: "Hyperbolic Discounting",
      trigger_answer: "I keep fixating on the Amazon number because it's guaranteed",
      explanation: "You're systematically overvaluing Amazon's immediate $160K salary while dramatically underweighting your startup's 4% equity, which has asymmetric upside potential worth multiples of Amazon's 4-year total comp. Your brain is treating the salary gap as a 'loss' rather than an 'investment.'",
      severity: "strong" as const,
      reframe: "Ask yourself: Would you trade $160K/year for a 15% chance at $3M in 4 years? Because that's the actual math."
    },
    {
      bias_name: "Anchoring Bias",
      trigger_answer: "Every time I imagine telling my parents I turned down Amazon Seattle, I feel physically sick",
      explanation: "You've anchored your self-worth and parental validation to the Amazon brand name. The 'prestige anchor' is making you evaluate the startup against Amazon's brand rather than against your own goals and the probability-weighted financial outcome.",
      severity: "moderate" as const,
      reframe: "Your parents sacrificed for your potential, not for a specific logo on your badge."
    },
    {
      bias_name: "Loss Aversion",
      trigger_answer: "I'd burn through my ₹18L savings in about 14 months at ₹10L salary",
      explanation: "You've framed the startup path primarily as 'burning savings' and 'losing guaranteed income' — classic loss framing. You haven't equally weighted what you lose by taking Amazon: co-founder equity, a YC interview, and 2 years of founder-mode skill acceleration.",
      severity: "mild" as const,
      reframe: "Reframe: You're not 'burning ₹18L' — you're investing ₹18L in a venture with 3 pilot customers and a YC interview."
    }
  ],
  // Legacy single bias fields (for backward compat)
  biasName: "Hyperbolic Discounting",
  biasInsight: "You're systematically overvaluing Amazon's immediate $160K salary while dramatically underweighting your startup's 4% equity, which has asymmetric upside potential. You said you 'keep fixating on the Amazon number because it's guaranteed' — that fixation is hyperbolic discounting in action, making near-term rewards feel 3-5x more valuable than equivalent future rewards.",
  confidenceScore: 82,
  counterfactuals: [
    {
      premise: "If you weighted financial security 40% less",
      outcome: "the startup score jumps to 92 and the verdict becomes unanimous — Amazon doesn't even come close on any dimension you actually care about.",
      flipped: false,
    },
    {
      premise: "If YC rejects your application",
      outcome: "the startup's confidence score drops to 61 and the verdict flips to Amazon — without YC's funding signal, the 14-month runway at ₹10L salary becomes an unacceptable risk.",
      flipped: true,
    }
  ],
  risks: {
    optionA: [
      { text: "₹10L salary burns through ₹18L savings in 14 months — but YC's $500K funding resets that clock entirely", severity: "Medium" as const },
      { text: "Co-founder relationship is load-bearing — if motivation diverges post-YC rejection, both the company and friendship are at risk", severity: "High" as const },
      { text: "UPSIDE: 4% equity in a YC-backed AI startup with pilot customers could be worth $2-4M at Series B — 6x Amazon's 4-year total comp", severity: "Low" as const },
    ],
    optionB: [
      { text: "Startup dies without you — your co-founder said she'd 'understand' but 6 months of shared work and 3 pilot customers don't just evaporate cleanly", severity: "High" as const },
      { text: "Amazon L5 work may feel like a lateral move after Flipkart SDE-3 — you've been doing distributed systems for 3 years already", severity: "Medium" as const },
      { text: "UPSIDE: Amazon's brand + Seattle network accelerates your next startup attempt with stronger foundations and US market access", severity: "Low" as const },
    ],
  },
  actionPlan: {
    week1: [
      "Do NOT accept or reject Amazon yet. Email recruiter requesting 60-day extension — cite 'family considerations for international relocation.' Worst case: they say no.",
      "Prep for YC interview like it's the most important 10 minutes of your career. Talk to 3 YC alumni in India for mock interviews.",
      "Model the equity math cold: 4% at $5M, $20M, $50M valuations. Factor in dilution through Series B. Get real numbers, not vibes.",
    ],
    week2: [
      "YC interview happens. This is the natural experiment that resolves your decision.",
      "If YC says yes: the startup is de-risked. $500K funding + YC network + 3 pilot customers = legitimate venture. Decline Amazon with confidence.",
      "If YC says no: Run one more experiment — approach 2 other accelerators or angel investors. If no traction in 2 weeks, the market is telling you something.",
    ],
    week3: [
      "Reassess with data: Did Amazon extend? Did alternative funding materialize? What did the YC interview reveal about your pitch?",
      "Have the explicit conversation with your co-founder: 'Here's where I am. Here's what I need to see to commit fully.'",
      "Talk to your parents — not to seek permission, but to share your framework. They deserve to understand your reasoning, not just your conclusion.",
    ],
    week4: [
      "Decision trigger: If YC accepted OR alternative funding secured -> formally decline Amazon and commit to the startup 100%.",
      "If neither materialized: Accept Amazon gracefully, help your co-founder find a replacement CTO, and plan your next startup from a position of financial strength.",
      "Set a 12-month calendar reminder regardless of path chosen. Decisions aren't permanent — but drift is. Revisit with fresh data.",
    ],
  },
  closingLine: "You said you've been daydreaming about founding a company for 2 years — and the YC interview is in 3 weeks. The universe is giving you an experiment with a built-in deadline. Run it before you optimize for certainty.",
  advisoryCouncil: {
    pragmatist: {
      verdict: "Co-found the AI startup — conditional on YC acceptance within 3 weeks.",
      reasoning: "Your 4% equity in a YC-backed AI supply-chain startup has a risk-adjusted 5-year expected value of $800K–$1.2M, dwarfing Amazon's $640K total comp over the same period. The AI supply-chain optimization TAM is growing at 34% CAGR with fragmented competition — first-mover advantage with 3 pilot customers is a rare asset that depreciates to zero if you walk away. Amazon will extend L5 offers to experienced SDE-3s indefinitely; co-founder windows with validated products close permanently.",
      confidence: 76,
      keySignal: "3 pilot customers pre-revenue — that's early product-market fit signal, not a hobby project.",
    },
    contrarian: {
      verdict: "Take Amazon Seattle — your startup romanticism is masking a fear of being ordinary.",
      reasoning: "You described the founder version of yourself 'without hesitation' — but you've been 'daydreaming' for 2 years without quitting, which means your conviction is performative, not operational. Your co-founder is the technical one and you're the 'product and business guy' — yet you have zero business experience, no revenue, and your only validation is 3 pilot customers who haven't paid you anything. Amazon gives you the international network, distributed systems depth, and financial runway to start a company at 32 with 10x more credibility than you have today.",
      confidence: 71,
      blindspot: "You're not choosing between Amazon and a startup — you're choosing between being a founder now with no business skills, or being a founder later with real ones.",
    },
    philosopher: {
      verdict: "Co-found the startup — at 80, you'll never forgive yourself for choosing comfort over conviction.",
      reasoning: "You said 'without hesitation' that the founder version is you — that's not analysis, that's identity speaking through every defense mechanism you've built. The Amazon offer feels like proof your parents' sacrifice paid off, but living someone else's definition of success is the #1 deathbed regret Bronnie Ware documented. You've been daydreaming about this for 2 years — dreams that persistent don't fade, they calcify into bitterness.",
      confidence: 88,
      regretRisk: "At 60, you'll be a senior director somewhere, financially secure, and haunted by the question: 'What if I'd had the courage to build something of my own when I had a co-founder, pilot customers, and a YC interview waiting?'",
    },
    arbitration: {
      finalVerdict: "Co-found the AI startup, with YC as the decision trigger.",
      consensusScore: 72,
      majorityVote: "optionA" as const,
      agentSummaries: {
        pragmatist: "Startup wins on 5-year expected value math",
        contrarian: "Amazon wins — startup desire is untested identity",
        philosopher: "Startup — founder regret is irreversible at 80",
      },
      tensionPoint: "The Contrarian argues the founder identity is performative — you've dreamed for 2 years without acting — while the Philosopher says that very tension proves it's real.",
      tiebreaker: "The YC interview in 3 weeks is a natural experiment that resolves the tension — it tests conviction with stakes, not daydreams.",
      chamberVerdict: "The council votes 2-1: build the company. But let YC be the crucible — if your conviction survives a rejection, Amazon was never the real option.",
    },
  },
};
