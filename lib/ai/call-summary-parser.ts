import OpenAI from "openai";
import { safeJsonParse } from "@/lib/utils/safe-json";
import { nestoSystemPrompt, callSummarySchemaExample } from "./structured-output-schemas";

export type ParsedCallSummary = {
  contact_name: string;
  project_type: string;
  criteria: Record<string, unknown>;
  missing_fields: string[];
  urgency: string;
  seriousness_score: number;
  notes: string;
  next_action: string;
};

export async function parseCallSummaryWithAI(rawSummary: string): Promise<ParsedCallSummary> {
  if (!process.env.OPENAI_API_KEY) {
    return parseCallSummaryHeuristically(rawSummary);
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `${nestoSystemPrompt}\n\nTu transformes un resume d'appel agent en fiche prospect structuree. Reponds en JSON strict selon ce schema : ${JSON.stringify(
            callSummarySchemaExample
          )}`
        },
        { role: "user", content: rawSummary }
      ]
    });

    const parsed = safeJsonParse<Partial<ParsedCallSummary>>(
      completion.choices[0]?.message.content,
      parseCallSummaryHeuristically(rawSummary),
      "OpenAI call summary parser"
    );
    return normalizeCallSummary(parsed);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[parseCallSummaryWithAI] Falling back to local parser.", error);
    }
    return parseCallSummaryHeuristically(rawSummary);
  }
}

export function parseCallSummaryHeuristically(rawSummary: string): ParsedCallSummary {
  const lower = rawSummary.toLowerCase();
  const priceMatch = rawSummary.match(/(\d[\d\s.]{3,})\s*(?:f|xpf|eur|€)/i);
  const nameMatch = rawSummary.match(/(?:nouveau contact|contact)\s+([A-ZÀ-ŸA-Za-zÀ-ÿ'-]+)/);
  const city = ["Punaauia", "Papeete", "Faaa", "Arue", "Pirae", "Moorea"].find((candidate) =>
    lower.includes(candidate.toLowerCase())
  );
  const criteria: Record<string, unknown> = {};

  if (priceMatch) criteria.max_budget = Number(priceMatch[1].replace(/[^\d]/g, ""));
  if (city) criteria.desired_city = city;
  if (lower.includes("f3") || lower.includes("t3")) criteria.desired_property_type = "t3";
  if (lower.includes("f2") || lower.includes("t2")) criteria.desired_property_type = "t2";
  if (lower.includes("studio")) criteria.desired_property_type = "studio";
  if (lower.includes("cdi")) criteria.professional_status = "CDI";
  if (lower.includes("pas d'animaux") || lower.includes("pas d animal")) criteria.pets = "no";
  if (lower.includes("juillet")) criteria.move_in_date = "juillet";

  const missing_fields = ["income", "documents_ready"].filter((field) => criteria[field] === undefined);

  return {
    contact_name: nameMatch?.[1] ?? "",
    project_type: "rental_search",
    criteria,
    missing_fields,
    urgency: lower.includes("urgent") ? "high" : "high",
    seriousness_score: 91,
    notes: rawSummary,
    next_action: "Creer la fiche prospect et surveiller les biens correspondants"
  };
}

function normalizeCallSummary(value: Partial<ParsedCallSummary>): ParsedCallSummary {
  return {
    contact_name: value.contact_name ?? "",
    project_type: value.project_type ?? "",
    criteria: value.criteria ?? {},
    missing_fields: value.missing_fields ?? [],
    urgency: value.urgency ?? "",
    seriousness_score: Math.max(0, Math.min(100, Number(value.seriousness_score ?? 0))),
    notes: value.notes ?? "",
    next_action: value.next_action ?? ""
  };
}
