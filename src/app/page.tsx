import { fetchStatus } from "@/lib/api"

export default async function Dashboard() {
  const status = await fetchStatus()

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Flux</h1>

      <div className="mt-4 flex gap-4">
        <div>Mode: {status.mode}</div>
        <div>Kill Switch: {status.kill_switch}</div>
        <div>Has Positions: {status.has_positions ? "Yes" : "No"}</div>
      </div>
    </main>
  )
}
