import { interpretAgentCommand } from "@/lib/agent/command-interpreter";
import { generateAgentNotificationWithAI } from "@/lib/ai/agent-notification-generator";
import { parseCallSummaryHeuristically } from "@/lib/ai/call-summary-parser";
import { analyzeProspectMessageHeuristically } from "@/lib/ai/prospect-analyzer";
import { calculateMatch } from "@/lib/matching/calculate-match";
import { demoAgency, demoUsers } from "@/lib/demo-data";
import type { AiActionProposal, Contact, Match, Message, Property } from "@/lib/types";

export type SimulatorScenario =
  | "prospect_message"
  | "call_summary"
  | "new_property_personal"
  | "new_property_colleague"
  | "agent_command_validate"
  | "agent_command_details"
  | "complete_flow"
  | "new_property"
  | "agent_command";

export type SimulatorChatMessage = {
  from: string;
  text: string;
  channel?: "whatsapp_prospect" | "whatsapp_agent" | "system";
};

export type SimulatorResponse = {
  scenario: SimulatorScenario;
  prospectConversation: SimulatorChatMessage[];
  agentConversation: SimulatorChatMessage[];
  result: {
    action: string;
    records: {
      contact?: Contact;
      property?: Property;
      match?: Match;
      ai_action?: AiActionProposal;
      messages?: Message[];
      followup_message?: string;
      interpreted_command?: ReturnType<typeof interpretAgentCommand>;
    };
    timeline: string[];
    details?: Record<string, unknown>;
  };
};

const currentUser = demoUsers[0];
const colleagueUser = demoUsers[1];

export const prospectMessage =
  "Bonjour, je cherche un F3 a Punaauia, budget 220 000 F, CDI, pas d'animaux, entree juillet.";

export const callSummary =
  "Nouveau contact Sarah : cherche F3 Punaauia, budget 220 000 F, CDI, pas d'animaux, entree juillet.";

export const personalPropertyText = "F3 Punaauia Taapuna, 210 000 F, disponible maintenant.";

export const colleaguePropertyText = "Marc vient d'ajouter un F3 a Punaauia Taapuna, 210 000 F, disponible maintenant.";

export function runWhatsAppSimulatorScenario(scenario: SimulatorScenario, rawCommand = "1"): SimulatorResponse {
  if (scenario === "new_property") return runPersonalPropertyScenario();
  if (scenario === "agent_command") return runAgentValidationScenario(rawCommand);

  switch (scenario) {
    case "prospect_message":
      return runProspectMessageScenario();
    case "call_summary":
      return runCallSummaryScenario();
    case "new_property_personal":
      return runPersonalPropertyScenario();
    case "new_property_colleague":
      return runColleaguePropertyScenario();
    case "agent_command_validate":
      return runAgentValidationScenario(rawCommand);
    case "agent_command_details":
      return runAgentDetailsScenario(rawCommand);
    case "complete_flow":
      return runCompleteFlowScenario();
    default:
      return runProspectMessageScenario();
  }
}

function runProspectMessageScenario(): SimulatorResponse {
  const analysis = analyzeProspectMessageHeuristically(prospectMessage);
  const contact = buildSarahContact({
    missing_fields: analysis.missing_fields,
    seriousness_score: analysis.seriousness_score,
    status: analysis.recommended_status || "hot"
  });
  const messages = [
    buildMessage("msg-prospect-1", "conversation-prospect-sarah", contact.id, "inbound", "prospect", prospectMessage, analysis),
    buildMessage(
      "msg-prospect-2",
      "conversation-prospect-sarah",
      contact.id,
      "outbound",
      "nesto",
      analysis.suggested_reply || "Merci, j'ai bien note votre demande. Je surveille les biens correspondants.",
      { automated: true, action: "request_missing_info" }
    )
  ];

  return {
    scenario: "prospect_message",
    prospectConversation: [
      { from: "Prospect", text: prospectMessage, channel: "whatsapp_prospect" },
      { from: "Clapy", text: messages[1].raw_content, channel: "whatsapp_prospect" }
    ],
    agentConversation: [
      {
        from: "Clapy",
        text: `Nouveau prospect cree depuis le WhatsApp professionnel : Sarah M. Score ${contact.seriousness_score}/100. Infos manquantes : ${contact.missing_fields.join(", ") || "aucune"}.`,
        channel: "whatsapp_agent"
      }
    ],
    result: {
      action: "Message prospect sauvegarde, fiche creee, informations manquantes detectees",
      records: { contact, messages },
      timeline: [
        "Message recu sur le WhatsApp professionnel",
        "Conversation prospect identifiee",
        "Fiche Sarah creee ou mise a jour",
        "Reponse simple preparee pour demander uniquement les informations manquantes"
      ],
      details: analysis
    }
  };
}

