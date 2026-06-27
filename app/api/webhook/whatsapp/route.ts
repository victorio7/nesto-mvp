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

      // Find agent by their WhatsApp phone number
      const agencyResult = await supabase
        .from("agencies")
        .select("id, name")
        .limit(1)
        .single();

      const agency = agencyResult.data;

      if (!agency) {
        console.log("No agency found for WhatsApp webhook");
        return NextResponse.json({
          success: true,
          message: "No agency configured"
        });
      }

      // Store message in database
      const { error: insertError } = await supabase.from("messages").insert({
        channel: "whatsapp",
        external_id: twilioMessageId,
        sender_phone: senderPhone,
        content: messageContent,
        timestamp: new Date().toISOString(),
        agency_id: agency.id,
        direction: "inbound",
        raw_data: body
      });

      if (insertError) {
        console.error("Error storing WhatsApp message:", insertError);
        return NextResponse.json({
          success: true,
          message: "Message received but not stored"
        });
      }

      console.log("WhatsApp message stored:", {
        from: senderPhone,
        content: messageContent,
        timestamp: new Date().toISOString()
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
