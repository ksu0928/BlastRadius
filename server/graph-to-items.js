// Convert graph.json + incidents into HydraDB knowledge items.
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { INCIDENTS } from "./incidents.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GRAPH_PATH = join(__dirname, "..", "data", "graph.json");

export function loadGraph() {
  const raw = readFileSync(GRAPH_PATH, "utf8");
  return JSON.parse(raw);
}

/** Build rich incident items (services, maintainers, anchor packages). */
export function buildIncidentItems(incident) {
  const items = [];
  const root = incident.root;
  const rootId = `pkg:${root.name}@${root.version}`;

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
      is_anchor: "true",
    },
    relations: {
      ids: [...directServiceIds, ...intermediateIds],
      properties: { relation_type: "compromises" },
    },
  });

  for (const pkg of incident.intermediates) {
    const pkgId = `pkg:${pkg.name}@${pkg.version}`;
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
        is_anchor: "true",
      },
      relations: {
        ids: [rootId, ...childServiceIds],
        properties: { relation_type: "depends_on" },
      },
    });
  }

  for (const svc of incident.services) {
    const svcId = `svc:${svc.name}`;
    const chainPkgIds = svc.chain.filter((c) => c.includes("@")).map((c) => `pkg:${c}`);
    const maintainerId = `maint:${svc.maintainerHandle}`;
    const maintainerData = incident.maintainers.find((m) => m.handle === svc.maintainerHandle);

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

  for (const maint of incident.maintainers) {
    const maintId = `maint:${maint.handle}`;
    const maintPkgIds = maint.packages.map((p) => {
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

/** Build registry package items from graph.json (real npm deps). */
export function buildRegistryItems(graph) {
  const items = [];
  const incidentPkgIds = new Set();

  for (const incident of INCIDENTS) {
    incidentPkgIds.add(`pkg:${incident.root.name}@${incident.root.version}`);
    for (const inter of incident.intermediates) {
      incidentPkgIds.add(`pkg:${inter.name}@${inter.version}`);
    }
  }

  const edgesByFrom = new Map();
  for (const edge of graph.edges || []) {
    if (!edgesByFrom.has(edge.from)) edgesByFrom.set(edge.from, []);
    edgesByFrom.get(edge.from).push(edge.to);
  }

  for (const pkg of graph.packages || []) {
    if (incidentPkgIds.has(pkg.id)) continue;

    const depIds = edgesByFrom.get(pkg.id) || [];
    const maintIds = (pkg.maintainers || []).map((h) => `maint:${h}`);

    let severity = pkg.severity || "normal";
    if (severity === "normal" && pkg.advisories?.length > 0) severity = "vulnerable";

    const advisoryText = (pkg.advisories || [])
      .map((a) => `${a.id}: ${a.summary}`)
      .join(" | ");

    items.push({
      id: pkg.id,
      title: `${pkg.name}@${pkg.version} — npm Package`,
      type: "custom",
      content: {
        text:
          `${pkg.name}@${pkg.version} from the npm registry. ${pkg.description || ""}` +
          (advisoryText ? ` Known vulnerabilities: ${advisoryText}` : ""),
      },
      tenant_metadata: {
        entity_type: "package",
        severity,
        incident_id: pkg.incidentId || "registry",
      },
      additional_metadata: {
        package_name: pkg.name,
        package_version: pkg.version,
        maintainers: JSON.stringify(pkg.maintainers || []),
        advisory_count: String((pkg.advisories || []).length),
        ...(pkg.compromisedAt ? { compromised_at: pkg.compromisedAt } : {}),
        ...(pkg.detectedAt ? { detected_at: pkg.detectedAt } : {}),
      },
      relations: {
        ids: [...depIds, ...maintIds],
        properties: { relation_type: "depends_on" },
      },
    });
  }

  // Maintainer nodes from registry packages
  const maintainerMap = new Map();
  for (const pkg of graph.packages || []) {
    for (const handle of pkg.maintainers || []) {
      if (!maintainerMap.has(handle)) maintainerMap.set(handle, new Set());
      maintainerMap.get(handle).add(pkg.id);
    }
  }

  for (const [handle, pkgIds] of maintainerMap) {
    if (items.some((i) => i.id === `maint:${handle}`)) continue;
    items.push({
      id: `maint:${handle}`,
      title: `${handle} — npm Maintainer`,
      type: "custom",
      content: {
        text: `npm maintainer ${handle}. Maintains ${pkgIds.size} packages in the BlastRadius dependency graph.`,
      },
      tenant_metadata: {
        entity_type: "maintainer",
        severity: "info",
        incident_id: "registry",
      },
      additional_metadata: {
        handle,
        packages: JSON.stringify([...pkgIds].map((id) => id.replace(/^pkg:/, "").split("@")[0])),
        typosquats: "[]",
      },
      relations: {
        ids: [...pkgIds],
        properties: { relation_type: "maintains" },
      },
    });
  }

  return items;
}

export function buildAllKnowledgeItems(graph) {
  const incidents = graph.incidents || INCIDENTS;
  const incidentItems = incidents.flatMap(buildIncidentItems);
  const registryItems = buildRegistryItems(graph);
  return [...incidentItems, ...registryItems];
}
