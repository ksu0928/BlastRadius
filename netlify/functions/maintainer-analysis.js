import { analyzeMaintainerRisk } from "../../server/maintainer-analysis.js";

export async function handler(event) {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { data } = JSON.parse(event.body || "{}");
    
    if (!data) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "data is required" }),
      };
    }

    console.log(`[maintainer-analysis] analyzing ${data.services?.length || 0} services`);
    const analysis = analyzeMaintainerRisk(data);
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(analysis),
    };
  } catch (err) {
    console.error("[maintainer-analysis] error:", err.message);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: err.message || "Analysis failed",
      }),
    };
  }
}
