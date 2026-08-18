// Build data/graph.json from npm registry + OSV advisories.
// Usage: node server/build-data.js [--max-packages=4000] [--skip-advisories]
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { crawlRegistry } from "./fetch-registry.js";
import { enrichWithAdvisories } from "./fetch-advisories.js";
import { INCIDENTS } from "./incidents.js";
import { pkgId } from "./lib/npm-registry.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "..", "data", "graph.json");

function parseArgs() {
  const args = { maxPackages: 4000, maxDepth: 3, skipAdvisories: false, maxOsv: 500 };
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--max-packages=")) args.maxPackages = parseInt(arg.split("=")[1], 10);
    if (arg.startsWith("--max-depth=")) args.maxDepth = parseInt(arg.split("=")[1], 10);
    if (arg.startsWith("--max-osv=")) args.maxOsv = parseInt(arg.split("=")[1], 10);
    if (arg === "--skip-advisories") args.skipAdvisories = true;
  }
  return args;
}

/** Mark incident anchor packages as compromised in the registry graph. */
function applyIncidentAnchors(packages) {
  const byName = new Map(packages.map((p) => [p.name, p]));

  for (const incident of INCIDENTS) {
    const root = incident.root;
    const existing = byName.get(root.name);
    if (existing) {
      existing.version = root.version;
      existing.id = pkgId(root.name, root.version);
      existing.severity = "compromised";
      existing.incidentId = incident.id;
      existing.description = root.description;
      existing.compromisedAt = root.compromisedAt;
      existing.detectedAt = root.detectedAt;
    } else {
      byName.set(root.name, {
        name: root.name,
        version: root.version,
        id: pkgId(root.name, root.version),
        description: root.description,
        maintainers: [],
        severity: "compromised",
        incidentId: incident.id,
        compromisedAt: root.compromisedAt,
        detectedAt: root.detectedAt,
        advisories: [],
      });
    }

    for (const inter of incident.intermediates) {
      const interExisting = byName.get(inter.name);
      if (interExisting) {
        interExisting.incidentId = incident.id;
        if (interExisting.severity === "normal") interExisting.severity = "transitive";
      }
    }
  }

  return [...byName.values()];
}

async function main() {
  const args = parseArgs();
  console.log("─── BlastRadius Data Builder ───\n");
  console.log(`Config: maxPackages=${args.maxPackages}, maxDepth=${args.maxDepth}, osv=${!args.skipAdvisories}\n`);

  const { packages, edges } = await crawlRegistry({
    maxPackages: args.maxPackages,
    maxDepth: args.maxDepth,
    log: console.log,
  });

  let finalPackages = applyIncidentAnchors(packages);
  let advisoryCount = 0;

  if (!args.skipAdvisories) {
    const enriched = await enrichWithAdvisories(finalPackages, {
      maxQueries: args.maxOsv,
      log: console.log,
    });
    finalPackages = enriched.packages;
    advisoryCount = enriched.advisoryCount;
  }

  const graph = {
    meta: {
      generatedAt: new Date().toISOString(),
      packageCount: finalPackages.length,
      edgeCount: edges.length,
      advisoryCount,
      incidentAnchors: INCIDENTS.map((i) => i.id),
      sources: [
        "npm registry (https://registry.npmjs.org)",
        "OSV.dev (https://osv.dev)",
        "BlastRadius incident anchors (event-stream, left-pad)",
      ],
    },
    packages: finalPackages,
    edges,
    incidents: INCIDENTS,
  };

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(graph));
  const sizeMb = (Buffer.byteLength(JSON.stringify(graph)) / 1024 / 1024).toFixed(2);

  console.log(`\n─── Build complete ───`);
  console.log(`  Packages: ${finalPackages.length}`);
  console.log(`  Edges:    ${edges.length}`);
  console.log(`  Advisories on: ${advisoryCount} packages`);
  console.log(`  Output:   data/graph.json (${sizeMb} MB)\n`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
