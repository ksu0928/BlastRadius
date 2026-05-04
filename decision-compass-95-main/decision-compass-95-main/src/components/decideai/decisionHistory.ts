/**
 * Decision History — localStorage persistence layer
 * Max 5 saved decisions, with bias profile accumulation
 */

export interface SavedDecision {
  id: string;
  timestamp: number;
  scenarioTitle: string;
  verdict: string;
  confidenceScore: number;
  optionAName: string;
  optionBName: string;
  optionAScore: number;
  optionBScore: number;
  biases: string[]; // All detected bias names
}

export interface BiasProfile {
  [biasName: string]: number; // bias name -> occurrence count
}

const STORAGE_KEY = "decideai_history";
const MAX_DECISIONS = 5;

// Tracked biases for the profile
export const TRACKED_BIASES = [
  "FOMO Bias",
  "Loss Aversion",
  "Status Quo Bias",
  "Sunk Cost Fallacy",
  "Optimism Bias",
  "Anchoring Bias",
  "Hyperbolic Discounting",
  "Confirmation Bias",
  "Social Proof Bias",
];

export function loadHistory(): SavedDecision[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveDecision(decision: Omit<SavedDecision, "id" | "timestamp">): SavedDecision {
  const history = loadHistory();
  const entry: SavedDecision = {
    ...decision,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  // Prepend new, cap at MAX
  const updated = [entry, ...history].slice(0, MAX_DECISIONS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return entry;
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function deleteDecision(id: string): void {
  const history = loadHistory();
  const updated = history.filter((d) => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/** Build a bias profile from all saved decisions */
export function buildBiasProfile(history: SavedDecision[]): BiasProfile {
  const profile: BiasProfile = {};
  for (const decision of history) {
    for (const bias of decision.biases) {
      const normalized = bias.trim();
      if (normalized) {
        profile[normalized] = (profile[normalized] || 0) + 1;
      }
    }
  }
  return profile;
}

/** Get recurring biases (appearing 2+ times) */
export function getRecurringBiases(history: SavedDecision[]): { name: string; count: number }[] {
  const profile = buildBiasProfile(history);
  return Object.entries(profile)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

/** Format timestamp as relative time */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}
