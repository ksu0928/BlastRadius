// ─────────────────────────────────────────────────────────────────────────────
// BlastRadius — HydraDB Seed Script
// Loads data/graph.json (real npm registry + OSV) + incident anchors.
//
// Usage:  npm run seed
//         npm run fetch:data   (regenerate graph.json first)
// Env:    HYDRA_DB_API_KEY must be set
// ─────────────────────────────────────────────────────────────────────────────
import "dotenv/config";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { HydraDBClient } from "@hydradb/sdk";
import { buildAllKnowledgeItems, loadGraph } from "./graph-to-items.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GRAPH_PATH = join(__dirname, "..", "data", "graph.json");
const DATABASE = "blastradius";
const INGEST_BATCH = 200;

async function ingestBatch(client, items, label) {
  const ingest = await client.context.ingest({
    type: "knowledge",
    database: DATABASE,
    appKnowledge: JSON.stringify(items),
  });
  const ingestedIds = (ingest?.data?.results || []).map((r) => r.id);
  console.log(`  ✓ ${label}: ingested ${ingestedIds.length} items`);
  return ingestedIds;
}

async function seed() {
  const token = process.env.HYDRA_DB_API_KEY;
  if (!token) {
    console.error("✗ HYDRA_DB_API_KEY is not set. Create a .env file with your key.");
    process.exit(1);
  }

  if (!existsSync(GRAPH_PATH)) {
    console.error("✗ data/graph.json not found. Run: npm run fetch:data");
    process.exit(1);
  }

  const graph = loadGraph();
  const allItems = buildAllKnowledgeItems(graph);
  const meta = graph.meta || {};

  console.log("─── BlastRadius Seed Script ───\n");
  console.log(`Graph: ${meta.packageCount || graph.packages?.length} packages, ${meta.edgeCount || graph.edges?.length} edges`);
  console.log(`Knowledge items to ingest: ${allItems.length}\n`);

  const client = new HydraDBClient({ token });

  console.log("① Creating database:", DATABASE);
  try {
    await client.databases.create({
      database: DATABASE,
      databaseMetadataSchema: [
        { name: "entity_type", data_type: "VARCHAR", enable_match: true, enable_dense_embedding: false, enable_sparse_embedding: false, max_length: 64 },
        { name: "severity", data_type: "VARCHAR", enable_match: true, enable_dense_embedding: false, enable_sparse_embedding: false, max_length: 32 },
        { name: "incident_id", data_type: "VARCHAR", enable_match: true, enable_dense_embedding: false, enable_sparse_embedding: false, max_length: 128 },
      ],
    });
    console.log("  ✓ Database created");
  } catch (err) {
    if (err?.body?.error?.code === "DATABASE_ALREADY_EXISTS") {
      console.log("  ⊘ Database already exists, continuing...");
    } else {
      console.error("  ✗ Failed to create database:", err.message || err);
      process.exit(1);
    }
  }

  console.log("② Waiting for database to be ready...");
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const status = await client.databases.status({ database: DATABASE });
      if (status?.data?.infra?.readyForIngestion) {
        ready = true;
        break;
      }
    } catch { /* transient */ }
    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, 5000));
  }
  if (!ready) {
    console.error("\n  ✗ Database did not become ready in time.");
    process.exit(1);
  }
  console.log("\n  ✓ Database ready for ingestion");

  console.log(`③ Ingesting ${allItems.length} knowledge items in batches of ${INGEST_BATCH}...`);
  const allIngestedIds = [];
  for (let i = 0; i < allItems.length; i += INGEST_BATCH) {
    const batch = allItems.slice(i, i + INGEST_BATCH);
    const batchNum = Math.floor(i / INGEST_BATCH) + 1;
    const totalBatches = Math.ceil(allItems.length / INGEST_BATCH);
    const ids = await ingestBatch(client, batch, `Batch ${batchNum}/${totalBatches}`);
    allIngestedIds.push(...ids);
  }

  console.log("④ Waiting for indexing to complete...");
  const idsToCheck = allIngestedIds.slice(0, 5);
  let indexed = false;
  for (let attempt = 0; attempt < 180; attempt++) {
    try {
      const statusResp = await client.context.status({ database: DATABASE, ids: idsToCheck });
      const statuses = statusResp?.data?.statuses || [];
      const allDone = statuses.every((s) =>
        ["graph_creation", "completed"].includes(s.indexingStatus || s.indexing_status)
      );
      if (allDone && statuses.length > 0) {
        indexed = true;
        break;
      }
      const failed = statuses.find((s) =>
        ["errored", "failed"].includes(s.indexingStatus || s.indexing_status)
      );
      if (failed) {
        console.error("\n  ✗ Indexing failed:", failed.errorMessage || failed.error_message || "unknown");
        process.exit(1);
      }
    } catch { /* transient */ }
    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, 3000));
  }
  if (!indexed) {
    console.error("\n  ✗ Indexing did not complete in time.");
    process.exit(1);
  }
  console.log("\n  ✓ All items indexed and graph built");

  console.log("⑤ Running verification query...");
  try {
    const result = await client.query({
      database: DATABASE,
      query: "event-stream compromised package blast radius",
      type: "knowledge",
      queryBy: "hybrid",
      mode: "thinking",
      graphContext: true,
      queryForcefulRelations: true,
      maxResults: 5,
    });
    const chunks = result?.data?.chunks || [];
    console.log(`  ✓ Query returned ${chunks.length} chunks`);
    if (chunks.length > 0) {
      console.log(`  ✓ Top result: "${chunks[0].source_title || chunks[0].sourceTitle || chunks[0].id}"`);
    }
    const gc = result?.data?.graph_context || result?.data?.graphContext;
    if (gc) {
      const paths = gc.query_paths || gc.queryPaths || [];
      console.log(`  ✓ Graph context: ${paths.length} query paths returned`);
    }
  } catch (err) {
    console.warn("  ⚠ Verification query failed (may need more time):", err.message);
  }

  console.log("\n─── Seed complete! ───");
  console.log(`Database "${DATABASE}" ready with ${allItems.length} knowledge items.`);
  console.log("Run 'npm run dev:all' to start the app.\n");
}

seed().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
