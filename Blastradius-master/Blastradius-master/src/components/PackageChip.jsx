// ─────────────────────────────────────────────────────────────────────────────
// PackageChip — Mono name@version with ecosystem icon, clickable
// ─────────────────────────────────────────────────────────────────────────────

import { useNavigate } from 'react-router-dom';

const EcosystemIcon = ({ ecosystem, size = 14 }) => {
  if (ecosystem === 'pypi') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12l3-3 3 3-3 3-3-3z" /><path d="M15 12l3-3 3 3-3 3-3-3z" /><path d="M9 6l3-3 3 3-3 3-3-3z" /><path d="M9 18l3-3 3 3-3 3-3-3z" />
      </svg>
    );
  }
  // npm cube icon
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
};

export default function PackageChip({ name, version, ecosystem = 'npm', clickable = true, className = '' }) {
  const navigate = useNavigate();
  const display = version ? `${name}@${version}` : name;

  const handleClick = () => {
    if (clickable) {
      navigate(`/package/${encodeURIComponent(display)}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={!clickable}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold transition-all duration-150 border ${
        clickable
          ? 'bg-surface-1 border-border-subtle text-text-primary hover:bg-surface-2 hover:border-brand-300 cursor-pointer'
          : 'bg-surface-1 border-border-subtle text-text-secondary cursor-default'
      } ${className}`}
    >
      <span className="text-text-secondary opacity-70">
        <EcosystemIcon ecosystem={ecosystem} size={12} />
      </span>
      {display}
    </button>
  );
}
