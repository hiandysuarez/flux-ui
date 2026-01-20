export default function Layout({ children, active = "dashboard" }) {
  const linkStyle = (on) => ({
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid #333",
    background: on ? "#111" : "transparent",
    color: "white",
    textDecoration: "none",
    fontWeight: 700,
    opacity: on ? 1 : 0.75,
  });

  return (
    <div style={{ minHeight: "100vh", background: "#0b0b0b", color: "white" }}>
      <header style={{ padding: 18, borderBottom: "1px solid #222", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontWeight: 900, fontSize: 18 }}>Flux</div>

        <nav style={{ display: "flex", gap: 10 }}>
          <a href="/" style={linkStyle(active === "dashboard")}>Dashboard</a>
          <a href="/settings" style={linkStyle(active === "settings")}>Settings</a>
        </nav>

        <div style={{ marginLeft: "auto", opacity: 0.7, fontSize: 12 }}>
          Operator UI (v0)
        </div>
      </header>

      <div style={{ padding: 18 }}>{children}</div>
    </div>
  );
}
