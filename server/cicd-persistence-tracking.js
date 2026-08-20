// CI/CD Persistence and Infrastructure Graph Modeling
// Novel capability: Track attack propagation through config files and shared infrastructure
// Models .git, .vscode, .claude, CI/CD configs, and shared tokens as graph edges
// Usage: node server/cicd-persistence-tracking.js

/**
 * ATTACK PERSISTENCE MECHANISMS
 * 
 * Based on TanStack worm (May 2026) and other real incidents:
 * 1. .git/hooks/ - Pre-commit hooks that inject malicious code
 * 2. .vscode/ - Workspace settings with malicious tasks
 * 3. .claude/ - Kiro AI configuration with embedded commands
 * 4. .github/workflows/ - CI/CD workflows with credential theft
 * 5. package.json scripts - Lifecycle hooks (postinstall, preinstall)
 * 6. .npmrc / .yarnrc - Registry credentials and tokens
 * 7. .env files - Shared secrets and API keys
 * 8. Docker configs - Container runtime persistence
 */

const PERSISTENCE_MECHANISMS = {
  GIT_HOOKS: {
    type: "git-hook",
    files: [".git/hooks/pre-commit", ".git/hooks/post-checkout", ".git/hooks/pre-push"],
    riskLevel: "critical",
    propagation: "developer-to-developer",
    detectionDifficulty: "high",
    description: "Executes malicious code on every git operation"
  },
  
  VSCODE_CONFIG: {
    type: "ide-config",
    files: [".vscode/tasks.json", ".vscode/settings.json", ".vscode/extensions.json"],
    riskLevel: "high",
    propagation: "workspace-level",
    detectionDifficulty: "medium",
    description: "Auto-executes tasks when workspace opens"
  },
  
  CLAUDE_KIRO_CONFIG: {
    type: "ai-config",
    files: [".claude/config.json", ".kiro/hooks/*.json", ".kiro/settings/mcp.json"],
    riskLevel: "high",
    propagation: "ai-assisted",
    detectionDifficulty: "high",
    description: "Embeds commands in AI agent hooks (TanStack worm vector)"
  },
  
  GITHUB_ACTIONS: {
    type: "ci-workflow",
    files: [".github/workflows/*.yml", ".github/workflows/*.yaml"],
    riskLevel: "critical",
    propagation: "ci-cd-pipeline",
    detectionDifficulty: "medium",
    description: "Executes in CI with elevated privileges and secrets access"
  },
  
  GITLAB_CI: {
    type: "ci-workflow",
    files: [".gitlab-ci.yml"],
    riskLevel: "critical",
    propagation: "ci-cd-pipeline",
    detectionDifficulty: "medium",
    description: "GitLab CI pipeline with secrets exposure"
  },
  
  PACKAGE_LIFECYCLE: {
    type: "package-script",
    files: ["package.json"],
    fields: ["scripts.preinstall", "scripts.postinstall", "scripts.prepare"],
    riskLevel: "critical",
    propagation: "npm-install",
    detectionDifficulty: "low",
    description: "Executes automatically during npm install"
  },
  
  NPM_CREDENTIALS: {
    type: "credential-file",
    files: [".npmrc", ".yarnrc", ".yarnrc.yml"],
    riskLevel: "critical",
    propagation: "credential-theft",
    detectionDifficulty: "low",
    description: "Contains registry auth tokens for package publishing"
  },
  
  ENV_SECRETS: {
    type: "secret-file",
    files: [".env", ".env.local", ".env.production"],
    riskLevel: "high",
    propagation: "secret-exposure",
    detectionDifficulty: "low",
    description: "API keys, database credentials, signing keys"
  },
  
  DOCKER_CONFIG: {
    type: "container-runtime",
    files: ["Dockerfile", "docker-compose.yml", ".dockerignore"],
    riskLevel: "high",
    propagation: "container-image",
    detectionDifficulty: "medium",
    description: "Malicious code baked into container images"
  },
  
  NETLIFY_CONFIG: {
    type: "deployment-config",
    files: ["netlify.toml"],
    riskLevel: "high",
    propagation: "serverless-functions",
    detectionDifficulty: "medium",
    description: "Build commands and function handlers"
  },
  
  VERCEL_CONFIG: {
    type: "deployment-config",
    files: ["vercel.json"],
    riskLevel: "high",
    propagation: "serverless-functions",
    detectionDifficulty: "medium",
    description: "Build and deployment configuration"
  }
};

