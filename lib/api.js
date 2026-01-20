const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

function mustBase() {
  if (!API_BASE) throw new Error("Missing NEXT_PUBLIC_API_BASE");
  return API_BASE.replace(/\/$/, "");
}

async function getJson(url) {
  try {
    const r = await fetch(url);
    const text = await r.text(); // read body even if not json
    if (!r.ok) throw new Error(`${r.status} ${r.statusText} :: ${text.slice(0, 200)}`);
    return text ? JSON.parse(text) : null;
  } catch (e) {
    console.error("FETCH_FAIL", url, e);
    throw e;
  }
}

export function fetchStatus() {
  return getJson(`${mustBase()}/api/status`);
}

export function fetchLatestCycle() {
  return getJson(`${mustBase()}/api/cycle/latest`);
}

export function fetchSettings() {
  return getJson(`${mustBase()}/api/settings`);
}

export async function saveSettings(payload) {
  const url = `${mustBase()}/api/settings`;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });
    const text = await r.text();
    if (!r.ok) throw new Error(`${r.status} ${r.statusText} :: ${text.slice(0, 200)}`);
    return text ? JSON.parse(text) : null;
  } catch (e) {
    console.error("FETCH_FAIL", url, e);
    throw e;
  }
}
