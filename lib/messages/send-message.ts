import type { SupabaseClient } from "@supabase/supabase-js";
import type { MessageChannel } from "./store-message";
import { storeMessage } from "./store-message";

export interface SendMessageParams {
  channel: MessageChannel;
  recipientPhone?: string; // For WhatsApp
  recipientId?: string; // For Messenger/Instagram
  recipientEmail?: string; // For email
  content: string;
  subject?: string; // For email
  agencyId: string;
  agentId?: string;
}

export async function sendMessage(
  supabase: SupabaseClient,
  params: SendMessageParams
): Promise<{ success: boolean; externalId?: string; error?: string }> {
  const {
    channel,
    recipientPhone,
    recipientId,
    recipientEmail,
    content,
    subject,
    agencyId,
    agentId
  } = params;

  try {
    let externalId: string | undefined;

    // Send via the appropriate channel
    if (channel === "whatsapp" && recipientPhone) {
      externalId = await sendWhatsAppMessage(recipientPhone, content);
    } else if (channel === "messenger" && recipientId) {
      externalId = await sendMessengerMessage(recipientId, content);
    } else if (channel === "email" && recipientEmail) {
      externalId = await sendEmailMessage(recipientEmail, subject || "", content);
    } else {
      return { success: false, error: "Invalid channel or missing recipient" };
    }

    // Store message in database
    if (externalId) {
      await storeMessage(supabase, {
        channel,
        external_id: externalId,
        direction: "outbound",
        sender_phone: channel === "whatsapp" ? process.env.TWILIO_PHONE_NUMBER : undefined,
        sender_id: channel === "messenger" ? process.env.META_PAGE_ID : undefined,
        sender_email: channel === "email" ? process.env.NESTO_FROM_EMAIL : undefined,
        content,
        subject,
        agency_id: agencyId,
        agent_id: agentId,
        status: "received"
      });
    }

    return { success: true, externalId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error sending ${channel} message:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

async function sendWhatsAppMessage(
  recipientPhone: string,
  message: string
): Promise<string | undefined> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error("Twilio credentials not configured");
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      From: `whatsapp:${fromNumber}`,
      To: `whatsapp:${recipientPhone}`,
      Body: message
    }).toString()
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twilio error: ${error}`);
  }

  const data = (await response.json()) as { sid?: string };
  return data.sid;
}

async function sendMessengerMessage(
  recipientId: string,
  message: string
): Promise<string | undefined> {
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("Meta access token not configured");
  }

  const url = "https://graph.instagram.com/v17.0/me/messages";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: message },
      access_token: accessToken
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Meta error: ${error}`);
  }

  const data = (await response.json()) as { message_id?: string };
  return data.message_id;
}

async function sendEmailMessage(
  recipientEmail: string,
  subject: string,
  content: string
): Promise<string | undefined> {
  // This would use your email service (e.g., Resend)
  // For now, return a mock ID
  const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log("Email sending:", {
    to: recipientEmail,
    subject,
    content,
    mockId: emailId
  });

  // TODO: Integrate with email service (Resend, SendGrid, etc.)

  return emailId;
}
