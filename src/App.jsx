import { useState, useEffect, useRef, useCallback } from "react"

// ─────────────────────────────────────────────────────────────────────────────
// COLOR SYSTEM — Professional Production Palette
// ─────────────────────────────────────────────────────────────────────────────
const colors = {
  // Backgrounds
  bgPrimary: "#0F0F1E",
  bgCard: "#1A1A2E",
  bgElevated: "#16162A",
  bgHover: "rgba(94, 106, 210, 0.08)",
  
  // Semantic
  critical: "#DC2626",
  warning: "#F59E0B",
  success: "#10B981",
  info: "#3B82F6",
  
  // Accent (single chromatic color)
  accent: "#5E6AD2",
  accentHover: "#7078E1",
  
  // Text
  textPrimary: "#F1F5F9",
  textSecondary: "#CBD5E1",
  textTertiary: "#94A3B8",
  textDisabled: "#64748B",
  
  // Borders
  borderPrimary: "#2D2D44",
  borderHover: "#3D3D5C",
  borderAccent: "rgba(94, 106, 210, 0.3)",
}

// ─────────────────────────────────────────────────────────────────────────────
// API CLIENT
// ─────────────────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.PROD 
  ? "/api" 
  : "http://localhost:3001/api"

async function fetchSearch(query) {
  const res = await fetch(`${API_BASE}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) throw new Error(`Search failed: ${res.status} ${res.statusText}`)
  return res.json()
}

async function fetchSuggestions() {
  const res = await fetch(`${API_BASE}/suggestions`)
  if (!res.ok) throw new Error(`Suggestions failed: ${res.status} ${res.statusText}`)
  return res.json()
}

async function fetchSimulateCompromise(packageId) {
  const res = await fetch(`${API_BASE}/simulate-compromise`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packageId }),
  })
  if (!res.ok) throw new Error(`Simulation failed: ${res.status} ${res.statusText}`)
  return res.json()
}

async function fetchMaintainerAnalysis(data) {
  const res = await fetch(`${API_BASE}/maintainer-analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  })
  if (!res.ok) throw new Error(`Analysis failed: ${res.status} ${res.statusText}`)
  return res.json()
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
// BADGE
// ─────────────────────────────────────────────────────────────────────────────
function Badge({sev}) {
  const d = sev === "direct"
  return (
    <span style={{
      display:"inline-flex",alignItems:"center",gap:4,
      fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",
      padding:"2px 8px",borderRadius:3,
      background:d?"rgba(239,68,68,.15)":"rgba(245,158,11,.12)",
      color:d?"#ef4444":"#f59e0b",
      border:`1px solid ${d?"rgba(239,68,68,.3)":"rgba(245,158,11,.25)"}`,
      fontFamily:"'JetBrains Mono',monospace",
    }}>
      {d ? "● Direct" : "◆ Transitive"}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({label, value, sub, accent}) {
  const colors = {red:"#ef4444",amber:"#f59e0b",green:"#22c55e"}
  const c = colors[accent] || null
  return (
    <div style={{flex:1,background:"#111",border:"1px solid #1c1c1f",borderRadius:8,padding:"20px 24px",display:"flex",flexDirection:"column",gap:6,position:"relative",overflow:"hidden"}}>
      {c && <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:c}}/>}
      <span style={{fontSize:11,fontWeight:500,color:"#71717a",letterSpacing:"0.06em",textTransform:"uppercase"}}>{label}</span>
      <span style={{fontSize:36,fontWeight:700,lineHeight:1,color:c||"#fafafa",fontFamily:"'JetBrains Mono',monospace"}}>{value}</span>
      {sub && <span style={{fontSize:11,color:"#52525b"}}>{sub}</span>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAIN BREADCRUMB
// ─────────────────────────────────────────────────────────────────────────────
function Chain({chain}) {
  return (
    <div style={{display:"flex",alignItems:"center",flexWrap:"wrap",gap:6,padding:"10px 14px",background:"#0d0d0d",borderRadius:6}}>
      {chain.map((node,i) => {
        const first=i===0, last=i===chain.length-1
        const col = first?"#ef4444":last?"#a1a1aa":"#f59e0b"
        const bg  = first?"rgba(239,68,68,.1)":last?"rgba(255,255,255,.05)":"rgba(245,158,11,.08)"
        const bdr = first?"rgba(239,68,68,.3)":last?"rgba(255,255,255,.1)":"rgba(245,158,11,.2)"
        return (
          <div key={i} style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:11,fontWeight:500,padding:"3px 10px",borderRadius:4,color:col,background:bg,border:`1px solid ${bdr}`,fontFamily:"'JetBrains Mono',monospace"}}>{node}</span>
            {!last && <span style={{color:"#3f3f46"}}><IcArrow/></span>}
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE ROW
// ─────────────────────────────────────────────────────────────────────────────
function ServiceRow({svc, idx, onDetails}) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{border:"1px solid #1c1c1f",borderRadius:6,overflow:"hidden",background:open?"#111":"#0e0e0e",transition:"background .15s",animation:"fadeUp .3s ease-out both",animationDelay:`${idx*40}ms`}}>
      <div onClick={()=>setOpen(o=>!o)}
        style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",cursor:"pointer",borderBottom:open?"1px solid #1c1c1f":"none"}}>
        <span style={{color:"#52525b",flexShrink:0}}><IcChev open={open}/></span>
        <span style={{flex:1,display:"flex",alignItems:"center",gap:8,minWidth:0}}>
          <span style={{fontSize:13,fontWeight:500,color:"#fafafa",fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap"}}>{svc.name}</span>
          <Badge sev={svc.severity}/>
        </span>
        <span style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#52525b",flexShrink:0}}>
          <IcClock/>
          <span style={{fontFamily:"'JetBrains Mono',monospace",color:"#71717a"}}>{minDisp(svc.resolvedMinutes)}</span>
        </span>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"#3f3f46",flexShrink:0}}>{fmtTime(svc.exposedAt)}</span>
        <button onClick={e=>{e.stopPropagation();onDetails(svc)}}
          style={{fontSize:11,padding:"3px 10px",borderRadius:4,border:"1px solid #27272a",background:"transparent",color:"#71717a",cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>
          Details
        </button>
      </div>
      {open && (
        <div style={{padding:"10px 14px",background:"#0a0a0a"}}>
          <div style={{fontSize:10,color:"#52525b",letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:6}}>
            Dependency Chain &middot; {svc.chain.length-1} hop{svc.chain.length-2!==1?"s":""}
          </div>
          <Chain chain={svc.chain}/>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GRAPH VIEW
// ─────────────────────────────────────────────────────────────────────────────
function GraphView({data, onDetails}) {
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
    <div style={{position:"relative",background:"#0a0a0a",borderRadius:8,border:"1px solid #1c1c1f",overflow:"hidden"}}>
      <div style={{position:"absolute",top:12,left:12,display:"flex",gap:12,zIndex:10}}>
        {[{c:"#ef4444",l:"Compromised"},{c:"#f59e0b",l:"Intermediate"},{c:"#71717a",l:"Service"}].map(x=>(
          <div key={x.l} style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:x.c}}/>
            <span style={{fontSize:10,color:"#52525b"}}>{x.l}</span>
          </div>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:440}}>
        <defs>
          <pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#141414" strokeWidth="1"/>
          </pattern>
          <radialGradient id="rg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#grid)"/>
        <circle cx={CX} cy={CY} r="58" fill="url(#rg)"/>
        {edges.map((e,i)=>(
          <line key={i} x1={e.ax} y1={e.ay} x2={e.bx} y2={e.by} stroke="#27272a" strokeWidth="1.5" opacity="0.6"/>
        ))}
        {innerNodes.map(n=>(
          <g key={n.name} onMouseEnter={()=>setHov(n.name)} onMouseLeave={()=>setHov(null)}>
            <circle cx={n.x} cy={n.y} r={hov===n.name?10:7} fill="#1a1a1a" stroke="#f59e0b" strokeWidth="1.5" style={{transition:"r .15s"}}/>
            <text x={n.x} y={n.y-12} textAnchor="middle" fill="#a1a1aa" fontSize="9" fontFamily="'JetBrains Mono',monospace">
              {n.name.split("@")[0].substring(0,14)}
            </text>
          </g>
        ))}
        {outerNodes.map(sn=>{
          const dx=sn.x-CX,dy=sn.y-CY,len=Math.sqrt(dx*dx+dy*dy)
          const lx=sn.x+dx/len*18,ly=sn.y+dy/len*13
          return (
            <g key={sn.id} onClick={()=>onDetails(sn)} style={{cursor:"pointer"}} onMouseEnter={()=>setHov(sn.id)} onMouseLeave={()=>setHov(null)}>
              <circle cx={sn.x} cy={sn.y} r={hov===sn.id?10:7} fill="#0e0e0e"
                stroke={sn.severity==="direct"?"#ef4444":"#f59e0b"}
                strokeWidth={hov===sn.id?2.5:1.5} style={{transition:"all .15s"}}/>
              <text x={lx} y={ly+3}
                textAnchor={sn.x<CX-15?"end":sn.x>CX+15?"start":"middle"}
                fill={hov===sn.id?"#e4e4e7":"#71717a"} fontSize="9.5"
                fontFamily="'JetBrains Mono',monospace" style={{transition:"fill .15s"}}>
                {sn.name}
              </text>
            </g>
          )
        })}
        <circle cx={CX} cy={CY} r="20" fill="#1c1c1f" stroke="#ef4444" strokeWidth="2.5"
          style={{animation:"pulseR 2s ease-in-out infinite"}}/>
        <circle cx={CX} cy={CY} r="26" fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.3"/>
        <text x={CX} y={CY-28} textAnchor="middle" fill="#ef4444" fontSize="10"
          fontFamily="'JetBrains Mono',monospace" fontWeight="600">
          {rootName.split("@")[0]}
        </text>
        <text x={CX} y={CY+3} textAnchor="middle" fill="#ef4444" fontSize="7"
          fontFamily="'JetBrains Mono',monospace" opacity="0.75">COMPROMISED</text>
      </svg>
      <div style={{position:"absolute",bottom:10,right:12,fontSize:10,color:"#3f3f46"}}>
        Click a service node to open details
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMELINE STRIP
// ─────────────────────────────────────────────────────────────────────────────
function Timeline({data}) {
  const {services:svcs, stats} = data
  const maxM = Math.max(...svcs.map(s=>s.resolvedMinutes)) + 2
  const pct = m => (m/maxM)*100
  const sorted = [...svcs].sort((a,b)=>a.resolvedMinutes-b.resolvedMinutes)
  const dw = 6
  return (
    <div style={{background:"#111",border:"1px solid #1c1c1f",borderRadius:8,padding:"20px 24px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div>
          <span style={{fontSize:13,fontWeight:600,color:"#fafafa"}}>Exposure Timeline</span>
          <span style={{fontSize:11,color:"#52525b",marginLeft:8}}>&middot; relative to compromise event</span>
        </div>
        <div style={{display:"flex",gap:14,alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:8,height:8,background:"rgba(239,68,68,.4)",borderRadius:2,border:"1px solid #ef4444"}}/>
            <span style={{fontSize:10,color:"#52525b"}}>First {dw}m danger window</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:8,height:2,background:"#3b82f6"}}/>
            <span style={{fontSize:10,color:"#52525b"}}>Detection</span>
          </div>
        </div>
      </div>
      <div style={{position:"relative",height:80}}>
        <div style={{position:"absolute",top:36,left:0,right:0,height:2,background:"#1c1c1f",borderRadius:1}}/>
        <div style={{position:"absolute",top:16,left:0,width:`${pct(dw)}%`,height:42,background:"rgba(239,68,68,.06)",borderLeft:"2px solid rgba(239,68,68,.4)",borderRight:"1px dashed rgba(239,68,68,.3)",borderRadius:2}}/>
        <span style={{position:"absolute",top:7,left:`${Math.max(1,pct(dw)-8)}%`,fontSize:9,color:"rgba(239,68,68,.6)",letterSpacing:"0.05em",textTransform:"uppercase",fontWeight:600}}>{dw}m window</span>
        <div style={{position:"absolute",top:12,left:`${pct(stats.detectionMinutes+stats.detectionSeconds/60)}%`,width:1,height:50,background:"#3b82f6",opacity:.6}}>
          <span style={{position:"absolute",top:-14,left:4,fontSize:9,color:"#3b82f6",whiteSpace:"nowrap",fontFamily:"'JetBrains Mono',monospace"}}>DETECTED +{stats.detectionMinutes}m{stats.detectionSeconds}s</span>
        </div>
        <div style={{position:"absolute",top:12,left:-1,display:"flex",flexDirection:"column",alignItems:"center"}}>
          <div style={{color:"#ef4444"}}><IcFlag/></div>
          <div style={{width:2,height:30,background:"#ef4444",opacity:.8}}/>
        </div>
        <span style={{position:"absolute",top:62,left:0,fontSize:9,color:"#ef4444",fontFamily:"'JetBrains Mono',monospace"}}>T+0</span>
        {sorted.map((s,i)=>(
          <div key={s.id}>
            <div title={`${s.name} \u00b7 ${minDisp(s.resolvedMinutes)}`} style={{position:"absolute",top:30,left:`calc(${pct(s.resolvedMinutes)}% - 5px)`,width:10,height:10,borderRadius:"50%",background:s.severity==="direct"?"#ef4444":"#f59e0b",border:"2px solid #0a0a0a",boxShadow:s.severity==="direct"?"0 0 8px rgba(239,68,68,.5)":"0 0 8px rgba(245,158,11,.4)",zIndex:2}}/>
            <span style={{position:"absolute",top:i%2===0?50:62,left:`calc(${pct(s.resolvedMinutes)}% - 2px)`,fontSize:8,color:"#3f3f46",whiteSpace:"nowrap",transform:"rotate(-35deg)",transformOrigin:"left top",fontFamily:"'JetBrains Mono',monospace"}}>{s.name}</span>
          </div>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:48}}>
        {Array.from({length:7},(_,i)=>(
          <span key={i} style={{fontSize:9,color:"#3f3f46",fontFamily:"'JetBrains Mono',monospace"}}>+{Math.round(maxM*i/6)}m</span>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE-OVER DRAWER
// ─────────────────────────────────────────────────────────────────────────────
function Drawer({svc, onClose}) {
  const mt = svc.maintainer
  useEffect(()=>{
    const h = e => { if(e.key==="Escape") onClose() }
    window.addEventListener("keydown",h)
    return ()=>window.removeEventListener("keydown",h)
  },[onClose])
  return (
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:40,backdropFilter:"blur(2px)"}}/>
      <div style={{position:"fixed",top:0,right:0,bottom:0,width:360,zIndex:50,background:"#111",borderLeft:"1px solid #1c1c1f",overflowY:"auto",display:"flex",flexDirection:"column",animation:"slideIn .25s cubic-bezier(.4,0,.2,1) both"}}>
        {/* Header */}
        <div style={{padding:"16px 20px",borderBottom:"1px solid #1c1c1f",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:"#111",zIndex:1}}>
          <div>
            <div style={{fontSize:10,color:"#52525b",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>Service Details</div>
            <div style={{fontSize:15,fontWeight:600,color:"#fafafa",fontFamily:"'JetBrains Mono',monospace"}}>{svc.name}</div>
          </div>
          <button onClick={onClose} style={{width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6,border:"1px solid #27272a",background:"transparent",cursor:"pointer",color:"#71717a"}}><IcX/></button>
        </div>
        <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:20}}>
          {/* Severity */}
          <div>
            <div style={{fontSize:10,color:"#52525b",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Severity</div>
            <Badge sev={svc.severity}/>
          </div>
          {/* Time */}
          <div>
            <div style={{fontSize:10,color:"#52525b",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>First Exposed</div>
            <div style={{display:"flex",gap:16}}>
              <div>
                <div style={{fontSize:13,color:"#fafafa",fontFamily:"'JetBrains Mono',monospace"}}>{fmtTime(svc.exposedAt)}</div>
                <div style={{fontSize:10,color:"#52525b"}}>{fmtDate(svc.exposedAt)}</div>
              </div>
              <div>
                <div style={{fontSize:13,color:svc.severity==="direct"?"#ef4444":"#f59e0b",fontFamily:"'JetBrains Mono',monospace"}}>{minDisp(svc.resolvedMinutes)}</div>
                <div style={{fontSize:10,color:"#52525b"}}>after compromise</div>
              </div>
            </div>
          </div>
          {/* Chain */}
          <div>
            <div style={{fontSize:10,color:"#52525b",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Dependency Chain</div>
            <Chain chain={svc.chain}/>
          </div>
          {/* Maintainer */}
          <div style={{borderTop:"1px solid #1c1c1f",paddingTop:16}}>
            <div style={{fontSize:10,color:"#52525b",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.05em"}}>Maintainer Intel</div>
            <div style={{background:"#0e0e0e",borderRadius:6,padding:"10px 14px",border:"1px solid #1c1c1f",marginBottom:10}}>
              <div style={{fontSize:13,fontWeight:600,color:"#fafafa",fontFamily:"'JetBrains Mono',monospace",marginBottom:2}}>{mt.name}</div>
              <div style={{fontSize:11,color:"#52525b"}}>{mt.email}</div>
            </div>
            <div style={{fontSize:10,color:"#52525b",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Other packages by this maintainer</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:16}}>
              {mt.packages.map(p=>(
                <span key={p} style={{fontSize:11,padding:"2px 8px",borderRadius:3,background:"#0d0d0d",border:"1px solid #1c1c1f",color:"#a1a1aa",fontFamily:"'JetBrains Mono',monospace"}}>{p}</span>
              ))}
            </div>
          </div>
          {/* Typosquats */}
          <div>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
              <span style={{color:"#f59e0b"}}><IcWarn/></span>
              <span style={{fontSize:10,color:"#f59e0b",textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:600}}>Possible Typosquats</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {mt.typosquats.map(t=>(
                <div key={t} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderRadius:5,background:"rgba(245,158,11,.05)",border:"1px solid rgba(245,158,11,.2)"}}>
                  <span style={{fontSize:12,color:"#f59e0b",fontFamily:"'JetBrains Mono',monospace"}}>{t}</span>
                  <span style={{fontSize:10,color:"#71717a",padding:"1px 6px",borderRadius:3,background:"#0a0a0a",border:"1px solid #1c1c1f"}}>edit-dist 1</span>
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
function MaintainerIntelligence({data}) {
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
      <div style={{textAlign:"center",padding:60}}>
        <div style={{width:40,height:40,margin:"0 auto 16px",borderRadius:"50%",border:"3px solid #1c1c1f",borderTopColor:"#ef4444",animation:"spin .8s linear infinite"}}/>
        <div style={{fontSize:13,color:"#52525b"}}>Analyzing maintainer network...</div>
      </div>
    )
  }

  if (!analysis) return null

  const riskColor = (level) => ({
    critical: "#ef4444",
    high: "#f59e0b",
    moderate: "#eab308",
    low: "#22c55e"
  }[level] || "#71717a")

  return (
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      
      {/* Overview Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:12}}>
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
  const [simulating, setSimulating] = useState(null) // packageId when modal is open

  // Load suggestions on mount
  useEffect(() => {
    setSugsLoading(true)
    fetchSuggestions()
      .then(setSuggestions)
      .catch(err => console.warn("Failed to load suggestions:", err))
      .finally(() => setSugsLoading(false))
  }, [])

  // Load initial data (event-stream as default)
  useEffect(() => {
    if (!data) {
      performSearch("event-stream@3.3.6")
    }
  }, [])

  const performSearch = async (q) => {
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
  }

  const search = useCallback(() => {
    performSearch(query)
  }, [query])

  const sorted = [...(data?.services||[])].filter(s=>filter==="all"||s.severity===filter).sort((a,b)=>{
    if(sortBy==="severity") return a.severity===b.severity?a.resolvedMinutes-b.resolvedMinutes:a.severity==="direct"?-1:1
    return a.resolvedMinutes-b.resolvedMinutes
  })

  return (
    <div style={{minHeight:"100vh",background:"#0a0a0a",paddingBottom:60}}>
      <style>{`
        @keyframes pulseR{0%,100%{transform:scale(1);opacity:.8}50%{transform:scale(1.08);opacity:.4}}
        @keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        select option{background:#1a1a1a;color:#a1a1aa}
        button:focus-visible{outline:2px solid #ef4444;outline-offset:2px}
        *{box-sizing:border-box}
      `}</style>

      {error && <ErrorBanner msg={error} onDismiss={() => setError(null)} />}

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <div style={{borderBottom:"1px solid #1c1c1f",padding:"0 32px",display:"flex",alignItems:"center",justifyContent:"space-between",height:52,background:"rgba(10,10,10,.95)",backdropFilter:"blur(8px)",position:"sticky",top:0,zIndex:30}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:20,height:20,borderRadius:4,background:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}><IcShield/></div>
          <span style={{fontSize:14,fontWeight:700,color:"#fafafa",letterSpacing:"-0.01em"}}>BlastRadius</span>
          <span style={{fontSize:11,color:"#3f3f46",marginLeft:4,padding:"1px 6px",border:"1px solid #27272a",borderRadius:3}}>by HydraDB</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <span style={{fontSize:11,color:"#3f3f46",fontFamily:"'JetBrains Mono',monospace"}}>supply-chain &middot; threat-intel</span>
          <div style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 6px rgba(34,197,94,.6)"}}/>
          <span style={{fontSize:11,color:"#52525b"}}>Live</span>
        </div>
      </div>

      <div style={{maxWidth:1100,margin:"0 auto",padding:"0 32px"}}>

        {/* ── SEARCH ────────────────────────────────────────────────────────── */}
        <div style={{padding:"48px 0 36px",display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
          <div style={{fontSize:11,color:"#52525b",letterSpacing:"0.08em",textTransform:"uppercase"}}>Supply Chain Threat Analysis</div>
          <div style={{position:"relative",width:"100%",maxWidth:580}}>
            <div style={{display:"flex",alignItems:"center",background:"#111",border:"1px solid #27272a",borderRadius:8,padding:"0 16px",gap:10}}>
              <span style={{color:"#52525b",flexShrink:0}}><IcSearch/></span>
              <input value={query}
                onChange={e=>setQuery(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&search()}
                onFocus={()=>setShowSug(true)}
                onBlur={()=>setTimeout(()=>setShowSug(false),150)}
                placeholder="e.g., event-stream@3.3.6"
                style={{flex:1,background:"transparent",border:"none",outline:"none",fontFamily:"'JetBrains Mono',monospace",fontSize:14,color:"#fafafa",padding:"14px 0",caretColor:"#ef4444"}}
              />
              {searching
                ? <div style={{width:16,height:16,borderRadius:"50%",border:"2px solid #27272a",borderTopColor:"#ef4444",animation:"spin .6s linear infinite",flexShrink:0}}/>
                : <button onClick={search} style={{padding:"5px 14px",borderRadius:5,border:"none",background:"#ef4444",color:"#fff",fontFamily:"inherit",fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0}}>Analyze</button>
              }
            </div>
            {showSug && (
              <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,background:"#111",border:"1px solid #27272a",borderRadius:6,zIndex:20,overflow:"hidden",boxShadow:"0 8px 24px rgba(0,0,0,.4)"}}>
                <div style={{padding:"6px 12px 4px",fontSize:10,color:"#3f3f46",textTransform:"uppercase",letterSpacing:"0.06em"}}>
                  {sugsLoading ? "Loading..." : "Known compromised packages"}
                </div>
                {suggestions.length === 0 ? (
                  <div style={{padding:"12px",fontSize:11,color:"#52525b"}}>No suggestions available. Backend may not be running.</div>
                ) : (
                  suggestions.map(s=>(
                    <div key={s.id} onMouseDown={()=>{setQuery(s.name);setShowSug(false)}}
                      style={{padding:"9px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}
                      onMouseEnter={e=>e.currentTarget.style.background="#161616"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <span style={{color:"#ef4444",fontSize:9}}>&#11044;</span>
                      <span style={{fontSize:13,color:"#a1a1aa",fontFamily:"'JetBrains Mono',monospace"}}>{s.name}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          {activeQ && (
            <div style={{display:"flex",gap:6,fontSize:11}}>
              <span style={{color:"#3f3f46"}}>Showing results for</span>
              <span style={{color:"#ef4444",fontFamily:"'JetBrains Mono',monospace"}}>{activeQ}</span>
            </div>
          )}
        </div>

        {/* ── STATS ─────────────────────────────────────────────────────────── */}
        {data && (
          <>
            <div style={{display:"flex",gap:12,marginBottom:16}}>
              <StatCard label="Packages Affected" value={data.stats.packagesAffected} sub="transitive + direct" accent="amber"/>
              <StatCard label="Services Exposed" value={data.stats.servicesExposed} sub={`${data.services.filter(s=>s.severity==="direct").length} direct \u00b7 ${data.services.filter(s=>s.severity==="transitive").length} transitive`} accent="red"/>
              <StatCard label="Time to Detection" value={`${data.stats.detectionMinutes}m ${data.stats.detectionSeconds}s`} sub={`compromise: ${fmtTime(data.compromisedAt)}`} accent={data.stats.detectionMinutes<10?"green":"red"}/>
              <StatCard label="Deepest Chain" value={`${data.stats.deepestChain} hops`} sub="longest dependency path"/>
            </div>
            <div style={{marginBottom:28,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <button 
                onClick={() => {
                  const pkgId = data.services[0]?.chain[0] ? `pkg:${data.services[0].chain[0]}` : `pkg:${activeQ}`
                  setSimulating(pkgId)
                }}
                style={{
                  padding:"10px 20px",borderRadius:8,border:"2px solid #ef4444",background:"rgba(239,68,68,.1)",
                  color:"#ef4444",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",
                  display:"flex",alignItems:"center",gap:8,transition:"all .2s"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,.2)"; e.currentTarget.style.transform = "translateY(-1px)" }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,.1)"; e.currentTarget.style.transform = "translateY(0)" }}>
                <span style={{fontSize:16}}>⚡</span>
                <span>Simulate Live Compromise</span>
                <span style={{fontSize:9,padding:"2px 6px",borderRadius:3,background:"rgba(239,68,68,.3)",color:"#fff",fontWeight:700}}>NEW</span>
              </button>
              <div style={{fontSize:10,color:"#52525b",maxWidth:280,textAlign:"center"}}>
                Watch real-time graph traversal with measured query latency
              </div>
            </div>
          </>
        )}

        {/* ── MAIN ──────────────────────────────────────────────────────────── */}
        {data && (
          <div style={{marginBottom:28}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:13,fontWeight:600,color:"#fafafa"}}>
                  {view === "maintainers" ? "Maintainer Intelligence" : "Exposed Services"}
                </span>
                {view !== "maintainers" && (
                  <span style={{fontSize:11,fontWeight:600,padding:"1px 7px",borderRadius:10,background:"rgba(239,68,68,.1)",color:"#ef4444",border:"1px solid rgba(239,68,68,.2)"}}>{data.services.length}</span>
                )}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                {view==="list" && (
                  <>
                    <select value={filter} onChange={e=>setFilter(e.target.value)}
                      style={{fontSize:11,background:"#111",color:"#a1a1aa",border:"1px solid #27272a",borderRadius:4,padding:"4px 8px",cursor:"pointer",outline:"none",fontFamily:"inherit"}}>
                      <option value="all">All Severities</option>
                      <option value="direct">Direct Only</option>
                      <option value="transitive">Transitive Only</option>
                    </select>
                    <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
                      style={{fontSize:11,background:"#111",color:"#a1a1aa",border:"1px solid #27272a",borderRadius:4,padding:"4px 8px",cursor:"pointer",outline:"none",fontFamily:"inherit"}}>
                      <option value="severity">Sort: Severity</option>
                      <option value="time">Sort: Time</option>
                    </select>
                  </>
                )}
                <div style={{display:"flex",alignItems:"center",background:"#111",border:"1px solid #27272a",borderRadius:6,padding:2}}>
                  {["list","graph","maintainers"].map(v=>(
                    <button key={v} onClick={()=>setView(v)}
                      style={{padding:"4px 14px",borderRadius:4,border:"none",background:v===view?"#1c1c1f":"transparent",color:v===view?"#fafafa":"#71717a",fontSize:12,fontWeight:v===view?600:400,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
                      {v==="list"?"&#9776; List":v==="graph"?"&#9673; Graph":"&#128100; Intel"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {view==="list" && (
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {sorted.length===0
                  ? <div style={{textAlign:"center",padding:40,color:"#3f3f46",fontSize:13}}>No services match the current filter.</div>
                  : sorted.map((s,i)=><ServiceRow key={s.id} svc={s} idx={i} onDetails={setDrawer}/>)
                }
              </div>
            )}
            {view==="graph" && <GraphView data={data} onDetails={setDrawer}/>}
            {view==="maintainers" && <MaintainerIntelligence data={data}/>}
          </div>
        )}

        {data && <Timeline data={data}/>}
      </div>

      {drawer && <Drawer svc={drawer} onClose={()=>setDrawer(null)}/>}
      {simulating && <SimulationModal packageId={simulating} onClose={()=>setSimulating(null)}/>}
    </div>
  )
}
