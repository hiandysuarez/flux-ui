// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://gpt5-trade.onrender.com";

async function getJSON(path: string) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${path}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

export async function fetchStatus() {
  return getJSON("/api/status");
}

export async function fetchLatestCycle() {
  return getJSON("/api/cycle/latest");
}
