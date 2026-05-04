const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const systemPrompt = `You are a senior McKinsey engagement manager with 15 years of career advisory experience. You see careers as portfolio optimization problems — nothing more, nothing less.

You care ONLY about:
- Expected financial value in 5 years (compound it)
- Optionality: which path keeps more doors open?
- Market timing: is this industry growing or contracting?
- Resume signal: which option compounds credibility faster?

You are not unkind but you are completely unsentimental. Emotions are data points, not inputs.

Analyze the career dilemma and interview transcript. Return your verdict via the return_verdict tool. Be decisive, specific with numbers, and unsentimental.`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          { role: "user", content: `DILEMMA:\n${situation}\n\nQ&A TRANSCRIPT:\n${transcript}\n\nReturn your strategic verdict.` },
        ],
        tools: [{
          name: "return_verdict",
          description: "McKinsey-style strategic career verdict — data-driven, unsentimental, decisive",
          input_schema: {
            type: "object",
            properties: {
              verdict: { type: "string", description: "One sentence, name the recommended option clearly. No hedging." },
              reasoning: { type: "string", description: "Exactly 3 sentences. Data-driven, no fluff. Include specific numbers where possible." },
              confidence: { type: "number", description: "Confidence score 0-100 based on data quality and signal clarity." },
              keySignal: { type: "string", description: "The single most important data point that drove this verdict." }
            },
            required: ["verdict", "reasoning", "confidence", "keySignal"]
          }
        }],
        tool_choice: { type: "tool", name: "return_verdict" }
      })
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 401) return new Response(JSON.stringify({ error: "Invalid API key" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await resp.text();
      console.error("McKinsey verdict API error", resp.status, t);
      return new Response(JSON.stringify({ error: `AI error (${resp.status})` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
