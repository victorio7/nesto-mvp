import type { Contact, Property } from "@/lib/types";

export function generateAgentNotificationWithAI({
  contact,
  property,
  score,
  sourceAgentName
}: {
  contact: Contact;
  property: Property;
  score: number;
  sourceAgentName?: string | null;
}) {
  const contactName = `${contact.first_name} ${contact.last_name}`.trim();
  const propertyLabel = getPropertyLabel(property.category);
  const intro = sourceAgentName
    ? `${sourceAgentName} vient d'ajouter un ${propertyLabel} a ${property.city}`
    : `Nouveau bien detecte : ${property.title}`;

  return {
    title: sourceAgentName ? "Opportunite de collaboration detectee" : "Nouveau match prospect/bien",
    summary: `${contactName} correspond a ${score} %.`,
    priority: score >= 90 ? "urgent" : "high",
    requires_validation: true,
    agent_message: `${intro}, ${formatPrice(property.price)} F. Ce bien correspond a ${contactName} dans votre base prospects avec un score de ${score} %. Voulez-vous preparer une relance ? Repondez 1 pour valider, 2 pour details, 3 pour ignorer.`,
    allowed_commands: ["1", "2", "3", "valide", "details", "refuse"]
  };
}

function getPropertyLabel(category: string) {
  if (category === "t2") return "F2";
  if (category === "t3") return "F3";
  if (category === "studio") return "studio";
  if (category === "house") return "maison";
  return category.toUpperCase();
}

function formatPrice(value: number) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
