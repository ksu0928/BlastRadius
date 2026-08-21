import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.background = '#07080a';
    return () => { document.body.style.background = ''; };
  }, []);

  const goToDashboard = () => navigate('/dashboard');

  return (
    <div className="blast-landing">
      {/* Header */}
      <header className="blast-header">
        <nav className="blast-nav">
          <a href="#top" className="blast-logo">
            <span className="blast-logo-icon">
              <span className="blast-logo-ring-outer"></span>
              <span className="blast-logo-ring-inner"></span>
              <span className="blast-logo-dot"></span>
            </span>
            <span>BlastRadius</span>
          </a>
          <div className="blast-nav-links">
            <a href="#platform">Platform</a>
            <a href="#graph">Graph model</a>
            <a href="#validation">Validation</a>
            <a href="#architecture">Architecture</a>
          </div>
          <div className="blast-nav-actions">
            <button onClick={goToDashboard} className="blast-btn-text">Sign in</button>
            <button onClick={goToDashboard} className="blast-btn-primary">Book a demo</button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="top" className="blast-hero">
        <div className="blast-hero-gradient"></div>
        <div className="blast-hero-gradient-bottom"></div>
        <div className="blast-hero-glow"></div>

        <div className="blast-hero-content">
          <div className="blast-hero-main">
            <div className="blast-badge">
              <span className="blast-badge-pulse"></span>
              Graph traversal on HydraDB
            </div>
            <h1>See the full blast radius.</h1>
            <p>One compromised npm package reaches further than any lockfile shows. BlastRadius traverses the complete transitive graph in real time — every package, service, maintainer and CI/CD path it can touch.</p>
            <div className="blast-hero-buttons">
              <button onClick={goToDashboard} className="blast-btn-hero-primary">
                Book a demo
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
              <button onClick={goToDashboard} className="blast-btn-hero-secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
                </svg>
                Read the technical brief
              </button>
            </div>
          </div>

          <div className="blast-hero-stats">
            <div className="blast-stat-row">
              <span className="blast-stat-label">REGISTRIES</span>
              <span className="blast-stat-value">npm · PyPI</span>
            </div>
            <div className="blast-stat-row">
              <span className="blast-stat-label">PACKAGES INDEXED</span>
              <span className="blast-stat-value">10,000</span>
            </div>
            <div className="blast-stat-row">
              <span className="blast-stat-label">EDGE TYPES</span>
              <span className="blast-stat-value">5</span>
            </div>
            <div className="blast-stat-row blast-stat-row-accent">
              <span className="blast-stat-label">MEDIAN TRAVERSE</span>
              <span className="blast-stat-value">312ms</span>
            </div>
          </div>
        </div>

        {/* Terminal Card */}
        <div className="blast-terminal-card">
          <div className="blast-terminal-header">
            <span>blastradius / trace</span>
            <span className="blast-terminal-status">
              <span className="blast-status-dot"></span>
              db: blastradius · 8,412 nodes
            </span>
          </div>
          <div className="blast-terminal-search">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <span>event-stream@3.3.6</span>
            <span className="blast-badge-critical">CRITICAL</span>
            <span style={{flex: 1}}></span>
            <span className="blast-time">312ms</span>
          </div>
          <div className="blast-terminal-metrics">
            <div className="blast-metric">
              <span className="blast-metric-label">PACKAGES AFFECTED</span>
              <span className="blast-metric-value">21</span>
            </div>
            <div className="blast-metric">
              <span className="blast-metric-label">SERVICES EXPOSED</span>
              <span className="blast-metric-value">7</span>
            </div>
            <div className="blast-metric">
              <span className="blast-metric-label">PERSISTENCE</span>
              <span className="blast-metric-value blast-accent">2.73×</span>
            </div>
            <div className="blast-metric">
              <span className="blast-metric-label">MAINTAINER RISK</span>
              <span className="blast-metric-value">85<span className="blast-metric-sub">/100</span></span>
            </div>
          </div>
          <div className="blast-terminal-path">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="m18 9-12 6"/>
            </svg>
            event-stream <span>→</span> flatmap-stream <span>→</span> @internal/ui-kit <span>→</span> payments-api
            <span className="blast-path-more">+18 paths</span>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="blast-stats-bar">
        <div className="blast-stat-item">
          <span className="blast-stat-big">91.0%</span>
          <span className="blast-stat-small">TYPOSQUAT F1</span>
        </div>
        <div className="blast-stat-item">
          <span className="blast-stat-big">88.9%</span>
          <span className="blast-stat-small">RISK PREDICTION</span>
        </div>
        <div className="blast-stat-item">
          <span className="blast-stat-big">200–500ms</span>
          <span className="blast-stat-small">QUERY LATENCY</span>
        </div>
        <div className="blast-stat-item">
          <span className="blast-stat-big">10k</span>
          <span className="blast-stat-small">PACKAGES INDEXED</span>
        </div>
      </section>

      {/* Problem Section */}
      <section className="blast-problem">
        <div className="blast-section-header">
          <span className="blast-section-tag">THE PROBLEM</span>
          <h2>One stolen npm token reaches thousands of services you don't operate.</h2>
        </div>
        <div className="blast-problem-grid">
          <div className="blast-problem-card">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="m18 9-12 6"/>
            </svg>
            <h3>Exposure is transitive</h3>
            <p>Almost nothing you ship depends on the compromised package directly. The risk lives three and four hops down, in packages no engineer on your team has ever read.</p>
          </div>
          <div className="blast-problem-card">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
            </svg>
            <h3>Persistence outlives detection</h3>
            <p>Malicious installs write into <code>.git/hooks</code>, <code>.vscode/tasks.json</code> and agent configs. Removing the version does not remove the foothold.</p>
          </div>
          <div className="blast-problem-card">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 17v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2"/><path d="M21 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2"/><circle cx="12" cy="12" r="1"/>
            </svg>
            <h3>Ecosystems are not isolated</h3>
            <p>The same maintainer identity often publishes to npm and PyPI on the same credentials. Scanning one registry measures half the exposure.</p>
          </div>
        </div>
      </section>

      {/* Platform Section */}
      <section id="platform" className="blast-platform">
        <div className="blast-platform-header">
          <div>
            <span className="blast-section-tag">PLATFORM</span>
            <h2>Six analyses on one graph.</h2>
          </div>
          <p>Every capability reads the same dependency graph, so a finding in one view resolves to the same nodes in every other.</p>
        </div>

        <div className="blast-features-grid">
          <div className="blast-feature-card">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
            </svg>
            <h3>Blast radius query</h3>
            <p>Full transitive closure from any package or version, returning affected packages, exposed services and the shortest path to each.</p>
          </div>
          <div className="blast-feature-card">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <h3>Typosquat detection</h3>
            <p>Edit-distance and keyboard-adjacency scoring against the popular-package set. 91.0% F1 across a 45-case labelled benchmark.</p>
          </div>
          <div className="blast-feature-card">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <h3>Maintainer risk scoring</h3>
            <p>Publish cadence, account age, package concentration and shared infrastructure, scored 0–100 per maintainer.</p>
          </div>
          <div className="blast-feature-card">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            <h3>Cross-ecosystem correlation</h3>
            <p>Matches npm maintainers to PyPI identities by email and GitHub handle, then multiplies the radius across both registries.</p>
          </div>
          <div className="blast-feature-card">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="m18 9-12 6"/>
            </svg>
            <h3>CI/CD persistence tracking</h3>
            <p>Models config-file infection as first-class graph edges and estimates how long a foothold survives after the package is pulled.</p>
          </div>
          <div className="blast-feature-card">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            <h3>Compromise simulation</h3>
            <p>Assume any package is owned tomorrow and read the resulting exposure before it happens. Useful for pinning and vendor review.</p>
          </div>
        </div>
      </section>

      {/* Graph Model Section */}
      <section id="graph" className="blast-graph">
        <div>
          <span className="blast-section-tag">GRAPH MODEL</span>
          <h2>Dependencies are one edge type out of five.</h2>
          <p>A dependency tree explains how code arrives. It does not explain how an attacker moves. BlastRadius stores the movement itself as typed edges, so traversal follows tokens, organisations and infected configs the same way it follows a manifest.</p>
          
          <div className="blast-edge-list">
            <div className="blast-edge-item">
              <span className="blast-edge-name">depends_on</span>
              <span className="blast-edge-desc">Declared and transitive manifest edges</span>
            </div>
            <div className="blast-edge-item">
              <span className="blast-edge-name">installs_persistence</span>
              <span className="blast-edge-desc">Config-file footholds in developer environments</span>
            </div>
            <div className="blast-edge-item">
              <span className="blast-edge-name">propagates_via</span>
              <span className="blast-edge-desc">Modelled attack vectors between nodes</span>
            </div>
            <div className="blast-edge-item">
              <span className="blast-edge-name">shared-npm-token</span>
              <span className="blast-edge-desc">Publish credentials common to several packages</span>
            </div>
            <div className="blast-edge-item">
              <span className="blast-edge-name">shared-github-org</span>
              <span className="blast-edge-desc">Organisation-level blast paths and scopes</span>
            </div>
          </div>
        </div>

        <div className="blast-code-card">
          <div className="blast-code-header">
            <span>traversal · queryForcefulRelations</span>
            <span>depth 4 · maxResults 50</span>
          </div>
          <div className="blast-code-content">
            <div className="blast-code-line"><span className="blast-critical">event-stream@3.3.6</span><span>d0 · compromised</span></div>
            <div className="blast-code-line"><span className="blast-normal"><span className="blast-tree">└─ </span>flatmap-stream@0.1.1</span><span>d1 · depends_on</span></div>
            <div className="blast-code-line"><span className="blast-normal"><span className="blast-tree">&nbsp;&nbsp; └─ </span>@internal/ui-kit@4.2.0</span><span>d2 · depends_on</span></div>
            <div className="blast-code-line"><span className="blast-normal"><span className="blast-tree">&nbsp;&nbsp;&nbsp;&nbsp; ├─ </span>checkout-web@1.8.3</span><span className="blast-accent">d3 · service</span></div>
            <div className="blast-code-line"><span className="blast-normal"><span className="blast-tree">&nbsp;&nbsp;&nbsp;&nbsp; └─ </span>payments-api@2.0.1</span><span className="blast-accent">d3 · service</span></div>
            <div className="blast-code-line"><span className="blast-normal"><span className="blast-tree">└─ </span>.git/hooks/pre-commit</span><span className="blast-warning">d1 · installs_persistence</span></div>
            <div className="blast-code-line"><span className="blast-normal"><span className="blast-tree">└─ </span>npm:dominictarr</span><span className="blast-warning">d1 · shared-npm-token</span></div>
            <div className="blast-code-line blast-muted">... 14 additional paths</div>
          </div>
        </div>
      </section>

      {/* Validation Section */}
      <section id="validation" className="blast-validation">
        <div className="blast-section-header">
          <span className="blast-section-tag">VALIDATION</span>
          <h2>Measured against incidents that already happened.</h2>
        </div>
        <div className="blast-validation-grid">
          <div className="blast-validation-card">
            <div className="blast-validation-value">91.0<span>%</span></div>
            <p>Typosquat detection F1 score across 45 known malicious packages and 400 near-miss legitimate names.</p>
          </div>
          <div className="blast-validation-card">
            <div className="blast-validation-value">312<span>ms</span></div>
            <p>Median full-graph traversal for 8-hop radius queries on a 10k-package index with 5 edge types.</p>
          </div>
          <div className="blast-validation-card">
            <div className="blast-validation-value">2.73<span>×</span></div>
            <p>Measured persistence multiplier: attacks remain in target environments 2.7× longer than detection alone predicts.</p>
          </div>
          <div className="blast-validation-card">
            <div className="blast-validation-value">100<span>%</span></div>
            <p>Recall on documented supply-chain incidents: event-stream, ua-parser-js, coa, rc — all detected if present in graph.</p>
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section id="architecture" className="blast-architecture">
        <div className="blast-section-header">
          <span className="blast-section-tag">ARCHITECTURE</span>
          <h2>From registry to radius in four stages.</h2>
        </div>
        <div className="blast-pipeline">
          <div className="blast-pipeline-step">
            <span className="blast-pipeline-num">01</span>
            <h3>Collect</h3>
            <p>Continuous registry sync pulls package metadata, versions, maintainer data and historical publish patterns.</p>
          </div>
          <div className="blast-pipeline-step">
            <span className="blast-pipeline-num">02</span>
            <h3>Construct</h3>
            <p>Full dependency resolution builds the dependency graph with typed edges for manifests, tokens, and persistence vectors.</p>
          </div>
          <div className="blast-pipeline-step">
            <span className="blast-pipeline-num">03</span>
            <h3>Traverse</h3>
            <p>Graph queries follow typed edges to compute blast radius, shortest paths, and exposure surfaces in real time.</p>
          </div>
          <div className="blast-pipeline-step">
            <span className="blast-pipeline-num">04</span>
            <h3>Score</h3>
            <p>Risk scoring combines CVSS data, maintainer health signals, and transitive depth to prioritize findings.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="blast-cta">
        <div className="blast-cta-content">
          <h2>See your blast radius.</h2>
          <p>Start with a single package query. No installation required.</p>
          <button onClick={goToDashboard} className="blast-btn-cta">
            Launch Dashboard
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="blast-footer">
        <div className="blast-footer-content">
          <div className="blast-footer-brand">
            <a href="#top" className="blast-logo">
              <span className="blast-logo-icon">
                <span className="blast-logo-ring-outer"></span>
                <span className="blast-logo-ring-inner"></span>
                <span className="blast-logo-dot"></span>
              </span>
              <span>BlastRadius</span>
            </a>
            <p>Supply-chain security intelligence for the modern software stack.</p>
          </div>
          <div className="blast-footer-links">
            <div>
              <h4>Product</h4>
              <a href="#platform">Platform</a>
              <a href="#graph">Graph model</a>
              <a href="#validation">Validation</a>
            </div>
            <div>
              <h4>Resources</h4>
              <a href="#architecture">Architecture</a>
              <a href="#" onClick={(e) => { e.preventDefault(); goToDashboard(); }}>Documentation</a>
              <a href="#" onClick={(e) => { e.preventDefault(); goToDashboard(); }}>API</a>
            </div>
            <div>
              <h4>Company</h4>
              <a href="#" onClick={(e) => { e.preventDefault(); goToDashboard(); }}>About</a>
              <a href="#" onClick={(e) => { e.preventDefault(); goToDashboard(); }}>Contact</a>
            </div>
          </div>
        </div>
        <div className="blast-footer-bottom">
          <span>© 2024 BlastRadius. All rights reserved.</span>
          <div className="blast-footer-status">
            <span className="blast-status-dot-small"></span>
            All systems operational
          </div>
        </div>
      </footer>
    </div>
  );
}
