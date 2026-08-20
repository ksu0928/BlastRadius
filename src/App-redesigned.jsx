import { useState, useEffect } from "react"

// ═════════════════════════════════════════════════════════════════════════════
// BLASTRADIUS — Hazard-Focused Incident Response Dashboard
// Design Process: Product Understanding → Reference Study → Wire frame → Tokens → Build
// User: Security engineer during active incident
// Goal: "How bad is this and what do I fix first?" in <3 seconds
// ═════════════════════════════════════════════════════════════════════════════

// API Configuration
const API_BASE = import.meta.env.PROD ? "/api" : "http://localhost:3001/api"

async function fetchSearch(query) {
  const res = await fetch(`${API_BASE}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) throw new Error(`Search failed: ${res.status}`)
  return res.json()
}

async function fetchSuggestions() {
  const res = await fetch(`${API_BASE}/suggestions`)
  if (!res.ok) throw new Error(`Suggestions failed: ${res.status}`)
  return res.json()
}

// ─────────────────────────────────────────────────────────────────────────────
// BLAST RADIUS DIAGRAM — Hero Visualization
// Concentric rings: epicenter → 1-hop → 2-hop → 3-hop
// Service dots plotted by hop distance, colored by severity
// ─────────────────────────────────────────────────────────────────────────────
function BlastRadiusDiagram({ services, onServiceClick, triggerPulse }) {
  // Calculate positions for service dots on rings
  const getServicePosition = (service, index, total) => {
    const hop = service.chain?.length || 1
    const ringSize = hop === 1 ? 20 : hop === 2 ? 40 : hop === 3 ? 60 : 75
    const angle = (index / total) * 2 * Math.PI
    const x = 50 + ringSize * Math.cos(angle)
    const y = 50 + ringSize * Math.sin(angle)
    return { x, y }
  }

  const totalServices = services.length
  
  return (
    <div className="blast-radar">
      {/* Outer ring */}
      <div className="radar-ring radar-ring-outer" />
      
      {/* Hop rings */}
      <div className="radar-ring radar-ring-3" />
      <div className="radar-ring radar-ring-2" />
      <div className="radar-ring radar-ring-1" />
      
      {/* Epicenter */}
      <div className="radar-ring-epicenter">
        <div className="animate-pulse-dot" />
      </div>
      
      {/* Shockwave pulse (triggered on search) */}
      {triggerPulse && (
        <div className="shockwave-ring animate-shockwave" />
      )}
      
      {/* Service dots */}
      {services.map((service, idx) => {
        const pos = getServicePosition(service, idx, totalServices)
        const severityClass = service.severity === 'direct' ? 'service-dot-critical' 
          : service.severity === 'transitive' ? 'service-dot-warning'
          : 'service-dot-contained'
        
        return (
          <div
            key={service.id}
            className={`service-dot ${severityClass} animate-fade-in delay-${Math.min(idx, 5)}00`}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
            onClick={() => onServiceClick(service)}
            role="button"
            tabIndex={0}
            aria-label={`${service.name} - ${service.severity}`}
            onKeyDown={(e) => e.key === 'Enter' && onServiceClick(service)}
          />
        )
      })}
      
      {/* Ring labels */}
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '11px',
        color: 'var(--text-muted)',
        fontFamily: "'IBM Plex Mono', monospace",
        pointerEvents: 'none'
      }}>
        HOP DISTANCE: 1 → 2 → 3+
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT STRIP — Compact KPI Row
// ─────────────────────────────────────────────────────────────────────────────
function StatStrip({ stats }) {
  const statItems = [
    { label: 'PACKAGES AFFECTED', value: stats.packagesAffected, color: 'epicenter' },
    { label: 'SERVICES EXPOSED', value: stats.servicesExposed, color: 'epicenter' },
    { label: 'TIME TO DETECTION', value: `${stats.detectionMinutes} MIN`, color: 'warning' },
    { label: 'DEEPEST CHAIN', value: `${stats.deepestChain} HOPS`, color: 'warning' }
  ]
  
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      padding: '24px 0'
    }}>
      {statItems.map((stat, idx) => (
        <div key={idx} className={`stat-card stat-card-${stat.color} animate-fade-in-up delay-${idx}00`}>
          <div style={{
            fontSize: '28px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            fontFamily: "'Archivo Narrow', sans-serif",
            marginBottom: '4px'
          }}>
            {stat.value}
          </div>
          <div style={{
            fontSize: '11px',
            fontWeight: '600',
            color: 'var(--text-muted)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            fontFamily: "'Archivo Narrow', sans-serif"
          }}>
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ALERT FEED — Severity-First Pinned Layout
// Top alert: 2x size, visually dominant
// Rest: Dense scrollable list
// ─────────────────────────────────────────────────────────────────────────────
function AlertFeed({ services, onServiceClick }) {
  // Sort by severity: direct → transitive
  const sorted = [...services].sort((a, b) => {
    if (a.severity === 'direct' && b.severity !== 'direct') return -1
    if (a.severity !== 'direct' && b.severity === 'direct') return 1
    return 0
  })
  
  const [pinnedAlert, ...restAlerts] = sorted
  
  if (!pinnedAlert) return null
  
  return (
    <div className="alert-feed">
      {/* Pinned Critical Alert */}
      <div className="alert-pinned animate-fade-in-up">
        <div className="alert-title">{pinnedAlert.name}</div>
        <div className="alert-description">
          <span className="text-epicenter">{pinnedAlert.severity.toUpperCase()}</span> DEPENDENCY
          — Chain: {pinnedAlert.chain?.join(' → ') || 'Direct'}
        </div>
        <div className="alert-meta">
          <span>⏱ Exposed {pinnedAlert.exposedAt ? new Date(pinnedAlert.exposedAt).toLocaleTimeString() : 'Unknown'}</span>
          <span>⚡ {pinnedAlert.resolvedMinutes ? `${pinnedAlert.resolvedMinutes.toFixed(1)} min to resolve` : 'Unresolved'}</span>
        </div>
      </div>
      
      {/* Rest of Alerts (Dense List) */}
      {restAlerts.length > 0 && (
        <>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--text-muted)',
            marginTop: '24px',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontFamily: "'Archivo Narrow', sans-serif"
          }}>
            ▼ {restAlerts.length} MORE ALERTS
          </div>
          
          <div className="alert-list">
            {restAlerts.map((service, idx) => (
              <div
                key={service.id}
                className={`alert-item ${service.severity === 'transitive' ? '' : 'alert-item-contained'} animate-fade-in delay-${Math.min(idx + 1, 5)}00`}
                onClick={() => onServiceClick(service)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onServiceClick(service)}
              >
                <div className="alert-item-content">
                  <div className="alert-item-title">{service.name}</div>
                  <div className="alert-item-subtitle">
                    {service.chain?.slice(-2).join(' → ') || 'Direct'}
                  </div>
                </div>
                <div className={`alert-badge alert-badge-${service.severity === 'direct' ? 'critical' : 'warning'}`}>
                  {service.severity}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPOSURE TIMELINE — Fixed Horizontal Lane (No Rotation)
// Alternating above/below labels (never rotated text)
// ─────────────────────────────────────────────────────────────────────────────
function ExposureTimeline({ compromisedAt, detectedAt }) {
  const compromised = new Date(compromisedAt)
  const detected = new Date(detectedAt)
  const now = new Date()
  
  // Calculate positions (0-100%)
  const totalTime = now - compromised
  const detectedPos = ((detected - compromised) / totalTime) * 100
  
  const formatTime = (date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  
  return (
    <div className="timeline-container">
      <div style={{
        fontSize: '12px',
        fontWeight: '600',
        color: 'var(--text-muted)',
        marginBottom: '16px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontFamily: "'Archivo Narrow', sans-serif"
      }}>
        EXPOSURE TIMELINE
      </div>
      
      <div className="timeline-track">
        {/* Danger window */}
        <div 
          className="timeline-danger-window"
          style={{
            left: '0%',
            width: `${detectedPos}%`
          }}
        />
        
        {/* Compromised marker */}
        <div className="timeline-marker timeline-marker-critical" style={{ left: '0%' }}>
          <div className="timeline-label timeline-label-above">
            COMPROMISED<br />{formatTime(compromised)}
          </div>
        </div>
        
        {/* Detected marker */}
        <div className="timeline-marker" style={{ left: `${detectedPos}%` }}>
          <div className="timeline-label timeline-label-below">
            DETECTED<br />{formatTime(detected)}
          </div>
        </div>
        
        {/* Resolved marker (placeholder) */}
        <div className="timeline-marker timeline-marker-contained" style={{ left: '100%' }}>
          <div className="timeline-label timeline-label-above">
            RESOLVED?<br />{formatTime(now)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE DETAIL DRAWER — Slide-in Panel
// ─────────────────────────────────────────────────────────────────────────────
function ServiceDrawer({ service, onClose }) {
  if (!service) return null
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '400px',
      height: '100vh',
      background: 'var(--surface)',
      borderLeft: '1px solid var(--border)',
      boxShadow: 'var(--shadow-xl)',
      zIndex: 1000,
      padding: '32px',
      overflowY: 'auto',
      animation: 'slide-in-right 0.3s ease-out'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '24px'
      }}>
        <h2 className="text-h2" style={{ margin: 0 }}>{service.name}</h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '8px'
          }}
          aria-label="Close drawer"
        >
          ✕
        </button>
      </div>
      
      <div className={`alert-badge alert-badge-${service.severity === 'direct' ? 'critical' : 'warning'}`} style={{ marginBottom: '24px' }}>
        {service.severity}
      </div>
      
      <div style={{ marginBottom: '24px' }}>
        <div className="text-h3" style={{ marginBottom: '8px' }}>DEPENDENCY CHAIN</div>
        <div className="mono" style={{ fontSize: '12px', lineHeight: '1.8' }}>
          {service.chain?.map((pkg, idx) => (
            <div key={idx} style={{ color: idx === 0 ? 'var(--epicenter)' : 'var(--text-secondary)' }}>
              {idx > 0 && '  └─ '}{pkg}
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ marginBottom: '24px' }}>
        <div className="text-h3" style={{ marginBottom: '8px' }}>EXPOSURE</div>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Exposed: {service.exposedAt ? new Date(service.exposedAt).toLocaleString() : 'Unknown'}
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Resolution time: {service.resolvedMinutes ? `${service.resolvedMinutes.toFixed(2)} minutes` : 'Pending'}
        </div>
      </div>
      
      {service.maintainer && (
        <div>
          <div className="text-h3" style={{ marginBottom: '8px' }}>MAINTAINER</div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {service.maintainer.handle || service.maintainer.name}
          </div>
          {service.maintainer.packages && (
            <div className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Controls {service.maintainer.packages.length} packages
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [triggerPulse, setTriggerPulse] = useState(false)
  
  // Fetch suggestions on mount
  useEffect(() => {
    fetchSuggestions()
      .then(setSuggestions)
      .catch(console.error)
  }, [])
  
  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    
    setLoading(true)
    setError(null)
    setTriggerPulse(false)
    
    try {
      const data = await fetchSearch(query)
      setResults(data)
      // Trigger shockwave pulse
      setTimeout(() => setTriggerPulse(true), 100)
      setTimeout(() => setTriggerPulse(false), 1400)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--void)',
      padding: '24px',
      color: 'var(--text-primary)'
    }}>
      {/* Header */}
      <header style={{
        maxWidth: '1200px',
        margin: '0 auto 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 className="text-display" style={{ margin: 0 }}>
          BLASTRADIUS
        </h1>
        
        {/* Search */}
        <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: '500px', marginLeft: '32px' }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            gap: '8px'
          }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search package (e.g., event-stream@3.3.6)"
              style={{
                flex: 1,
                padding: '12px 16px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontFamily: "'IBM Plex Mono', monospace"
              }}
              aria-label="Search package"
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                background: 'var(--epicenter)',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '12px',
                fontWeight: '700',
                fontFamily: "'Archivo Narrow', sans-serif",
                textTransform: 'uppercase',
                cursor: 'pointer',
                letterSpacing: '0.05em'
              }}
            >
              {loading ? 'SEARCHING...' : 'SEARCH'}
            </button>
          </div>
        </form>
      </header>
      
      {/* Main Content */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {error && (
          <div style={{
            padding: '16px',
            background: 'rgba(230, 57, 70, 0.1)',
            border: '1px solid var(--epicenter)',
            borderRadius: '4px',
            color: 'var(--epicenter)',
            marginBottom: '24px'
          }}>
            ⚠ ERROR: {error}
          </div>
        )}
        
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '18px', fontFamily: "'Archivo Narrow', sans-serif" }}>
              ANALYZING BLAST RADIUS...
            </div>
          </div>
        )}
        
        {results && !loading && (
          <>
            {/* Blast Radius Diagram */}
            <div style={{ marginBottom: '40px' }}>
              <BlastRadiusDiagram
                services={results.services || []}
                onServiceClick={setSelectedService}
                triggerPulse={triggerPulse}
              />
            </div>
            
            {/* Stat Strip */}
            <StatStrip stats={results.stats} />
            
            {/* Alert Feed */}
            <div style={{ marginTop: '40px' }}>
              <AlertFeed
                services={results.services || []}
                onServiceClick={setSelectedService}
              />
            </div>
            
            {/* Timeline */}
            {results.compromisedAt && results.detectedAt && (
              <div style={{ marginTop: '40px' }}>
                <ExposureTimeline
                  compromisedAt={results.compromisedAt}
                  detectedAt={results.detectedAt}
                />
              </div>
            )}
          </>
        )}
        
        {!results && !loading && (
          <div style={{
            textAlign: 'center',
            padding: '80px 0',
            color: 'var(--text-muted)'
          }}>
            <div style={{
              fontSize: '16px',
              fontFamily: "'Archivo Narrow', sans-serif",
              marginBottom: '24px'
            }}>
              SEARCH A PACKAGE TO ANALYZE BLAST RADIUS
            </div>
            {suggestions.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', marginBottom: '12px' }}>TRY THESE:</div>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}>
                  {suggestions.slice(0, 5).map((pkg) => (
                    <button
                      key={pkg}
                      onClick={() => {
                        setQuery(pkg)
                        handleSearch({ preventDefault: () => {} })
                      }}
                      style={{
                        padding: '8px 12px',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        color: 'var(--text-secondary)',
                        fontSize: '12px',
                        fontFamily: "'IBM Plex Mono', monospace",
                        cursor: 'pointer'
                      }}
                    >
                      {pkg}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* Service Detail Drawer */}
      {selectedService && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setSelectedService(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              zIndex: 999
            }}
          />
          <ServiceDrawer
            service={selectedService}
            onClose={() => setSelectedService(null)}
          />
        </>
      )}
    </div>
  )
}