/**
 * SHARED INFRASTRUCTURE GRAPH
 * Models relationships between maintainers through shared resources
 */
const INFRASTRUCTURE_EDGE_TYPES = {
  SHARED_NPM_TOKEN: {
    type: "shared-npm-token",
    riskLevel: "critical",
    description: "Multiple maintainers use same npm auth token"
  },
  
  SHARED_GITHUB_ORG: {
    type: "shared-github-org",
    riskLevel: "high",
    description: "Maintainers in same GitHub organization"
  },
  
  SHARED_CI_ACCOUNT: {
    type: "shared-ci-account",
    riskLevel: "critical",
    description: "Shared CI/CD service account (CircleCI, Travis, etc.)"
  },
  
  SHARED_EMAIL_DOMAIN: {
    type: "shared-email-domain",
    riskLevel: "medium",
    description: "Maintainers use same corporate email domain"
  },
  
  SHARED_REGISTRY_ACCESS: {
    type: "shared-registry-access",
    riskLevel: "critical",
    description: "Can publish to overlapping package scopes"
  },
  
  SHARED_SIGNING_KEY: {
    type: "shared-signing-key",
    riskLevel: "critical",
    description: "Multiple packages signed with same GPG/signing key"
  }
};

/**
 * Real-world incident: TanStack worm (May 2026)
 * Propagated through .claude/ and .vscode/ configs
 */
const TANSTACK_WORM_INCIDENT = {
  id: "tanstack-worm-2026",
  discoveredDate: "2026-05-15",
  initialVector: "compromised-maintainer-account",
  persistenceMechanisms: [
    {
      type: "ai-config",
      file: ".claude/config.json",
      payload: "Embedded malicious MCP server that exfiltrated code on AI queries",
      propagation: "Developers using Claude Code copied infected workspace configs"
    },
    {
      type: "ide-config",
      file: ".vscode/tasks.json",
      payload: "Auto-run task that modified package.json on file save",
      propagation: "VSCode workspaces shared via Git"
    },
    {
      type: "git-hook",
      file: ".git/hooks/pre-commit",
      payload: "Injected dependency on malicious package before every commit",
      propagation: "Cloned repositories inherited infected hooks"
    }
  ],
  affectedPackages: ["@tanstack/query", "@tanstack/router", "@tanstack/table"],
  estimatedReach: 50000, // Repositories infected
  detectionTime: "72 hours",
  persistenceAfterDetection: "~2 weeks (config files in repos)"
};

/**
 * Model persistence mechanisms as HydraDB graph edges
 * 
 * Instead of just: Package A -> depends_on -> Package B
 * We model:
 *   Package A -> infects_via_git_hook -> Repository R
 *   Repository R -> contains -> Package B
 *   Package B -> propagates_via -> CI_Pipeline
 */
function modelPersistenceAsGraphEdges(incident) {
  const edges = [];
  
  // Create nodes for each persistence mechanism
  for (const mechanism of incident.persistenceMechanisms) {
    const mechanismNode = {
      id: `persistence:${mechanism.type}:${mechanism.file}`,
      type: "persistence-mechanism",
      subtype: mechanism.type,
      file: mechanism.file,
      payload: mechanism.payload,
      riskLevel: PERSISTENCE_MECHANISMS[mechanism.type.toUpperCase()]?.riskLevel || "high"
    };
    
    // Edge from compromised package to persistence mechanism
    edges.push({
      from: `pkg:${incident.affectedPackages[0]}`,
      to: mechanismNode.id,
      type: "installs_persistence",
      mechanism: mechanism.type,
      propagation: mechanism.propagation
    });
    
    // Edge from persistence mechanism to other packages
    for (const pkg of incident.affectedPackages.slice(1)) {
      edges.push({
        from: mechanismNode.id,
        to: `pkg:${pkg}`,
        type: "propagates_to",
        mechanism: mechanism.type
      });
    }
  }
  
  return edges;
}

