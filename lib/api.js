import { getAccessToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

function mustBase() {
  if (!API_BASE) throw new Error("Missing NEXT_PUBLIC_API_BASE");
  return API_BASE.replace(/\/$/, "");
}

// Non-throwing version for optional API calls
function getBase() {
  if (!API_BASE) return null;
  return API_BASE.replace(/\/$/, "");
}

async function getJson(url, options = {}) {
  try {
    const r = await fetch(url, options);
    const text = await r.text(); // always read body
    if (!r.ok) {
      throw new Error(`${r.status} ${r.statusText} :: ${text.slice(0, 200)}`);
    }
    return text ? JSON.parse(text) : null;
  } catch (e) {
    console.error("FETCH_FAIL", url, e);
    throw e;
  }
}

// Authenticated fetch helper
async function authJson(url, options = {}) {
  const token = await getAccessToken();
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return getJson(url, { ...options, headers });
}

/* =========================
   READ ENDPOINTS
   ========================= */

export function fetchStatus() {
  return getJson(`${mustBase()}/api/status`);
}

export function fetchLatestCycle() {
  return getJson(`${mustBase()}/api/cycle/latest`);
}

export function fetchSettings() {
  return getJson(`${mustBase()}/api/settings`);
}

export function fetchRecentTrades(limit = 10, tradingMode = 'paper') {
  return getJson(`${mustBase()}/api/trades/recent?limit=${limit}&trading_mode=${tradingMode}`);
}

export function fetchRecentShadowLogs(limit = 10) {
  return getJson(`${mustBase()}/api/shadow/recent?limit=${limit}`);
}

export function fetchActivePositions() {
  return getJson(`${mustBase()}/api/positions/active`);
}

export function fetchAccountSummary(tradingMode = 'paper') {
  return getJson(`${mustBase()}/api/account/summary?trading_mode=${tradingMode}`);
}

export function fetchDailyPnl(days = 7) {
  return getJson(`${mustBase()}/api/performance/daily?days=${days}`);
}

/* =========================
   ANALYTICS ENDPOINTS
   ========================= */

export function fetchPerformanceMetrics(days = 30) {
  return getJson(`${mustBase()}/api/analytics/performance?days=${days}`);
}

export function fetchTradeHistory({ page = 1, limit = 50, symbol, side, win, from, to } = {}) {
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('limit', limit);
  if (symbol) params.set('symbol', symbol);
  if (side) params.set('side', side);
  if (win !== undefined && win !== null) params.set('win', win);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return getJson(`${mustBase()}/api/analytics/trades?${params.toString()}`);
}

export function fetchSymbolAnalytics() {
  return getJson(`${mustBase()}/api/analytics/symbols`);
}

export function fetchTimingAnalytics() {
  return getJson(`${mustBase()}/api/analytics/timing`);
}

/* =========================
   WRITE / ACTION ENDPOINTS
   ========================= */

export async function saveSettings(payload) {
  return getJson(`${mustBase()}/api/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
}

/**
 * 🔁 Run a decision cycle
 * @param {boolean} force - bypass time windows
 */
export function runDecisionCycle(force = false) {
  const q = force ? "?force=true" : "";
  return getJson(`${mustBase()}/decision_cycle${q}`);
}

/**
 * 🛑 Force exit all positions immediately
 */
export function forceExitAll() {
  return getJson(`${mustBase()}/force_exit_all`);
}

/* =========================
   MULTI-TENANT ENDPOINTS
   ========================= */

/**
 * Get all available presets (public, no auth)
 */
export function fetchPresets() {
  return getJson(`${mustBase()}/api/presets`);
}

/**
 * Get guardrails info for settings validation (public, no auth)
 */
export function fetchGuardrails() {
  return getJson(`${mustBase()}/api/guardrails`);
}

/**
 * Get current user's settings (requires auth)
 */
export function fetchUserSettings() {
  return authJson(`${mustBase()}/api/user/settings`);
}

/**
 * Update current user's settings (requires auth)
 */
export function saveUserSettings(payload) {
  return authJson(`${mustBase()}/api/user/settings`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

/**
 * Apply a preset to user's settings (requires auth)
 */
export function applyPreset(presetId) {
  return authJson(`${mustBase()}/api/user/settings/apply-preset`, {
    method: 'POST',
    body: JSON.stringify({ preset_id: presetId }),
  });
}

/**
 * Complete onboarding with selected preset (requires auth)
 * @param {string} presetId - Which trading preset to use
 * @param {boolean} termsAccepted - User accepted Terms of Service
 * @param {boolean} riskDisclosed - User acknowledged risk disclosure
 */
export function completeOnboarding(presetId, termsAccepted = false, riskDisclosed = false) {
  return authJson(`${mustBase()}/api/user/onboarding`, {
    method: 'POST',
    body: JSON.stringify({
      preset_id: presetId,
      terms_accepted: termsAccepted,
      risk_disclosed: riskDisclosed,
    }),
  });
}

/**
 * Get user's theme preference (requires auth)
 * Uses non-throwing getBase() to avoid crashing if API not configured
 */
export function fetchUserTheme() {
  const base = getBase();
  if (!base) return Promise.resolve({ ok: false });
  return authJson(`${base}/api/user/theme`);
}

/**
 * Save user's theme preference (requires auth)
 * Uses non-throwing getBase() to avoid crashing if API not configured
 */
export function saveUserTheme(theme) {
  const base = getBase();
  if (!base) return Promise.resolve({ ok: false });
  return authJson(`${base}/api/user/theme`, {
    method: 'POST',
    body: JSON.stringify({ theme }),
  });
}

/**
 * Get current user's subscription (requires auth)
 */
export function fetchSubscription() {
  return authJson(`${mustBase()}/api/user/subscription`);
}

/**
 * Get subscription limits and usage for current user (requires auth)
 */
export function fetchSubscriptionLimits() {
  return authJson(`${mustBase()}/api/user/subscription/limits`);
}

/**
 * Upgrade subscription to a higher tier (requires auth)
 * @param {string} targetPlan - 'plus' or 'pro'
 */
export function upgradeSubscription(targetPlan) {
  return authJson(`${mustBase()}/api/user/subscription/upgrade`, {
    method: 'POST',
    body: JSON.stringify({ target_plan: targetPlan }),
  });
}
