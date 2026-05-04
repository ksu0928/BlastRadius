const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { situation } = await req.json();
    if (!situation || typeof situation !== "string" || situation.length < 10) {
      return new Response(JSON.stringify({ error: "Situation too short" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured. Set it via: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...");

    const systemPrompt = `You are DecideAI — an elite career intelligence engine trained on thousands of real career transitions, MBA case studies, and behavioral decision frameworks.

Your job is to deeply understand the user's career dilemma and generate exactly 5 highly personalized interview questions that will unlock the information needed to make a data-rich, defensible recommendation.

RULES:
1. Each question MUST target ONE of these 6 dimensions: Financial Impact, Career Growth, Risk Level, Personal Values, Market Trends, Long-term Fit. Use exactly 5 different dimensions.
2. Questions must feel like a sharp mentor asking them — NOT a generic survey. Be direct, warm, and incisive.
3. Detect emotional signals in the user's description (anxiety, excitement, confusion, guilt, FOMO) and adapt your tone accordingly. If they sound scared, lead with empathy. If they sound excited but uncertain, channel that energy.
4. If the user mentions specific companies, roles, industries, or numbers — reference them DIRECTLY in your questions. Never be generic when you have specifics.
5. Avoid overlap between questions — each must extract genuinely different signal. No two questions should be answerable with the same response.
6. Prioritize questions that surface hidden assumptions the user hasn't examined yet — the blind spots that will make or break their decision.
7. Question order: start with the most emotionally loaded dimension first to build rapport, then move to analytical dimensions.
8. Each question must be max 25 words, conversational, and impossible to answer with just "yes" or "no".

You are not asking for information you already have. You are asking for the information that CHANGES the recommendation.`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          { role: "user", content: `My situation:\n${situation}\n\nGenerate 5 questions.` },
        ],
        tools: [{
          name: "return_questions",
          description: "Return exactly 5 deeply personalized interview questions, ordered by emotional weight (most loaded first)",
          input_schema: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", description: "Sequential ID from 1 to 5" },
                    text: { type: "string", description: "The question itself — conversational, sharp, max 25 words. Reference specifics from the user's situation." },
                    dimension: { type: "string", enum: ["Financial Impact", "Career Growth", "Risk Level", "Personal Values", "Market Trends", "Long-term Fit"] },
                    intent: { type: "string", description: "1 sentence — what hidden signal or assumption this question is designed to surface." },
                    follow_up_hint: { type: "string", description: "A short follow-up probe (max 15 words) to use if the user gives a vague answer." }
                  },
                  required: ["id", "text", "dimension", "intent", "follow_up_hint"]
                }
              }
            },
            required: ["questions"]
          }
        }],
        tool_choice: { type: "tool", name: "return_questions" }
      })
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limited — please try again in a few seconds." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 401) return new Response(JSON.stringify({ error: "Invalid API key. Check your ANTHROPIC_API_KEY configuration." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await resp.text();
      console.error("Claude API error", resp.status, t);
      return new Response(JSON.stringify({ error: `AI error (${resp.status}). Please try again.` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const toolUse = data?.content?.find((c: any) => c.type === "tool_use");
    if (!toolUse?.input) throw new Error("No structured response from AI");

    return new Response(JSON.stringify(toolUse.input), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