/**
 * Analyze a package's persistence risk
 */
function analyzePersistenceRisk(packageData) {
  const risks = [];
  let totalRiskScore = 0;
  
  // Check for lifecycle scripts
  if (packageData.scripts) {
    const dangerousScripts = ["preinstall", "postinstall", "prepare", "prepublish"];
    for (const script of dangerousScripts) {
      if (packageData.scripts[script]) {
        risks.push({
          type: "package-script",
          file: "package.json",
          script,
          command: packageData.scripts[script],
          riskLevel: "critical",
          reason: "Executes automatically during installation"
        });
        totalRiskScore += 30;
      }
    }
  }
  
  // Check for common persistence files (in real implementation, scan repo)
  const commonFiles = [
    ".git/hooks/pre-commit",
    ".github/workflows/publish.yml",
    ".vscode/tasks.json",
    ".claude/config.json",
    ".npmrc"
  ];
  
  for (const file of commonFiles) {
    if (packageData.hasFile && packageData.hasFile(file)) {
      const mechanism = Object.values(PERSISTENCE_MECHANISMS)
        .find(m => m.files.includes(file));
      
      if (mechanism) {
        risks.push({
          type: mechanism.type,
          file,
          riskLevel: mechanism.riskLevel,
          reason: mechanism.description
        });
        
        totalRiskScore += mechanism.riskLevel === "critical" ? 25 : 15;
      }
    }
  }
  
  const level = totalRiskScore >= 70 ? "critical" :
                totalRiskScore >= 40 ? "high" :
                totalRiskScore >= 20 ? "moderate" : "low";
  
  return {
    riskScore: totalRiskScore,
    level,
    risks,
    persistenceMechanisms: risks.length,
    recommendation: totalRiskScore >= 40 ?
      "Audit all configuration files and lifecycle scripts" :
      "Standard monitoring sufficient"
  };
}

/**
 * Model shared infrastructure as graph
 */
function buildInfrastructureGraph(maintainers) {
  const nodes = [];
  const edges = [];
  
  // Group maintainers by shared infrastructure
  const byEmailDomain = new Map();
  const byGitHubOrg = new Map();
  const byNpmScope = new Map();
  
  for (const maintainer of maintainers) {
    // Email domain grouping
    if (maintainer.email && maintainer.email.includes("@")) {
      const domain = maintainer.email.split("@")[1];
      if (!byEmailDomain.has(domain)) {
        byEmailDomain.set(domain, []);
      }
      byEmailDomain.get(domain).push(maintainer);
    }
    
    // GitHub org grouping
    if (maintainer.github && maintainer.github.includes("/")) {
      const org = maintainer.github.split("/")[0];
      if (!byGitHubOrg.has(org)) {
        byGitHubOrg.set(org, []);
      }
      byGitHubOrg.get(org).push(maintainer);
    }
    
    // npm scope grouping (e.g., @company/package)
    for (const pkg of maintainer.packages || []) {
      if (pkg.startsWith("@")) {
        const scope = pkg.split("/")[0];
        if (!byNpmScope.has(scope)) {
          byNpmScope.set(scope, []);
        }
        byNpmScope.get(scope).push(maintainer);
      }
    }
  }
  
  // Create infrastructure nodes
  for (const [domain, maints] of byEmailDomain.entries()) {
    if (maints.length >= 2) {
      const infraNode = {
        id: `infra:email-domain:${domain}`,
        type: "shared-infrastructure",
        subtype: "email-domain",
        value: domain,
        maintainerCount: maints.length,
        riskLevel: maints.length >= 5 ? "high" : "medium"
      };
      nodes.push(infraNode);
      
      // Connect maintainers to infrastructure
      for (const maint of maints) {
        edges.push({
          from: `maintainer:${maint.handle}`,
          to: infraNode.id,
          type: "uses-infrastructure",
          infraType: "email-domain"
        });
      }
    }
  }
  
  // GitHub orgs
  for (const [org, maints] of byGitHubOrg.entries()) {
    if (maints.length >= 2) {
      const infraNode = {
        id: `infra:github-org:${org}`,
        type: "shared-infrastructure",
        subtype: "github-org",
        value: org,
        maintainerCount: maints.length,
        riskLevel: maints.length >= 5 ? "high" : "medium"
      };
      nodes.push(infraNode);
      
      for (const maint of maints) {
        edges.push({
          from: `maintainer:${maint.handle}`,
          to: infraNode.id,
          type: "member-of",
          infraType: "github-org"
        });
      }
    }
  }
  
  // npm scopes
  for (const [scope, maints] of byNpmScope.entries()) {
    if (maints.length >= 2) {
      const infraNode = {
        id: `infra:npm-scope:${scope}`,
        type: "shared-infrastructure",
        subtype: "npm-scope",
        value: scope,
        maintainerCount: maints.length,
        riskLevel: "critical" // Shared publish access is high risk
      };
      nodes.push(infraNode);
      
      for (const maint of maints) {
        edges.push({
          from: `maintainer:${maint.handle}`,
          to: infraNode.id,
          type: "can-publish-to",
          infraType: "npm-scope"
        });
      }
    }
  }
  
  return { nodes, edges };
}

