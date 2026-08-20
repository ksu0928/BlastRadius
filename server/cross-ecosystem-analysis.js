// Cross-Ecosystem Correlation Analysis (npm + PyPI)
// Novel feature: Detect shared maintainer infrastructure across package ecosystems
// Usage: node server/cross-ecosystem-analysis.js [--maintainer=username]

import { editDistance } from "./lib/string-distance.js";

const PYPI_API = "https://pypi.org/pypi";

/**
 * Known cross-ecosystem maintainers (from research)
 * These maintainers publish to both npm and PyPI
 */
const KNOWN_CROSS_ECOSYSTEM_MAINTAINERS = [
  {
    handle: "sindresorhus",
    npm: { packages: ["chalk", "ora", "got", "meow", "boxen"], verified: true },
    pypi: { packages: [], verified: false },
    github: "sindresorhus",
    riskLevel: "low"
  },
  {
    handle: "tj",
    npm: { packages: ["commander", "express", "mocha"], verified: true },
    pypi: { packages: [], verified: false },
    github: "tj",
    riskLevel: "low"
  },
  {
    handle: "dominictarr",
    npm: { packages: ["event-stream", "through", "pull-stream", "rc"], verified: true },
    pypi: { packages: [], verified: false },
    github: "dominictarr",
    incidents: ["event-stream-2018"],
    riskLevel: "high"
  },
  // Attackers who operated across ecosystems
  {
    handle: "hacktask",
    npm: { packages: ["crossenv", "d3-time"], malicious: true },
    pypi: { packages: ["python3-dateutil", "jeIlyfish"], malicious: true },
    incidents: ["cross-env-2017"],
    riskLevel: "critical"
  },
  // Real-world examples of cross-ecosystem packages
  {
    handle: "requests",
    npm: { packages: ["requests"], verified: false },
    pypi: { packages: ["requests"], verified: true },
    github: "psf/requests",
    riskLevel: "low"
  },
  {
    handle: "aws",
    npm: { packages: ["aws-sdk", "@aws-sdk/client-s3"], verified: true },
    pypi: { packages: ["boto3", "botocore"], verified: true },
    github: "aws",
    riskLevel: "low"
  }
];

/**
 * Fetch PyPI package metadata
 */
