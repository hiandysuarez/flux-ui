import Layout from "../components/Layout";

export default function Settings() {
  return (
    <Layout active="settings">
      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Settings</h1>
      <p style={{ opacity: 0.7 }}>Next: kill switch + thresholds.</p>
    </Layout>
  );
}
