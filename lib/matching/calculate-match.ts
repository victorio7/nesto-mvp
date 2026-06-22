import type { Contact, Match, Property } from "@/lib/types";

export function calculateMatch(contact: Contact, property: Property): Pick<Match, "score" | "reasons" | "blocking_points"> {
  const reasons: string[] = [];
  const blocking_points: string[] = [];
  let score = 0;

  if (property.status !== "available") {
    blocking_points.push("Bien non disponible");
    return { score: 0, reasons, blocking_points };
  }

  if (contact.project_type === "rental_search" && property.listing_type !== "rental") {
    blocking_points.push("Le contact cherche une location");
  } else if (contact.project_type === "purchase_search" && property.listing_type !== "sale") {
    blocking_points.push("Le contact cherche un achat");
  } else {
    score += 16;
    reasons.push("Type de transaction compatible");
  }

  if (contact.max_budget && property.price <= contact.max_budget) {
    score += 22;
    reasons.push("Budget compatible");
  } else if (contact.max_budget) {
    const overBudget = property.price - contact.max_budget;
    if (overBudget / contact.max_budget <= 0.08) {
      score += 8;
      blocking_points.push("Prix legerement au-dessus du budget");
    } else {
      blocking_points.push("Budget depasse");
    }
  }

  if (sameText(contact.desired_city, property.city)) {
    score += 18;
    reasons.push("Ville compatible");
  } else if (contact.desired_city) {
    blocking_points.push("Ville differente");
  }

  if (!contact.desired_district || sameText(contact.desired_district, property.district)) {
    score += 8;
    if (contact.desired_district) reasons.push("Quartier compatible");
  }

  if (!contact.desired_property_type || contact.desired_property_type === property.category) {
    score += 14;
    reasons.push("Type de bien compatible");
  } else {
    blocking_points.push("Type de bien different");
  }

  if (contact.desired_bedrooms == null || property.bedrooms == null || property.bedrooms >= contact.desired_bedrooms) {
    score += 10;
    reasons.push("Nombre de chambres compatible");
  } else {
    blocking_points.push("Nombre de chambres insuffisant");
  }

  if (contact.pets === "yes" && property.pets_allowed === "no") {
    blocking_points.push("Animaux non acceptes");
  } else {
    score += 6;
  }

  if (contact.move_in_date && property.available_from) {
    const desired = new Date(contact.move_in_date).getTime();
    const available = new Date(property.available_from).getTime();
    if (available <= desired + 1000 * 60 * 60 * 24 * 14) {
      score += 6;
      reasons.push("Disponibilite compatible");
    } else {
      blocking_points.push("Disponibilite trop tardive");
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    reasons,
    blocking_points
  };
}

export function buildMatchesForContact(contact: Contact, properties: Property[]) {
  return properties
    .map((property) => ({ property, result: calculateMatch(contact, property) }))
    .filter(({ result }) => result.score >= 55)
    .sort((a, b) => b.result.score - a.result.score);
}

export function buildMatchesForProperty(property: Property, contacts: Contact[]) {
  return contacts
    .filter((contact) => !["lost", "archived"].includes(contact.status))
    .map((contact) => ({ contact, result: calculateMatch(contact, property) }))
    .filter(({ result }) => result.score >= 55)
    .sort((a, b) => b.result.score - a.result.score);
}

export function matchPropertyWithContacts(property: Property, contacts: Contact[], currentUserId?: string) {
  return buildMatchesForProperty(property, contacts).map(({ contact, result }) => ({
    contact,
    result,
    match_context: getMatchContext(contact, property, currentUserId),
    collaboration_opportunity: isCollaborationOpportunity(contact, property, currentUserId)
  }));
}

export function matchContactWithProperties(contact: Contact, properties: Property[], currentUserId?: string) {
  return buildMatchesForContact(contact, properties).map(({ property, result }) => ({
    property,
    result,
    match_context: getMatchContext(contact, property, currentUserId),
    collaboration_opportunity: isCollaborationOpportunity(contact, property, currentUserId)
  }));
}

export function detectCollaborationOpportunities(contacts: Contact[], properties: Property[], currentUserId: string) {
  return properties
    .flatMap((property) => matchPropertyWithContacts(property, contacts, currentUserId).map((match) => ({ property, ...match })))
    .filter((match) => match.collaboration_opportunity)
    .sort((a, b) => b.result.score - a.result.score);
}

function getMatchContext(contact: Contact, property: Property, currentUserId?: string) {
  if (currentUserId && property.created_by_user_id === currentUserId) return "own_property";
  if (currentUserId && property.created_by_user_id && property.created_by_user_id !== currentUserId) return "colleague_property";
  if (property.source_agent_name && property.source_agent_name !== contactOwnerName(contact)) return "colleague_property";
  return "agency_property";
}

function isCollaborationOpportunity(contact: Contact, property: Property, currentUserId?: string) {
  return Boolean(
    currentUserId &&
      contact.owner_user_id === currentUserId &&
      ((property.created_by_user_id && property.created_by_user_id !== currentUserId) || property.source_agent_name)
  );
}

function contactOwnerName(contact: Contact) {
  return contact.owner_user_id ?? "";
}

function sameText(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}
