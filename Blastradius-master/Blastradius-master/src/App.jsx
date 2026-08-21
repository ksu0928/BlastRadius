import { useState, useEffect, useRef, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import { MOCK_SEARCH_RESULT, MOCK_SUGGESTIONS, MOCK_SIMULATION_RESULT, MOCK_MAINTAINER_ANALYSIS } from "./api/mockData.js"

// Import graph visualization images
import graph3D from "./assets/graph-3d.png"
import graphNetwork from "./assets/graph-network.png"
import graphBlueprint from "./assets/graph-blueprint.png"

// ─────────────────────────────────────────────────────────────────────────────
// THEME SYSTEM - Clean Security Dashboard
// Matches landing page design: #07080a background, #eaeef2 text
// ─────────────────────────────────────────────────────────────────────────────
const colors = {
  // Backgrounds - matches landing page
  bgPrimary: "#07080a",      // Page background - matches landing
  bgCard: "#0d0e12",         // Cards, panels
  bgElevated: "#14151a",     // Hovered/elevated cards
  bgHover: "#1a1b21",        // Hover states
  bgInput: "#0a0b0f",        // Input fields
  
  // Severity System
  critical: "#ef4444",       // Red - critical severity
  criticalGlow: "rgba(239, 68, 68, 0.3)",
  transitive: "#a855f7",     // Purple - transitive risk
  transitiveGlow: "rgba(168, 85, 247, 0.3)",
  accent: "oklch(0.82 0.11 205)", // Cyan - matches landing page
  accentGlow: "rgba(120, 200, 230, 0.3)",
  safe: "#22c55e",           // Green - healthy states
  safeGlow: "rgba(34, 197, 94, 0.3)",
  
  // Semantic mappings
  high: "#f97316",           // Orange for high severity
  highGlow: "rgba(249, 115, 22, 0.3)",
  medium: "#eab308",         // Yellow for medium
  mediumGlow: "rgba(234, 179, 8, 0.3)",
  low: "#6b7280",            // Gray for low
  warning: "#f59e0b",        // Amber for warnings
  
  // Accent variations
  accentHover: "oklch(0.85 0.12 205)",
  
  // Text - matches landing page
  textPrimary: "#eaeef2",    // Main text - matches landing
  textSecondary: "#9ca3af",  // Secondary text
  textTertiary: "#6b7280",   // Meta text
  textMuted: "#6b7280",      // Muted text
  textDisabled: "#4b5563",   // Disabled state
  
  // Monospace text
  textMono: "#eaeef2",
  
  // Borders
  borderSubtle: "rgba(255, 255, 255, 0.07)",
  borderMedium: "rgba(255, 255, 255, 0.1)",
  borderStrong: "rgba(255, 255, 255, 0.15)",
  borderAccent: "oklch(0.82 0.11 205)",
  borderCritical: "#ef4444",
  
  // Shadows
  shadowSm: "0 1px 3px rgba(0, 0, 0, 0.5)",
  shadowMd: "0 4px 8px rgba(0, 0, 0, 0.6)",
  shadowLg: "0 10px 20px rgba(0, 0, 0, 0.7)",
  shadowXl: "0 20px 40px rgba(0, 0, 0, 0.8)",
  
  // Graph visualization
  graphNode: "#eaeef2",
  graphNodeCritical: "#ef4444",
  graphNodeHigh: "#f97316",
  graphEdge: "rgba(255, 255, 255, 0.1)",
}


// ─────────────────────────────────────────────────────────────────────────────
// API CLIENT
// ─────────────────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.PROD 
  ? "/api" 
  : "http://localhost:3001/api"

async function fetchSearch(query) {
  try {
    const res = await fetch(`${API_BASE}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })
    if (!res.ok) throw new Error(`Search failed: ${res.status} ${res.statusText}`)
    return await res.json()
  } catch (err) {
    console.warn(`[API] search failed, using mock data:`, err.message)
    return MOCK_SEARCH_RESULT
  }
}

async function fetchSuggestions() {
  try {
    const res = await fetch(`${API_BASE}/suggestions`)
    if (!res.ok) throw new Error(`Suggestions failed: ${res.status} ${res.statusText}`)
    return await res.json()
  } catch (err) {
    console.warn(`[API] suggestions failed, using mock data:`, err.message)
    return MOCK_SUGGESTIONS
  }
}

async function fetchSimulateCompromise(packageId) {
  try {
    const res = await fetch(`${API_BASE}/simulate-compromise`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId }),
    })
    if (!res.ok) throw new Error(`Simulation failed: ${res.status} ${res.statusText}`)
    return await res.json()
  } catch (err) {
    console.warn(`[API] simulation failed, using mock data:`, err.message)
    return MOCK_SIMULATION_RESULT
  }
}

async function fetchMaintainerAnalysis(data) {
  try {
    const res = await fetch(`${API_BASE}/maintainer-analysis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    })
    if (!res.ok) throw new Error(`Analysis failed: ${res.status} ${res.statusText}`)
    return await res.json()
  } catch (err) {
    console.warn(`[API] maintainer analysis failed, using mock data:`, err.message)
    return MOCK_MAINTAINER_ANALYSIS
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString("en-US",{hour12:false,hour:"2-digit",minute:"2-digit",second:"2-digit"})
}
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})
}
function minDisp(mins) {
  const s=Math.round(mins*60),m=Math.floor(s/60),sc=s%60
  return m===0?`+${sc}s`:`+${m}m ${sc}s`
}