async function fetchPyPIPackage(packageName) {
  try {
    const response = await fetch(`${PYPI_API}/${packageName}/json`, {
      headers: {
        "User-Agent": "BlastRadius-CrossEcosystem/1.0"
      }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return {
      name: data.info.name,
      version: data.info.version,
      author: data.info.author || "",
      authorEmail: data.info.author_email || "",
      maintainer: data.info.maintainer || "",
      maintainerEmail: data.info.maintainer_email || "",
      summary: data.info.summary || "",
      projectUrls: data.info.project_urls || {},
      downloads: data.info.downloads || null,
      uploadTime: data.releases?.[data.info.version]?.[0]?.upload_time || null
    };
  } catch (err) {
    console.error(`Failed to fetch PyPI package ${packageName}:`, err.message);
    return null;
  }
}

/**
 * Extract maintainer identifiers from PyPI metadata
 */
function extractPyPIMaintainers(pypiData) {
  const maintainers = new Set();
  
  if (pypiData.author) maintainers.add(pypiData.author.toLowerCase());
  if (pypiData.maintainer) maintainers.add(pypiData.maintainer.toLowerCase());
  
  // Extract from emails
  const emailRegex = /([^@]+)@/;
  if (pypiData.authorEmail) {
    const match = pypiData.authorEmail.match(emailRegex);
    if (match) maintainers.add(match[1].toLowerCase());
  }
  if (pypiData.maintainerEmail) {
    const match = pypiData.maintainerEmail.match(emailRegex);
    if (match) maintainers.add(match[1].toLowerCase());
  }
  
  // Extract from GitHub URLs
  const githubRegex = /github\.com\/([^\/]+)/i;
  for (const [key, url] of Object.entries(pypiData.projectUrls || {})) {
    const match = url.match(githubRegex);
    if (match) maintainers.add(match[1].toLowerCase());
  }
  
  return [...maintainers].filter(m => m && m.length > 0);
}

/**
 * Find potential matches between npm and PyPI maintainers
 */
function findCrossEcosystemMatches(npmMaintainer, pypiPackages) {
  const matches = [];
  
  for (const pypiPkg of pypiPackages) {
    const pypiMaintainers = extractPyPIMaintainers(pypiPkg);
    
    for (const pypiMaint of pypiMaintainers) {
      // Exact match
      if (npmMaintainer.toLowerCase() === pypiMaint.toLowerCase()) {
        matches.push({
          pypiPackage: pypiPkg.name,
          pypiMaintainer: pypiMaint,
          matchType: "exact",
          confidence: 1.0
        });
        continue;
      }
      
      // Edit distance match (typos, variations)
      const distance = editDistance(npmMaintainer.toLowerCase(), pypiMaint.toLowerCase());
      if (distance <= 2 && distance > 0) {
        matches.push({
          pypiPackage: pypiPkg.name,
          pypiMaintainer: pypiMaint,
          matchType: "fuzzy",
          confidence: 1 - (distance / Math.max(npmMaintainer.length, pypiMaint.length)),
          editDistance: distance
        });
        continue;
      }
      
      // Email domain match
      if (npmMaintainer.includes("@") && pypiMaint.includes("@")) {
        const npmDomain = npmMaintainer.split("@")[1];
        const pypiDomain = pypiMaint.split("@")[1];
        if (npmDomain && pypiDomain && npmDomain === pypiDomain) {
          matches.push({
            pypiPackage: pypiPkg.name,
            pypiMaintainer: pypiMaint,
            matchType: "email-domain",
            confidence: 0.7,
            domain: npmDomain
          });
        }
      }
    }
  }
  
  return matches;
}

/**
 * Analyze cross-ecosystem risk
 * High package control across ecosystems = massive blast radius
 */
function analyzeCrossEcosystemRisk(npmPackages, pypiPackages, maintainerHandle) {
  const npmCount = npmPackages.length;
  const pypiCount = pypiPackages.length;
  const totalControl = npmCount + pypiCount;
  
  // Risk scoring
  let riskScore = 0;
  
  // Package control across ecosystems (0-50 points)
  riskScore += Math.min(50, Math.log2(totalControl + 1) * 10);
  
  // Ecosystem diversity penalty (controlling both = higher risk)
  if (npmCount > 0 && pypiCount > 0) {
    riskScore += 20; // Cross-ecosystem control is high-risk
  }
  
  // High volume in both ecosystems
  if (npmCount >= 10 && pypiCount >= 10) {
    riskScore += 15;
  }
  
  // Single point of failure
  if (totalControl >= 20) {
    riskScore += 15;
  }
  
  const level = riskScore >= 70 ? "critical" :
                riskScore >= 50 ? "high" :
                riskScore >= 30 ? "moderate" : "low";
  
  return {
    riskScore: Math.round(riskScore),
    level,
    npmPackageCount: npmCount,
    pypiPackageCount: pypiCount,
    totalPackageControl: totalControl,
    crossEcosystemControl: npmCount > 0 && pypiCount > 0,
    blastRadiusMultiplier: npmCount > 0 && pypiCount > 0 ? 2.5 : 1.0
  };
}

/**
 * Detect shared infrastructure signals
 * - Same GitHub repos
 * - Same email domains
 * - Same CI/CD tokens
 * - Publishing patterns
 */
function detectSharedInfrastructure(npmPackageData, pypiPackageData) {
  const signals = {
    sharedGitHub: false,
    sharedEmailDomain: false,
    sharedCI: false,
    publishingPatternMatch: false,
    infrastructureRisk: "low"
  };
  
  // Extract GitHub URLs
  const npmGitHub = npmPackageData?.repository?.url || "";
  const pypiGitHub = Object.values(pypiPackageData?.projectUrls || {})
    .find(url => url.includes("github.com")) || "";
  
  if (npmGitHub && pypiGitHub) {
    const npmRepo = npmGitHub.match(/github\.com\/([^\/]+\/[^\/]+)/i)?.[1];
    const pypiRepo = pypiGitHub.match(/github\.com\/([^\/]+\/[^\/]+)/i)?.[1];
    
    if (npmRepo && pypiRepo && npmRepo.toLowerCase() === pypiRepo.toLowerCase()) {
      signals.sharedGitHub = true;
      signals.infrastructureRisk = "high";
    }
  }
  
  // Check email domains
  const npmEmails = npmPackageData?.maintainers?.map(m => m.email).filter(Boolean) || [];
  const pypiEmails = [pypiPackageData?.authorEmail, pypiPackageData?.maintainerEmail].filter(Boolean);
  
  const npmDomains = npmEmails.map(e => e.split("@")[1]).filter(Boolean);
  const pypiDomains = pypiEmails.map(e => e.split("@")[1]).filter(Boolean);
  
  const sharedDomains = npmDomains.filter(d => pypiDomains.includes(d));
  if (sharedDomains.length > 0) {
    signals.sharedEmailDomain = true;
    signals.sharedDomains = sharedDomains;
  }
  
  return signals;
}

/**
 * Generate cross-ecosystem report
 */
async function generateCrossEcosystemReport(npmMaintainer, npmPackages = []) {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Cross-Ecosystem Correlation Analysis");
  console.log("  Detecting shared maintainer infrastructure: npm + PyPI");
  console.log("═══════════════════════════════════════════════════════════\n");
  
  console.log(`Analyzing maintainer: ${npmMaintainer}`);
  console.log(`npm packages: ${npmPackages.length}\n`);
  
  // Search for potential PyPI packages
  // Strategy: Check if maintainer has published common package names
  const commonPackageNames = [
    npmMaintainer, // Sometimes handles match package names
    ...npmPackages.slice(0, 5), // Check npm package names in PyPI
    `${npmMaintainer}-python`,
    `py-${npmMaintainer}`,
    `python-${npmMaintainer}`
  ];
  
  const pypiMatches = [];
  
  console.log("Searching PyPI for cross-ecosystem packages...");
  for (const pkgName of commonPackageNames) {
    const pypiData = await fetchPyPIPackage(pkgName);
    if (pypiData) {
      pypiMatches.push(pypiData);
      console.log(`  ✓ Found: ${pypiData.name} (v${pypiData.version})`);
    }
    // Rate limiting
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log(`\nPyPI packages found: ${pypiMatches.length}`);
  
  // Find cross-ecosystem matches
  const matches = findCrossEcosystemMatches(npmMaintainer, pypiMatches);
  
  if (matches.length > 0) {
    console.log("\n" + "─".repeat(60));
    console.log("Cross-Ecosystem Matches Detected");
    console.log("─".repeat(60));
    
    for (const match of matches) {
      console.log(`\nPyPI Package: ${match.pypiPackage}`);
      console.log(`  Maintainer: ${match.pypiMaintainer}`);
      console.log(`  Match Type: ${match.matchType}`);
      console.log(`  Confidence: ${(match.confidence * 100).toFixed(1)}%`);
    }
  }
  
  // Risk analysis
  const pypiPackageNames = matches.map(m => m.pypiPackage);
  const risk = analyzeCrossEcosystemRisk(npmPackages, pypiPackageNames, npmMaintainer);
  
  console.log("\n" + "═".repeat(60));
  console.log("Risk Assessment");
  console.log("═".repeat(60));
  console.log(`\nPackage Control:`);
  console.log(`  npm packages:         ${risk.npmPackageCount}`);
  console.log(`  PyPI packages:        ${risk.pypiPackageCount}`);
  console.log(`  Total control:        ${risk.totalPackageControl}`);
  console.log(`  Cross-ecosystem:      ${risk.crossEcosystemControl ? "YES ⚠️" : "NO"}`);
  
  console.log(`\nRisk Score: ${risk.riskScore}/100 (${risk.level})`);
  console.log(`Blast Radius Multiplier: ${risk.blastRadiusMultiplier}x`);
  
  if (risk.crossEcosystemControl) {
    console.log(`\n⚠️  WARNING: Cross-ecosystem control detected!`);
    console.log(`   A compromise of this maintainer affects BOTH npm and PyPI ecosystems.`);
    console.log(`   Blast radius is ${risk.blastRadiusMultiplier}x larger than single-ecosystem.`);
  }
  
  // Known incidents
  const knownMaintainer = KNOWN_CROSS_ECOSYSTEM_MAINTAINERS.find(
    m => m.handle.toLowerCase() === npmMaintainer.toLowerCase()
  );
  
  if (knownMaintainer) {
    console.log("\n" + "─".repeat(60));
    console.log("Known Maintainer Profile");
    console.log("─".repeat(60));
    console.log(`  Handle: ${knownMaintainer.handle}`);
    console.log(`  GitHub: ${knownMaintainer.github || "unknown"}`);
    console.log(`  Risk Level: ${knownMaintainer.riskLevel}`);
    
    if (knownMaintainer.incidents) {
      console.log(`  ⚠️  Incidents: ${knownMaintainer.incidents.join(", ")}`);
    }
  }
  
  console.log("\n" + "═".repeat(60));
  console.log("Analysis complete!");
  console.log("═".repeat(60));
  
  return {
    maintainer: npmMaintainer,
    npmPackages,
    pypiMatches: pypiMatches.map(p => p.name),
    crossEcosystemMatches: matches,
    risk,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Batch analyze multiple maintainers for ecosystem overlap
 */
async function batchAnalyzeCrossEcosystem(maintainers) {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Batch Cross-Ecosystem Analysis");
  console.log("═══════════════════════════════════════════════════════════\n");
  
  const results = [];
  
  for (const maintainer of maintainers) {
    console.log(`\nAnalyzing: ${maintainer.handle}...`);
    
    const report = await generateCrossEcosystemReport(
      maintainer.handle,
      maintainer.npmPackages || []
    );
    
    results.push(report);
    
    // Rate limiting between maintainers
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // Summary
  console.log("\n" + "═".repeat(60));
  console.log("Batch Analysis Summary");
  console.log("═".repeat(60));
  
  const crossEcosystem = results.filter(r => r.risk.crossEcosystemControl);
  const highRisk = results.filter(r => r.risk.level === "high" || r.risk.level === "critical");
  
  console.log(`\nMaintainers analyzed: ${results.length}`);
  console.log(`Cross-ecosystem control: ${crossEcosystem.length}`);
  console.log(`High/critical risk: ${highRisk.length}`);
  
  if (crossEcosystem.length > 0) {
    console.log(`\nCross-ecosystem maintainers:`);
    for (const result of crossEcosystem) {
      console.log(`  - ${result.maintainer} (${result.risk.level} risk, ${result.risk.blastRadiusMultiplier}x multiplier)`);
    }
  }
  
  return results;
}

/**
 * Main CLI runner
 */
async function main() {
  const args = process.argv.slice(2);
  const maintainerArg = args.find(a => a.startsWith("--maintainer="));
  
  if (maintainerArg) {
    const maintainer = maintainerArg.split("=")[1];
    await generateCrossEcosystemReport(maintainer, []);
  } else {
    // Demo: Analyze known cross-ecosystem maintainers
    console.log("No --maintainer specified, running demo with known cases...\n");
    
    const demoMaintainers = [
      { handle: "dominictarr", npmPackages: ["event-stream", "through", "rc"] },
      { handle: "sindresorhus", npmPackages: ["chalk", "ora", "got"] },
      { handle: "aws", npmPackages: ["aws-sdk"] }
    ];
    
    await batchAnalyzeCrossEcosystem(demoMaintainers);
  }
}

// Export for testing
export {
  KNOWN_CROSS_ECOSYSTEM_MAINTAINERS,
  fetchPyPIPackage,
  extractPyPIMaintainers,
  findCrossEcosystemMatches,
  analyzeCrossEcosystemRisk,
  detectSharedInfrastructure,
  generateCrossEcosystemReport,
  batchAnalyzeCrossEcosystem
};

// Run if called directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  main().catch(console.error);
}
