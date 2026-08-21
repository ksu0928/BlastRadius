// ─────────────────────────────────────────────────────────────────────────────
// Maintainer Intelligence & Risk Scoring
// ─────────────────────────────────────────────────────────────────────────────

import { editDistance } from "./lib/string-distance.js";

/**
 * Analyze typosquat risk with edit distance
 */
function analyzeTyposquats(packageName, typosquats) {
  return typosquats.map(typo => {
    const distance = editDistance(packageName.toLowerCase(), typo.toLowerCase());
    const diff = highlightDifference(packageName, typo);
    
    let severity = "low";
    if (distance === 1) severity = "critical";
    else if (distance === 2) severity = "high";
    else if (distance === 3) severity = "moderate";
    
    return {
      name: typo,
      distance,
      severity,
      diff,
      risk: distance === 1 ? "Extremely easy to mistype" :
            distance === 2 ? "Easy to mistype" :
            distance === 3 ? "Possible confusion" :
            "Low confusion risk"
    };
  }).sort((a, b) => a.distance - b.distance);
}

/**
 * Highlight character differences between two strings
 */
function highlightDifference(original, variant) {
  const changes = [];
  const maxLen = Math.max(original.length, variant.length);
  
  for (let i = 0; i < maxLen; i++) {
    const origChar = original[i] || '';
    const varChar = variant[i] || '';
    
    if (origChar !== varChar) {
      if (!origChar) changes.push({ type: 'added', char: varChar, pos: i });
      else if (!varChar) changes.push({ type: 'removed', char: origChar, pos: i });
      else changes.push({ type: 'changed', from: origChar, to: varChar, pos: i });
    }
  }
  
  return changes;
}

/**
 * Calculate maintainer risk score
 * Score components:
 * - Package count (control surface): 0-40 points
 * - Typosquat density: 0-30 points
 * - Incident involvement: 0-30 points (compromised = 30, transitive = 15)
 * Total: 0-100 risk score
 */
function calculateRiskScore(maintainer, graph) {
  let score = 0;
  
  // Package count component (logarithmic scale)
  const pkgCount = maintainer.packages?.length || 0;
  const pkgScore = Math.min(40, Math.log2(pkgCount + 1) * 8);
  score += pkgScore;
  
  // Typosquat density component
  const typoCount = maintainer.typosquats?.length || 0;
  const typoScore = Math.min(30, typoCount * 3);
  score += typoScore;
  
  // Incident involvement component
  const incidentSeverity = maintainer.incidentRole || "none";
  if (incidentSeverity === "attacker" || incidentSeverity === "compromised") {
    score += 30;
  } else if (incidentSeverity === "transitive") {
    score += 15;
  }
  
  return {
    total: Math.round(score),
    breakdown: {
      packageControl: Math.round(pkgScore),
      typosquatRisk: Math.round(typoScore),
      incidentInvolvement: incidentSeverity === "attacker" || incidentSeverity === "compromised" ? 30 :
                           incidentSeverity === "transitive" ? 15 : 0
    },
    level: score >= 70 ? "critical" :
           score >= 50 ? "high" :
           score >= 30 ? "moderate" : "low"
  };
}

/**
 * Find single points of failure (maintainers controlling critical paths)
 */
function findCriticalMaintainers(maintainers, services) {
  const criticalityMap = new Map();
  
  for (const service of services) {
    const chain = service.chain || [];
    const maintainerHandle = service.maintainer?.name || service.maintainerHandle;
    
    if (maintainerHandle) {
      if (!criticalityMap.has(maintainerHandle)) {
        criticalityMap.set(maintainerHandle, {
          servicesControlled: new Set(),
          criticalPaths: [],
          chainDepths: []
        });
      }
      
      const entry = criticalityMap.get(maintainerHandle);
      entry.servicesControlled.add(service.name);
      entry.criticalPaths.push(chain);
      entry.chainDepths.push(chain.length);
    }
  }
  
  return Array.from(criticalityMap.entries()).map(([handle, data]) => ({
    handle,
    servicesControlled: data.servicesControlled.size,
    criticalPaths: data.criticalPaths.length,
    avgChainDepth: data.chainDepths.reduce((a, b) => a + b, 0) / data.chainDepths.length,
    maxChainDepth: Math.max(...data.chainDepths),
    isSinglePointOfFailure: data.servicesControlled.size >= 3 || data.criticalPaths.length >= 5
  })).sort((a, b) => b.servicesControlled - a.servicesControlled);
}

