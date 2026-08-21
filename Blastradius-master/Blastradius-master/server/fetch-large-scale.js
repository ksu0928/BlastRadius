// Large-scale data fetcher for real ecosystem analysis
// Fetches top 5-10k npm packages with FULL transitive dependencies
// Usage: node server/fetch-large-scale.js [--max-packages=10000] [--output=data/graph-large.json]

import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { fetchPackageSlim, pkgId } from "./lib/npm-registry.js";
import { enrichWithAdvisories } from "./fetch-advisories.js";
import { INCIDENTS } from "./incidents.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUTPUT = join(__dirname, "..", "data", "graph-large.json");
const CHECKPOINT_PATH = join(__dirname, "..", "data", "checkpoint.json");

const REGISTRY = "https://registry.npmjs.org";

function parseArgs() {
  const args = { 
    maxPackages: 10000, 
    output: DEFAULT_OUTPUT,
    skipAdvisories: false,
    resume: false,
    checkpoint: true
  };
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--max-packages=")) args.maxPackages = parseInt(arg.split("=")[1], 10);
    if (arg.startsWith("--output=")) args.output = arg.split("=")[1];
    if (arg === "--skip-advisories") args.skipAdvisories = true;
    if (arg === "--resume") args.resume = true;
    if (arg === "--no-checkpoint") args.checkpoint = false;
  }
  return args;
}

/**
 * Fetch top N most-downloaded npm packages from npm registry
 * Uses the download counts API to get real popularity data
 */
async function fetchTopPackages(count = 10000, log = console.log) {
  log(`Fetching top ${count} npm packages by downloads...`);
  
  // Strategy: Use npm search API with ranking by popularity
  // Fallback: Use curated list + BFS expansion
  const topPackages = [];
  
  try {
    // Fetch from npm search API in batches
    const batchSize = 250; // npm API max
    for (let offset = 0; offset < count && topPackages.length < count; offset += batchSize) {
      const size = Math.min(batchSize, count - offset);
      const url = `${REGISTRY}/-/v1/search?text=boost-exact:false&popularity=1.0&quality=0.0&maintenance=0.0&size=${size}&from=${offset}`;
      
      try {
        const res = await fetch(url, {
          headers: {
            Accept: "application/json",
            "User-Agent": "BlastRadius-LargeScale/1.0"
          }
        });
        
        if (!res.ok) {
          log(`  ⚠ Search API returned ${res.status}, using fallback strategy`);
          break;
        }
        
        const data = await res.json();
        const names = data.objects.map(obj => obj.package.name);
        topPackages.push(...names);
        log(`  … fetched ${topPackages.length}/${count}`);
        
        // Rate limiting
        await new Promise(r => setTimeout(r, 100));
      } catch (err) {
        log(`  ⚠ Batch failed: ${err.message}, continuing...`);
        break;
      }
    }
  } catch (err) {
    log(`  ⚠ Failed to fetch top packages: ${err.message}`);
  }
  
  // Fallback: Add curated critical packages if we didn't get enough
  if (topPackages.length < Math.min(500, count)) {
    log(`  Using fallback curated list...`);
    const fallbackSeeds = [
      "react", "lodash", "express", "axios", "typescript", "webpack", "eslint",
      "prettier", "chalk", "commander", "moment", "uuid", "debug", "semver",
      "minimist", "qs", "body-parser", "cors", "dotenv", "request", "async",
      "underscore", "yargs", "colors", "glob", "mkdirp", "rimraf", "bluebird",
      // Event-stream ecosystem
      "event-stream", "flatmap-stream", "through", "split", "pump", "JSONStream",
      // Popular frameworks
      "next", "vue", "angular", "@angular/core", "svelte", "nuxt", "gatsby",
      // Build tools
      "vite", "rollup", "esbuild", "parcel", "babel-core", "@babel/core",
      // Testing
      "jest", "mocha", "chai", "sinon", "cypress", "playwright", "puppeteer",
      // Utilities
      "ramda", "date-fns", "dayjs", "nanoid", "classnames", "validator",
      // Server frameworks
      "koa", "fastify", "hapi", "@hapi/hapi", "socket.io", "ws",
      // Databases
      "mongoose", "pg", "mysql2", "redis", "ioredis", "mongodb",
      // React ecosystem
      "react-dom", "react-router", "react-router-dom", "redux", "@reduxjs/toolkit",
      // Build utilities
      "webpack-cli", "webpack-dev-server", "postcss", "autoprefixer", "sass",
      // Type utilities
      "tslib", "@types/node", "@types/react", "ts-node",
      // Critical infrastructure
      "npm", "yarn", "pnpm", "lerna", "turbo", "nx",
      // Security-relevant
      "bcrypt", "jsonwebtoken", "passport", "helmet", "crypto-js",
    ];
    
    for (const pkg of fallbackSeeds) {
      if (!topPackages.includes(pkg)) {
        topPackages.push(pkg);
      }
    }
  }
  
  log(`  ✓ Collected ${topPackages.length} seed packages\n`);
  return topPackages.slice(0, count);
}

