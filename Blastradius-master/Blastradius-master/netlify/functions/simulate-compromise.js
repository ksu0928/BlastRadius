import { simulateCompromise } from "../../server/hydra.js";

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
    const { packageId } = JSON.parse(event.body || "{}");
    
    if (!packageId || typeof packageId !== "string") {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "packageId is required" }),
      };
    }

    console.log(`[simulate] packageId="${packageId}"`);
    const result = await simulateCompromise(packageId);
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error("[simulate] error:", err.message);
    return {
      statusCode: err.status || 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: err.message || "Simulation failed",
        code: err?.body?.error?.code || "INTERNAL_ERROR",
      }),
    };
  }
}
