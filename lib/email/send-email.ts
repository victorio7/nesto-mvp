import "server-only";

type SendEmailInput = {
  subject: string;
  text: string;
  to: string;
};

export type SendEmailResult = {
  id?: string;
  sent: boolean;
};

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NESTO_FROM_EMAIL;

  if (!apiKey || !from) {
    console.warn("Email non envoyé : configuration manquante");
    return { sent: false };
  }

  if (!input.to.trim()) {
    console.warn("Email non envoyé : destinataire manquant");
    return { sent: false };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text
      })
    }).finally(() => clearTimeout(timeout));
    const payload = await response.json().catch(() => null) as {
      id?: string;
      message?: string;
      name?: string;
    } | null;

    if (!response.ok) {
      console.error("Email non envoyé : erreur Resend", {
        status: response.status,
        error: payload?.message ?? payload?.name ?? "Réponse Resend invalide"
      });
      return { sent: false };
    }

    return { id: payload?.id, sent: true };
  } catch (error) {
    console.error("Email non envoyé : appel Resend impossible", getErrorMessage(error));
    return { sent: false };
  }
}

export function getWelcomeEmail(firstName: string) {
  return {
    subject: "Bienvenue sur Nesto",
    text: [
      `Bonjour ${firstName},`,
      "",
      "Votre espace Nesto est créé. Notre équipe va vous accompagner pour finaliser l’installation.",
      "",
      "WhatsApp reste votre poste de commande. Votre dashboard servira à consulter votre mémoire commerciale."
    ].join("\n")
  };
}

export function getNestoReadyEmail(firstName: string) {
  return {
    subject: "Nesto est prêt",
    text: [
      `Bonjour ${firstName},`,
      "",
      "Nesto est prêt. Vous pouvez accéder à votre mémoire commerciale.",
      "",
      "Pour agir, valider ou demander une relance, utilisez WhatsApp."
    ].join("\n")
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
