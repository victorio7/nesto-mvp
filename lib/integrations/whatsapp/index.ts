import { interpretAgentCommand } from "@/lib/agent/command-interpreter";
import { safeJsonParse } from "@/lib/utils/safe-json";
import { createHmac, timingSafeEqual } from "crypto";

export type WhatsAppWebhookPayload = {
  object?: string;
  entry?: unknown[];
};

export async function receiveWhatsAppWebhook(payload: WhatsAppWebhookPayload) {
  return {
    received: true,
    payload
  };
}

export function verifyWhatsAppWebhook(mode: string | null, token: string | null, challenge: string | null) {
  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!expectedToken || mode !== "subscribe" || token !== expectedToken) {
    return {
      verified: false,
      challenge: null
    };
  }

  return {
    verified: true,
    challenge
  };
}

export function verifyMetaWebhookSignature(rawBody: string, signatureHeader: string | null) {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    console.error("META_APP_SECRET is not configured. Rejecting webhook in production is recommended.");
    return process.env.NODE_ENV !== "production";
  }

  if (!signatureHeader?.startsWith("sha256=")) return false;

  const expected = `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  const providedBuffer = Buffer.from(signatureHeader);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export async function receiveVerifiedWhatsAppWebhook(rawBody: string, signatureHeader: string | null) {
  if (!verifyMetaWebhookSignature(rawBody, signatureHeader)) {
    console.error("Rejected unverified WhatsApp webhook.");
    return {
      received: false,
      error: "invalid_signature"
    };
  }

  const payload = safeJsonParse<WhatsAppWebhookPayload>(rawBody, {}, "WhatsApp webhook body");
  return receiveWhatsAppWebhook(payload);
}

export function parseIncomingWhatsAppMessage(payload: WhatsAppWebhookPayload) {
  const entry = payload.entry?.[0] as
    | {
        changes?: Array<{
          value?: {
            messages?: Array<{ from?: string; id?: string; text?: { body?: string }; timestamp?: string }>;
            metadata?: { phone_number_id?: string };
          };
        }>;
      }
    | undefined;
  const value = entry?.changes?.[0]?.value;
  const message = value?.messages?.[0];

  return {
    from: message?.from ?? "",
    text: message?.text?.body ?? "",
    external_message_id: message?.id ?? "",
    phone_number_id: value?.metadata?.phone_number_id ?? "",
    channel_type: "whatsapp_prospect" as const,
    raw: payload
  };
}

export async function saveIncomingMessage(message: { from: string; text: string; agency_id?: string; channel_type?: string }) {
  return {
    id: `message-${Date.now()}`,
    ...message,
    saved: true
  };
}

export async function findOrCreateContactByPhone(phoneNumber: string) {
  return {
    id: `contact-phone-${phoneNumber.replace(/\D/g, "")}`,
    phone: phoneNumber,
    created: false
  };
}

export async function sendWhatsAppMessage(to: string, body: string) {
  if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
    return {
      simulated: true,
      to,
      body
    };
  }

  return {
    simulated: false,
    to,
    body,
    status: "ready_to_send"
  };
}

export async function sendAgentNotification(to: string, body: string) {
  return sendWhatsAppMessage(to, body);
}

export async function receiveAgentCommand(rawCommand: string, context: Record<string, unknown> = {}) {
  return {
    rawCommand,
    interpreted: interpretAgentCommand(rawCommand),
    context
  };
}

export async function executeValidatedAction(action: {
  id: string;
  type: string;
  proposed_message?: string | null;
  recipient_phone?: string | null;
}) {
  if (!action.recipient_phone || !action.proposed_message) {
    return {
      action_id: action.id,
      executed: false,
      reason: "missing_recipient_or_message"
    };
  }

  const delivery = await sendWhatsAppMessage(action.recipient_phone, action.proposed_message);
  return {
    action_id: action.id,
    executed: true,
    delivery
  };
}
