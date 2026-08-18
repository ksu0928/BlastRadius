// ─────────────────────────────────────────────────────────────────────────────
// BlastRadius — HydraDB Seed Script
// Seeds the graph database with supply-chain threat data.
//
// Usage:  node server/seed.js
// Env:    HYDRA_DB_API_KEY must be set
// ─────────────────────────────────────────────────────────────────────────────
import "dotenv/config";
import { HydraDBClient } from "@hydradb/sdk";

const DATABASE = "blastradius";

// ── Incident Data ───────────────────────────────────────────────────────────
// Each incident models: compromised package → intermediate deps → services
// with maintainer intel and typosquat warnings.

const INCIDENTS = [
  {
    id: "event-stream-3.3.6",
    root: {
      name: "event-stream",
      version: "3.3.6",
      compromisedAt: "2024-11-26T08:31:00Z",
      detectedAt: "2024-11-26T08:36:42Z",
      description:
        "event-stream@3.3.6 was compromised via a malicious dependency injection. " +
        "The attacker (right9ctrl) gained publish rights by social-engineering the original " +
        "maintainer (dominictarr) and injected flatmap-stream@0.1.1 which contained a " +
        "cryptocurrency-stealing payload targeting the Copay Bitcoin wallet.",
      detectionMinutes: 5,
      detectionSeconds: 42,
    },
    intermediates: [
      { name: "flatmap-stream", version: "0.1.1", description: "Malicious package injected by right9ctrl. Contains obfuscated cryptocurrency theft payload." },
      { name: "through", version: "2.3.8", description: "Simple stream construction utility. Widely depended upon, amplifying blast radius." },
      { name: "split", version: "1.0.1", description: "Stream splitter for newline-delimited data. Transitive dependency of through." },
      { name: "pump", version: "3.0.0", description: "Pipe streams together and handle errors. Key infrastructure package." },
      { name: "JSONStream", version: "1.3.5", description: "Streaming JSON parser. Used by request and other HTTP libraries." },
      { name: "archiver", version: "5.3.1", description: "Streaming archive generator. Used for report and data export services." },
      { name: "request", version: "2.88.2", description: "HTTP request library (deprecated). Still widely used, increasing attack surface." },
      { name: "csv-parse", version: "4.16.3", description: "CSV parser for Node.js streams. Used in data pipeline services." },
      { name: "node-config", version: "3.3.6", description: "Configuration management for Node.js apps. Deep transitive dependency." },
    ],
    services: [
      { name: "payments-api", severity: "direct", exposedAt: "2024-11-26T08:31:00Z", resolvedMinutes: 0, chain: ["event-stream@3.3.6", "payments-api"], maintainerHandle: "dominictarr" },
      { name: "auth-service", severity: "direct", exposedAt: "2024-11-26T08:31:15Z", resolvedMinutes: 0.25, chain: ["event-stream@3.3.6", "auth-service"], maintainerHandle: "dominictarr" },
      { name: "billing-worker", severity: "transitive", exposedAt: "2024-11-26T08:32:18Z", resolvedMinutes: 1.3, chain: ["event-stream@3.3.6", "flatmap-stream@0.1.1", "billing-worker"], maintainerHandle: "right9ctrl" },
      { name: "notification-svc", severity: "transitive", exposedAt: "2024-11-26T08:33:04Z", resolvedMinutes: 2.07, chain: ["event-stream@3.3.6", "through@2.3.8", "pump@3.0.0", "notification-svc"], maintainerHandle: "mafintosh" },
      { name: "audit-logger", severity: "transitive", exposedAt: "2024-11-26T08:33:40Z", resolvedMinutes: 2.67, chain: ["event-stream@3.3.6", "through@2.3.8", "split@1.0.1", "audit-logger"], maintainerHandle: "mafintosh" },
      { name: "fraud-detector", severity: "transitive", exposedAt: "2024-11-26T08:34:12Z", resolvedMinutes: 3.2, chain: ["event-stream@3.3.6", "flatmap-stream@0.1.1", "JSONStream@1.3.5", "fraud-detector"], maintainerHandle: "right9ctrl" },
      { name: "report-generator", severity: "transitive", exposedAt: "2024-11-26T08:34:55Z", resolvedMinutes: 3.92, chain: ["event-stream@3.3.6", "through@2.3.8", "pump@3.0.0", "archiver@5.3.1", "report-generator"], maintainerHandle: "ctalkington" },
      { name: "webhook-dispatcher", severity: "transitive", exposedAt: "2024-11-26T08:35:22Z", resolvedMinutes: 4.37, chain: ["event-stream@3.3.6", "flatmap-stream@0.1.1", "JSONStream@1.3.5", "request@2.88.2", "webhook-dispatcher"], maintainerHandle: "mikeal" },
      { name: "data-pipeline", severity: "transitive", exposedAt: "2024-11-26T08:36:00Z", resolvedMinutes: 5.0, chain: ["event-stream@3.3.6", "through@2.3.8", "split@1.0.1", "csv-parse@4.16.3", "data-pipeline"], maintainerHandle: "wdavidw" },
      { name: "analytics-ingester", severity: "transitive", exposedAt: "2024-11-26T08:37:11Z", resolvedMinutes: 6.18, chain: ["event-stream@3.3.6", "through@2.3.8", "pump@3.0.0", "archiver@5.3.1", "analytics-ingester"], maintainerHandle: "ctalkington" },
      { name: "config-sync", severity: "transitive", exposedAt: "2024-11-26T08:43:00Z", resolvedMinutes: 12.0, chain: ["event-stream@3.3.6", "flatmap-stream@0.1.1", "JSONStream@1.3.5", "request@2.88.2", "node-config@3.3.6", "config-sync"], maintainerHandle: "lorenwest" },
    ],
    maintainers: [
      { handle: "dominictarr", email: "dominic.tarr@example.com", packages: ["event-stream", "through", "map-stream", "split", "JSONStream"], typosquats: ["event_stream", "eventstream", "eventt-stream"], description: "Original maintainer of event-stream. Social-engineered into transferring publish rights." },
      { handle: "right9ctrl", email: "right9ctrl@protonmail.com", packages: ["flatmap-stream", "event-stream"], typosquats: ["flatmap_stream", "flat-map-stream", "flatmapstream"], description: "Attacker who injected malicious flatmap-stream dependency. Used social engineering to gain access." },
      { handle: "mafintosh", email: "mathias.buus@example.com", packages: ["pump", "through2", "end-of-stream", "pumpify", "duplexify"], typosquats: ["puump", "pumpp", "pump-stream"], description: "Prolific Node.js streaming library maintainer. Packages used as transitive dependencies." },
      { handle: "ctalkington", email: "chris@talkington.com", packages: ["archiver", "archiver-utils", "compress-commons", "zip-stream"], typosquats: ["archiveer", "archiver-js", "archiverr"], description: "Maintainer of archiver ecosystem. Used for file compression and report generation." },
      { handle: "mikeal", email: "mikeal.rogers@gmail.com", packages: ["request", "concat-stream", "JSONStream", "caseless", "aws-sign2"], typosquats: ["requestt", "request-lib", "requuest"], description: "Maintainer of the deprecated request library. Still widely used in legacy systems." },
      { handle: "wdavidw", email: "david@adaltas.com", packages: ["csv", "csv-parse", "csv-stringify", "csv-generate", "stream-transform"], typosquats: ["csv_parse", "csv-parser", "csvparse"], description: "Maintainer of the csv ecosystem for Node.js data processing." },
      { handle: "lorenwest", email: "loren.west@example.com", packages: ["node-config", "config", "node-int64"], typosquats: ["node_config", "nodeconfig", "node-configurr"], description: "Maintainer of node-config. Deep transitive dependency in configuration management." },
    ],
  },
  {
    id: "left-pad-1.3.0",
    root: {
      name: "left-pad",
      version: "1.3.0",
      compromisedAt: "2024-09-10T14:00:00Z",
      detectedAt: "2024-09-10T14:22:15Z",
      description:
        "left-pad@1.3.0 was unpublished from npm, breaking thousands of builds. " +
        "This simulated supply-chain disruption demonstrated the fragility of the npm " +
        "ecosystem's dependency on micro-packages.",
      detectionMinutes: 22,
      detectionSeconds: 15,
    },
    intermediates: [
      { name: "babel-runtime", version: "6.26.0", description: "Babel helpers runtime. Core build-tool dependency amplifying blast radius." },
      { name: "webpack", version: "4.46.0", description: "Module bundler. Transitive through babel-runtime, affecting build infrastructure." },
      { name: "jest-cli", version: "29.0.0", description: "Jest CLI runner. Transitive dependency in test infrastructure." },
    ],
    services: [
      { name: "web-frontend", severity: "direct", exposedAt: "2024-09-10T14:00:00Z", resolvedMinutes: 0, chain: ["left-pad@1.3.0", "web-frontend"], maintainerHandle: "stevemao" },
      { name: "ssr-renderer", severity: "transitive", exposedAt: "2024-09-10T14:08:22Z", resolvedMinutes: 8.37, chain: ["left-pad@1.3.0", "babel-runtime@6.26.0", "ssr-renderer"], maintainerHandle: "hzoo" },
      { name: "cdn-worker", severity: "transitive", exposedAt: "2024-09-10T14:12:00Z", resolvedMinutes: 12.0, chain: ["left-pad@1.3.0", "babel-runtime@6.26.0", "webpack@4.46.0", "cdn-worker"], maintainerHandle: "sokra" },
      { name: "build-server", severity: "transitive", exposedAt: "2024-09-10T14:16:30Z", resolvedMinutes: 16.5, chain: ["left-pad@1.3.0", "babel-runtime@6.26.0", "webpack@4.46.0", "build-server"], maintainerHandle: "sokra" },
      { name: "test-runner", severity: "transitive", exposedAt: "2024-09-10T14:20:00Z", resolvedMinutes: 20.0, chain: ["left-pad@1.3.0", "jest-cli@29.0.0", "test-runner"], maintainerHandle: "fb-open-source" },
    ],
    maintainers: [
      { handle: "stevemao", email: "steve.mao@example.com", packages: ["left-pad", "right-pad", "pad"], typosquats: ["left_pad", "leftpad", "left-padd"], description: "Original author of left-pad. Package removal broke the internet." },
      { handle: "hzoo", email: "h.zhu@example.com", packages: ["babel-runtime", "@babel/runtime", "babel-core"], typosquats: ["babel_runtime", "babelruntime", "babel-runtim"], description: "Core Babel maintainer. babel-runtime is a critical transitive dependency." },
      { handle: "sokra", email: "tobias.koppers@example.com", packages: ["webpack", "enhanced-resolve", "loader-runner", "tapable"], typosquats: ["webpackk", "webpack-js", "webpak"], description: "Creator and maintainer of webpack. Build infrastructure dependency." },
      { handle: "fb-open-source", email: "jest@fb.com", packages: ["jest", "jest-cli", "jest-runtime", "jest-config", "jest-circus"], typosquats: ["jestt", "jest-js", "gest"], description: "Meta Open Source team maintaining Jest testing framework." },
    ],
  },
];

