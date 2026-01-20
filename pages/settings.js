import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { fetchSettings, saveSettings } from "../lib/api";

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchSettings();
        setSettings(res?.settings ?? null);
      } catch (e) {
        setErr(String(e?.message || e));
      }
    }
    load();
  }, []);

  const kill = settings?.kill_switch ?? "off";
  const conf = settings?.thresholds?.conf_threshold ?? 0.5;
  const tradesPer = settings?.limits?.trades_per_ticker_per_day ?? 1;
  const maxPos = settings?.limits?.max_open_positions ?? 5;

  async function onSave() {
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const payload = {
        ...settings,
        kill_switch: kill,
        thresholds: { ...(settings?.thresholds || {}), conf_threshold: Number(conf) },
        limits: {
          ...(settings?.limits || {}),
          trades_per_ticker_per_day: Number(tradesPer),
          max_open_positions: Number(maxPos),
        },
      };

      const res = await saveSettings(payload);
      setSettings(res?.settings ?? payload);
      setMsg("Saved ✅");
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout active="settings">
      <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>Settings</h1>
      <div style={{ marginTop: 10, opacity: 0.75, fontSize: 13 }}>
        Changes save to Supabase and are read by the UI. (Bot wiring comes next.)
      </div>

      {msg ? <div style={{ marginTop: 12, color: "lime" }}>{msg}</div> : null}
      {err ? <pre style={{ marginTop: 12, color: "crimson", whiteSpace: "pre-wrap" }}>{err}</pre> : null}

      {!settings ? (
        <div style={{ marginTop: 18, opacity: 0.8 }}>Loading settings…</div>
      ) : (
        <div style={{ marginTop: 18, display: "grid", gap: 14, maxWidth: 720 }}>
          <Card title="Safety">
            <Row label="Kill switch">
              <select
                value={kill}
                onChange={(e) => setSettings((s) => ({ ...s, kill_switch: e.target.value }))}
                style={inputStyle}
              >
                <option value="off">OFF</option>
                <option value="on">ON</option>
              </select>
              <div style={{ opacity: 0.7, fontSize: 12, marginTop: 6 }}>
                When ON, entries should be blocked (we’ll wire bot behavior next).
              </div>
            </Row>
          </Card>

          <Card title="Entry rules">
            <Row label="Confidence threshold">
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={conf}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    thresholds: { ...(s?.thresholds || {}), conf_threshold: e.target.value },
                  }))
                }
                style={inputStyle}
              />
              <div style={{ opacity: 0.7, fontSize: 12, marginTop: 6 }}>
                0.00–1.00. If decision confidence is below this, bot should HOLD.
              </div>
            </Row>
          </Card>

          <Card title="Execution limits">
            <Row label="Trades per ticker per day">
              <input
                type="number"
                min="0"
                step="1"
                value={tradesPer}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    limits: { ...(s?.limits || {}), trades_per_ticker_per_day: e.target.value },
                  }))
                }
                style={inputStyle}
              />
            </Row>

            <Row label="Max open positions">
              <input
                type="number"
                min="0"
                step="1"
                value={maxPos}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    limits: { ...(s?.limits || {}), max_open_positions: e.target.value },
                  }))
                }
                style={inputStyle}
              />
            </Row>
          </Card>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onSave} disabled={saving} style={buttonStyle}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ border: "1px solid #222", borderRadius: 16, padding: 14, background: "#0f0f0f" }}>
      <div style={{ fontWeight: 900, marginBottom: 10 }}>{title}</div>
      <div style={{ display: "grid", gap: 14 }}>{children}</div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div>
      <div style={{ opacity: 0.8, fontSize: 12, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #222",
  background: "#0b0b0b",
  color: "#fff",
  outline: "none",
};

const buttonStyle = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #222",
  background: "#111",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};
