// pages/index.js
import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchStatus,
  fetchLatestCycle,
  runDecisionCycle,
  forceExitAll,
} from "../lib/api";
import Layout from "../components/Layout";

export default function Home() {
  const [status, setStatus] = useState(null);
  const [cycle, setCycle] = useState(null);
  const [err, setErr] = useState(null);

  // Step A: operator action state
  const [acting, setActing] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);
  const [actionErr, setActionErr] = useState(null);

  // ✅ Step B: auto-refresh controls
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshSec, setRefreshSec] = useState(10);
  const [lastRefresh, setLastRefresh] = useState(null);

  // ✅ Step B: change highlighting
  const prevRowsRef = useRef(new Map()); // symbol -> last snapshot

  async function load({ silent = false } = {}) {
    try {
      if (!silent) setErr(null);

      const s = await fetchStatus();
      setStatus(s);

      const latest = await fetchLatestCycle();
      setCycle(latest?.cycle ?? null);

      setLastRefresh(new Date().toISOString());
    } catch (e) {
      setErr(String(e?.message || e));
    }
  }

  // Initial load
  useEffect(() => {
    load();
  }, []);

  // ✅ Step B: auto refresh timer (pauses when tab hidden)
  useEffect(() => {
    if (!autoRefresh) return;

    const tick = async () => {
      // Don't hammer API when tab is hidden
      if (typeof document !== "undefined" && document.hidden) return;
      await load({ silent: true });
    };

    const ms = Math.max(3, Number(refreshSec || 10)) * 1000;
    const id = setInterval(tick, ms);
    return () => clearInterval(id);
  }, [autoRefresh, refreshSec]);

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

  // ✅ Step B: compute changed symbols (based on last snapshot)
  const changedSymbols = useMemo(() => {
    const changed = new Set();
    const prevMap = prevRowsRef.current;

    for (const r of rows) {
      const sym = r?.symbol;
      if (!sym) continue;

      const prev = prevMap.get(sym);
      if (!prev) continue;

      // Compare only the stuff that matters for “ops”
      const nowSig = rowSignature(r);
      const prevSig = rowSignature(prev);
      if (nowSig !== prevSig) changed.add(sym);
    }

    // Update snapshot for next render
    const nextMap = new Map();
    for (const r of rows) {
      if (r?.symbol) nextMap.set(r.symbol, r);
    }
    prevRowsRef.current = nextMap;

    return changed;
  }, [rows, ts]); // ts changes every cycle, good trigger

  async function onRunCycle(force = false) {
    setActing(true);
    setActionMsg(null);
    setActionErr(null);
    try {
      await runDecisionCycle(force);
      setActionMsg(force ? "Forced cycle ran ✅" : "Cycle ran ✅");
      await load();
    } catch (e) {
      setActionErr(String(e?.message || e));
    } finally {
      setActing(false);
    }
  }

  async function onForceExitAll() {
    const ok = confirm("Force exit ALL positions right now?");
    if (!ok) return;

    setActing(true);
    setActionMsg(null);
    setActionErr(null);
    try {
      await forceExitAll();
      setActionMsg("Force exit requested ✅");
      await load();
    } catch (e) {
      setActionErr(String(e?.message || e));
    } finally {
      setActing(false);
    }
  }

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
        <Badge label="LAST_CYCLE" value=fmtLocal(status?.last_cycle_ts) />
        <Badge label="HAS_POSITIONS" value={status?.has_positions ? "yes" : "no"} />
      </div>

      {/* Step A: Operator controls */}
      <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button
          onClick={() => onRunCycle(false)}
          disabled={acting}
          style={buttonStyle}
          title="Run a normal decision cycle"
        >
          {acting ? "Working…" : "Run Cycle"}
        </button>

        <button
          onClick={() => onRunCycle(true)}
          disabled={acting}
          style={buttonStyle}
          title="Force cycle (bypass windows)"
        >
          {acting ? "Working…" : "Force Cycle"}
        </button>

        <button
          onClick={onForceExitAll}
          disabled={acting}
          style={dangerButtonStyle}
          title="Force exit all positions"
        >
          {acting ? "Working…" : "Force Exit All"}
        </button>

        <button
          onClick={() => load()}
          disabled={acting}
          style={ghostButtonStyle}
          title="Refresh dashboard data"
        >
          Refresh
        </button>
      </div>

      {/* ✅ Step B: Auto-refresh controls */}
      <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={chipStyle}>
          <span style={{ opacity: 0.7, marginRight: 8 }}>Auto-refresh</span>
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            style={autoRefresh ? toggleOnStyle : toggleOffStyle}
            title="Pause/resume auto-refresh"
          >
            {autoRefresh ? "ON" : "OFF"}
          </button>
        </div>

        <div style={chipStyle}>
          <span style={{ opacity: 0.7, marginRight: 8 }}>Every</span>
          <input
            type="number"
            min="3"
            step="1"
            value={refreshSec}
            onChange={(e) => setRefreshSec(Number(e.target.value || 10))}
            style={{ ...smallInputStyle, width: 80 }}
          />
          <span style={{ opacity: 0.7, marginLeft: 8 }}>sec</span>
        </div>

        <div style={{ opacity: 0.7, fontSize: 12 }}>
          Last refresh: {lastRefresh ? new Date(lastRefresh).toLocaleTimeString() : "—"}
        </div>
      </div>

      {actionMsg ? (
        <div style={{ marginTop: 10, color: "lime", fontWeight: 700 }}>{actionMsg}</div>
      ) : null}

      {actionErr ? (
        <pre style={{ marginTop: 10, color: "crimson", whiteSpace: "pre-wrap" }}>{actionErr}</pre>
      ) : null}

      {/* Step 3: "Today" quick cards */}
      <div style={{ marginTop: 14, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Card title="Latest cycle" value={fmtLocal(ts)} />
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
              rows.map((r) => {
                const isChanged = changedSymbols.has(r.symbol);
                const isAction = (r.decision === "BUY" || r.decision === "SELL");
                const rowStyle = {
                  borderTop: "1px solid #1f1f1f",
                  background: isChanged ? "rgba(255,255,255,0.06)" : "transparent",
                  transition: "background 300ms ease",
                };

                const decisionStyle = {
                  fontWeight: isAction ? 900 : 700,
                  opacity: r.decision === "HOLD" ? 0.75 : 1,
                };

                return (
                  <tr key={r.symbol} style={rowStyle} title={isChanged ? "Changed since last refresh" : ""}>
                    <Td>
                      {r.symbol}
                      {isChanged ? <span style={{ marginLeft: 8, opacity: 0.7, fontSize: 12 }}>•</span> : null}
                    </Td>
                    <Td style={decisionStyle}>{r.decision ?? "—"}</Td>
                    <Td>{typeof r.confidence === "number" ? r.confidence.toFixed(2) : "—"}</Td>
                    <Td>{r.hold_reason ?? "—"}</Td>
                    <Td>{r.last_price ?? "—"}</Td>
                    <Td>
                      {(r.position_side ?? "flat")}{" "}
                      {typeof r.position_qty === "number" ? `(${r.position_qty})` : ""}
                    </Td>
                  </tr>
                );
              })
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

function rowSignature(r) {
  // Only include “ops-critical” fields; keep it stable and cheap
  const lp = r?.last_price ?? null;
  const dec = r?.decision ?? null;
  const conf = typeof r?.confidence === "number" ? Number(r.confidence.toFixed(3)) : null;
  const hr = r?.hold_reason ?? null;
  const ps = r?.position_side ?? null;
  const pq = typeof r?.position_qty === "number" ? Number(r.position_qty.toFixed(6)) : null;
  const pa = typeof r?.position_avg === "number" ? Number(r.position_avg.toFixed(4)) : null;
  return JSON.stringify([lp, dec, conf, hr, ps, pq, pa]);
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

const buttonStyle = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #222",
  background: "#111",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const ghostButtonStyle = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #222",
  background: "transparent",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
  opacity: 0.9,
};

const dangerButtonStyle = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #3b0b0b",
  background: "#220808",
  color: "#ffb4b4",
  fontWeight: 900,
  cursor: "pointer",
};

const chipStyle = {
  border: "1px solid #222",
  borderRadius: 999,
  padding: "6px 10px",
  background: "#0f0f0f",
  display: "flex",
  alignItems: "center",
};

const toggleOnStyle = {
  border: "1px solid #1d3b1d",
  background: "#0f2010",
  color: "#b9ffbe",
  borderRadius: 999,
  padding: "4px 10px",
  fontWeight: 900,
  cursor: "pointer",
};

const toggleOffStyle = {
  border: "1px solid #3b1d1d",
  background: "#200f10",
  color: "#ffb9b9",
  borderRadius: 999,
  padding: "4px 10px",
  fontWeight: 900,
  cursor: "pointer",
};

const smallInputStyle = {
  padding: "6px 10px",
  borderRadius: 10,
  border: "1px solid #222",
  background: "#0b0b0b",
  color: "#fff",
  outline: "none",
};

function parseTs(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  const s = String(v);

  // If "YYYY-MM-DD HH:MM:SS+00" -> make it ISO-ish
  const normalized =
    s.includes("T") ? s : s.replace(" ", "T");

  const d = new Date(normalized);
  if (!isFinite(d.getTime())) return null;
  return d;
}

function fmtLocal(v) {
  const d = parseTs(v);
  return d ? d.toLocaleString() : "—";
}

function fmtTime(v) {
  const d = parseTs(v);
  return d ? d.toLocaleTimeString() : "—";
}

