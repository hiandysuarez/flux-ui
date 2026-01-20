const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

function mustBase() {
  if (!API_BASE) throw new Error("Missing NEXT_PUBLIC_API_BASE");
  return API_BASE.replace(/\/$/, "");
}

export async function fetchStatus() {
  const r = await fetch(`${mustBase()}/api/status`);
  if (!r.ok) throw new Error(`status ${r.status}`);
  return r.json();
}

export async function fetchLatestCycle() {
  const r = await fetch(`${mustBase()}/api/cycle/latest`);
  if (!r.ok) throw new Error(`cycle ${r.status}`);
  return r.json();
}

export async function fetchSettings() {
  const r = await fetch(`${mustBase()}/api/settings`);
  if (!r.ok) throw new Error(`settings ${r.status}`);
  return r.json();
}

export async function saveSettings(payload) {
  const r = await fetch(`${mustBase()}/api/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  if (!r.ok) throw new Error(`save_settings ${r.status}`);
  return r.json();
}
