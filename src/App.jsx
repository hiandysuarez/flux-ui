import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_BASE;

export default function App() {
  const [status, setStatus] = useState(null);
  const [cycle, setCycle] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/status`)
      .then(r => r.json())
      .then(setStatus)
      .catch(console.error);

    fetch(`${API}/api/cycle/latest`)
      .then(r => r.json())
      .then(r => setCycle(r.cycle))
      .catch(console.error);
  }, []);

  const rows = cycle?.rows || [];

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Flux</h1>

      <pre>Status: {JSON.stringify(status, null, 2)}</pre>

      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Decision</th>
            <th>Conf</th>
            <th>Hold</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.symbol}>
              <td>{r.symbol}</td>
              <td>{r.decision}</td>
              <td>{r.confidence}</td>
              <td>{r.hold_reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
