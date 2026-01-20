const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

function mustBase() {
  if (!API_BASE) throw new Error("Missing NEXT_PUBLIC_API_BASE in Vercel env vars.");
  return API_BASE.replace(/\/$/, "");
}

export async function fetchStatus() {
  const r = await fetch(`${mustBase()}/api/status`);
  if (!r.ok) throw new Error(`/api/status failed: ${r.status}`);
  return r.json();
}

export async function fetchLatestCycle() {
  const r = await fetch(`${mustBase()}/api/cycle/latest`);
  if (!r.ok) throw new Error(`/api/cycle/latest failed: ${r.status}`);
  return r.json();
}

