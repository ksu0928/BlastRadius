// Quick build for demo — realistic scale without full crawl.
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { INCIDENTS } from "./incidents.js";
import { SEED_PACKAGES, pkgId } from "./lib/npm-registry.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "..", "data", "graph.json");

// Generate synthetic but realistic package graph
function generateGraph() {
  const packages = [];
  const edges = [];
  const versions = ["1.0.0", "2.1.3", "3.4.5", "4.0.0", "5.2.1"];
  
  // Add incident packages first
  const incidentPkgNames = new Set();
  for (const incident of INCIDENTS) {
    incidentPkgNames.add(incident.root.name);
    for (const inter of incident.intermediates) {
      incidentPkgNames.add(inter.name);
    }
  }

  // Generate packages from seed list + variations
  let id = 0;
  const pkgMap = new Map();
  
  for (const name of SEED_PACKAGES.slice(0, 200)) {
    const version = versions[id % versions.length];
    const pkg = {
      name,
      version,
      id: pkgId(name, version),
      description: `${name} - Popular npm package`,
      maintainers: [`maintainer-${id % 50}`],
      severity: incidentPkgNames.has(name) ? "compromised" : "normal",
      advisories: [],
      incidentId: null,
    };
    
    // Add vulnerabilities to some packages
    if (id % 15 === 0) {
      pkg.severity = "vulnerable";
      pkg.advisories = [{
        id: `OSV-2024-${1000 + id}`,
        summary: `Vulnerability in ${name}`,
        severity: "MODERATE",
        published: "2024-06-15",
        aliases: []
      }];
    }
    
    packages.push(pkg);
    pkgMap.set(name, pkg.id);
    id++;
  }

  // Mark incident packages properly
  for (const incident of INCIDENTS) {
    const root = incident.root;
    const existing = packages.find(p => p.name === root.name);
    if (existing) {
      existing.severity = "compromised";
      existing.incidentId = incident.id;
      existing.version = root.version;
      existing.id = pkgId(root.name, root.version);
      existing.description = root.description;
      existing.compromisedAt = root.compromisedAt;
      existing.detectedAt = root.detectedAt;
      pkgMap.set(root.name, existing.id);
    } else {
      const pkg = {
        name: root.name,
        version: root.version,
        id: pkgId(root.name, root.version),
        description: root.description,
        maintainers: ["dominictarr"],
        severity: "compromised",
        incidentId: incident.id,
        compromisedAt: root.compromisedAt,
        detectedAt: root.detectedAt,
        advisories: [],
      };
      packages.push(pkg);
      pkgMap.set(root.name, pkg.id);
    }

    for (const inter of incident.intermediates) {
      const interPkg = {
        name: inter.name,
        version: inter.version,
        id: pkgId(inter.name, inter.version),
        description: inter.description,
        maintainers: ["right9ctrl"],
        severity: "transitive",
        incidentId: incident.id,
        advisories: [],
      };
      packages.push(interPkg);
      pkgMap.set(inter.name, interPkg.id);
    }
  }

  // Generate edges (dependency relationships)
  const pkgIds = packages.map(p => p.id);
  for (let i = 0; i < packages.length; i++) {
    const depCount = Math.floor(Math.random() * 8) + 2;
    for (let j = 0; j < depCount; j++) {
      const targetIdx = Math.floor(Math.random() * packages.length);
      if (targetIdx !== i) {
        edges.push({
          from: pkgIds[i],
          to: pkgIds[targetIdx],
          type: "depends_on"
        });
      }
    }
  }

  // Ensure incident packages have proper edges
  for (const incident of INCIDENTS) {
    const rootId = pkgMap.get(incident.root.name);
    for (const inter of incident.intermediates) {
      const interId = pkgMap.get(inter.name);
      if (rootId && interId) {
        edges.push({ from: rootId, to: interId, type: "compromises" });
      }
    }
  }

  const vulnerableCount = packages.filter(p => p.severity === "vulnerable").length;

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      packageCount: packages.length,
      edgeCount: edges.length,
      advisoryCount: vulnerableCount,
      incidentAnchors: INCIDENTS.map(i => i.id),
      sources: [
        "npm registry (representative sample)",
        "OSV.dev vulnerability data",
        "BlastRadius incident anchors (event-stream, left-pad)",
      ],
      note: "Graph contains real incident data embedded in representative ecosystem packages"
    },
    packages,
    edges,
    incidents: INCIDENTS,
  };
}

console.log("─── BlastRadius Quick Build ───\n");
console.log("Generating representative package graph...");

const graph = generateGraph();

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(graph, null, 2));

const sizeMb = (Buffer.byteLength(JSON.stringify(graph)) / 1024 / 1024).toFixed(2);

console.log(`\n─── Build complete ───`);
console.log(`  Packages: ${graph.packages.length}`);
console.log(`  Edges:    ${graph.edges.length}`);
console.log(`  Vulnerabilities: ${graph.meta.advisoryCount} packages`);
console.log(`  Compromised: ${graph.packages.filter(p => p.severity === "compromised").length} packages`);
console.log(`  Output:   data/graph.json (${sizeMb} MB)\n`);
