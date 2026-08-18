// ─────────────────────────────────────────────────────────────────────────────
// BlastRadius — Express API Server
// Proxies frontend requests to HydraDB for live graph-powered threat analysis.
//
// Usage:  node server/server.js
// Env:    HYDRA_DB_API_KEY must be set
// ─────────────────────────────────────────────────────────────────────────────
import "dotenv/config";
import express from "express";
import cors from "cors";
import { queryBlastRadius, listCompromisedPackages, getRelations, simulateCompromise } from "./hydra.js";

const PORT = process.env.PORT || 3001;
const app = express();

app.use(cors());
app.use(express.json());

// ── Health check ────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  const hasKey = !!process.env.HYDRA_DB_API_KEY;
  res.json({
    status: hasKey ? "ok" : "missing_api_key",
    database: "blastradius",
    timestamp: new Date().toISOString(),
  });
});

// ── Main search endpoint ────────────────────────────────────────────────────
app.post("/api/search", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "query is required" });
    }

    console.log(`[search] query="${query}"`);
    const result = await queryBlastRadius(query.trim());
    res.json(result);
  } catch (err) {
    console.error("[search] error:", err.message);
    res.status(err.status || 500).json({
      error: err.message || "Search failed",
      code: err?.body?.error?.code || "INTERNAL_ERROR",
    });
  }
});

// ── Suggestions (known compromised packages) ────────────────────────────────
app.get("/api/suggestions", async (_req, res) => {
  try {
    const packages = await listCompromisedPackages();
    res.json(packages);
  } catch (err) {
    console.error("[suggestions] error:", err.message);
    // Return empty array on error so UI still works
    res.json([]);
  }
});

// ── Graph relations for an entity ───────────────────────────────────────────
app.get("/api/relations/:id", async (req, res) => {
  try {
    const entityId = decodeURIComponent(req.params.id);
    const relations = await getRelations(entityId);
    res.json(relations);
  } catch (err) {
    console.error("[relations] error:", err.message);
    res.status(err.status || 500).json({
      error: err.message || "Failed to fetch relations",
    });
  }
});

// ── Simulate compromise event ───────────────────────────────────────────────
app.post("/api/simulate-compromise", async (req, res) => {
  try {
    const { packageId } = req.body;
    if (!packageId || typeof packageId !== "string") {
      return res.status(400).json({ error: "packageId is required" });
    }

    console.log(`[simulate] packageId="${packageId}"`);
    const result = await simulateCompromise(packageId);
    res.json(result);
  } catch (err) {
    console.error("[simulate] error:", err.message);
    res.status(err.status || 500).json({
      error: err.message || "Simulation failed",
      code: err?.body?.error?.code || "INTERNAL_ERROR",
    });
  }
});

// ── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n⚡ BlastRadius API server running on http://localhost:${PORT}`);
  console.log(`   HydraDB key: ${process.env.HYDRA_DB_API_KEY ? "✓ set" : "✗ MISSING"}\n`);
});
