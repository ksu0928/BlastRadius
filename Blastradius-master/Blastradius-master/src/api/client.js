// ─────────────────────────────────────────────────────────────────────────────
// BlastRadius — Centralized API Client
// Wires to existing backend endpoints with mock data fallback
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.PROD
  ? "/api"
  : "http://localhost:3001/api";

import { MOCK_SEARCH_RESULT, MOCK_SUGGESTIONS, MOCK_MAINTAINER_ANALYSIS, MOCK_CROSS_ECOSYSTEM, MOCK_PERSISTENCE_REPORT, MOCK_SIMULATION_RESULT } from './mockData.js';

async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn(`[API] ${url} failed:`, err.message);
    return null;
  }
}

export async function searchPackage(query) {
  const data = await safeFetch(`${API_BASE}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  return data || MOCK_SEARCH_RESULT;
}

export async function getSuggestions() {
  const data = await safeFetch(`${API_BASE}/suggestions`);
  return data || MOCK_SUGGESTIONS;
}

export async function analyzeMaintainer(serviceData) {
  const data = await safeFetch(`${API_BASE}/maintainer-analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: serviceData }),
  });
  return data || MOCK_MAINTAINER_ANALYSIS;
}

export async function getCrossEcosystem(maintainer, npmPackages = []) {
  const data = await safeFetch(`${API_BASE}/cross-ecosystem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ maintainer, npmPackages }),
  });
  return data || MOCK_CROSS_ECOSYSTEM;
}

export async function getPersistenceReport() {
  const data = await safeFetch(`${API_BASE}/persistence-report`);
  return data || MOCK_PERSISTENCE_REPORT;
}

export async function simulateCompromise(packageId) {
  const data = await safeFetch(`${API_BASE}/simulate-compromise`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packageId }),
  });
  return data || MOCK_SIMULATION_RESULT;
}
