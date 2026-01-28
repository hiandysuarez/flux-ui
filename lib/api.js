const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

function mustBase() {
  if (!API_BASE) throw new Error("Missing NEXT_PUBLIC_API_BASE");
  return API_BASE.replace(/\/$/, "");
}

async function getJson(url, options) {
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

export function fetchRecentTrades(limit = 10) {
  return getJson(`${mustBase()}/api/trades/recent?limit=${limit}`);
}

export function fetchRecentShadowLogs(limit = 10) {
  return getJson(`${mustBase()}/api/shadow/recent?limit=${limit}`);
}

export function fetchActivePositions() {
  return getJson(`${mustBase()}/api/positions/active`);
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
