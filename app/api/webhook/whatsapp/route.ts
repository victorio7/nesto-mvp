import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClientOrNull } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createSupabaseAdminClientOrNull();

    if (!supabase) {
      console.error("Supabase not configured");
      return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    // Handle Twilio WhatsApp webhook
    if (body.SmsMessageSid) {
      const senderPhone = body.From?.replace("whatsapp:", "") || "";
      const messageContent = body.Body || "";
      const twilioMessageId = body.SmsMessageSid;

      // Get the first agency (WhatsApp is typically tied to one agency per Twilio account)
      const { data: agency, error: agencyError } = await supabase
        .from("agencies")
        .select("id")
        .limit(1)
        .single();

      if (agencyError || !agency) {
        console.log("No agency found for WhatsApp webhook");
        return NextResponse.json({
          success: true,
          message: "No agency configured"
        });
      }

      // Create or find contact by phone number
      const { data: existingContact } = await supabase
        .from("contacts")
        .select("id")
        .eq("phone", senderPhone)
        .eq("agency_id", agency.id)
        .limit(1)
        .maybeSingle();

      let contactId = existingContact?.id;

      if (!contactId) {
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

        if (contactError || !newContact) {
          console.error("Error creating contact:", contactError);
          return NextResponse.json({ success: true, message: "Message received but contact creation failed" });
        }

        contactId = newContact.id;
      }

      // Create or find conversation
      const { data: existingConversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("contact_id", contactId)
        .eq("agency_id", agency.id)
        .eq("channel_type", "whatsapp_prospect")
        .limit(1)
        .maybeSingle();

      let conversationId = existingConversation?.id;

      if (!conversationId) {
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

        if (conversationError || !newConversation) {
          console.error("Error creating conversation:", conversationError);
          return NextResponse.json({ success: true, message: "Message received but conversation creation failed" });
        }

        conversationId = newConversation.id;
      }

      // Store message in database with correct column names
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
        console.error("Error storing WhatsApp message:", {
          error: insertError,
          message: insertError?.message,
          details: insertError?.details
        });
        return NextResponse.json({
          success: true,
          message: "Message received but not stored"
        });
      }

      console.log("WhatsApp message stored:", {
        from: senderPhone,
        content: messageContent,
        agency_id: agency.id,
        conversation_id: conversationId
      });

      return NextResponse.json({ success: true, message: "WhatsApp message received" });
    }

    return NextResponse.json({ error: "Invalid webhook format" }, { status: 400 });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
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
