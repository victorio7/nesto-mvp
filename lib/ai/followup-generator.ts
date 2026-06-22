import OpenAI from "openai";
import type { Contact, Property } from "@/lib/types";

export async function generateFollowupWithAI(contact: Contact, property: Property, context = "") {
  if (!process.env.OPENAI_API_KEY) {
    return generateFollowupFallback(contact, property);
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "Tu rediges une relance courte, professionnelle et personnalisee pour un agent immobilier. Ne confirme jamais une visite ni une adresse exacte."
        },
        {
          role: "user",
          content: `Contexte: ${context}\nContact: ${JSON.stringify(contact)}\nBien: ${JSON.stringify(property)}`
        }
      ]
    });

    return completion.choices[0]?.message.content?.trim() || generateFollowupFallback(contact, property);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[generateFollowupWithAI] Falling back to local generator.", error);
    }
    return generateFollowupFallback(contact, property);
  }
}

export function generateFollowupFallback(contact: Contact, property: Property) {
  const firstName = contact.first_name || "Bonjour";
  const city = property.district ? `${property.city} (${property.district})` : property.city;
  return `Bonjour ${firstName}, je reviens vers vous car un bien correspondant a votre recherche vient d'entrer : ${property.title} a ${city}, au prix de ${property.price.toLocaleString("fr-FR")} F. Souhaitez-vous recevoir plus d'informations ou que je vous propose un creneau de visite a valider ?`;
}
