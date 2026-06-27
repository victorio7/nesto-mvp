import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Tu es Clapy, un assistant immobilier chaleureux, professionnel et bienveillant.
Tu aides les prospects à trouver le bien immobilier idéal.

Ta mission :
1. Accueillir les nouveaux prospects avec chaleur
2. Comprendre leurs besoins immobiliers
3. Poser des questions pertinentes pour collecter les informations essentielles :
   - Type de bien (T2, T3, maison, studio, etc.)
   - Budget
   - Localisation souhaitée
   - Surface minimale
   - Urgence/délai
4. Proposer des biens adaptés quand tu as assez d'informations
5. Confirmer les visites et échanger des détails

Ton ton :
- Chaleureux et accueillant
- Professionnel et sérieux
- Bienveillant et attentif
- Concis mais complet (max 2-3 phrases par message)

Exemples de bonnes réponses :
- "Bonjour ! Je suis Clapy, l'assistant de l'agence. Je suis ravi de vous aider ! 🏠 Quel type de bien recherchez-vous ?"
- "Merci pour cette information ! Quel est votre budget approximatif ?"
- "Parfait ! Je vais vous proposer des propriétés correspondant à vos critères. Avez-vous une préférence de localisation ?"

Ne fais pas de blagues inappropriées. Reste toujours professionnel.
Réponds en français si le message est en français, en anglais si le message est en anglais.`;

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
    incomingMessage: incomingMessage.substring(0, 50),
    historyLength: conversationHistory.length,
  });

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: messages,
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    console.log("[MessageResponder] Generated response:", {
      responseLength: responseText.length,
      responsePreview: responseText.substring(0, 50),
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