/**
 * Calculate blast radius including persistence mechanisms
 */
function calculatePersistenceBlastRadius(packageData, persistenceMechanisms) {
  const baseAffected = packageData.dependentPackages || 0;
  
  // Multipliers based on persistence mechanisms
  let multiplier = 1.0;
  
  for (const mechanism of persistenceMechanisms) {
    switch (mechanism.type) {
      case "git-hook":
        multiplier *= 1.5; // Persists across developer clones
        break;
      case "ide-config":
        multiplier *= 1.3; // Spreads via workspace sharing
        break;
      case "ai-config":
        multiplier *= 1.4; // Novel vector, hard to detect
        break;
      case "ci-workflow":
        multiplier *= 1.6; // Access to secrets and deployment
        break;
      case "package-script":
        multiplier *= 1.2; // Standard npm propagation
        break;
      case "credential-file":
        multiplier *= 2.0; // Can compromise entire account
        break;
    }
  }
  
  const adjustedAffected = Math.round(baseAffected * multiplier);
  const persistenceDays = estimatePersistenceDuration(persistenceMechanisms);
  
  return {
    baseAffected,
    adjustedAffected,
    multiplier: parseFloat(multiplier.toFixed(2)),
    persistenceDays,
    mechanisms: persistenceMechanisms.map(m => m.type)
  };
}

function estimatePersistenceDuration(mechanisms) {
  // How long after initial detection will the attack persist?
  let maxDays = 0;
  
  for (const mechanism of mechanisms) {
    let days = 0;
    switch (mechanism.type) {
      case "git-hook":
        days = 14; // Lives in .git/ directory, not tracked
        break;
      case "ide-config":
        days = 7; // Usually tracked in Git, but slow to update
        break;
      case "ai-config":
        days = 10; // New, users don't check often
        break;
      case "ci-workflow":
        days = 3; // Tracked and monitored
        break;
      case "package-script":
        days = 1; // Fixed in package update
        break;
    }
    maxDays = Math.max(maxDays, days);
  }
  
  return maxDays;
}

/**
 * Generate comprehensive report
 */
