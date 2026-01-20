// src/lib/api.ts
type Json = Record<string, any>;

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, "") ||
  "http://localhost:8000"; // fallback for local only

async function getJSON<T = Json>(path: string): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GET ${url} -> ${res.status} ${text}`);
    }
  return (await res.json()) as T;
}

export async function fetchStatus() {
  // Your Render endpoint
  return getJSON("/api/status");
}

export async function fetchLatestCycle() {
  // Your Render endpoint
  return getJSON("/api/cycle/latest");
}