// ── Build knowledge items with forceful relations ───────────────────────────
function buildKnowledgeItems(incident) {
  const items = [];
  const root = incident.root;
  const rootId = `pkg:${root.name}@${root.version}`;

  // 1. Root compromised package
  const directServiceIds = incident.services
    .filter((s) => s.severity === "direct")
    .map((s) => `svc:${s.name}`);
  const intermediateIds = incident.intermediates.map(
    (p) => `pkg:${p.name}@${p.version}`
  );

  items.push({
    id: rootId,
    title: `${root.name}@${root.version} — Compromised Package`,
    type: "custom",
    content: { text: root.description },
    tenant_metadata: {
      entity_type: "package",
      severity: "compromised",
      incident_id: incident.id,
    },
    additional_metadata: {
      package_name: root.name,
      package_version: root.version,
      compromised_at: root.compromisedAt,
      detected_at: root.detectedAt,
      detection_minutes: String(root.detectionMinutes),
      detection_seconds: String(root.detectionSeconds),
    },
    relations: {
      ids: [...directServiceIds, ...intermediateIds],
      properties: { relation_type: "compromises" },
    },
  });

  // 2. Intermediate packages
  for (const pkg of incident.intermediates) {
    const pkgId = `pkg:${pkg.name}@${pkg.version}`;
    // Find services that have this package in their chain
    const childServiceIds = incident.services
      .filter((s) => s.chain.includes(`${pkg.name}@${pkg.version}`))
      .map((s) => `svc:${s.name}`);

    items.push({
      id: pkgId,
      title: `${pkg.name}@${pkg.version} — Intermediate Dependency`,
      type: "custom",
      content: { text: pkg.description },
      tenant_metadata: {
        entity_type: "package",
        severity: "transitive",
        incident_id: incident.id,
      },
      additional_metadata: {
        package_name: pkg.name,
        package_version: pkg.version,
        parent_package: rootId,
      },
      relations: {
        ids: [rootId, ...childServiceIds],
        properties: { relation_type: "depends_on" },
      },
    });
  }

  // 3. Services
  for (const svc of incident.services) {
    const svcId = `svc:${svc.name}`;
    const chainPkgIds = svc.chain
      .filter((c) => c.includes("@"))
      .map((c) => `pkg:${c}`);
    const maintainerId = `maint:${svc.maintainerHandle}`;

    // Find the maintainer data for embedding in metadata
    const maintainerData = incident.maintainers.find(
      (m) => m.handle === svc.maintainerHandle
    );

    items.push({
      id: svcId,
      title: `${svc.name} — Exposed Service`,
      type: "custom",
      content: {
        text:
          `Service "${svc.name}" was exposed via a ${svc.severity} dependency on the compromised package. ` +
          `Dependency chain: ${svc.chain.join(" → ")}. ` +
          `Exposed at ${svc.exposedAt}, ${svc.resolvedMinutes} minutes after initial compromise.`,
      },
      tenant_metadata: {
        entity_type: "service",
        severity: svc.severity,
        incident_id: incident.id,
      },
      additional_metadata: {
        service_name: svc.name,
        exposed_at: svc.exposedAt,
        resolved_minutes: String(svc.resolvedMinutes),
        chain: JSON.stringify(svc.chain),
        maintainer: JSON.stringify(maintainerData || {}),
      },
      relations: {
        ids: [...chainPkgIds, maintainerId],
        properties: { relation_type: "exposed_by" },
      },
    });
  }

  // 4. Maintainers
  for (const maint of incident.maintainers) {
    const maintId = `maint:${maint.handle}`;
    const maintPkgIds = maint.packages.map((p) => {
      // Try to find exact versioned package in incident data
      const inter = incident.intermediates.find((i) => i.name === p);
      if (inter) return `pkg:${inter.name}@${inter.version}`;
      if (p === root.name) return rootId;
      return `pkg:${p}`;
    });

    items.push({
      id: maintId,
      title: `${maint.handle} — Package Maintainer`,
      type: "custom",
      content: { text: maint.description },
      tenant_metadata: {
        entity_type: "maintainer",
        severity: "info",
        incident_id: incident.id,
      },
      additional_metadata: {
        handle: maint.handle,
        email: maint.email,
        packages: JSON.stringify(maint.packages),
        typosquats: JSON.stringify(maint.typosquats),
      },
      relations: {
        ids: maintPkgIds,
        properties: { relation_type: "maintains" },
      },
    });
  }

  return items;
}

