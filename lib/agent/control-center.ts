import type { AiActionProposal, Contact, Property } from "@/lib/types";

export function prepareAgentNotification(action: AiActionProposal, contacts: Contact[] = [], property?: Property) {
  const compatibleCount = contacts.filter((contact) => !["lost", "archived"].includes(contact.status)).length;
  const propertyLine = property
    ? `Nouveau bien detecte : ${property.title}, ${property.price.toLocaleString("fr-FR")} F.`
    : action.title;

  return [
    propertyLine,
    compatibleCount ? `${compatibleCount} prospects compatibles trouves.` : action.summary,
    `Action proposee : ${action.summary}`,
    "Repondez 1 pour valider, 2 pour voir les details, 3 pour refuser."
  ].join("\n");
}

export const agentControlCenter = {
  prepareAgentNotification
};