/**
 * Analyze maintainer network for an incident
 */
export function analyzeMaintainerRisk(data) {
  const { services, graphContext } = data;
  
  // Extract maintainers from services
  const maintainerMap = new Map();
  
  for (const service of services) {
    const maint = service.maintainer;
    if (!maint || !maint.name) continue;
    
    if (!maintainerMap.has(maint.name)) {
      maintainerMap.set(maint.name, {
        handle: maint.name,
        email: maint.email || "",
        packages: maint.packages || [],
        typosquats: maint.typosquats || [],
        servicesExposed: [],
        incidentRole: "transitive"
      });
    }
    
    maintainerMap.get(maint.name).servicesExposed.push(service.name);
  }
  
  // Calculate risk scores
  const maintainers = Array.from(maintainerMap.values()).map(m => {
    const packages = m.packages || [];
    const primaryPkg = packages[0] || m.handle;
    
    return {
      ...m,
      riskScore: calculateRiskScore(m, {}),
      typosquatAnalysis: analyzeTyposquats(primaryPkg, m.typosquats || []),
      packageCount: packages.length,
      exposureCount: m.servicesExposed.length
    };
  });
  
  // Sort by risk score
  maintainers.sort((a, b) => b.riskScore.total - a.riskScore.total);
  
  // Find critical maintainers
  const criticalMaintainers = findCriticalMaintainers(maintainers, services);
  
  // Overall statistics
  const stats = {
    totalMaintainers: maintainers.length,
    criticalMaintainers: maintainers.filter(m => m.riskScore.level === "critical").length,
    highRiskMaintainers: maintainers.filter(m => m.riskScore.level === "high").length,
    totalTyposquats: maintainers.reduce((sum, m) => sum + (m.typosquats?.length || 0), 0),
    avgPackagesPerMaintainer: maintainers.reduce((sum, m) => sum + m.packageCount, 0) / maintainers.length,
    singlePointsOfFailure: criticalMaintainers.filter(c => c.isSinglePointOfFailure).length
  };
  
  return {
    maintainers,
    criticalMaintainers,
    stats,
    recommendations: generateRecommendations(maintainers, criticalMaintainers)
  };
}

/**
 * Generate security recommendations based on analysis
 */
function generateRecommendations(maintainers, criticalMaintainers) {
  const recommendations = [];
  
  const criticalRisk = maintainers.filter(m => m.riskScore.level === "critical");
  if (criticalRisk.length > 0) {
    recommendations.push({
      severity: "critical",
      title: "Critical Risk Maintainers Detected",
      description: `${criticalRisk.length} maintainer(s) with critical risk scores control packages in this blast radius.`,
      action: `Review and audit all packages maintained by: ${criticalRisk.slice(0, 3).map(m => m.handle).join(", ")}`
    });
  }
  
  const highTyposquat = maintainers.filter(m => (m.typosquats?.length || 0) >= 5);
  if (highTyposquat.length > 0) {
    recommendations.push({
      severity: "high",
      title: "High Typosquat Risk",
      description: `${highTyposquat.length} maintainer(s) have 5+ typosquat variants detected.`,
      action: "Implement package name validation and registry verification in CI/CD pipeline"
    });
  }
  
  const spof = criticalMaintainers.filter(c => c.isSinglePointOfFailure);
  if (spof.length > 0) {
    recommendations.push({
      severity: "high",
      title: "Single Points of Failure",
      description: `${spof.length} maintainer(s) control critical dependency paths affecting multiple services.`,
      action: `Consider diversifying dependencies or vendoring packages from: ${spof.slice(0, 3).map(c => c.handle).join(", ")}`
    });
  }
  
  const distance1Typos = maintainers.flatMap(m => 
    (m.typosquatAnalysis || []).filter(t => t.distance === 1)
  );
  if (distance1Typos.length > 0) {
    recommendations.push({
      severity: "moderate",
      title: "Edit-Distance 1 Typosquats",
      description: `${distance1Typos.length} typosquat(s) are only 1 character different from legitimate packages.`,
      action: "Enable typosquatting detection in package manager and review package names carefully"
    });
  }
  
  return recommendations;
}