function runCallSummaryScenario(): SimulatorResponse {
  const parsed = parseCallSummaryHeuristically(callSummary);
  const contact = buildSarahContact({
    missing_fields: parsed.missing_fields,
    seriousness_score: parsed.seriousness_score,
    status: "hot"
  });

  return {
    scenario: "call_summary",
    prospectConversation: [],
    agentConversation: [
      { from: "Agent", text: callSummary, channel: "whatsapp_agent" },
      {
        from: "Clapy",
        text: "Fiche Sarah creee. Prospect chaud. Je surveille les F3 a Punaauia jusqu'a 220 000 F et je vous alerte des qu'un bien correspond.",
        channel: "whatsapp_agent"
      }
    ],
    result: {
      action: "Resume d'appel transforme en fiche prospect personnelle",
      records: { contact },
      timeline: [
        "Resume recu sur le WhatsApp interne de l'agent",
        "Sarah est associee a la base prospects personnelle de l'agent",
        "Criteres recherches memorises",
        "Surveillance des biens agence activee"
      ],
      details: parsed
    }
  };
}

function runPersonalPropertyScenario(): SimulatorResponse {
  const contact = buildSarahContact();
  const property = buildSimulatedProperty({ created_by_user_id: currentUser.id });
  const match = buildMatch(contact, property, "agency_property", false);
  const action = buildAction(contact, property, match, "notify_new_match");

  return {
    scenario: "new_property_personal",
    prospectConversation: [],
    agentConversation: [
      { from: "Site agence", text: personalPropertyText, channel: "system" },
      {
        from: "Clapy",
        text: `Nouveau bien detecte : F3 Punaauia Taapuna, 210 000 F. Sarah M. correspond a ${match.score} %. Voulez-vous lui envoyer une relance ? Repondez 1 pour valider, 2 pour details, 3 pour refuser.`,
        channel: "whatsapp_agent"
      }
    ],
    result: {
      action: "Bien personnel cree, matching lance, action de relance proposee",
      records: { contact, property, match, ai_action: action },
      timeline: [
        "Nouveau bien detecte depuis le site agence",
        "Bien structure en fiche propriete",
        "Matching lance avec les prospects personnels de l'agent",
        "Alerte envoyee au WhatsApp interne de l'agent"
      ]
    }
  };
}

function runColleaguePropertyScenario(): SimulatorResponse {
  const contact = buildSarahContact();
  const property = buildSimulatedProperty({
    created_by_user_id: colleagueUser.id,
    source_agent_name: "Marc",
    source_agent_id: colleagueUser.id
  });
  const match = buildMatch(contact, property, "colleague_property", true);
  const action = buildAction(contact, property, match, "collaboration_opportunity");
  const notification = generateAgentNotificationWithAI({
    contact,
    property,
    score: match.score,
    sourceAgentName: "Marc"
  });

  return {
    scenario: "new_property_colleague",
    prospectConversation: [],
    agentConversation: [
      { from: "Site agence", text: colleaguePropertyText, channel: "system" },
      { from: "Clapy", text: notification.agent_message, channel: "whatsapp_agent" }
    ],
    result: {
      action: "Bien agence cree, opportunite de collaboration detectee, action proposee",
      records: { contact, property, match, ai_action: action },
      timeline: [
        "Marc ajoute un bien sur le site de l'agence",
        "Clapy enregistre le bien comme bien agence",
        "Clapy compare ce bien avec les prospects personnels de Maeva",
        "Sarah M. ressort avec un score de compatibilite eleve",
        "Clapy alerte Maeva sur son WhatsApp interne"
      ],
      details: notification
    }
  };
}

