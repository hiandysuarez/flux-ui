// pages/index.js
import { useEffect, useMemo, useState } from "react";
import { fetchStatus, fetchLatestCycle } from "../lib/api";
import Layout from "../components/Layout";

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
  const ts = cycle?.ts ?? null;
  const unrealized = cycle?.unrealized ?? null;

  // Step 3: "Data health" quick metrics (computed from cycle rows)
  const { candlesOkPct, mqPresentPct, noPrice, mqNull, total } = useMemo(() => {
    const total = rows.length || 0;
    const noPrice = rows.filter((r) => r?.last_price == null).length;
    const mqNull = rows.filter((r) => r?.mq_ok == null).length;

    const candlesOkPct = total ? Math.round(((total - noPrice) / total) * 100) : 0;
    const mqPresentPct = total ? Math.round(((total - mqNull) / total) * 100) : 0;

    return { candlesOkPct, mqPresentPct, noPrice, mqNull, total };
  }, [rows]);

  return (
    <Layout active="dashboard">
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>Dashboard</h1>
          <div style={{ marginTop: 8, opacity: 0.75, fontSize: 13 }}>
            API: {process.env.NEXT_PUBLIC_API_BASE || "(missing NEXT_PUBLIC_API_BASE)"}
          </div>
        </div>
      </div>

      {err ? (
        <pre style={{ marginTop: 12, color: "crimson", whiteSpace: "pre-wrap" }}>{err}</pre>
      ) : null}

      {/* Step 2: top badges */}
      <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Badge label="MODE" value={status?.mode} />
        <Badge label="KILL" value={status?.kill_switch} />
        <Badge label="LAST_CYCLE" value={status?.last_cycle_ts || "n/a"} />
        <Badge label="HAS_POSITIONS" value={status?.has_positions ? "yes" : "no"} />
      </div>

      {/* Step 3: "Today" quick cards (data health + latest cycle info) */}
      <div style={{ marginTop: 14, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Card title="Latest cycle" value={ts || "none"} />
        <Card title="Unrealized" value={unrealized != null ? String(unrealized) : "n/a"} />
        <Card title="Candles OK" value={`${candlesOkPct}%`} subtitle={total ? `${total - noPrice}/${total}` : "0/0"} />
        <Card title="MQ Present" value={`${mqPresentPct}%`} subtitle={total ? `${total - mqNull}/${total}` : "0/0"} />
      </div>

      {/* Live table */}
      <div style={{ marginTop: 18, border: "1px solid #222", borderRadius: 14, overflow: "hidden" }}>
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
              <tr>
                <Td colSpan={6}>No rows yet.</Td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.symbol} style={{ borderTop: "1px solid #1f1f1f" }}>
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
        If you see rows, Flux is wired to Render + Supabase. 🎛️
      </p>
    </Layout>
  );
}

function Badge({ label, value }) {
  return (
    <div style={{ border: "1px solid #222", borderRadius: 999, padding: "6px 10px", background: "#0f0f0f" }}>
      <span style={{ opacity: 0.7, marginRight: 6 }}>{label}:</span>
      <span style={{ fontWeight: 800 }}>{String(value ?? "n/a")}</span>
    </div>
  );
}

function Card({ title, value, subtitle }) {
  return (
    <div style={{ border: "1px solid #222", borderRadius: 16, padding: 14, minWidth: 190, background: "#0f0f0f" }}>
      <div style={{ opacity: 0.7, fontSize: 12 }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 900, marginTop: 6, lineHeight: 1.15 }}>{value}</div>
      {subtitle ? <div style={{ marginTop: 6, opacity: 0.65, fontSize: 12 }}>{subtitle}</div> : null}
    </div>
  );
}

function Th({ children }) {
  return <th style={{ textAlign: "left", padding: 10, fontSize: 12, opacity: 0.85 }}>{children}</th>;
}
function Td({ children, colSpan }) {
  return (
    <td style={{ padding: 10, opacity: 0.95 }} colSpan={colSpan}>
      {children}
    </td>
  );
}
