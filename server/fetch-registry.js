// Crawl npm registry for package nodes and depends_on edges.
import {
  SEED_PACKAGES,
  fetchPackageSlim,
  pkgId,
} from "./lib/npm-registry.js";

export const DEFAULTS = {
  maxPackages: 4000,
  maxDepth: 3,
};

/** Resolve dep range to version — reuse already-crawled packages when possible. */
async function resolveDepVersion(depName, range, packages, versionCache) {
  const existing = packages.get(depName);
  if (existing) return existing.version;

  const key = `${depName}@${range}`;
  if (versionCache.has(key)) return versionCache.get(key);

  const slim = await fetchPackageSlim(depName);
  if (!slim) {
    versionCache.set(key, null);
    return null;
  }
  versionCache.set(key, slim.version);
  return slim.version;
}

/**
 * BFS crawl from seed packages. Returns { packages, edges }.
 */
export async function crawlRegistry(opts = {}) {
  const maxPackages = opts.maxPackages ?? DEFAULTS.maxPackages;
  const maxDepth = opts.maxDepth ?? DEFAULTS.maxDepth;
  const log = opts.log ?? console.log;

  /** @type {Map<string, object>} */
  const packages = new Map();
  /** @type {Array<{from:string,to:string,type:string}>} */
  const edges = [];
  const edgeSet = new Set();
  const versionCache = new Map();

  const queue = SEED_PACKAGES.map((name) => ({ name, depth: 0 }));
  const queued = new Set(SEED_PACKAGES);

  log(`Crawling npm registry (max ${maxPackages} packages, depth ${maxDepth})...`);

  while (queue.length > 0 && packages.size < maxPackages) {
    const { name, depth } = queue.shift();
    if (packages.has(name)) continue;

    let slim;
    try {
      slim = await fetchPackageSlim(name);
    } catch (err) {
      log(`  ⚠ skip ${name}: ${err.message}`);
      continue;
    }
    if (!slim) continue;

    packages.set(name, {
      name: slim.name,
      version: slim.version,
      id: pkgId(slim.name, slim.version),
      description: slim.description,
      maintainers: slim.maintainers,
      severity: "normal",
      advisories: [],
      incidentId: null,
    });

    if (depth < maxDepth) {
      for (const dep of slim.dependencies) {
        const depVersion = await resolveDepVersion(dep.name, dep.range, packages, versionCache);
        if (depVersion) {
          const fromId = pkgId(slim.name, slim.version);
          const toId = pkgId(dep.name, depVersion);
          const edgeKey = `${fromId}->${toId}`;
          if (!edgeSet.has(edgeKey)) {
            edgeSet.add(edgeKey);
            edges.push({ from: fromId, to: toId, type: "depends_on" });
          }
        }

        if (!queued.has(dep.name) && packages.size + queue.length < maxPackages) {
          queued.add(dep.name);
          queue.push({ name: dep.name, depth: depth + 1 });
        }
      }
    }

    if (packages.size % 200 === 0) {
      log(`  … ${packages.size} packages, ${edges.length} edges`);
    }
  }

  log(`  ✓ Registry crawl: ${packages.size} packages, ${edges.length} edges`);
  return { packages: [...packages.values()], edges };
}