// ── Main seed function ──────────────────────────────────────────────────────
async function seed() {
  const token = process.env.HYDRA_DB_API_KEY;
  if (!token) {
    console.error("✗ HYDRA_DB_API_KEY is not set. Create a .env file with your key.");
    process.exit(1);
  }

  const client = new HydraDBClient({ token });
  console.log("─── BlastRadius Seed Script ───\n");

  // 1. Create database
  console.log("① Creating database:", DATABASE);
  try {
    await client.databases.create({
      database: DATABASE,
      databaseMetadataSchema: [
        {
          name: "entity_type",
          data_type: "VARCHAR",
          enable_match: true,
          enable_dense_embedding: false,
          enable_sparse_embedding: false,
          max_length: 64,
        },
        {
          name: "severity",
          data_type: "VARCHAR",
          enable_match: true,
          enable_dense_embedding: false,
          enable_sparse_embedding: false,
          max_length: 32,
        },
        {
          name: "incident_id",
          data_type: "VARCHAR",
          enable_match: true,
          enable_dense_embedding: false,
          enable_sparse_embedding: false,
          max_length: 128,
        },
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

  // 2. Poll until ready
  console.log("② Waiting for database to be ready...");
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const status = await client.databases.status({ database: DATABASE });
      if (status?.data?.infra?.readyForIngestion) {
        ready = true;
        break;
      }
    } catch {
      // ignore transient errors during provisioning
    }
    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, 5000));
  }
  if (!ready) {
    console.error("\n  ✗ Database did not become ready in time.");
    process.exit(1);
  }
  console.log("\n  ✓ Database ready for ingestion");

  // 3. Ingest knowledge items
  const allItems = INCIDENTS.flatMap(buildKnowledgeItems);
  console.log(`③ Ingesting ${allItems.length} knowledge items...`);

  const ingest = await client.context.ingest({
    type: "knowledge",
    database: DATABASE,
    appKnowledge: JSON.stringify(allItems),
  });

  const ingestedIds = (ingest?.data?.results || []).map((r) => r.id);
  console.log(`  ✓ Ingested ${ingestedIds.length} items`);

  // 4. Poll until indexed
  console.log("④ Waiting for indexing to complete...");
  const idsToCheck = ingestedIds.slice(0, 5); // Check a sample
  let indexed = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      const statusResp = await client.context.status({
        database: DATABASE,
        ids: idsToCheck,
      });
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
        console.error("\n  ✗ Indexing failed:", failed.errorMessage || failed.error_message || "unknown error");
        process.exit(1);
      }
    } catch {
      // ignore transient errors
    }
    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, 3000));
  }
  if (!indexed) {
    console.error("\n  ✗ Indexing did not complete in time.");
    process.exit(1);
  }
  console.log("\n  ✓ All items indexed and graph built");

  // 5. Verify with a test query
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
  console.log(`\nDatabase "${DATABASE}" is ready with ${allItems.length} knowledge items.`);
  console.log("Run 'npm run server' to start the API, then 'npm run dev' for the frontend.\n");
}

seed().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