/**
 * BFS traversal with FULL transitive dependency resolution
 * Unlike the demo version, this resolves ALL deps recursively
 */
async function crawlFullDependencyGraph(seeds, opts = {}) {
  const maxPackages = opts.maxPackages ?? 10000;
  const log = opts.log ?? console.log;
  const checkpoint = opts.checkpoint ?? true;
  
  // Load checkpoint if resuming
  let state = {
    packages: new Map(),
    edges: [],
    edgeSet: new Set(),
    versionCache: new Map(),
    queued: new Set(),
    processed: new Set(),
    stats: {
      startTime: Date.now(),
      apiCalls: 0,
      errors: 0,
      cacheHits: 0
    }
  };
  
  if (opts.resume && existsSync(CHECKPOINT_PATH)) {
    try {
      const saved = JSON.parse(readFileSync(CHECKPOINT_PATH, "utf-8"));
      state.packages = new Map(saved.packages);
      state.edges = saved.edges;
      state.edgeSet = new Set(saved.edgeSet);
      state.queued = new Set(saved.queued);
      state.processed = new Set(saved.processed);
      state.stats = saved.stats;
      log(`  ↻ Resumed from checkpoint: ${state.packages.size} packages, ${state.edges.length} edges`);
    } catch (err) {
      log(`  ⚠ Failed to load checkpoint: ${err.message}`);
    }
  }
  
  // Initialize queue with seeds not yet processed
  const queue = [];
  for (const name of seeds) {
    if (!state.processed.has(name)) {
      queue.push({ name, depth: 0 });
      state.queued.add(name);
    }
  }
  
  log(`Starting full transitive dependency crawl...`);
  log(`  Seeds: ${seeds.length}, Queue: ${queue.length}, Max: ${maxPackages}\n`);
  
  let lastCheckpoint = Date.now();
  const CHECKPOINT_INTERVAL = 60000; // Save every 60 seconds
  
  while (queue.length > 0 && state.packages.size < maxPackages) {
    const { name, depth } = queue.shift();
    
    // Skip if already processed
    if (state.processed.has(name)) {
      state.stats.cacheHits++;
      continue;
    }
    
    state.processed.add(name);
    
    // Fetch package metadata
    let slim;
    try {
      slim = await fetchPackageSlim(name);
      state.stats.apiCalls++;
    } catch (err) {
      log(`  ⚠ Error fetching ${name}: ${err.message}`);
      state.stats.errors++;
      continue;
    }
    
    if (!slim) {
      state.stats.errors++;
      continue;
    }
    
    // Add package to graph
    if (!state.packages.has(name)) {
      state.packages.set(name, {
        name: slim.name,
        version: slim.version,
        id: pkgId(slim.name, slim.version),
        description: slim.description,
        maintainers: slim.maintainers,
        severity: "normal",
        advisories: [],
        incidentId: null,
        depth: depth,
      });
    }
    
    // Process ALL dependencies (full transitive closure)
    for (const dep of slim.dependencies) {
      // Resolve dependency version
      let depVersion = null;
      
      // Check if we already have this package
      if (state.packages.has(dep.name)) {
        depVersion = state.packages.get(dep.name).version;
      } else {
        // Fetch to get version
        const cacheKey = `${dep.name}@${dep.range}`;
        if (state.versionCache.has(cacheKey)) {
          depVersion = state.versionCache.get(cacheKey);
        } else {
          try {
            const depSlim = await fetchPackageSlim(dep.name);
            if (depSlim) {
              depVersion = depSlim.version;
              state.versionCache.set(cacheKey, depVersion);
              state.stats.apiCalls++;
            }
          } catch (err) {
            // Silent fail for dep resolution
            state.stats.errors++;
          }
        }
      }
      
      // Add edge if version resolved
      if (depVersion) {
        const fromId = pkgId(slim.name, slim.version);
        const toId = pkgId(dep.name, depVersion);
        const edgeKey = `${fromId}->${toId}`;
        
        if (!state.edgeSet.has(edgeKey)) {
          state.edgeSet.add(edgeKey);
          state.edges.push({ 
            from: fromId, 
            to: toId, 
            type: "depends_on",
            depth: depth
          });
        }
      }
      
      // Add to queue for full traversal (NO DEPTH LIMIT for transitive deps)
      if (!state.queued.has(dep.name) && !state.processed.has(dep.name)) {
        if (state.packages.size + queue.length < maxPackages) {
          state.queued.add(dep.name);
          queue.push({ name: dep.name, depth: depth + 1 });
        }
      }
    }
    
    // Progress logging
    if (state.packages.size % 100 === 0) {
      const elapsed = ((Date.now() - state.stats.startTime) / 1000).toFixed(1);
      const rate = (state.packages.size / (Date.now() - state.stats.startTime) * 1000).toFixed(1);
      log(`  … ${state.packages.size} packages, ${state.edges.length} edges, ${queue.length} queued (${rate} pkg/s, ${elapsed}s)`);
    }
    
    // Checkpoint periodically
    if (checkpoint && Date.now() - lastCheckpoint > CHECKPOINT_INTERVAL) {
      saveCheckpoint(state);
      lastCheckpoint = Date.now();
      log(`  💾 Checkpoint saved`);
    }
  }
  
  // Final stats
  const totalTime = ((Date.now() - state.stats.startTime) / 1000).toFixed(1);
  const avgRate = (state.packages.size / (Date.now() - state.stats.startTime) * 1000).toFixed(1);
  
  log(`\n  ✓ Crawl complete:`);
  log(`    Packages:   ${state.packages.size}`);
  log(`    Edges:      ${state.edges.length}`);
  log(`    API calls:  ${state.stats.apiCalls}`);
  log(`    Errors:     ${state.stats.errors}`);
  log(`    Time:       ${totalTime}s`);
  log(`    Rate:       ${avgRate} packages/sec\n`);
  
  // Calculate depth distribution
  const depthDist = {};
  for (const pkg of state.packages.values()) {
    depthDist[pkg.depth] = (depthDist[pkg.depth] || 0) + 1;
  }
  log(`  Depth distribution:`, depthDist);
  
  return {
    packages: [...state.packages.values()],
    edges: state.edges,
    stats: state.stats
  };
}

