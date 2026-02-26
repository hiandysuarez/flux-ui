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

/* =========================
   ML OPTIMIZATION ENDPOINTS
   ========================= */

/**
 * Get ML-derived settings suggestions (requires auth)
 * @param {number} days - Number of days of history to analyze
 */
export function fetchSettingsSuggestions(days = 30) {
  return authJson(`${mustBase()}/api/user/settings/suggestions?days=${days}&strategy=llm`);
}

/**
 * Run a backtest comparing settings (requires auth)
 * @param {Object} settings - Settings to test
 * @param {number} days - Number of days to backtest
 * @param {boolean} compareToCurrent - Compare to current settings
 */
export function runBacktest(settings, days = 30, compareToCurrent = true) {
  return authJson(`${mustBase()}/api/user/backtest`, {
    method: 'POST',
    body: JSON.stringify({
      settings,
      days,
      compare_to_current: compareToCurrent,
      strategy: 'llm',
    }),
  });
}

/**
 * Quick backtest for dashboard widget (requires auth)
 * @param {number} days - Number of days of history to analyze
 */
export function fetchQuickBacktest(days = 30) {
  return authJson(`${mustBase()}/api/user/backtest/quick?days=${days}&strategy=llm`);
}

/**
 * Log user action on a suggestion (requires auth)
 */
export function logSuggestionAction(suggestionType, currentValue, suggestedValue, action, extra = {}) {
  return authJson(`${mustBase()}/api/user/suggestion-action`, {
    method: 'POST',
    body: JSON.stringify({
      suggestion_type: suggestionType,
      current_value: currentValue,
      suggested_value: suggestedValue,
      action,
      ...extra,
    }),
  });
}

/* =========================
   ADMIN ENDPOINTS
   ========================= */

/**
 * Get admin settings (requires admin auth)
 * Returns flat settings from admin_settings table
 */
export function fetchAdminSettings() {
  return authJson(`${mustBase()}/api/admin/settings`);
}

/**
 * Save admin settings (requires admin auth)
 * Saves to admin_settings table (flat columns)
 */
export function saveAdminSettings(payload) {
  return authJson(`${mustBase()}/api/admin/settings`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

/* =========================
   CYCLE REPLAY / WHAT-IF ENDPOINTS
   ========================= */

/**
 * Replay historical decisions with different filters/settings
 * @param {Object} options - Replay configuration
 * @param {number} options.days - Number of days to replay (default: 30)
 * @param {string[]} options.symbols - Optional symbol filter
 * @param {number} options.conf_threshold - Confidence threshold (default: 0.60)
 * @param {number} options.win_prob_min - Min win probability (default: 0)
 * @param {boolean} options.mq_required - Require market quality (default: true)
 * @param {number} options.stop_loss_pct - Stop loss percentage (default: 0.01)
 * @param {number} options.take_profit_pct - Take profit percentage (default: 0.02)
 * @param {number} options.max_hold_min - Max hold minutes (default: 120)
 * @param {boolean} options.trailing_enabled - Enable trailing stop (default: true)
 */
export function runCycleReplay(options = {}) {
  return getJson(`${mustBase()}/api/backtest/replay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
}

/**
 * Quick comparison of two confidence thresholds
 * @param {number} days - Number of days to compare
 * @param {number} baseConf - Base confidence threshold (default: 0.60)
 * @param {number} variantConf - Variant confidence threshold (default: 0.65)
 */
export function compareCycleReplay(days = 30, baseConf = 0.60, variantConf = 0.65) {
  return getJson(`${mustBase()}/api/backtest/replay/compare?days=${days}&base_conf=${baseConf}&variant_conf=${variantConf}`);
}

/* =========================
   PARAMETER OPTIMIZATION ENDPOINTS
   ========================= */

/**
 * Find optimal parameters using grid search (requires auth)
 * @param {Object} options - Optimization configuration
 * @param {number} options.days - Number of days of history (default: 30)
 * @param {number} options.starting_equity - Starting account balance (default: 10000)
 * @param {number} options.risk_per_trade_pct - Risk per trade (default: 0.01)
 * @param {Object} options.entry_params - Custom entry parameter grid
 * @param {Object} options.exit_params - Custom exit parameter grid
 */
export function runParameterOptimization(options = {}) {
  return getJson(`${mustBase()}/api/backtest/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
}

/**
 * Quick parameter optimization with default grids
 * @param {number} days - Number of days of history to analyze
 */
export function fetchQuickOptimization(days = 30) {
  return getJson(`${mustBase()}/api/backtest/optimize/quick?days=${days}`);
}

/**
 * Compare current settings against optimized parameters
 * @param {Object} currentParams - Current settings to compare
 * @param {number} days - Number of days of history
 */
export function compareVsOptimal(currentParams = {}, days = 30) {
  return getJson(`${mustBase()}/api/backtest/optimize/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ current_params: currentParams, days }),
  });
}

/* =========================
   FLUX SETTINGS ENDPOINTS
   ========================= */

/**
 * Fetch user's Flux Settings (backtest-optimized parameters)
 * Returns settings with source ('backtest' or 'system')
 */
export function fetchFluxSettings() {
  return authJson(`${mustBase()}/api/user/flux-settings`);
}

/**
 * Save backtest results to Flux Settings
 * @param {Object} settings - Trading parameters to save
 * @param {Object} metrics - Backtest performance metrics
 * @param {number} days - Number of days the backtest covered
 */
export function saveToFluxSettings(settings, metrics, days = 30) {
  return authJson(`${mustBase()}/api/user/flux-settings`, {
    method: 'POST',
    body: JSON.stringify({ settings, metrics, days }),
  });
}

/**
 * Save what-if results to Custom Settings
 * Sets preset_id to null (custom mode)
 * @param {Object} settings - Trading parameters to save
 */
export function saveToCustomSettings(settings) {
  return authJson(`${mustBase()}/api/backtest/replay/save`, {
    method: 'POST',
    body: JSON.stringify({ settings }),
  });
}
