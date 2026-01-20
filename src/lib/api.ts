export async function fetchStatus() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/api/status`,
    { cache: "no-store" }
  )
  if (!res.ok) throw new Error("Status fetch failed")
  return res.json()
}