function runAgentValidationScenario(rawCommand = "1"): SimulatorResponse {
  const base = runColleaguePropertyScenario();
  const contact = base.result.records.contact;
  const property = base.result.records.property;
  const match = base.result.records.match;
  const action = base.result.records.ai_action;

  if (!contact || !property || !match || !action) return base;

  const interpreted = interpretAgentCommand(rawCommand);
  const validated = ["validate", "send"].includes(interpreted.intent);
  const followup = buildSarahFollowupMessage(property);

  return {
    scenario: "agent_command_validate",
    prospectConversation: validated ? [{ from: "Clapy", text: followup, channel: "whatsapp_prospect" }] : [],
    agentConversation: [
      ...base.agentConversation,
      { from: "Agent", text: rawCommand, channel: "whatsapp_agent" },
      {
        from: "Clapy",
        text: validated
          ? "Action validee. Relance preparee en simulation et historique mis a jour."
          : `Commande comprise : ${interpreted.intent}. Aucune relance envoyee dans cette simulation.`,
        channel: "whatsapp_agent"
      }
    ],
    result: {
      action: validated ? "Action validee, relance generee, historique enregistre" : "Commande agent enregistree",
      records: {
        contact,
        property,
        match: { ...match, status: validated ? "validated" : match.status },
        ai_action: {
          ...action,
          status: validated ? "validated" : action.status,
          validated_at: validated ? new Date().toISOString() : action.validated_at
        },
        followup_message: validated ? followup : undefined,
        interpreted_command: interpreted
      },
      timeline: [
        ...base.result.timeline,
        "Commande recue sur le WhatsApp interne de l'agent",
        validated ? "Action marquee comme validee" : "Commande comprise sans execution",
        validated ? "Relance generee en simulation" : "Historique mis a jour"
      ]
    }
  };
}

function runAgentDetailsScenario(rawCommand = "details"): SimulatorResponse {
  const base = runColleaguePropertyScenario();
  const contact = base.result.records.contact;
  const property = base.result.records.property;
  const match = base.result.records.match;
  const interpreted = interpretAgentCommand(rawCommand);

  return {
    scenario: "agent_command_details",
    prospectConversation: [],
    agentConversation: [
      ...base.agentConversation,
      { from: "Agent", text: rawCommand, channel: "whatsapp_agent" },
      {
        from: "Clapy",
        text:
          "Details : Sarah M. cherche un F3 a Punaauia, budget maximum 220 000 F, CDI, pas d'animaux, entree juillet. Le bien de Marc est un F3 a Punaauia Taapuna a 210 000 F. Score 94 %. Point de vigilance : dossier a confirmer.",
        channel: "whatsapp_agent"
      }
    ],
    result: {
      action: "Details du match affiches a l'agent",
      records: { contact, property, match, interpreted_command: interpreted },
      timeline: [
        ...base.result.timeline,
        "L'agent demande les details",
        "Clapy affiche la fiche prospect, le bien, les raisons du match et le point de vigilance"
      ],
      details: {
        prospect: contact,
        property,
        reasons: match?.reasons,
        blocking_points: match?.blocking_points
      }
    }
  };
}

function runCompleteFlowScenario(): SimulatorResponse {
  const call = runCallSummaryScenario();
  const colleague = runColleaguePropertyScenario();
  const validation = runAgentValidationScenario("1");

  return {
    scenario: "complete_flow",
    prospectConversation: validation.prospectConversation,
    agentConversation: [...call.agentConversation, ...colleague.agentConversation, ...validation.agentConversation.slice(2)],
    result: {
      action: "Scenario complet execute : Sarah creee, bien Marc detecte, match valide, relance preparee",
      records: validation.result.records,
      timeline: [
        "1. L'agent envoie le resume d'appel Sarah",
        "2. Clapy cree la fiche Sarah dans la base personnelle de l'agent",
        "3. Marc ajoute un F3 a Punaauia sur le site agence",
        "4. Clapy detecte le bien de Marc comme bien de l'agence",
        "5. Clapy matche le bien avec Sarah",
        "6. Clapy alerte l'agent sur WhatsApp interne",
        "7. L'agent repond 1",
        "8. Clapy prepare la relance et enregistre l'action"
      ],
      details: {
        call_summary: call.result.details,
        collaboration: colleague.result.details,
        validation: validation.result.records.interpreted_command
      }
    }
  };
}

function buildSarahContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: "contact-sarah",
    agency_id: demoAgency.id,
    owner_user_id: currentUser.id,
    first_name: "Sarah",
    last_name: "M.",
    phone: "+689 87 12 34 56",
    email: "",
    source_channel: "whatsapp_prospect",
    contact_type: "tenant",
    project_type: "rental_search",
    min_budget: null,
    max_budget: 220000,
    desired_city: "Punaauia",
    desired_district: "Taapuna",
    desired_property_type: "t3",
    desired_bedrooms: 2,
    number_of_people: 3,
    professional_status: "CDI",
    income: null,
    pets: "no",
    move_in_date: "2026-07-01",
    financing_approved: "unknown",
    documents_ready: "unknown",
    urgency: "high",
    seriousness_score: 91,
    status: "hot",
    missing_fields: ["income", "documents_ready"],
    notes: "Recherche recue depuis WhatsApp. Entree souhaitee en juillet.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
}

function buildSimulatedProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: "property-f3-taapuna",
    agency_id: demoAgency.id,
    created_by_user_id: currentUser.id,
    source_agent_name: null,
    source_agent_id: null,
    visibility_scope: "agency",
    title: "F3 Punaauia Taapuna",
    listing_type: "rental",
    category: "t3",
    city: "Punaauia",
    district: "Taapuna",
    price: 210000,
    surface: 72,
    bedrooms: 2,
    available_from: "maintenant",
    pets_allowed: "no",
    status: "available",
    description: personalPropertyText,
    source_url: "https://mana-immo.example/locations/f3-taapuna",
    source_type: "agency_website",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
}

function buildMatch(
  contact: Contact,
  property: Property,
  match_context: Match["match_context"],
  collaboration_opportunity: boolean
): Match {
  const calculated = calculateMatch(contact, property);
  return {
    id: collaboration_opportunity ? "match-sarah-marc-f3" : "match-sarah-f3",
    agency_id: demoAgency.id,
    contact_id: contact.id,
    property_id: property.id,
    contact_owner_user_id: contact.owner_user_id,
    property_source_agent_name: property.source_agent_name ?? null,
    score: Math.max(calculated.score, 94),
    reasons: [
      "Budget compatible",
      "Ville compatible",
      "Type de bien compatible",
      "Nombre de chambres compatible",
      ...(collaboration_opportunity ? ["Bien ajoute par un autre agent de l'agence"] : [])
    ],
    blocking_points: contact.documents_ready !== "yes" ? ["Dossier a confirmer avant visite"] : [],
    collaboration_opportunity,
    match_context,
    status: "proposed",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function buildAction(
  contact: Contact,
  property: Property,
  match: Match,
  action_type: AiActionProposal["action_type"]
): AiActionProposal {
  return {
    id: action_type === "collaboration_opportunity" ? "action-collaboration-sarah-marc" : "action-followup-sarah",
    agency_id: demoAgency.id,
    contact_id: contact.id,
    property_id: property.id,
    match_id: match.id,
    user_id: currentUser.id,
    action_type,
    priority: "urgent",
    title: action_type === "collaboration_opportunity" ? "Opportunite Sarah x bien de Marc" : "Relancer Sarah",
    summary: `${contact.first_name} correspond au bien ${property.title} avec un score de ${match.score} %.`,
    proposed_message: buildSarahFollowupMessage(property),
    status: "pending",
    requires_validation: true,
    created_at: new Date().toISOString(),
    validated_at: null,
    executed_at: null
  };
}

function buildSarahFollowupMessage(property: Property) {
  return `Bonjour Sarah, je reviens vers vous car un F3 a Punaauia vient d'etre ajoute a l'agence. Il est a ${formatPrice(
    property.price
  )} F et semble correspondre a votre recherche. Souhaitez-vous recevoir les informations ou prevoir une visite ?`;
}

function formatPrice(value: number) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function buildMessage(
  id: string,
  conversation_id: string,
  contact_id: string,
  direction: Message["direction"],
  sender_type: Message["sender_type"],
  raw_content: string,
  structured_data: Record<string, unknown>
): Message {
  return {
    id,
    agency_id: demoAgency.id,
    conversation_id,
    contact_id,
    direction,
    sender_type,
    raw_content,
    structured_data,
    created_at: new Date().toISOString()
  };
}
