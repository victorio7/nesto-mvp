import Anthropic from "@anthropic-ai/sdk";

if (!process.env.ANTHROPIC_API_KEY) {
  console.error(
    "[MessageResponder] ANTHROPIC_API_KEY is not configured. Auto-reply will fail."
  );
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const SYSTEM_PROMPT = `Tu es Clapy, l'assistant commercial immobilier. Tu aides les prospects à préciser leur recherche immobilière.

**Ta mission :**
- Accueillir chaleureusement les nouveaux prospects
- Collecter progressivement : type de bien, budget, localisation, surface
- Poser UNE SEULE question à la fois
- Être bref, chaleureux et professionnel

**Règles importantes :**
- Réponds TOUJOURS en français
- Maximum 2-3 phrases par message
- Pose des questions simples et directes
- Sois bienveillant et encourageant
- Si le prospect mentionne plusieurs critères, extrayez-les progressivement

**Exemples de bonnes réponses :**
- Premier contact : "Bonjour ! Je suis Clapy, l'assistant de l'agence. Ravi de vous aider ! 🏠 Quel type de bien recherchez-vous ? (T2, T3, maison, studio...)"
- Après réponse : "Merci ! Quel est votre budget approximatif pour votre recherche ?"
- Suite : "Parfait ! Quelle localisation vous intéresse ? (ex: centre-ville, proche de l'école...)"
- Confirmation : "Excellent ! Je vais vous proposer des propriétés correspondant à vos critères."

**Critères à collecter (dans cet ordre si possible) :**
1. Type de bien (T2, T3, maison, studio, commerce, terrain, etc.)
2. Budget (minimum et maximum si possible)
3. Localisation souhaitée (quartier, ville, commune)
4. Surface minimale ou nombre de pièces
5. Urgence/délai de recherche

**Tone :** Chaleureux, professionnel, bienveillant, concis.
Ne fais JAMAIS de blagues inappropriées. Reste professional et courtois.`;

interface GenerateResponseOptions {
  incomingMessage: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  contactInfo?: {
    phone?: string;
    name?: string;
  };
}

export async function generateResponse(
  options: GenerateResponseOptions
): Promise<string> {
  const {
    incomingMessage,
    conversationHistory = [],
    contactInfo = {},
  } = options;

  const messages: Anthropic.Messages.MessageParam[] = [
    ...conversationHistory,
    {
      role: "user",
      content: incomingMessage,
    },
  ];

  console.log("[MessageResponder] Generating response for:", {
    incomingMessage: incomingMessage.substring(0, 60),
    historyLength: conversationHistory.length,
    contactPhone: contactInfo.phone,
  });

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 250,
      system: SYSTEM_PROMPT,
      messages: messages,
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    if (!responseText.trim()) {
      throw new Error("Empty response from Claude API");
    }

    console.log("[MessageResponder] Generated response:", {
      responseLength: responseText.length,
      responsePreview: responseText.substring(0, 60),
    });

    return responseText;
  } catch (error) {
    console.error("[MessageResponder] Error generating response:", {
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function analyzeMessageType(
  message: string
): Promise<{
  type:
    | "greeting"
    | "property_inquiry"
    | "information_request"
    | "confirmation"
    | "question"
    | "other";
  confidence: number;
}> {
  const analysisPrompt = `Analyse ce message immobilier et détermine son type.
Types possibles : greeting (salutation), property_inquiry (demande de propriété), information_request (demande d'info), confirmation (confirmation), question (question générale), other (autre).

Message: "${message}"

Réponds en JSON: {"type": "...", "confidence": 0.0-1.0}`;

  try {
    const message_response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: analysisPrompt,
        },
      ],
    });

    const responseText =
      message_response.content[0].type === "text"
        ? message_response.content[0].text
        : "{}";
    const analysis = JSON.parse(responseText);

    return analysis;
  } catch (error) {
    console.error("[MessageResponder] Error analyzing message type:", error);
    return { type: "other", confidence: 0.5 };
  }
}
