"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import type { ParsedProperty } from "@/lib/ai/property-parser";

export function ImportPropertyForm() {
  const [sourceUrl, setSourceUrl] = useState("https://mana-immo.example/locations/t2-arue");
  const [rawContent, setRawContent] = useState("T2 meuble a Arue, loyer 165 000 F, 45 m2, une chambre, disponible rapidement.");
  const [result, setResult] = useState<ParsedProperty | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    const response = await fetch("/api/properties/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawContent, sourceUrl })
    });
    setResult(await response.json());
    setLoading(false);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-4">
        <label className="block text-sm font-bold">
          URL annonce ou site agence
          <input className="mt-2 w-full rounded-md border border-line px-3 py-2 focus-ring" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} />
        </label>
        <label className="block text-sm font-bold">
          Contenu brut recupere
          <textarea className="mt-2 min-h-48 w-full rounded-md border border-line p-3 focus-ring" value={rawContent} onChange={(event) => setRawContent(event.target.value)} />
        </label>
        <Button type="button" onClick={handleSubmit}>
          {loading ? "Analyse..." : "Extraire avec l'IA"}
        </Button>
      </div>
      <pre className="min-h-96 overflow-auto rounded-md bg-ink p-4 text-sm leading-6 text-white">
        {result ? JSON.stringify(result, null, 2) : "Le brouillon de bien apparaitra ici."}
      </pre>
    </div>
  );
}
