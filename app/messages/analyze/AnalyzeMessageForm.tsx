"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import type { ProspectAnalysis } from "@/lib/ai/prospect-analyzer";

export function AnalyzeMessageForm() {
  const [rawMessage, setRawMessage] = useState(
    "Bonjour, je cherche une location T3 sur Punaauia, budget max 220 000 F. Nous sommes 3, je suis en CDI, revenus 520 000 F. Pas d'animaux."
  );
  const [result, setResult] = useState<ProspectAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    const response = await fetch("/api/messages/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawMessage })
    });
    setResult(await response.json());
    setLoading(false);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-4">
        <label className="block text-sm font-bold">
          Message prospect brut
          <textarea className="mt-2 min-h-72 w-full rounded-md border border-line p-3 focus-ring" value={rawMessage} onChange={(event) => setRawMessage(event.target.value)} />
        </label>
        <Button type="button" onClick={handleSubmit}>
          {loading ? "Analyse..." : "Tester l'analyse"}
        </Button>
      </div>
      <div className="space-y-4">
        <pre className="min-h-72 overflow-auto rounded-md bg-ink p-4 text-sm leading-6 text-white">
          {result ? JSON.stringify(result, null, 2) : "L'analyse IA apparaitra ici."}
        </pre>
        {result?.suggested_reply ? (
          <div className="rounded-md border border-line bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-normal text-gray-500">Reponse suggeree</p>
            <p className="mt-2 leading-7">{result.suggested_reply}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
