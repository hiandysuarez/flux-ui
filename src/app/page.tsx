// app/page.tsx
import { fetchStatus, fetchLatestCycle } from "../lib/api";

export default async function Dashboard() {
  const status = await fetchStatus();
  const latest = await fetchLatestCycle();

  const cycle = latest?.cycle ?? null;
  const ts = cycle?.ts ?? null;
  const rows = Array.isArray(cycle?.rows) ? cycle.rows : [];
  const unrealized = cycle?.unrealized ?? null;

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Flux</h1>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
        <Badge label="MODE" value={status?.mode} />
        <Badge label="KILL" value={status?.kill_switch} />
        <Badge label="LAST_CYCLE" value={status?.last_cycle_ts || "n/a"} />
        <Badge label="HAS_POSITIONS" value={status?.has_positions ? "yes" : "no"} />
      </div>

      <div style={{ marginTop: 12, marginBottom: 12, fontWeight: 700 }}>
        Latest cycle: {ts || "none"} {unrealized !== null ? `| unrealized: ${unrealized}` : ""}
      </div>

      <div style={{ border: "1px solid #333", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#111" }}>
              <Th>Symbol</Th>
              <Th>Decision</Th>
              <Th>Conf</Th>
              <Th>Hold reason</Th>
              <Th>Last price</Th>
              <Th>Pos</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <Td colSpan={6}>No rows yet.</Td>
              </tr>
            ) : (
              rows.map((r: any) => (
                <tr key={r.symbol} style={{ borderTop: "1px solid #222" }}>
                  <Td>{r.symbol}</Td>
                  <Td>{r.decision ?? "—"}</Td>
                  <Td>{typeof r.confidence === "number" ? r.confidence.toFixed(2) : "—"}</Td>
                  <Td>{r.hold_reason ?? "—"}</Td>
                  <Td>{r.last_price ?? "—"}</Td>
                  <Td>
                    {(r.position_side ?? "flat")}{" "}
                    {typeof r.position_qty === "number" ? `(${r.position_qty})` : ""}
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 14, opacity: 0.7 }}>
        If this loads, Flux is officially wired to Render + Supabase. 🎛️
      </p>
    </main>
  );
}

function Badge({ label, value }: { label: string; value: any }) {
  return (
    <div style={{ border: "1px solid #333", borderRadius: 999, padding: "6px 10px" }}>
      <span style={{ opacity: 0.7, marginRight: 6 }}>{label}:</span>
      <span style={{ fontWeight: 700 }}>{String(value ?? "n/a")}</span>
    </div>
  );
}

function Th({ children }: { children: any }) {
  return (
    <th style={{ textAlign: "left", padding: 10, fontSize: 12, letterSpacing: 0.5, opacity: 0.8 }}>
      {children}
    </th>
  );
}

function Td({ children, colSpan }: { children: any; colSpan?: number }) {
  return (
    <td style={{ padding: 10 }} colSpan={colSpan}>
      {children}
    </td>
  );
}
