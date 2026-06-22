import OpenAI from "openai";
import type { ContactStatus, ContactType, ProjectType } from "@/lib/types";
import { safeJsonParse } from "@/lib/utils/safe-json";
import { nestoSystemPrompt, prospectMessageSchemaExample } from "./structured-output-schemas";

export type ProspectAnalysis = {
  intent: string;
  contact_type: ContactType;
  project_type: ProjectType | "";
  extracted_fields: Record<string, unknown>;
  missing_fields: string[];
  seriousness_score: number;
  recommended_status: ContactStatus | "";
  requires_validation: boolean;
  suggested_reply: string;
  next_action: string;
};

const importantFieldsByProject: Record<string, string[]> = {
  tenant: [
    "desired_property_type",
    "desired_city",
    "max_budget",
    "number_of_people",
    "professional_status",
    "income",
    "pets",
    "move_in_date",
    "documents_ready"
  ],
  buyer: ["max_budget", "apport", "financing_approved", "desired_property_type", "desired_city", "purchase_timeline", "purchase_goal"],
  seller: ["desired_property_type", "desired_city", "surface", "expected_price", "project_type", "urgency", "appointment_availability"],
  landlord: ["desired_property_type", "desired_city", "surface", "expected_price", "project_type", "urgency", "appointment_availability"]
};

export async function analyzeProspectMessageWithAI(rawMessage: string, agencyContext = ""): Promise<ProspectAnalysis> {
  if (!process.env.OPENAI_API_KEY) {
    return analyzeProspectMessageHeuristically(rawMessage);
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
          content: `${nestoSystemPrompt}\n\nTu analyses un message prospect immobilier. Reponds en JSON strict selon ce schema : ${JSON.stringify(
            prospectMessageSchemaExample
          )}`
        },
        {
          role: "user",
          content: `Contexte agence: ${agencyContext}\n\nMessage prospect:\n${rawMessage}`
        }
      ]
    });

    const parsed = safeJsonParse<Partial<ProspectAnalysis>>(
      completion.choices[0]?.message.content,
      analyzeProspectMessageHeuristically(rawMessage),
      "OpenAI prospect analyzer"
    );
    return normalizeAnalysis(parsed);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[analyzeProspectMessageWithAI] Falling back to local analyzer.", error);
    }
    return analyzeProspectMessageHeuristically(rawMessage);
  }
}

