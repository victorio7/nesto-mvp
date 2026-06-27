import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClientOrNull } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[WhatsApp Webhook] Received:", {
      smsMessageSid: body.SmsMessageSid,
      from: body.From,
      body: body.Body?.substring(0, 50)
    });

    const supabase = createSupabaseAdminClientOrNull();

    if (!supabase) {
      console.error("[WhatsApp Webhook] Supabase client not configured");
      return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    // Handle Twilio WhatsApp webhook
    if (body.SmsMessageSid) {
      const senderPhone = body.From?.replace("whatsapp:", "") || "";
      const messageContent = body.Body || "";
      const twilioMessageId = body.SmsMessageSid;

      console.log("[WhatsApp Webhook] Extracted data:", {
        senderPhone,
        contentLength: messageContent.length,
        twilioMessageId
      });

      // Get the first agency (WhatsApp is typically tied to one agency per Twilio account)
      console.log("[WhatsApp Webhook] Querying for first agency...");
      const { data: agency, error: agencyError } = await supabase
        .from("agencies")
        .select("id")
        .limit(1)
        .maybeSingle();

      console.log("[WhatsApp Webhook] Agency query result:", {
        agencyId: agency?.id,
        agencyError: agencyError?.message
      });

      if (agencyError) {
        console.error("[WhatsApp Webhook] Agency query error:", agencyError);
        return NextResponse.json({ error: "Failed to fetch agency" }, { status: 500 });
      }

      if (!agency) {
        console.log("[WhatsApp Webhook] No agency found in database");
        return NextResponse.json({
          success: true,
          message: "No agency configured"
        });
      }

      // Create or find contact by phone number
      console.log("[WhatsApp Webhook] Looking for existing contact:", {
        phone: senderPhone,
        agencyId: agency.id
      });

      const { data: existingContact, error: contactQueryError } = await supabase
        .from("contacts")
        .select("id")
        .eq("phone", senderPhone)
        .eq("agency_id", agency.id)
        .limit(1)
        .maybeSingle();

      console.log("[WhatsApp Webhook] Contact query result:", {
        contactId: existingContact?.id,
        contactQueryError: contactQueryError?.message
      });

      let contactId = existingContact?.id;

      if (!contactId) {
        console.log("[WhatsApp Webhook] Creating new contact...");
        const { data: newContact, error: contactError } = await supabase
          .from("contacts")
          .insert({
            agency_id: agency.id,
            phone: senderPhone,
            source_channel: "whatsapp",
            contact_type: "unknown",
            project_type: "unknown"
          })
          .select("id")
          .single();

        console.log("[WhatsApp Webhook] Contact creation result:", {
          newContactId: newContact?.id,
          contactError: contactError?.message
        });

        if (contactError || !newContact) {
          console.error("[WhatsApp Webhook] Failed to create contact:", contactError);
          return NextResponse.json({
            success: true,
            message: "Message received but contact creation failed"
          });
        }

        contactId = newContact.id;
      }

      // Create or find conversation
      console.log("[WhatsApp Webhook] Looking for existing conversation:", {
        contactId,
        agencyId: agency.id,
        channelType: "whatsapp_prospect"
      });

      const { data: existingConversation, error: conversationQueryError } = await supabase
        .from("conversations")
        .select("id")
        .eq("contact_id", contactId)
        .eq("agency_id", agency.id)
        .eq("channel_type", "whatsapp_prospect")
        .limit(1)
        .maybeSingle();

      console.log("[WhatsApp Webhook] Conversation query result:", {
        conversationId: existingConversation?.id,
        conversationQueryError: conversationQueryError?.message
      });

      let conversationId = existingConversation?.id;

      if (!conversationId) {
        console.log("[WhatsApp Webhook] Creating new conversation...");
        const { data: newConversation, error: conversationError } = await supabase
          .from("conversations")
          .insert({
            agency_id: agency.id,
            contact_id: contactId,
            channel_type: "whatsapp_prospect",
            external_thread_id: twilioMessageId
          })
          .select("id")
          .single();

        console.log("[WhatsApp Webhook] Conversation creation result:", {
          newConversationId: newConversation?.id,
          conversationError: conversationError?.message
        });

        if (conversationError || !newConversation) {
          console.error("[WhatsApp Webhook] Failed to create conversation:", conversationError);
          return NextResponse.json({
            success: true,
            message: "Message received but conversation creation failed"
          });
        }

        conversationId = newConversation.id;
      }

      // Store message in database with correct column names
      console.log("[WhatsApp Webhook] Inserting message...", {
        agencyId: agency.id,
        conversationId,
        contactId,
        direction: "inbound",
        senderType: "prospect"
      });

      const { error: insertError } = await supabase.from("messages").insert({
        agency_id: agency.id,
        conversation_id: conversationId,
        contact_id: contactId,
        direction: "inbound",
        sender_type: "prospect",
        raw_content: messageContent,
        structured_data: {
          twilio_sid: twilioMessageId,
          phone: senderPhone,
          channel: "whatsapp",
          raw_webhook: body
        }
      });

      if (insertError) {
        console.error("[WhatsApp Webhook] Error inserting message:", {
          error: insertError,
          message: insertError?.message,
          details: insertError?.details,
          code: insertError?.code
        });
        return NextResponse.json({
          success: true,
          message: "Message received but not stored"
        });
      }

      console.log("[WhatsApp Webhook] ✅ Message stored successfully:", {
        from: senderPhone,
        contentLength: messageContent.length,
        agency_id: agency.id,
        conversation_id: conversationId,
        contact_id: contactId
      });

      return NextResponse.json({ success: true, message: "WhatsApp message received" });
    }

    console.log("[WhatsApp Webhook] Invalid webhook format, missing SmsMessageSid");
    return NextResponse.json({ error: "Invalid webhook format" }, { status: 400 });
  } catch (error) {
    console.error("[WhatsApp Webhook] Unexpected error:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Twilio webhook validation
  const hubVerifyToken = request.nextUrl.searchParams.get("hub.verify_token");
  const hubChallenge = request.nextUrl.searchParams.get("hub.challenge");

  const verifyToken = process.env.TWILIO_WEBHOOK_SECRET || "";

  if (hubVerifyToken === verifyToken) {
    return NextResponse.json(hubChallenge, { status: 200 });
  }

  return NextResponse.json({ error: "Invalid verify token" }, { status: 403 });
}
