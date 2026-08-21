// Fetch vulnerability advisories from OSV.dev for npm packages.
const OSV_QUERY = "https://api.osv.dev/v1/query";
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function queryOsv(packageName) {
  const res = await fetch(OSV_QUERY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ package: { name: packageName, ecosystem: "npm" } }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.vulns || [];
}

/**
 * Enrich packages with OSV advisory data.
 * @param {object[]} packages
 * @param {object} opts
 * @param {number} [opts.maxQueries] - cap OSV API calls
 * @param {(msg: string) => void} [opts.log]
 */
export async function enrichWithAdvisories(packages, opts = {}) {
  const maxQueries = opts.maxQueries ?? 500;
  const log = opts.log ?? console.log;
  const names = [...new Set(packages.map((p) => p.name))].slice(0, maxQueries);

  log(`Querying OSV.dev for ${names.length} packages...`);

  /** @type {Map<string, object[]>} */
  const advisoryMap = new Map();
  let vulnerableCount = 0;

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    try {
      const vulns = await queryOsv(name);
      if (vulns.length > 0) {
        const summaries = vulns.slice(0, 5).map((v) => ({
          id: v.id,
          summary: (v.summary || "").slice(0, 300),
          severity: v.database_specific?.severity || v.severity?.[0]?.type || "unknown",
          published: v.published || null,
          aliases: (v.aliases || []).slice(0, 3),
        }));
        advisoryMap.set(name, summaries);
        vulnerableCount++;
      }
    } catch {
      // skip failed lookups
    }

    if ((i + 1) % 25 === 0) {
      log(`  … ${i + 1}/${names.length} queried, ${vulnerableCount} with advisories`);
    }
    await delay(40);
  }

  const enriched = packages.map((pkg) => {
    const advisories = advisoryMap.get(pkg.name) || [];
    if (advisories.length === 0) return pkg;
    return {
      ...pkg,
      severity: pkg.severity === "compromised" ? "compromised" : "vulnerable",
      advisories,
    };
  });

  log(`  ✓ OSV enrichment: ${vulnerableCount} packages with known vulnerabilities`);

  return { packages: enriched, advisoryCount: vulnerableCount };
}
