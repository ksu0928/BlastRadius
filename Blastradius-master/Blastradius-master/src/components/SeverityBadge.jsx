// ─────────────────────────────────────────────────────────────────────────────
// SeverityBadge — Pill badge with severity color-coding
// Soft glow at critical level only, per §7
// ─────────────────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  critical: { bg: 'bg-sev-critical/15', text: 'text-sev-critical', label: 'CRITICAL' },
  high:     { bg: 'bg-sev-high/15',     text: 'text-sev-high',     label: 'HIGH' },
  medium:   { bg: 'bg-sev-medium/15',   text: 'text-sev-medium',   label: 'MEDIUM' },
  low:      { bg: 'bg-sev-low/15',      text: 'text-sev-low',      label: 'LOW' },
  info:     { bg: 'bg-sev-info/15',     text: 'text-sev-info',     label: 'INFO' },
  direct:   { bg: 'bg-sev-critical/15', text: 'text-sev-critical', label: 'DIRECT' },
  transitive: { bg: 'bg-sev-high/15',   text: 'text-sev-high',     label: 'TRANSITIVE' },
  compromised: { bg: 'bg-sev-critical/15', text: 'text-sev-critical', label: 'COMPROMISED' },
  safe:     { bg: 'bg-sev-low/15',      text: 'text-sev-low',      label: 'SAFE' },
};

export default function SeverityBadge({ severity, score, className = '' }) {
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.info;
  const isCritical = severity === 'critical' || severity === 'direct' || severity === 'compromised';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] font-bold tracking-wider uppercase ${config.bg} ${config.text} ${isCritical ? 'animate-pulse-critical' : ''} ${className}`}
      style={isCritical ? { boxShadow: '0 0 8px rgba(229, 72, 77, 0.25)' } : undefined}
    >
      {config.label}
      {score !== undefined && (
        <>
          <span className="opacity-50">·</span>
          <span>{score}</span>
        </>
      )}
    </span>
  );
}
