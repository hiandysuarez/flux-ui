import { useEffect, useState } from "react";
import { fetchStatus, fetchLatestCycle } from "../lib/api";

export default function Home() {
  const [status, setStatus] = useState(null);
  const [cycle, setCycle] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const s = await fetchStatus();
        setStatus(s);

        const latest = await fetchLatestCycle();
        setCycle(latest?.cycle ?? null);
      } catch (e) {
        setErr(String(e?.message || e));
      }
    }
    load();
  }, []);

  const rows = Array.isArray(cycle?.rows) ? cycle.rows : [];

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Flux</h1>

      <div style={{ marginTop: 12, opacity: 0.8 }}>
        API: {process.env.NEXT_PUBLIC_API_BASE || "(missing NEXT_PUBLIC_API_BASE)"}
      </div>

      {err ? (
        <pre style={{ marginTop: 12, color: "crimson" }}>{err}</pre>
      ) : null}

      <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Badge label="MODE" value={status?.mode} />
        <Badge label="KILL" value={status?.kill_switch} />
        <Badge label="LAST_CYCLE" value={status?.last_cycle_ts || "n/a"} />
        <Badge label="HAS_POSITIONS" value={status?.has_positions ? "yes" : "no"} />
      </div>

      <div style={{ marginTop: 18, border: "1px solid #333", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#111", color: "#fff" }}>
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
              <tr><Td colSpan={6}>No rows yet.</Td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.symbol} style={{ borderTop: "1px solid #222" }}>
                  <Td>{r.symbol}</Td>
                  <Td>{r.decision ?? "—"}</Td>
                  <Td>{typeof r.confidence === "number" ? r.confidence.toFixed(2) : "—"}</Td>
                  <Td>{r.hold_reason ?? "—"}</Td>
                  <Td>{r.last_price ?? "—"}</Td>
                  <Td>{(r.position_side ?? "flat")} {typeof r.position_qty === "number" ? `(${r.position_qty})` : ""}</Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 14, opacity: 0.7 }}>
        If you see rows, Flux is wired to Render + Supabase. 🎛️
      </p>
    </main>
  );
}

function Badge({ label, value }) {
  return (
    <div style={{ border: "1px solid #333", borderRadius: 999, padding: "6px 10px" }}>
      <span style={{ opacity: 0.7, marginRight: 6 }}>{label}:</span>
      <span style={{ fontWeight: 700 }}>{String(value ?? "n/a")}</span>
    </div>
  );
}

function Th({ children }) {
  return <th style={{ textAlign: "left", padding: 10, fontSize: 12, opacity: 0.8 }}>{children}</th>;
}
function Td({ children, colSpan }) {
  return <td style={{ padding: 10 }} colSpan={colSpan}>{children}</td>;
}