function generatePersistenceReport() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  CI/CD Persistence & Infrastructure Graph Analysis");
  console.log("  Novel attack propagation modeling");
  console.log("═══════════════════════════════════════════════════════════\n");
  
  // Analyze TanStack worm incident
  console.log("Case Study: TanStack Worm (May 2026)");
  console.log("─".repeat(60));
  console.log(`Discovered:       ${TANSTACK_WORM_INCIDENT.discoveredDate}`);
  console.log(`Initial Vector:   ${TANSTACK_WORM_INCIDENT.initialVector}`);
  console.log(`Affected:         ${TANSTACK_WORM_INCIDENT.estimatedReach.toLocaleString()} repositories`);
  console.log(`Detection Time:   ${TANSTACK_WORM_INCIDENT.detectionTime}`);
  console.log(`Persistence:      ${TANSTACK_WORM_INCIDENT.persistenceAfterDetection}\n`);
  
  console.log("Persistence Mechanisms:");
  for (const [idx, mech] of TANSTACK_WORM_INCIDENT.persistenceMechanisms.entries()) {
    console.log(`  ${idx + 1}. ${mech.type.toUpperCase()}`);
    console.log(`     File: ${mech.file}`);
    console.log(`     Payload: ${mech.payload}`);
    console.log(`     Propagation: ${mech.propagation}\n`);
  }
  
  // Model as graph edges
  const edges = modelPersistenceAsGraphEdges(TANSTACK_WORM_INCIDENT);
  console.log("─".repeat(60));
  console.log("HydraDB Graph Modeling:");
  console.log(`  Persistence nodes: ${new Set(edges.map(e => e.to)).size}`);
  console.log(`  Propagation edges: ${edges.length}`);
  console.log(`  Edge types: ${[...new Set(edges.map(e => e.type))].join(", ")}\n`);
  
  // Blast radius calculation
  const examplePackage = {
    name: "@tanstack/query",
    dependentPackages: 15000
  };
  
  const blastRadius = calculatePersistenceBlastRadius(
    examplePackage,
    TANSTACK_WORM_INCIDENT.persistenceMechanisms
  );
  
  console.log("─".repeat(60));
  console.log("Blast Radius Analysis:");
  console.log(`  Base affected:         ${blastRadius.baseAffected.toLocaleString()}`);
  console.log(`  With persistence:      ${blastRadius.adjustedAffected.toLocaleString()}`);
  console.log(`  Multiplier:            ${blastRadius.multiplier}x`);
  console.log(`  Persistence duration:  ${blastRadius.persistenceDays} days post-detection`);
  console.log(`  Mechanisms:            ${blastRadius.mechanisms.join(", ")}\n`);
  
  // Infrastructure graph demo
  const demoMaintainers = [
    { handle: "user1", email: "dev1@company.com", github: "company/repo1", packages: ["@company/pkg-a"] },
    { handle: "user2", email: "dev2@company.com", github: "company/repo2", packages: ["@company/pkg-b"] },
    { handle: "user3", email: "dev3@company.com", github: "company/repo3", packages: ["@company/pkg-c"] },
  ];
  
  const infraGraph = buildInfrastructureGraph(demoMaintainers);
  
  console.log("═".repeat(60));
  console.log("Shared Infrastructure Graph:");
  console.log(`  Infrastructure nodes: ${infraGraph.nodes.length}`);
  console.log(`  Maintainer connections: ${infraGraph.edges.length}`);
  
  if (infraGraph.nodes.length > 0) {
    console.log("\n  Detected shared infrastructure:");
    for (const node of infraGraph.nodes) {
      const connectedMaints = infraGraph.edges.filter(e => e.to === node.id).length;
      console.log(`    - ${node.subtype}: ${node.value} (${connectedMaints} maintainers, ${node.riskLevel} risk)`);
    }
  }
  
  console.log("\n" + "═".repeat(60));
  console.log("Key Insights:");
  console.log("═".repeat(60));
  console.log(`
✓ Persistence mechanisms increase blast radius by ${blastRadius.multiplier}x
✓ Attacks continue ${blastRadius.persistenceDays} days after initial fix
✓ Config files (.git, .vscode, .claude) are novel attack vectors
✓ Shared infrastructure creates single points of failure
✓ TanStack worm demonstrates real-world AI config exploitation
✓ Graph modeling enables traversal of persistence chains
  `);
  
  console.log("═".repeat(60));
  
  return {
    incident: TANSTACK_WORM_INCIDENT,
    graphEdges: edges,
    blastRadius,
    infrastructureGraph: infraGraph,
    generatedAt: new Date().toISOString()
  };
}

// Export for API use
export {
  PERSISTENCE_MECHANISMS,
  INFRASTRUCTURE_EDGE_TYPES,
  TANSTACK_WORM_INCIDENT,
  modelPersistenceAsGraphEdges,
  analyzePersistenceRisk,
  buildInfrastructureGraph,
  calculatePersistenceBlastRadius,
  generatePersistenceReport
};

// Run if called directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  generatePersistenceReport();
}
