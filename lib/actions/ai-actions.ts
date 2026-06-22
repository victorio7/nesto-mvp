import type { AiActionProposal, Contact, Match, Property } from "@/lib/types";

export function createActionForMatch(contact: Contact, property: Property, match: Match): AiActionProposal {
  return {
    id: `action-${match.id}`,
    agency_id: contact.agency_id,
    contact_id: contact.id,
    property_id: property.id,
    match_id: match.id,
    action_type: match.score >= 85 ? "send_followup" : "notify_new_match",
    priority: match.score >= 90 ? "urgent" : match.score >= 80 ? "high" : "medium",
    title: `Proposer ${property.title} a ${contact.first_name}`,
    summary: `${match.score}/100 - ${match.reasons.slice(0, 2).join(", ")}`,
    proposed_message: `Bonjour ${contact.first_name}, un bien semble correspondre a votre recherche : ${property.title}. Souhaitez-vous plus d'informations ?`,
    status: "pending",
    requires_validation: true,
    created_at: new Date().toISOString(),
    validated_at: null,
    executed_at: null
  };
}

export function isImportantAction(action: AiActionProposal) {
  return [
    "propose_visit",
    "confirm_appointment",
    "send_followup",
    "notify_property_change"
  ].includes(action.action_type) || action.requires_validation;
}
