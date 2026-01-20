// lib/api.ts
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "";

export async function fetchStatus() {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE is not set");

  const res = await fetch(`${API_BASE}/api/status`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Status fetch failed: ${res.status} ${txt.slice(0, 200)}`);
  }

  return res.json();
}

export async function fetchLatestCycle() {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE is not set");

  const res = await fetch(`${API_BASE}/api/cycle/latest`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Cycle fetch failed: ${res.status} ${txt.slice(0, 200)}`);
  }

  return res.json();
}
