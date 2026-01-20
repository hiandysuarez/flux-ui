import { apiGet } from "@/lib/api";

export default async function Home() {
  const status = await apiGet<any>("/state");

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-4">Flux — Live Status</h1>

      <pre className="bg-black text-green-400 p-4 rounded">
        {JSON.stringify(status, null, 2)}
      </pre>
    </main>
  );
}