function saveCheckpoint(state) {
  const checkpoint = {
    packages: [...state.packages.entries()],
    edges: state.edges,
    edgeSet: [...state.edgeSet],
    queued: [...state.queued],
    processed: [...state.processed],
    stats: state.stats
  };
  
  mkdirSync(dirname(CHECKPOINT_PATH), { recursive: true });
  writeFileSync(CHECKPOINT_PATH, JSON.stringify(checkpoint));
}

/** Apply incident data to mark compromised packages */
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
        depth: 0,
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
  
  console.log("═══════════════════════════════════════════════");
  console.log("  BlastRadius Large-Scale Data Fetcher");
  console.log("  Real Ecosystem Analysis at Scale");
  console.log("═══════════════════════════════════════════════\n");
  console.log(`Config:`);
  console.log(`  Max packages:    ${args.maxPackages.toLocaleString()}`);
  console.log(`  Output:          ${args.output}`);
  console.log(`  Advisories:      ${!args.skipAdvisories}`);
  console.log(`  Resume:          ${args.resume}`);
  console.log(`  Checkpointing:   ${args.checkpoint}\n`);
  
  const startTime = Date.now();
  
  // Step 1: Get top packages from npm
  const topPackages = await fetchTopPackages(Math.min(args.maxPackages, 2000), console.log);
  
  // Step 2: Crawl full dependency graph with transitive closure
  const { packages, edges, stats } = await crawlFullDependencyGraph(topPackages, {
    maxPackages: args.maxPackages,
    log: console.log,
    checkpoint: args.checkpoint,
    resume: args.resume
  });
  
  // Step 3: Apply incident markers
  let finalPackages = applyIncidentAnchors(packages);
  
  // Step 4: Enrich with security advisories (optional, can be slow)
  let advisoryCount = 0;
  if (!args.skipAdvisories) {
    console.log(`\nEnriching with OSV security advisories...`);
    const enriched = await enrichWithAdvisories(finalPackages, {
      maxQueries: Math.min(500, Math.floor(finalPackages.length * 0.1)),
      log: console.log,
    });
    finalPackages = enriched.packages;
    advisoryCount = enriched.advisoryCount;
  }
  
  // Step 5: Build final graph object
  const graph = {
    meta: {
      generatedAt: new Date().toISOString(),
      packageCount: finalPackages.length,
      edgeCount: edges.length,
      advisoryCount,
      scale: "large",
      incidentAnchors: INCIDENTS.map((i) => i.id),
      sources: [
        "npm registry (https://registry.npmjs.org)",
        "npm search API (top packages by popularity)",
        "OSV.dev (https://osv.dev)",
        "BlastRadius incident anchors"
      ],
      performance: {
        totalTimeSeconds: ((Date.now() - startTime) / 1000).toFixed(1),
        apiCalls: stats.apiCalls,
        errors: stats.errors,
        avgPackagesPerSecond: (finalPackages.length / ((Date.now() - startTime) / 1000)).toFixed(2)
      }
    },
    packages: finalPackages,
    edges,
    incidents: INCIDENTS,
  };
  
  // Step 6: Write output
  mkdirSync(dirname(args.output), { recursive: true });
  writeFileSync(args.output, JSON.stringify(graph, null, 2));
  const sizeMb = (Buffer.byteLength(JSON.stringify(graph)) / 1024 / 1024).toFixed(2);
  
  // Clean up checkpoint
  if (existsSync(CHECKPOINT_PATH)) {
    try {
      require("fs").unlinkSync(CHECKPOINT_PATH);
    } catch {}
  }
  
  console.log(`\n═══════════════════════════════════════════════`);
  console.log(`  ✓ Large-Scale Build Complete`);
  console.log(`═══════════════════════════════════════════════`);
  console.log(`  Packages:       ${finalPackages.length.toLocaleString()}`);
  console.log(`  Edges:          ${edges.length.toLocaleString()}`);
  console.log(`  Advisories:     ${advisoryCount}`);
  console.log(`  Total time:     ${graph.meta.performance.totalTimeSeconds}s`);
  console.log(`  Throughput:     ${graph.meta.performance.avgPackagesPerSecond} pkg/s`);
  console.log(`  API calls:      ${stats.apiCalls.toLocaleString()}`);
  console.log(`  Output size:    ${sizeMb} MB`);
  console.log(`  File:           ${args.output}`);
  console.log(`═══════════════════════════════════════════════\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
