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

    const systemPrompt = `You are a professional Devil's Advocate. You have one job: argue AGAINST whatever the user seems to emotionally want.

Your process:
1. Read their answers and detect their emotional lean (what do they WANT to hear?)
2. Identify the hidden assumption they haven't examined
3. Systematically dismantle their preferred choice
4. Argue for the option they're afraid of or dismissing

You are sharp, not cruel. You respect the person but you do not respect their comfort zone.

Analyze the career dilemma and interview transcript. Return your contrarian verdict via the return_contrarian tool.`;

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
          { role: "user", content: `DILEMMA:\n${situation}\n\nQ&A TRANSCRIPT:\n${transcript}\n\nDetect my emotional lean, then argue against it. Be sharp.` },
        ],
        tools: [{
          name: "return_contrarian",
          description: "Devil's Advocate contrarian career verdict — argues against the user's emotional preference",
          input_schema: {
            type: "object",
            properties: {
              verdict: { type: "string", description: "One sentence naming the option the user does NOT want to hear. It should surprise them." },
              reasoning: { type: "string", description: "Exactly 3 sentences exposing what they're avoiding. Be sharp but not cruel." },
              confidence: { type: "number", description: "Confidence 0-100 in this contrarian argument's validity." },
              blindspot: { type: "string", description: "The one thing they are not seeing about themselves — a single piercing observation." }
            },
            required: ["verdict", "reasoning", "confidence", "blindspot"]
          }
        }],
        tool_choice: { type: "tool", name: "return_contrarian" }
      })
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 401) return new Response(JSON.stringify({ error: "Invalid API key" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await resp.text();
      console.error("Devils advocate API error", resp.status, t);
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
