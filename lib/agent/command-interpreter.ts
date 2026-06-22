export type InterpretedAgentCommand = {
  intent: "validate" | "refuse" | "modify" | "send" | "postpone" | "details" | "unknown";
  confidence: number;
  delay?: string;
};

export function interpretAgentCommand(rawCommand: string): InterpretedAgentCommand {
  const value = rawCommand.trim().toLowerCase();

  if (["1", "oui", "ok", "valide", "validé", "go"].includes(value)) {
    return { intent: "validate", confidence: 0.95 };
  }
  if (["envoie", "envoyer", "send"].includes(value)) {
    return { intent: "send", confidence: 0.9 };
  }
  if (["non", "3", "refuse", "refuser"].includes(value)) {
    return { intent: "refuse", confidence: 0.92 };
  }
  if (["2", "details", "détails", "voir details", "voir détails"].includes(value)) {
    return { intent: "details", confidence: 0.9 };
  }
  if (value.includes("modifie") || value.includes("modifier")) {
    return { intent: "modify", confidence: 0.86 };
  }
  if (value.includes("demain") || value.includes("relance demain")) {
    return { intent: "postpone", confidence: 0.82, delay: "tomorrow" };
  }

  return { intent: "unknown", confidence: 0.25 };
}
