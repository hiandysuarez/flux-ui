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
