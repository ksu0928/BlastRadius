// Netlify serverless function for cross-ecosystem analysis
import { generateCrossEcosystemReport } from "../../server/cross-ecosystem-analysis.js";

export async function handler(event) {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle OPTIONS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { maintainer, npmPackages } = JSON.parse(event.body || "{}");

    if (!maintainer || typeof maintainer !== "string") {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "maintainer is required" }),
      };
    }

    console.log(`[cross-ecosystem] analyzing maintainer="${maintainer}"`);
    const analysis = await generateCrossEcosystemReport(maintainer, npmPackages || []);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(analysis),
    };
  } catch (err) {
    console.error("[cross-ecosystem] error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: err.message || "Cross-ecosystem analysis failed",
      }),
    };
  }
}
