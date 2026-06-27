export function buildClapyWelcomeMessage({
  firstName,
  missingConnections = []
}: {
  firstName: string;
  missingConnections?: string[];
}) {
  const greetingName = firstName.trim() || "bonjour";
  const baseMessage = [
    `Bonjour ${greetingName}, bienvenue sur Clapy. Votre assistant est pret.`,
    "Vous gerez la relation. Clapy memorise, relance et vous alerte au bon moment.",
    "Pour toute action importante, vous recevrez une alerte ici sur WhatsApp."
  ].join("\n");

  if (!missingConnections.length) return baseMessage;

  return [
    baseMessage,
    "",
    `Il reste quelques connexions a finaliser : ${missingConnections.join(", ")}. Notre equipe peut vous accompagner.`
  ].join("\n");
}