// ─────────────────────────────────────────────────────────────────────────────
// ICONS (inline SVG components)
// ─────────────────────────────────────────────────────────────────────────────
const IcSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)
const IcChev = ({open}) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{transform:open?"rotate(90deg)":"none",transition:"transform .2s"}}>
    <path d="m9 18 6-6-6-6"/>
  </svg>
)
const IcArrow = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
)
const IcX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
)
const IcFlag = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
)
const IcShield = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)
const IcWarn = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <path d="M12 9v4"/><path d="M12 17h.01"/>
  </svg>
)
const IcClock = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON LOADER (Shimmer Effect for Loading States)
// ─────────────────────────────────────────────────────────────────────────────
function SkeletonLoader({width = "100%", height = 20, borderRadius = 4, colors}) {
  return (
    <div style={{
      width,
      height,
      borderRadius,
      background: colors.bgCard,
      position: "relative",
      overflow: "hidden"
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(90deg, transparent, ${colors.bgElevated}, transparent)`,
        animation: "shimmer 2s infinite"
      }}/>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BADGE COMPONENT — "Signal on Void" Design System
// Soft-fill pills with semantic colors (no outlined borders)
// ─────────────────────────────────────────────────────────────────────────────
function Badge({sev, colors}) {
  const config = {
    direct: {
      bg: "rgba(255, 61, 87, 0.15)",      // Crimson at 15%
      color: colors.critical,              // Solid crimson text
      label: "DIRECT",
    },
    transitive: {
      bg: "rgba(139, 92, 246, 0.15)",     // Violet at 15%
      color: colors.transitive,            // Solid violet text
      label: "TRANSITIVE",
    },
    compromised: {
      bg: "rgba(255, 61, 87, 0.15)",      // Crimson at 15%
      color: colors.critical,              // Solid crimson text
      label: "COMPROMISED",
    },
    safe: {
      bg: "rgba(0, 229, 160, 0.15)",      // Green at 15%
      color: colors.safe,                  // Solid green text
      label: "SAFE",
    }
  }
  const style = config[sev] || config.safe
  
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 10px",
      borderRadius: 4,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: "0.8px",
      textTransform: "uppercase",
      background: style.bg,
      color: style.color,
      fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
    }}>
      {style.label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD (KPI Card Component) — "Signal on Void" Design System
// 2px left border semantic color accent, increased number size
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({label, value, sub, accent, colors}) {
  const accentColors = {
    critical: colors.critical,
    transitive: colors.transitive,
    accent: colors.accent,
    safe: colors.safe,
  }
  const accentColor = accentColors[accent] || colors.textPrimary
  const accentGlow = accent === 'critical' ? colors.criticalGlow : 
                     accent === 'transitive' ? colors.transitiveGlow :
                     accent === 'accent' ? colors.accentGlow : 
                     accent === 'safe' ? colors.safeGlow : 'transparent'
  
  return (
    <div style={{
      flex: 1,
      minWidth: 180,
      position: "relative",
      background: colors.bgCard,
      border: `1px solid ${colors.borderMedium}`,
      borderLeft: `2px solid ${accentColor}`,  // 2px left border semantic color
      borderRadius: 8,
      padding: "18px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      overflow: "hidden",
      transition: "all 0.2s ease",
      cursor: "default"
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderLeftColor = accentColor
      e.currentTarget.style.background = colors.bgElevated
      e.currentTarget.style.borderLeftWidth = "3px"
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderLeftColor = accentColor
      e.currentTarget.style.background = colors.bgCard
      e.currentTarget.style.borderLeftWidth = "2px"
    }}>
      
      {/* Label */}
      <span style={{
        fontSize: 10,
        fontWeight: 600,
        color: colors.textMuted,
        letterSpacing: "0.8px",
        textTransform: "uppercase",
        fontFamily: "'Inter', system-ui, sans-serif"
      }}>
        {label}
      </span>
      
      {/* Value (Large Number) - Increased size */}
      <span style={{
        fontSize: 52,  // Increased from 44
        fontWeight: 800,  // Heavier weight
        lineHeight: 1,
        color: accentColor,
        fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
        textShadow: `0 0 20px ${accentGlow}`
      }}>
        {value}
      </span>
      
      {/* Subtitle Detail */}
      {sub && (
        <span style={{
          fontSize: 12,
          color: colors.textTertiary,
          marginTop: 4,
          fontFamily: "'Inter', system-ui, sans-serif"
        }}>
          {sub}
        </span>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAIN BREADCRUMB (Dependency Path Visualization)
// Shows attack propagation path with "signal on void" colors
// ─────────────────────────────────────────────────────────────────────────────
function Chain({chain, colors}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 6,
      padding: "10px 14px",
      background: colors.bgCard,
      borderRadius: 6,
      border: `1px solid ${colors.borderMedium}`
    }}>
      {chain.map((node, i) => {
        const first = i === 0
        const last = i === chain.length - 1
        const col = first ? colors.critical : last ? colors.textSecondary : colors.transitive
        const bg = first 
          ? "rgba(255, 61, 87, 0.15)"      // Crimson at 15%
          : last 
            ? "rgba(139, 146, 165, 0.1)"   // Muted at 10%
            : "rgba(139, 92, 246, 0.15)"   // Violet at 15%
        
        return (
          <div key={i} style={{display: "flex", alignItems: "center", gap: 6}}>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: 4,
              color: col,
              background: bg,
              fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace"
            }}>
              {node}
            </span>
            {!last && (
              <span style={{color: colors.textTertiary, fontSize: 12}}>
                <IcArrow/>
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE ROW (Alert Feed Item) — "Signal on Void" Design System
// 2px left border for severity visual consistency
// ─────────────────────────────────────────────────────────────────────────────
function ServiceRow({svc, idx, onDetails, colors}) {
  const [open, setOpen] = useState(false)
  
  const severityColor = svc.severity === 'direct' ? colors.critical : colors.transitive
  const severityGlow = svc.severity === 'direct' ? colors.criticalGlow : colors.transitiveGlow
  
  return (
    <div style={{
      border: `1px solid ${colors.borderMedium}`,
      borderLeft: `2px solid ${severityColor}`,  // 2px left border for severity
      borderRadius: 6,
      overflow: "hidden",
      background: colors.bgCard,
      transition: "all 0.2s ease",
      animation: "fadeUp .3s ease-out both",
      animationDelay: `${idx * 30}ms`,
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderLeftWidth = "3px"
      e.currentTarget.style.background = colors.bgElevated
      e.currentTarget.style.boxShadow = `0 0 16px ${severityGlow}`
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderLeftWidth = "2px"
      e.currentTarget.style.background = colors.bgCard
      e.currentTarget.style.boxShadow = 'none'
    }}>
      <div 
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 14px",
          cursor: "pointer",
          borderBottom: open ? `1px solid ${colors.borderMedium}` : "none",
          transition: "all 0.15s ease"
        }}>
        
        <span style={{color: colors.textTertiary, flexShrink: 0}}>
          <IcChev open={open}/>
        </span>
        
        <span style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 10,
          minWidth: 0
        }}>
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            color: colors.textPrimary,
            fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
            whiteSpace: "nowrap"
          }}>
            {svc.name}
          </span>
          <Badge sev={svc.severity} colors={colors}/>
        </span>
        
        <span style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 10,
          color: colors.textTertiary,
          flexShrink: 0
        }}>
          <IcClock/>
          <span style={{
            fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
            color: colors.textSecondary
          }}>
            {minDisp(svc.resolvedMinutes)}
          </span>
        </span>
        
        <span style={{
          fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
          fontSize: 10,
          color: colors.textTertiary,
          flexShrink: 0
        }}>
          {fmtTime(svc.exposedAt)}
        </span>
        
        <button 
          onClick={e => {e.stopPropagation(); onDetails(svc)}}
          style={{
            fontSize: 11,
            padding: "5px 12px",
            borderRadius: 4,
            border: `1px solid ${colors.accent}`,
            background: colors.accent,  // Solid cyan fill
            color: colors.bgPrimary,    // Dark text on cyan
            cursor: "pointer",
            fontFamily: "'Inter', system-ui, sans-serif",
            fontWeight: 600,
            flexShrink: 0,
            transition: "all 0.15s ease"
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = colors.accentHover
            e.currentTarget.style.boxShadow = `0 0 16px ${colors.accentGlow}`
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = colors.accent
            e.currentTarget.style.boxShadow = 'none'
          }}>
          DETAILS →
        </button>
      </div>
      
      {open && (
        <div style={{padding: "12px 14px", background: colors.bgInput}}>
          <div style={{
            fontSize: 10,
            color: colors.textSecondary,
            letterSpacing: "0.8px",
            textTransform: "uppercase",
            marginBottom: 10,
            fontWeight: 600,
            fontFamily: "'Inter', system-ui, sans-serif"
          }}>
            DEPENDENCY CHAIN · {svc.chain.length - 1} HOP{svc.chain.length - 2 !== 1 ? "S" : ""}
          </div>
          <Chain chain={svc.chain} colors={colors}/>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GRAPH VIEW
// ─────────────────────────────────────────────────────────────────────────────
function GraphView({data, onDetails, colors}) {
  const [hov, setHov] = useState(null)
  const W=800,H=440,CX=W/2,CY=H/2,IR=105,OR=195
  const svcs = data.services
  const inters = [...new Set(svcs.flatMap(s=>s.chain.slice(1,-1)))]
  const innerNodes = inters.map((name,i)=>({
    name,
    x:CX+IR*Math.cos(2*Math.PI*i/inters.length-Math.PI/2),
    y:CY+IR*Math.sin(2*Math.PI*i/inters.length-Math.PI/2),
  }))
  const outerNodes = svcs.map((s,i)=>({
    ...s,
    x:CX+OR*Math.cos(2*Math.PI*i/svcs.length-Math.PI/2),
    y:CY+OR*Math.sin(2*Math.PI*i/svcs.length-Math.PI/2),
  }))
  const rootName = svcs[0]?.chain[0]||""
  const edgeSet=new Set(), edges=[]
  function addEdge(ax,ay,bx,by) {
    const k=`${ax},${ay}|${bx},${by}`
    if(!edgeSet.has(k)){edgeSet.add(k);edges.push({ax,ay,bx,by})}
  }
  outerNodes.forEach(sn=>{
    const ch=sn.chain
    if(ch.length===2){ addEdge(CX,CY,sn.x,sn.y) }
    else {
      const fi=innerNodes.find(n=>n.name===ch[1])
      if(fi) addEdge(CX,CY,fi.x,fi.y)
      const li=innerNodes.find(n=>n.name===ch[ch.length-2])
      if(li) addEdge(li.x,li.y,sn.x,sn.y)
      for(let i=1;i<ch.length-2;i++){
        const a=innerNodes.find(n=>n.name===ch[i])
        const b=innerNodes.find(n=>n.name===ch[i+1])
        if(a&&b) addEdge(a.x,a.y,b.x,b.y)
      }
    }
  })
  return (
    <div style={{
      position: "relative",
      background: colors.bgCard,  // Warm off-white
      borderRadius: 12,
      border: `1px solid ${colors.borderSubtle}`,
      overflow: "hidden",
      boxShadow: colors.shadowMd  // Light shadow
    }}>
      {/* Legend */}
      <div style={{
        position: "absolute",
        top: 16,
        left: 16,
        display: "flex",
        gap: 16,
        zIndex: 10,
        background: colors.bgElevated,
        padding: "8px 14px",
        borderRadius: 8,
        border: `1px solid ${colors.borderSubtle}`
      }}>
        {[
          {c: colors.critical, l: "Compromised"},
          {c: colors.warning, l: "Intermediate"},
          {c: colors.textSecondary, l: "Service"}
        ].map(x => (
          <div key={x.l} style={{display: "flex", alignItems: "center", gap: 6}}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: x.c,
              boxShadow: `0 0 8px ${x.c}40`
            }}/>
            <span style={{fontSize: 11, color: colors.textSecondary, fontWeight: 500}}>{x.l}</span>
          </div>
        ))}
      </div>
      
      <svg viewBox={`0 0 ${W} ${H}`} style={{width: "100%", height: 440}}>
        <defs>
          <pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M 36 0 L 0 0 0 36" fill="none" stroke={colors.borderSubtle} strokeWidth="0.5" opacity="0.3"/>
          </pattern>
          <radialGradient id="rg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.critical} stopOpacity="0.2"/>
            <stop offset="100%" stopColor={colors.critical} stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#grid)"/>
        <circle cx={CX} cy={CY} r="58" fill="url(#rg)"/>
        {edges.map((e, i) => (
          <line 
            key={i} 
            x1={e.ax} 
            y1={e.ay} 
            x2={e.bx} 
            y2={e.by} 
            stroke={colors.borderStrong} 
            strokeWidth="1.5" 
            opacity="0.5"/>
        ))}
        {innerNodes.map(n => (
          <g key={n.name} onMouseEnter={() => setHov(n.name)} onMouseLeave={() => setHov(null)}>
            <circle 
              cx={n.x} 
              cy={n.y} 
              r={hov === n.name ? 10 : 7} 
              fill={colors.bgCard} 
              stroke={colors.warning} 
              strokeWidth="2" 
              style={{transition: "r .2s ease"}}/>
            <text 
              x={n.x} 
              y={n.y - 14} 
              textAnchor="middle" 
              fill={colors.textSecondary} 
              fontSize="9" 
              fontFamily="'IBM Plex Mono',monospace">
              {n.name.split("@")[0].substring(0, 14)}
            </text>
          </g>
        ))}
        {outerNodes.map(sn => {
          const dx = sn.x - CX, dy = sn.y - CY, len = Math.sqrt(dx * dx + dy * dy)
          const lx = sn.x + dx / len * 18, ly = sn.y + dy / len * 13
          return (
            <g 
              key={sn.id} 
              onClick={() => onDetails(sn)} 
              style={{cursor: "pointer"}} 
              onMouseEnter={() => setHov(sn.id)} 
              onMouseLeave={() => setHov(null)}>
              <circle 
                cx={sn.x} 
                cy={sn.y} 
                r={hov === sn.id ? 10 : 7} 
                fill={colors.bgPrimary}
                stroke={sn.severity === "direct" ? colors.critical : colors.warning}
                strokeWidth={hov === sn.id ? 2.5 : 1.5} 
                style={{transition: "all .2s ease"}}/>
              <text 
                x={lx} 
                y={ly + 3}
                textAnchor={sn.x < CX - 15 ? "end" : sn.x > CX + 15 ? "start" : "middle"}
                fill={hov === sn.id ? colors.textPrimary : colors.textSecondary} 
                fontSize="10"
                fontFamily="'IBM Plex Mono',monospace" 
                style={{transition: "fill .2s ease"}}>
                {sn.name}
              </text>
            </g>
          )
        })}
        <circle 
          cx={CX} 
          cy={CY} 
          r="20" 
          fill={colors.bgCard} 
          stroke={colors.critical} 
          strokeWidth="3"
          style={{animation: "pulseR 2s ease-in-out infinite"}}/>
        <circle 
          cx={CX} 
          cy={CY} 
          r="26" 
          fill="none" 
          stroke={colors.critical} 
          strokeWidth="1" 
          opacity="0.4"/>
        <text 
          x={CX} 
          y={CY - 28} 
          textAnchor="middle" 
          fill={colors.critical} 
          fontSize="11"
          fontFamily="'IBM Plex Mono',monospace" 
          fontWeight="600">
          {rootName.split("@")[0]}
        </text>
        <text 
          x={CX} 
          y={CY + 3} 
          textAnchor="middle" 
          fill={colors.critical} 
          fontSize="8"
          fontFamily="'IBM Plex Mono',monospace" 
          opacity="0.8">
          COMPROMISED
        </text>
      </svg>
      
      <div style={{
        position: "absolute",
        bottom: 16,
        right: 16,
        fontSize: 11,
        color: colors.textTertiary,
        background: colors.bgElevated,
        padding: "6px 12px",
        borderRadius: 6,
        border: `1px solid ${colors.borderSubtle}`
      }}>
        Click a service node to view details
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// TIMELINE STRIP (Exposure Timeline with Pulse Animations)
// ─────────────────────────────────────────────────────────────────────────────
function Timeline({data, colors}) {
  const {services: svcs, stats} = data
  const maxM = Math.max(...svcs.map(s => s.resolvedMinutes)) + 2
  const pct = m => (m / maxM) * 100
  const sorted = [...svcs].sort((a, b) => a.resolvedMinutes - b.resolvedMinutes)
  const dw = 6
  
  return (
    <div style={{
      background: colors.bgCard,  // Warm off-white
      border: `1px solid ${colors.borderSubtle}`,
      borderRadius: 12,
      padding: "24px 28px",
      boxShadow: colors.shadowMd  // Light shadow
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 24
      }}>
        <div>
          <span style={{
            fontSize: 16,
            fontWeight: 600,
            color: colors.textPrimary,
            letterSpacing: "-0.01em"
          }}>
            Exposure Timeline
          </span>
          <span style={{
            fontSize: 12,
            color: colors.textTertiary,
            marginLeft: 10
          }}>
            · relative to compromise event
          </span>
        </div>
        
        {/* Legend */}
        <div style={{display: "flex", gap: 16, alignItems: "center"}}>
          <div style={{display: "flex", alignItems: "center", gap: 6}}>
            <div style={{
              width: 10,
              height: 10,
              background: "rgba(220, 38, 38, 0.2)",
              borderRadius: 3,
              border: `2px solid ${colors.critical}`
            }}/>
            <span style={{fontSize: 11, color: colors.textSecondary}}>
              First {dw}m danger window
            </span>
          </div>
          <div style={{display: "flex", alignItems: "center", gap: 6}}>
            <div style={{
              width: 10,
              height: 3,
              background: colors.info,
              borderRadius: 1
            }}/>
            <span style={{fontSize: 11, color: colors.textSecondary}}>Detection</span>
          </div>
        </div>
      </div>
      
      {/* Timeline Visualization */}
      <div style={{position: "relative", height: 90}}>
        {/* Base timeline track */}
        <div style={{
          position: "absolute",
          top: 40,
          left: 0,
          right: 0,
          height: 3,
          background: colors.borderSubtle,
          borderRadius: 2
        }}/>
        
        {/* Danger window - Orange Shaded Region (Light Theme) */}
        <div style={{
          position: "absolute",
          top: 18,
          left: 0,
          width: `${pct(dw)}%`,
          height: 46,
          background: "rgba(234, 88, 12, 0.08)",  // Orange at 8%
          borderLeft: `3px solid ${colors.critical}`,
          borderRight: `2px dashed rgba(234, 88, 12, 0.3)`,
          borderRadius: 6
        }}/>
        <span style={{
          position: "absolute",
          top: 8,
          left: `${Math.max(1, pct(dw) - 8)}%`,
          fontSize: 10,
          color: colors.critical,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          fontWeight: 600,
          fontFamily: "'IBM Plex Mono', monospace"
        }}>
          {dw}m window
        </span>
        
        {/* Detection marker */}
        <div style={{
          position: "absolute",
          top: 14,
          left: `${pct(stats.detectionMinutes + stats.detectionSeconds / 60)}%`,
          width: 2,
          height: 54,
          background: colors.info,
          opacity: 0.8,
          borderRadius: 1
        }}>
          <span style={{
            position: "absolute",
            top: -16,
            left: 6,
            fontSize: 10,
            color: colors.info,
            whiteSpace: "nowrap",
            fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 600
          }}>
            DETECTED +{stats.detectionMinutes}m{stats.detectionSeconds}s
          </span>
        </div>
        
        {/* Compromise flag (T+0) */}
        <div style={{
          position: "absolute",
          top: 14,
          left: -2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          <div style={{color: colors.critical, fontSize: 18}}>
            <IcFlag/>
          </div>
          <div style={{
            width: 3,
            height: 32,
            background: colors.critical,
            opacity: 0.9,
            borderRadius: 2
          }}/>
        </div>
        <span style={{
          position: "absolute",
          top: 70,
          left: 0,
          fontSize: 10,
          color: colors.critical,
          fontFamily: "'IBM Plex Mono', monospace",
          fontWeight: 600
        }}>
          T+0
        </span>
        
        {/* Service exposure dots with pulse animation */}
        {sorted.map((s, i) => (
          <div key={s.id}>
            {/* Pulsing dot */}
            <div 
              title={`${s.name} · ${minDisp(s.resolvedMinutes)}`}
              style={{
                position: "absolute",
                top: 34,
                left: `calc(${pct(s.resolvedMinutes)}% - 6px)`,
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: s.severity === "direct" ? colors.critical : colors.warning,
                border: `2px solid ${colors.bgCard}`,  // Warm off-white border
                boxShadow: s.severity === "direct" 
                  ? `0 0 12px rgba(234, 88, 12, 0.4), 0 0 20px rgba(234, 88, 12, 0.2)`  // Orange glow
                  : `0 0 12px rgba(245, 158, 11, 0.4), 0 0 20px rgba(245, 158, 11, 0.2)`,  // Amber glow
                zIndex: 2,
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                cursor: "pointer"
              }}/>
            
            {/* Service label */}
            <span style={{
              position: "absolute",
              top: i % 2 === 0 ? 56 : 70,
              left: `calc(${pct(s.resolvedMinutes)}% - 2px)`,
              fontSize: 9,
              color: colors.textTertiary,
              whiteSpace: "nowrap",
              transform: "rotate(-35deg)",
              transformOrigin: "left top",
              fontFamily: "'IBM Plex Mono', monospace"
            }}>
              {s.name}
            </span>
          </div>
        ))}
      </div>
      
      {/* Time axis labels */}
      <div style={{display: "flex", justifyContent: "space-between", marginTop: 56}}>
        {Array.from({length: 7}, (_, i) => (
          <span 
            key={i} 
            style={{
              fontSize: 10,
              color: colors.textTertiary,
              fontFamily: "'IBM Plex Mono', monospace"
            }}>
            +{Math.round(maxM * i / 6)}m
          </span>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// SLIDE-OVER DRAWER (Service Details Panel) — Production Design System
// ─────────────────────────────────────────────────────────────────────────────
function Drawer({svc, onClose, colors}) {
  const mt = svc.maintainer
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [onClose])
  
  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(17, 24, 39, 0.5)",  // Dark gray at 50% (light theme)
          zIndex: 40,
          backdropFilter: "blur(4px)",
          animation: "fadeIn .25s ease-out both"
        }}/>
      
      {/* Drawer Panel */}
      <div style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: "min(420px, 100vw)",
        maxWidth: "100%",
        zIndex: 50,
        background: colors.bgPrimary,  // Pure white
        borderLeft: `1px solid ${colors.borderSubtle}`,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        animation: "slideIn .3s cubic-bezier(.4,0,.2,1) both",
        boxShadow: colors.shadowXl  // Extra large shadow for depth
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: `1px solid ${colors.borderSubtle}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          background: colors.bgPrimary,  // Pure white (sticky header)
          zIndex: 1,
          backdropFilter: "blur(8px)"
        }}>
          <div>
            <div style={{
              fontSize: 11,
              color: colors.textTertiary,
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 600
            }}>
              Service Details
            </div>
            <div style={{
              fontSize: 16,
              fontWeight: 600,
              color: colors.textPrimary,
              fontFamily: "'IBM Plex Mono', monospace"
            }}>
              {svc.name}
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              border: `1px solid ${colors.borderSubtle}`,
              background: "transparent",
              cursor: "pointer",
              color: colors.textSecondary,
              transition: "all 0.2s ease"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = colors.bgHover
              e.currentTarget.style.borderColor = colors.accent
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent"
              e.currentTarget.style.borderColor = colors.borderSubtle
            }}>
            <IcX/>
          </button>
        </div>
        
        <div style={{padding: "24px", display: "flex", flexDirection: "column", gap: 24}}>
          {/* Severity */}
          <div>
            <div style={{
              fontSize: 11,
              color: colors.textTertiary,
              marginBottom: 10,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 600
            }}>
              Severity
            </div>
            <Badge sev={svc.severity} colors={colors}/>
          </div>
          
          {/* Time */}
          <div>
            <div style={{
              fontSize: 11,
              color: colors.textTertiary,
              marginBottom: 10,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 600
            }}>
              First Exposed
            </div>
            <div style={{display: "flex", gap: 20}}>
              <div>
                <div style={{
                  fontSize: 14,
                  color: colors.textPrimary,
                  fontFamily: "'IBM Plex Mono', monospace",
                  marginBottom: 4,
                  fontWeight: 500
                }}>
                  {fmtTime(svc.exposedAt)}
                </div>
                <div style={{fontSize: 11, color: colors.textTertiary}}>
                  {fmtDate(svc.exposedAt)}
                </div>
              </div>
              <div style={{
                borderLeft: `1px solid ${colors.borderSubtle}`,
                paddingLeft: 20
              }}>
                <div style={{
                  fontSize: 14,
                  color: svc.severity === "direct" ? colors.critical : colors.warning,
                  fontFamily: "'IBM Plex Mono', monospace",
                  marginBottom: 4,
                  fontWeight: 600
                }}>
                  {minDisp(svc.resolvedMinutes)}
                </div>
                <div style={{fontSize: 11, color: colors.textTertiary}}>
                  after compromise
                </div>
              </div>
            </div>
          </div>
          
          {/* Chain */}
          <div>
            <div style={{
              fontSize: 11,
              color: colors.textTertiary,
              marginBottom: 10,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 600
            }}>
              Dependency Chain
            </div>
            <Chain chain={svc.chain} colors={colors}/>
          </div>
          
          {/* Maintainer */}
          <div style={{
            borderTop: `1px solid ${colors.borderSubtle}`,
            paddingTop: 24
          }}>
            <div style={{
              fontSize: 11,
              color: colors.textTertiary,
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 600
            }}>
              Maintainer Intel
            </div>
            <div style={{
              background: colors.bgElevated,
              borderRadius: 8,
              padding: "12px 16px",
              border: `1px solid ${colors.borderSubtle}`,
              marginBottom: 16
            }}>
              <div style={{
                fontSize: 14,
                fontWeight: 600,
                color: colors.textPrimary,
                fontFamily: "'IBM Plex Mono', monospace",
                marginBottom: 4
              }}>
                {mt.name}
              </div>
              <div style={{fontSize: 12, color: colors.textSecondary}}>
                {mt.email}
              </div>
            </div>
            <div style={{
              fontSize: 11,
              color: colors.textTertiary,
              marginBottom: 10,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 600
            }}>
              Other packages by this maintainer
            </div>
            <div style={{display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20}}>
              {mt.packages.map(p => (
                <span 
                  key={p} 
                  style={{
                    fontSize: 11,
                    padding: "4px 10px",
                    borderRadius: 6,
                    background: colors.bgPrimary,
                    border: `1px solid ${colors.borderSubtle}`,
                    color: colors.textSecondary,
                    fontFamily: "'IBM Plex Mono', monospace"
                  }}>
                  {p}
                </span>
              ))}
            </div>
          </div>
          
          {/* Typosquats */}
          <div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12
            }}>
              <span style={{color: colors.warning, fontSize: 18}}>
                <IcWarn/>
              </span>
              <span style={{
                fontSize: 11,
                color: colors.warning,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: 600
              }}>
                Possible Typosquats
              </span>
            </div>
            <div style={{display: "flex", flexDirection: "column", gap: 8}}>
              {mt.typosquats.map(t => (
                <div 
                  key={t} 
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "rgba(245, 158, 11, 0.08)",  // Amber at 8% (light)
                    border: `1px solid rgba(245, 158, 11, 0.3)`  // Amber border
                  }}>
                  <span style={{
                    fontSize: 13,
                    color: colors.warning,
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontWeight: 500
                  }}>
                    {t}
                  </span>
                  <span style={{
                    fontSize: 10,
                    color: colors.textTertiary,
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: colors.bgPrimary,
                    border: `1px solid ${colors.borderSubtle}`,
                    fontFamily: "'IBM Plex Mono', monospace"
                  }}>
                    edit-dist 1
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAINTAINER INTELLIGENCE VIEW
// ─────────────────────────────────────────────────────────────────────────────
function MaintainerIntelligence({data, colors}) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedMaint, setSelectedMaint] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetchMaintainerAnalysis(data)
      .then(setAnalysis)
      .catch(err => console.error("Maintainer analysis error:", err))
      .finally(() => setLoading(false))
  }, [data])

  if (loading) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 16
      }}>
        {/* Skeleton Cards */}
        {[1, 2, 3].map(i => (
          <div 
            key={i}
            style={{
              background: colors.bgCard,
              border: `1px solid ${colors.borderSubtle}`,
              borderRadius: 12,
              padding: "20px 24px"
            }}>
            <SkeletonLoader width="40%" height={16} borderRadius={4} colors={colors}/>
            <div style={{marginTop: 12}}>
              <SkeletonLoader width="60%" height={14} borderRadius={4} colors={colors}/>
            </div>
            <div style={{marginTop: 16, display: "flex", gap: 8}}>
              <SkeletonLoader width={80} height={24} borderRadius={6} colors={colors}/>
              <SkeletonLoader width={100} height={24} borderRadius={6} colors={colors}/>
              <SkeletonLoader width={90} height={24} borderRadius={6} colors={colors}/>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!analysis) return null

  const riskColor = (level) => ({
    critical: colors.critical,
    high: colors.high,
    moderate: colors.medium,
    low: colors.low
  }[level] || colors.textTertiary)

  return (
    <div style={{display:"flex",flexDirection:"column",gap:24, position: "relative"}}>
      
      {/* Blueprint Background */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "400px",
        opacity: 0.04,
        pointerEvents: "none",
        backgroundImage: `url(${graphBlueprint})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        zIndex: 0
      }} />
      
      {/* Overview Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:12, position: "relative", zIndex: 1}}>
        <div style={{background:"#111",border:"1px solid #1c1c1f",borderRadius:8,padding:"16px 20px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"#71717a"}}/>
          <div style={{fontSize:10,color:"#52525b",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>Total Maintainers</div>
          <div style={{fontSize:32,fontWeight:700,color:"#fafafa",fontFamily:"'JetBrains Mono',monospace"}}>{analysis.stats.totalMaintainers}</div>
        </div>
        <div style={{background:"#111",border:"1px solid #1c1c1f",borderRadius:8,padding:"16px 20px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"#ef4444"}}/>
          <div style={{fontSize:10,color:"#52525b",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>Critical Risk</div>
          <div style={{fontSize:32,fontWeight:700,color:"#ef4444",fontFamily:"'JetBrains Mono',monospace"}}>{analysis.stats.criticalMaintainers}</div>
        </div>
        <div style={{background:"#111",border:"1px solid #1c1c1f",borderRadius:8,padding:"16px 20px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"#f59e0b"}}/>
          <div style={{fontSize:10,color:"#52525b",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>Typosquats</div>
          <div style={{fontSize:32,fontWeight:700,color:"#f59e0b",fontFamily:"'JetBrains Mono',monospace"}}>{analysis.stats.totalTyposquats}</div>
        </div>
        <div style={{background:"#111",border:"1px solid #1c1c1f",borderRadius:8,padding:"16px 20px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"#eab308"}}/>
          <div style={{fontSize:10,color:"#52525b",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>Single Points of Failure</div>
          <div style={{fontSize:32,fontWeight:700,color:"#eab308",fontFamily:"'JetBrains Mono',monospace"}}>{analysis.stats.singlePointsOfFailure}</div>
        </div>
      </div>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div style={{background:"#111",border:"1px solid #1c1c1f",borderRadius:8,padding:"20px 24px"}}>
          <div style={{fontSize:13,fontWeight:600,color:"#fafafa",marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
            <span style={{color:"#f59e0b"}}><IcWarn/></span>
            Security Recommendations
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {analysis.recommendations.map((rec, i) => (
              <div key={i} style={{background:"#0e0e0e",border:`1px solid ${riskColor(rec.severity)}33`,borderLeft:`3px solid ${riskColor(rec.severity)}`,borderRadius:6,padding:"12px 16px"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <span style={{fontSize:10,fontWeight:700,color:riskColor(rec.severity),textTransform:"uppercase",letterSpacing:"0.06em"}}>{rec.severity}</span>
                  <span style={{fontSize:12,fontWeight:600,color:"#fafafa"}}>{rec.title}</span>
                </div>
                <div style={{fontSize:11,color:"#71717a",marginBottom:6}}>{rec.description}</div>
                <div style={{fontSize:11,color:"#a1a1aa",fontStyle:"italic"}}>→ {rec.action}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critical Maintainers Table */}
      <div style={{background:"#111",border:"1px solid #1c1c1f",borderRadius:8,padding:"20px 24px"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#fafafa",marginBottom:16}}>Maintainer Risk Ranking</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {analysis.maintainers.slice(0, 10).map((maint, i) => (
            <div key={maint.handle} onClick={() => setSelectedMaint(maint)}
              style={{background:"#0e0e0e",border:"1px solid #1c1c1f",borderRadius:6,padding:"12px 16px",cursor:"pointer",transition:"all .15s"}}
              onMouseEnter={e => e.currentTarget.style.background = "#141414"}
              onMouseLeave={e => e.currentTarget.style.background = "#0e0e0e"}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:12,flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#52525b",fontFamily:"'JetBrains Mono',monospace",width:20}}>#{i + 1}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#fafafa",fontFamily:"'JetBrains Mono',monospace",marginBottom:2}}>{maint.handle}</div>
                    <div style={{fontSize:10,color:"#52525b"}}>{maint.packageCount} packages • {maint.exposureCount} services exposed • {maint.typosquats?.length || 0} typosquats</div>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:24,fontWeight:700,color:riskColor(maint.riskScore.level),fontFamily:"'JetBrains Mono',monospace"}}>{maint.riskScore.total}</div>
                    <div style={{fontSize:9,color:riskColor(maint.riskScore.level),textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:600}}>{maint.riskScore.level}</div>
                  </div>
                  <div style={{width:60,height:60}}>
                    <svg viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="16" fill="none" stroke="#1c1c1f" strokeWidth="2.5"/>
                      <circle cx="18" cy="18" r="16" fill="none" stroke={riskColor(maint.riskScore.level)} strokeWidth="2.5"
                        strokeDasharray={`${maint.riskScore.total} 100`} strokeLinecap="round" transform="rotate(-90 18 18)"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Maintainer Detail Modal */}
      {selectedMaint && (
        <>
          <div onClick={() => setSelectedMaint(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:40,backdropFilter:"blur(3px)"}}/>
          <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:50,background:"#111",border:"1px solid #27272a",borderRadius:12,width:"90%",maxWidth:700,maxHeight:"80vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.6)"}}>
            
            <div style={{padding:"20px 24px",borderBottom:"1px solid #1c1c1f",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:"#111",zIndex:1}}>
              <div>
                <div style={{fontSize:11,color:"#52525b",marginBottom:4}}>Maintainer Profile</div>
                <div style={{fontSize:16,fontWeight:600,color:"#fafafa",fontFamily:"'JetBrains Mono',monospace"}}>{selectedMaint.handle}</div>
              </div>
              <button onClick={() => setSelectedMaint(null)} style={{width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6,border:"1px solid #27272a",background:"transparent",cursor:"pointer",color:"#71717a"}}><IcX/></button>
            </div>

            <div style={{padding:"24px"}}>
              {/* Risk Breakdown */}
              <div style={{marginBottom:24}}>
                <div style={{fontSize:12,color:"#52525b",marginBottom:12,textTransform:"uppercase",letterSpacing:"0.05em"}}>Risk Score Breakdown</div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{flex:1,background:"#0e0e0e",border:"1px solid #1c1c1f",borderRadius:6,padding:"14px"}}>
                    <div style={{fontSize:10,color:"#52525b",marginBottom:4}}>Package Control</div>
                    <div style={{fontSize:24,fontWeight:700,color:"#f59e0b",fontFamily:"'JetBrains Mono',monospace"}}>{selectedMaint.riskScore.breakdown.packageControl}</div>
                  </div>
                  <div style={{flex:1,background:"#0e0e0e",border:"1px solid #1c1c1f",borderRadius:6,padding:"14px"}}>
                    <div style={{fontSize:10,color:"#52525b",marginBottom:4}}>Typosquat Risk</div>
                    <div style={{fontSize:24,fontWeight:700,color:"#f59e0b",fontFamily:"'JetBrains Mono',monospace"}}>{selectedMaint.riskScore.breakdown.typosquatRisk}</div>
                  </div>
                  <div style={{flex:1,background:"#0e0e0e",border:"1px solid #1c1c1f",borderRadius:6,padding:"14px"}}>
                    <div style={{fontSize:10,color:"#52525b",marginBottom:4}}>Incident Role</div>
                    <div style={{fontSize:24,fontWeight:700,color:"#ef4444",fontFamily:"'JetBrains Mono',monospace"}}>{selectedMaint.riskScore.breakdown.incidentInvolvement}</div>
                  </div>
                </div>
              </div>

              {/* Packages */}
              <div style={{marginBottom:24}}>
                <div style={{fontSize:12,color:"#52525b",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Maintained Packages ({selectedMaint.packageCount})</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {selectedMaint.packages.slice(0, 20).map(pkg => (
                    <span key={pkg} style={{fontSize:11,padding:"4px 10px",borderRadius:4,background:"#0d0d0d",border:"1px solid #1c1c1f",color:"#a1a1aa",fontFamily:"'JetBrains Mono',monospace"}}>{pkg}</span>
                  ))}
                  {selectedMaint.packageCount > 20 && (
                    <span style={{fontSize:11,padding:"4px 10px",color:"#52525b"}}>+{selectedMaint.packageCount - 20} more</span>
                  )}
                </div>
              </div>

              {/* Typosquats */}
              {selectedMaint.typosquatAnalysis && selectedMaint.typosquatAnalysis.length > 0 && (
                <div>
                  <div style={{fontSize:12,color:"#52525b",marginBottom:12,textTransform:"uppercase",letterSpacing:"0.05em",display:"flex",alignItems:"center",gap:8}}>
                    <span style={{color:"#f59e0b"}}><IcWarn/></span>
                    Typosquat Variants ({selectedMaint.typosquatAnalysis.length})
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {selectedMaint.typosquatAnalysis.map(typo => (
                      <div key={typo.name} style={{background:"#0e0e0e",border:`1px solid ${riskColor(typo.severity)}33`,borderLeft:`3px solid ${riskColor(typo.severity)}`,borderRadius:6,padding:"12px 14px"}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                          <span style={{fontSize:13,fontWeight:600,color:"#fafafa",fontFamily:"'JetBrains Mono',monospace"}}>{typo.name}</span>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <span style={{fontSize:9,padding:"2px 8px",borderRadius:3,background:riskColor(typo.severity)+"22",color:riskColor(typo.severity),fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em"}}>{typo.severity}</span>
                            <span style={{fontSize:11,color:"#52525b",fontFamily:"'JetBrains Mono',monospace"}}>edit distance: {typo.distance}</span>
                          </div>
                        </div>
                        <div style={{fontSize:10,color:"#71717a"}}>{typo.risk}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </>
      )}

    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SIMULATION MODAL
// ─────────────────────────────────────────────────────────────────────────────
function SimulationModal({packageId, onClose}) {
  const [status, setStatus] = useState("running") // running | complete | error
  const [elapsed, setElapsed] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const startTimeRef = useRef(null)

  useEffect(() => {
    startTimeRef.current = Date.now()
    const timer = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current)
    }, 27)

    fetchSimulateCompromise(packageId)
      .then(data => {
        setResult(data)
        setStatus("complete")
        clearInterval(timer)
      })
      .catch(err => {
        setError(err.message)
        setStatus("error")
        clearInterval(timer)
      })

    return () => clearInterval(timer)
  }, [packageId])

  useEffect(() => {
    const h = e => { if(e.key === "Escape") onClose() }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [onClose])

  const pkgName = packageId.replace(/^pkg:/, "")

  return (
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:40,backdropFilter:"blur(3px)",animation:"fadeIn .2s"}}/>
      <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:50,background:"#111",border:"1px solid #27272a",borderRadius:12,width:"90%",maxWidth:580,boxShadow:"0 20px 60px rgba(0,0,0,.6)",animation:"popIn .3s cubic-bezier(.4,0,.2,1)"}}>
        
        {/* Header */}
        <div style={{padding:"20px 24px",borderBottom:"1px solid #1c1c1f",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:11,color:"#52525b",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>
              Live Blast Radius Simulation
            </div>
            <div style={{fontSize:15,fontWeight:600,color:"#fafafa",fontFamily:"'JetBrains Mono',monospace"}}>{pkgName}</div>
          </div>
          <button onClick={onClose} style={{width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6,border:"1px solid #27272a",background:"transparent",cursor:"pointer",color:"#71717a"}}><IcX/></button>
        </div>

        {/* Body */}
        <div style={{padding:"32px 24px"}}>
          {status === "running" && (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:20}}>
              <div style={{position:"relative",width:120,height:120}}>
                <svg viewBox="0 0 120 120" style={{position:"absolute",inset:0,animation:"spin 2s linear infinite"}}>
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#1c1c1f" strokeWidth="4"/>
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#ef4444" strokeWidth="4" strokeDasharray="170 170" strokeDashoffset="42" strokeLinecap="round"/>
                </svg>
                <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
                  <div style={{fontSize:28,fontWeight:700,color:"#ef4444",fontFamily:"'JetBrains Mono',monospace"}}>{(elapsed/1000).toFixed(2)}</div>
                  <div style={{fontSize:10,color:"#52525b",marginTop:2}}>seconds</div>
                </div>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:13,color:"#fafafa",marginBottom:6}}>Traversing dependency graph...</div>
                <div style={{fontSize:11,color:"#52525b"}}>Analyzing transitive relationships with HydraDB</div>
              </div>
            </div>
          )}

          {status === "complete" && result && (
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              {/* Timer Result */}
              <div style={{textAlign:"center",padding:"20px 0",borderBottom:"1px solid #1c1c1f"}}>
                <div style={{fontSize:11,color:"#52525b",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.06em"}}>Blast Radius Resolved In</div>
                <div style={{fontSize:42,fontWeight:700,color:"#22c55e",fontFamily:"'JetBrains Mono',monospace",lineHeight:1}}>{result.simulation.latencyMs}<span style={{fontSize:20,color:"#71717a"}}>ms</span></div>
                <div style={{fontSize:11,color:"#52525b",marginTop:6}}>Single graph traversal query • {result.simulation.traversalDepth} hops deep</div>
              </div>

              {/* Stats Grid */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div style={{background:"#0e0e0e",border:"1px solid #1c1c1f",borderRadius:6,padding:"14px 16px"}}>
                  <div style={{fontSize:10,color:"#52525b",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>Packages</div>
                  <div style={{fontSize:28,fontWeight:700,color:"#f59e0b",fontFamily:"'JetBrains Mono',monospace"}}>{result.stats.packagesAffected}</div>
                </div>
                <div style={{background:"#0e0e0e",border:"1px solid #1c1c1f",borderRadius:6,padding:"14px 16px"}}>
                  <div style={{fontSize:10,color:"#52525b",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>Services</div>
                  <div style={{fontSize:28,fontWeight:700,color:"#ef4444",fontFamily:"'JetBrains Mono',monospace"}}>{result.stats.servicesExposed}</div>
                </div>
                <div style={{background:"#0e0e0e",border:"1px solid #1c1c1f",borderRadius:6,padding:"14px 16px"}}>
                  <div style={{fontSize:10,color:"#52525b",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>Deepest Chain</div>
                  <div style={{fontSize:28,fontWeight:700,color:"#71717a",fontFamily:"'JetBrains Mono',monospace"}}>{result.stats.deepestChain}</div>
                </div>
                <div style={{background:"#0e0e0e",border:"1px solid #1c1c1f",borderRadius:6,padding:"14px 16px"}}>
                  <div style={{fontSize:10,color:"#52525b",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>Nodes Explored</div>
                  <div style={{fontSize:28,fontWeight:700,color:"#71717a",fontFamily:"'JetBrains Mono',monospace"}}>{result.simulation.nodesExplored}</div>
                </div>
              </div>

              {/* Performance Note */}
              <div style={{background:"rgba(34,197,94,.08)",border:"1px solid rgba(34,197,94,.2)",borderRadius:6,padding:"12px 14px",display:"flex",gap:10}}>
                <span style={{color:"#22c55e",flexShrink:0}}><IcShield/></span>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#22c55e",marginBottom:2}}>Real-Time Performance</div>
                  <div style={{fontSize:10,color:"#71717a"}}>
                    HydraDB resolved {result.simulation.traversalDepth}-hop transitive dependencies in {result.simulation.latencyMs}ms. 
                    Equivalent SQL would require {result.simulation.traversalDepth}+ recursive queries.
                  </div>
                </div>
              </div>

              {/* Action */}
              <button onClick={() => window.location.reload()} 
                style={{padding:"10px 18px",borderRadius:6,border:"1px solid #27272a",background:"#1c1c1f",color:"#fafafa",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                View Full Analysis
              </button>
            </div>
          )}

          {status === "error" && (
            <div style={{textAlign:"center",padding:"20px 0"}}>
              <div style={{fontSize:36,marginBottom:12}}>⚠️</div>
              <div style={{fontSize:13,color:"#ef4444",marginBottom:6}}>Simulation Failed</div>
              <div style={{fontSize:11,color:"#52525b"}}>{error}</div>
              <button onClick={onClose} style={{marginTop:20,padding:"8px 16px",borderRadius:5,border:"1px solid #27272a",background:"#1c1c1f",color:"#a1a1aa",fontSize:11,cursor:"pointer"}}>Close</button>
            </div>
          )}
        </div>

      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
      `}</style>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR BANNER
// ─────────────────────────────────────────────────────────────────────────────
function ErrorBanner({msg, onDismiss}) {
  return (
    <div style={{
      position:"fixed",top:60,left:32,right:32,maxWidth:500,
      background:"rgba(239,68,68,.15)",borderLeft:"4px solid #ef4444",
      borderRadius:6,padding:"12px 16px",border:"1px solid rgba(239,68,68,.3)",
      zIndex:100,display:"flex",alignItems:"center",justifyContent:"space-between"
    }}>
      <div style={{fontSize:12,color:"#ef4444"}}>
        <span style={{fontWeight:600}}>Error:</span> {msg}
      </div>
      <button onClick={onDismiss} style={{background:"transparent",border:"none",color:"#ef4444",cursor:"pointer",fontSize:16}}>✕</button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [query, setQuery]       = useState("")
  const [activeQ, setActiveQ]   = useState(null)
  const [data, setData]         = useState(null)
  const [view, setView]         = useState("list")
  const [sortBy, setSortBy]     = useState("severity")
  const [filter, setFilter]     = useState("all")
  const [drawer, setDrawer]     = useState(null)
  const [searching, setSearching] = useState(false)
  const [showSug, setShowSug]   = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [error, setError]       = useState(null)
  const [sugsLoading, setSugsLoading] = useState(false)
  const [simulating, setSimulating] = useState(null)
  
  // Set background color
  useEffect(() => {
    document.body.style.background = colors.bgPrimary
  }, []) // packageId when modal is open

  // Load suggestions on mount
  useEffect(() => {
    setSugsLoading(true)
    fetchSuggestions()
      .then(setSuggestions)
      .catch(err => console.warn("Failed to load suggestions:", err))
      .finally(() => setSugsLoading(false))
  }, [])

  const performSearch = useCallback(async (q) => {
    if (!q.trim()) return
    setSearching(true)
    setError(null)
    try {
      const result = await fetchSearch(q.trim())
      setData(result)
      setActiveQ(q.trim())
    } catch (err) {
      setError(err.message)
      console.error("Search error:", err)
    } finally {
      setSearching(false)
    }
  }, [])

  // Load initial data (event-stream as default)
  useEffect(() => {
    performSearch("event-stream@3.3.6")
  }, [performSearch])

  const search = useCallback(() => {
    performSearch(query)
  }, [query, performSearch])

  const sorted = [...(data?.services||[])].filter(s=>filter==="all"||s.severity===filter).sort((a,b)=>{
    if(sortBy==="severity") return a.severity===b.severity?a.resolvedMinutes-b.resolvedMinutes:a.severity==="direct"?-1:1
    return a.resolvedMinutes-b.resolvedMinutes
  })

  return (
    <div style={{
      minHeight: "100vh",
      background: colors.bgPrimary,
      paddingBottom: 60
    }}>
      <style>{`
        @keyframes pulseR{0%,100%{transform:scale(1);opacity:.8}50%{transform:scale(1.08);opacity:.4}}
        @keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        select option{background:#1a1a1a;color:#a1a1aa}
        button:focus-visible{outline:2px solid ${colors.accent};outline-offset:2px}
        *{box-sizing:border-box}
      `}</style>

      {error && <ErrorBanner msg={error} onDismiss={() => setError(null)} colors={colors} />}

      {/* ── HEADER BAR ──────────────────────────────────────────────────────── */}
      <div style={{
        borderBottom: `1px solid ${colors.borderMedium}`,
        padding: "0 clamp(20px, 4vw, 40px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: 56,
        background: colors.bgCard,
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 30,
        flexWrap: "wrap",
        gap: 12
      }}>
        <div style={{display: "flex", alignItems: "center", gap: 16}}>
          <span style={{
            fontSize: 16,
            fontWeight: 700,
            color: colors.textPrimary,
            fontFamily: "'Inter', system-ui, sans-serif",
            letterSpacing: "-0.02em"
          }}>
            BLASTRADIUS
          </span>
          <div style={{
            width: 1,
            height: 20,
            background: colors.borderMedium
          }}/>
          <span style={{
            fontSize: 10,
            color: colors.textTertiary,
            fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
            letterSpacing: "0.5px"
          }}>
            supply-chain · threat-intel
          </span>
        </div>
        <div style={{display: "flex", alignItems: "center", gap: 16}}>
          <Link to="/" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: 6,
            background: "rgba(255, 255, 255, 0.05)",
            border: `1px solid ${colors.borderMedium}`,
            color: colors.textSecondary,
            fontSize: 12,
            fontFamily: "'Inter', system-ui, sans-serif",
            fontWeight: 500,
            textDecoration: "none",
            transition: "all 0.2s ease"
          }}>
            ← Landing Page
          </Link>
          <div style={{display: "flex", alignItems: "center", gap: 8}}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: colors.accent,  // Cyan for live/interactive indicator
              boxShadow: `0 0 12px ${colors.accentGlow}, 0 0 4px ${colors.accent}`,
              animation: "pulse-live 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"  // Custom pulse-live animation
            }}/>
            <span style={{
              fontSize: 11,
              color: colors.accent,  // Cyan text to match
              fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
              fontWeight: 600
            }}>
              LIVE
            </span>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: 1400,
        margin: "0 auto",
        padding: "0 clamp(20px, 4vw, 40px)"
      }}>

        {/* ── SEARCH INTERFACE ──────────────────────────────────────────────────────── */}
        <div style={{padding: "40px 0 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20, position: "relative"}}>
          
          {/* Hero Radial Glow - "Signal on Void" */}
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "800px",
            height: "400px",
            background: `radial-gradient(ellipse at center, ${colors.criticalGlow} 0%, rgba(139, 92, 246, 0.15) 35%, transparent 70%)`,
            opacity: 0.3,
            pointerEvents: "none",
            zIndex: 0,
            filter: "blur(60px)"
          }} />
          
          {/* Background Graph Image */}
          <div style={{
            position: "absolute",
            top: "-60px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "300px",
            opacity: 0.08,
            pointerEvents: "none",
            zIndex: 0,
            backgroundImage: `url(${graph3D})`,
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter: "brightness(1.5)"
          }} />
          
          <div style={{textAlign: "center", marginBottom: 4, position: "relative", zIndex: 1}}>
            <h1 style={{
              fontSize: 40,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: colors.textPrimary,
              margin: "0 0 8px 0",
              lineHeight: 1.1,
              fontFamily: "'Inter', system-ui, sans-serif"
            }}>
              Supply Chain Threat Analysis
            </h1>
            <p style={{
              fontSize: 14,
              color: colors.textSecondary,
              margin: 0,
              letterSpacing: "-0.01em",
              fontFamily: "'Inter', system-ui, sans-serif"
            }}>
              Real-time dependency graph analysis · Identify attack vectors · Calculate blast radius
            </p>
          </div>
          
          <div style={{position: "relative", width: "100%", maxWidth: 680, zIndex: 1}}>
            <div style={{
              display: "flex",
              alignItems: "center",
              background: colors.bgInput,
              border: `1px solid ${colors.borderMedium}`,
              borderRadius: 8,
              padding: "0 6px 0 16px",
              gap: 12,
              transition: "all 0.2s ease",
              boxShadow: `0 0 0 0 ${colors.accentGlow}`
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = colors.borderStrong
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = colors.borderMedium
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = colors.accent
              e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.accentGlow}`
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = colors.borderMedium
              e.currentTarget.style.boxShadow = `0 0 0 0 ${colors.accentGlow}`
            }}>
              <span style={{color: colors.textTertiary, flexShrink: 0}}>
                <IcSearch/>
              </span>
              <input 
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && search()}
                onFocus={() => setShowSug(true)}
                onBlur={() => setTimeout(() => setShowSug(false), 150)}
                placeholder="Search npm package, org, or CVE (e.g. event-stream@3.3.6)"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
                  fontSize: 13,
                  color: colors.textPrimary,
                  padding: "13px 0",
                  caretColor: colors.accent
                }}
              />
              {searching ? (
                <div style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: `2px solid ${colors.borderStrong}`,
                  borderTopColor: colors.accent,
                  animation: "spin .6s linear infinite",
                  flexShrink: 0,
                  marginRight: 10
                }}/>
              ) : (
                <button 
                  onClick={search}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 9999,
                  borderTop: `2px solid ${colors.accent}`,
                  borderRadius: 8,
                  padding: "12px 28px",
                  outline: "none",
                  border: "none",
                  background: colors.accent,
                  color: colors.bgPrimary,
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  flexShrink: 0,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  transition: "all 0.2s ease",
                  boxShadow: `0 0 20px ${colors.accentGlow}`
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = colors.accentHover
                    e.currentTarget.style.transform = "translateY(-1px)"
                    e.currentTarget.style.boxShadow = `0 0 30px ${colors.accentGlow}, 0 4px 12px rgba(0,0,0,0.4)`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = colors.accent
                    e.currentTarget.style.transform = "translateY(0)"
                    e.currentTarget.style.boxShadow = `0 0 20px ${colors.accentGlow}`
                  }}>
                  ANALYZE
                </button>
              )}
            </div>
            {showSug && (
              <div style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                right: 0,
                background: colors.bgElevated,
                border: `1px solid ${colors.borderMedium}`,
                borderRadius: 8,
                zIndex: 20,
                overflow: "hidden",
                boxShadow: `0 8px 32px rgba(0, 0, 0, 0.6)`
              }}>
                <div style={{
                  padding: "10px 16px 6px",
                  fontSize: 10,
                  color: colors.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  fontWeight: 600,
                  fontFamily: "'Inter', system-ui, sans-serif"
                }}>
                  {sugsLoading ? "LOADING..." : "KNOWN COMPROMISED PACKAGES"}
                </div>
                {suggestions.length === 0 ? (
                  <div style={{padding: "16px", fontSize: 11, color: colors.textTertiary, fontFamily: "'JetBrains Mono', monospace"}}>
                    No suggestions available. Backend may not be running.
                  </div>
                ) : (
                  suggestions.map(s => (
                    <div 
                      key={s.id}
                      onMouseDown={() => {setQuery(s.name); setShowSug(false)}}
                      style={{
                        padding: "10px 16px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        transition: "all 0.15s ease",
                        borderLeft: "3px solid transparent"
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = colors.bgCard
                        e.currentTarget.style.borderLeftColor = colors.critical
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "transparent"
                        e.currentTarget.style.borderLeftColor = "transparent"
                      }}>
                      <span style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: colors.critical,
                        boxShadow: `0 0 8px ${colors.critical}`
                      }}/>
                      <span style={{
                        fontSize: 12,
                        color: colors.textPrimary,
                        fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
                        fontWeight: 600
                      }}>
                        {s.name}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          {activeQ && (
            <div style={{display: "flex", gap: 8, fontSize: 11, alignItems: "center"}}>
              <span style={{color: colors.textTertiary, fontFamily: "'Inter', system-ui, sans-serif"}}>Query:</span>
              <span style={{
                color: colors.accent,
                fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
                fontWeight: 700,
                padding: "4px 10px",
                background: colors.bgCard,
                borderRadius: 4,
                border: `1px solid ${colors.borderMedium}`
              }}>
                {activeQ}
              </span>
            </div>
          )}
        </div>

        {/* ── KPI STATS GRID ───────────────────────────────────────────────────── */}
        {data && (
          <>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
              marginBottom: 28
            }}>
              <StatCard label="Packages Affected" value={data.stats.packagesAffected} sub="transitive + direct" accent="critical" colors={colors}/>
              <StatCard label="Services Exposed" value={data.stats.servicesExposed} sub={`${data.services.filter(s=>s.severity==="direct").length} direct · ${data.services.filter(s=>s.severity==="transitive").length} transitive`} accent="transitive" colors={colors}/>
              <StatCard label="Time to Detection" value={`${data.stats.detectionMinutes}m ${data.stats.detectionSeconds}s`} sub={`compromise: ${fmtTime(data.compromisedAt)}`} accent="accent" colors={colors}/>
              <StatCard label="Deepest Chain" value={`${data.stats.deepestChain} hops`} sub="longest dependency path" accent="safe" colors={colors}/>
            </div>
            <div style={{marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 10}}>
              <button 
                onClick={() => {
                  const pkgId = data.services[0]?.chain[0] ? `pkg:${data.services[0].chain[0]}` : `pkg:${activeQ}`
                  setSimulating(pkgId)
                }}
                style={{
                  padding: "12px 24px",
                  borderRadius: 9999,
                  border: `2px solid ${colors.critical}`,
                  background: "rgba(234, 88, 12, 0.1)",  // Orange at 10% (light)
                  color: colors.critical,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  transition: "all 0.2s ease",
                  boxShadow: colors.shadowMd  // Medium shadow
                }}
                onMouseEnter={e => { 
                  e.currentTarget.style.background = "rgba(234, 88, 12, 0.15)"  // Darker on hover
                  e.currentTarget.style.transform = "translateY(-2px)"
                  e.currentTarget.style.boxShadow = colors.shadowLg  // Larger shadow
                }}
                onMouseLeave={e => { 
                  e.currentTarget.style.background = "rgba(234, 88, 12, 0.1)"
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = colors.shadowMd
                }}>
                <span>Simulate Live Compromise</span>
                <span style={{
                  fontSize: 10,
                  padding: "3px 8px",
                  borderRadius: 9999,
                  background: colors.critical,
                  color: "#fff",
                  fontWeight: 700,
                  fontFamily: "'IBM Plex Mono', monospace"
                }}>
                  NEW
                </span>
              </button>
              <div style={{
                fontSize: 12,
                color: colors.textTertiary,
                maxWidth: 300,
                textAlign: "center"
              }}>
                Watch real-time graph traversal with measured query latency
              </div>
            </div>
          </>
        )}

        {/* ── CONTROLS BAR ─────────────────────────────────────────────────────── */}
        {data && (
          <div style={{marginBottom: 24}}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
              padding: "14px 18px",
              background: colors.bgCard,
              border: `1px solid ${colors.borderMedium}`,
              borderRadius: 8,
              flexWrap: "wrap",
              gap: 12
            }}>
              <div style={{display: "flex", alignItems: "center", gap: 12}}>
                <span style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: colors.textPrimary,
                  letterSpacing: "-0.01em",
                  fontFamily: "'Inter', system-ui, sans-serif",
                  textTransform: "uppercase"
                }}>
                  {view === "maintainers" ? "Maintainer Intelligence" : "Alert Feed"}
                </span>
                {view !== "maintainers" && (
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 4,
                    background: "rgba(255, 255, 255, 0.15)",
                    color: colors.critical,
                    border: `1px solid ${colors.critical}`,
                    fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace"
                  }}>
                    {data.services.length}
                  </span>
                )}
              </div>
              
              <div style={{display: "flex", alignItems: "center", gap: 10}}>
                {view === "list" && (
                  <>
                    <select 
                      value={filter} 
                      onChange={e => setFilter(e.target.value)}
                      style={{
                        fontSize: 11,
                        background: colors.bgInput,
                        color: colors.textSecondary,
                        border: `1px solid ${colors.borderMedium}`,
                        borderRadius: 6,
                        padding: "7px 12px",
                        cursor: "pointer",
                        outline: "none",
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontWeight: 600
                      }}>
                      <option value="all">All Severities</option>
                      <option value="direct">Direct Only</option>
                      <option value="transitive">Transitive Only</option>
                    </select>
                    <select 
                      value={sortBy} 
                      onChange={e => setSortBy(e.target.value)}
                      style={{
                        fontSize: 11,
                        background: colors.bgInput,
                        color: colors.textSecondary,
                        border: `1px solid ${colors.borderMedium}`,
                        borderRadius: 6,
                        padding: "7px 12px",
                        cursor: "pointer",
                        outline: "none",
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontWeight: 600
                      }}>
                      <option value="severity">Sort: Severity</option>
                      <option value="time">Sort: Time</option>
                    </select>
                  </>
                )}
                
                {/* View Tabs */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  background: colors.bgInput,
                  border: `1px solid ${colors.borderMedium}`,
                  borderRadius: 6,
                  padding: 2
                }}>
                  {["list", "graph", "maintainers"].map(v => (
                    <button 
                      key={v} 
                      onClick={() => setView(v)}
                      style={{
                        padding: "7px 16px",
                        borderRadius: 4,
                        border: "none",
                        background: v === view ? colors.accent : "transparent",
                        color: v === view ? colors.bgPrimary : colors.textSecondary,
                        fontSize: 11,
                        fontWeight: v === view ? 700 : 600,
                        cursor: "pointer",
                        fontFamily: "'Inter', system-ui, sans-serif",
                        letterSpacing: "0.3px",
                        textTransform: "uppercase",
                        transition: "all 0.15s ease",
                        boxShadow: v === view ? `0 0 12px ${colors.accentGlow}` : "none"
                      }}
                      onMouseEnter={e => {
                        if (v !== view) {
                          e.currentTarget.style.background = colors.bgCard
                          e.currentTarget.style.color = colors.textPrimary
                        }
                      }}
                      onMouseLeave={e => {
                        if (v !== view) {
                          e.currentTarget.style.background = "transparent"
                          e.currentTarget.style.color = colors.textSecondary
                        }
                      }}>
                      {v === "list" ? "Alerts" : v === "graph" ? "Graph" : "Intel"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* List View Panel */}
            {view === "list" && (
              <div style={{display: "flex", flexDirection: "column", gap: 10}}>
                {sorted.length === 0 ? (
                  <div style={{
                    textAlign: "center",
                    padding: "60px 40px",
                    color: colors.textTertiary,
                    fontSize: 13,
                    fontFamily: "'Inter', system-ui, sans-serif",
                    position: "relative"
                  }}>
                    {/* Empty State Graph Image */}
                    <div style={{
                      width: "200px",
                      height: "150px",
                      margin: "0 auto 20px",
                      opacity: 0.15,
                      backgroundImage: `url(${graphNetwork})`,
                      backgroundSize: "contain",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat"
                    }} />
                    <div style={{fontWeight: 600, marginBottom: 6, color: colors.textSecondary}}>No alerts match the current filter</div>
                    <div style={{fontSize: 11, color: colors.textTertiary}}>Try adjusting your filter settings</div>
                  </div>
                ) : (
                  sorted.map((s, i) => <ServiceRow key={s.id} svc={s} idx={i} onDetails={setDrawer} colors={colors}/>)
                )}
              </div>
            )}
            
            {/* Graph View Panel */}
            {view === "graph" && <GraphView data={data} onDetails={setDrawer} colors={colors}/>}
            
            {/* Maintainer Intelligence Panel */}
            {view === "maintainers" && <MaintainerIntelligence data={data} colors={colors}/>}
          </div>
        )}

        {data && <Timeline data={data} colors={colors}/>}
      </div>

      {drawer && <Drawer svc={drawer} onClose={()=>setDrawer(null)} colors={colors}/>}
      {simulating && <SimulationModal packageId={simulating} onClose={()=>setSimulating(null)} colors={colors}/>}
    </div>
  )
}