export function analyzeProspectMessageHeuristically(rawMessage: string): ProspectAnalysis {
  const lower = rawMessage.toLowerCase().replace(/’/g, "'");
  const contactType: ContactType = lower.includes("acheter") || lower.includes("achat")
    ? "buyer"
    : lower.includes("vendre") || lower.includes("estimation")
      ? "seller"
      : lower.includes("proprietaire") || lower.includes("mettre en location")
        ? "landlord"
        : lower.includes("louer") || lower.includes("location") || (lower.includes("cherche") && /(t|f)\d|studio|maison/.test(lower))
          ? "tenant"
          : "unknown";

  const projectType: ProjectType | "" =
    contactType === "buyer"
      ? "purchase_search"
      : contactType === "seller"
        ? "sale_project"
        : contactType === "landlord"
          ? "rental_project"
          : contactType === "tenant"
            ? "rental_search"
            : "";

  const extracted_fields: Record<string, unknown> = {};
  const priceMatch = rawMessage.match(/(\d[\d\s.]{3,})\s*(?:f|xpf|eur|€)/i);
  const incomeMatch = rawMessage.match(/revenus?.*?(\d[\d\s.]{3,})/i);
  const peopleMatch = rawMessage.match(/(\d+)\s*(?:personnes?|adultes?|enfants?)/i) ?? rawMessage.match(/nous sommes\s+(\d+)/i);
  const city = ["Punaauia", "Papeete", "Faaa", "Arue", "Pirae", "Moorea"].find((candidate) =>
    lower.includes(candidate.toLowerCase())
  );

  if (priceMatch) extracted_fields.max_budget = Number(priceMatch[1].replace(/[^\d]/g, ""));
  if (incomeMatch) extracted_fields.income = Number(incomeMatch[1].replace(/[^\d]/g, ""));
  if (peopleMatch) extracted_fields.number_of_people = Number(peopleMatch[1]);
  if (city) extracted_fields.desired_city = city;
  if (lower.includes("studio")) extracted_fields.desired_property_type = "studio";
  if (lower.includes("t2") || lower.includes("f2")) extracted_fields.desired_property_type = "t2";
  if (lower.includes("t3") || lower.includes("f3")) extracted_fields.desired_property_type = "t3";
  if (lower.includes("maison")) extracted_fields.desired_property_type = "house";
  if (lower.includes("cdi")) extracted_fields.professional_status = "CDI";
  if (lower.includes("chien") || lower.includes("chat") || lower.includes("animal") || lower.includes("animaux")) extracted_fields.pets = "yes";
  if (lower.includes("pas d'animal") || lower.includes("pas d'animaux") || lower.includes("sans animal")) extracted_fields.pets = "no";
  if (lower.includes("juillet")) extracted_fields.move_in_date = "juillet";
  if (lower.includes("dossier complet")) extracted_fields.documents_ready = "yes";
  if (lower.includes("financement valide") || lower.includes("pret accepte")) extracted_fields.financing_approved = "yes";

  const expectedFields = importantFieldsByProject[contactType] ?? [];
  const missing_fields = expectedFields.filter((field) => extracted_fields[field] === undefined);
  const score = Math.max(20, Math.min(96, 100 - missing_fields.length * 8 + (priceMatch ? 8 : 0)));

  return {
    intent: contactType === "unknown" ? "unknown_request" : "property_project",
    contact_type: contactType,
    project_type: projectType,
    extracted_fields,
    missing_fields,
    seriousness_score: score,
    recommended_status: missing_fields.length > 3 ? "incomplete" : score >= 80 ? "hot" : "qualified",
    requires_validation: false,
    suggested_reply: buildMissingInfoReply(contactType, missing_fields),
    next_action: missing_fields.length ? "Completer la fiche prospect" : "Lancer le matching avec les biens disponibles"
  };
}

function buildMissingInfoReply(contactType: ContactType, missingFields: string[]) {
  if (!missingFields.length) {
    return "Merci pour ces informations. Je regarde les biens disponibles et je reviens vers vous rapidement.";
  }

  const labels: Record<string, string> = {
    desired_property_type: "le type de bien recherche",
    desired_city: "la ville ou le quartier souhaite",
    max_budget: "votre budget maximum",
    number_of_people: "le nombre de personnes",
    professional_status: "votre situation professionnelle",
    income: "vos revenus mensuels",
    pets: "si vous avez un animal",
    move_in_date: "la date d'entree souhaitee",
    documents_ready: "si votre dossier est deja pret",
    apport: "votre apport",
    financing_approved: "si votre financement est valide",
    purchase_timeline: "votre delai d'achat",
    purchase_goal: "residence principale ou investissement",
    surface: "la surface du bien",
    expected_price: "le prix souhaite",
    project_type: "vente ou location",
    urgency: "votre niveau d'urgence",
    appointment_availability: "vos disponibilites pour un rendez-vous"
  };

  const questions = missingFields.map((field) => labels[field] ?? field).join(", ");
  const opener = contactType === "tenant" ? "Pour mieux cibler votre recherche" : "Pour avancer efficacement";
  return `${opener}, pouvez-vous me confirmer uniquement ces elements : ${questions} ?`;
}

function normalizeAnalysis(value: Partial<ProspectAnalysis>): ProspectAnalysis {
  return {
    intent: value.intent ?? "",
    contact_type: value.contact_type ?? "unknown",
    project_type: value.project_type ?? "",
    extracted_fields: value.extracted_fields ?? {},
    missing_fields: value.missing_fields ?? [],
    seriousness_score: Math.max(0, Math.min(100, Number(value.seriousness_score ?? 0))),
    recommended_status: value.recommended_status ?? "",
    requires_validation: Boolean(value.requires_validation ?? false),
    suggested_reply: value.suggested_reply ?? "",
    next_action: value.next_action ?? ""
  };
}
