import twilio from "twilio";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+1415523XXXX";

let twilioClient: any = null;

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

interface SendWhatsAppMessageOptions {
  to: string;
  message: string;
}

export async function sendWhatsAppMessage(
  options: SendWhatsAppMessageOptions
): Promise<{ success: boolean; sid?: string; error?: string }> {
  const { to, message } = options;

  if (!twilioClient) {
    console.warn("[TwilioSender] Twilio not configured - skipping message send");
    return {
      success: false,
      error: "Twilio not configured (missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN)",
    };
  }

  // Ensure phone number has whatsapp: prefix
  const recipientPhone = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

  console.log("[TwilioSender] Sending WhatsApp message:", {
    to: recipientPhone,
    messageLength: message.length,
    messagePreview: message.substring(0, 50),
  });

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: TWILIO_WHATSAPP_NUMBER,
      to: recipientPhone,
    });

    console.log("[TwilioSender] Message sent successfully:", {
      sid: result.sid,
      status: result.status,
    });

    return {
      success: true,
      sid: result.sid,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error("[TwilioSender] Failed to send message:", {
      error: errorMessage,
      to: recipientPhone,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

export function formatPhoneForWhatsApp(phone: string): string {
  if (phone.startsWith("whatsapp:")) {
    return phone;
  }
  if (phone.startsWith("+")) {
    return `whatsapp:${phone}`;
  }
  return `whatsapp:+${phone}`;
}
